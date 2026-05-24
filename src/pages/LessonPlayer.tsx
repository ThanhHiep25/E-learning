import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Play, Lock,
    CheckCircle2, MessageSquare, FileText,
    Menu, X, ArrowLeft, Trophy, HelpCircle, Eye, BookOpen,
    Image as ImageIcon, File as FileIcon, Music, Video as VideoIcon, Download,
    LoaderCircle, ArrowRight,
    Maximize, Square, Columns2, PictureInPicture,
    Share2, ExternalLink, Heart, Flag
} from 'lucide-react';
import { useCourseStore } from '../store/useCourseStore';
import type { CurriculumIndex } from '../store/curriculumIndex';
import { buildCurriculumIndex } from '../store/curriculumIndex';
import { courseService } from '../services/course.service';
import { enrollmentService, type BackendEnrollment } from '../services/enrollment.service';
import { progressService } from '../services/progress.service';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ForumSection from '../components/course/ForumSection';
import LectureChat from '../components/course/LectureChat';
import QuizPreviewPanel from '../components/course/QuizPreviewPanel';
import CertificateCongratulationModal from '../components/course/CertificateCongratulationModal';
import { Breadcrumb } from '../components/common/Breadcrumb';
import 'quill/dist/quill.snow.css';
// 🛡️ P0-5 FIX: Import XSS protection
import { sanitizeHTML } from '../utils/sanitize';

const decodeHTML = (html: string) => {
    if (!html) return '';

    if (/<[a-z][\s\S]*>/i.test(html)) {
        return html;
    }

    return html
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&copy;/g, '©')
        .replace(/&reg;/g, '®');
};

const LessonPlayer: React.FC = () => {
    const { id, lessonId } = useParams<{ id: string, lessonId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { courses, loadCourseDetail, getCurriculumIndex } = useCourseStore();
    const [curriculum, setCurriculum] = useState<any[]>([]);
    const [curriculumIndex, setCurriculumIndex] = useState<CurriculumIndex | undefined>(undefined);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [enrollment, setEnrollment] = useState<BackendEnrollment | null>(null);
    const [isTeacherOwner, setIsTeacherOwner] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewPdf, setPreviewPdf] = useState<string | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'content' | 'chat' | 'discussion'>('content');
    const [viewMode, setViewMode] = useState<'fullscreen' | 'large' | 'split' | 'compact'>('split');
    const [showCertCongrats, setShowCertCongrats] = useState(false);
    const [latestCertId, setLatestCertId] = useState<string | null>(null);
    const course = useMemo(() => courses.find(c => String(c.id) === String(id)), [courses, id]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    useEffect(() => {
        const init = async () => {
            if (!id) return;
            // Nếu chưa có khóa học HOẶC curriculum rỗng (thường do load từ list)
            if (!course || !course.curriculum || course.curriculum.length === 0) {
                setIsLoadingDetail(true);
                try {
                    await loadCourseDetail(id);
                } finally {
                    setIsLoadingDetail(false);
                }
            }
        };
        init();
    }, [id, course?.id, loadCourseDetail]);

    const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

    useEffect(() => {
        const loadEnrollmentAndProgress = async () => {
            if (!id) return;
            // Guest (not logged in): skip auth APIs, rely on store curriculum for preview lectures
            if (!user) {
                setEnrollment(null);
                setCompletedLessonIds([]);
                return;
            }
            try {
                enrollmentService.clearCache();
                const enrollments = await enrollmentService.listMyEnrollments();
                const en = enrollments.find((e) => String(e.courseId) === String(id)) || null;
                setEnrollment(en);

                // If enrolled or teacher owner, load enrolled content to get full video URLs
                const canAccessFullContent = en || user?.role === 'TEACHER' || user?.role === 'ADMIN';
                if (canAccessFullContent) {
                    try {
                        const enrolledData = await courseService.getEnrolledCourseContent(id);
                        const mappedCurriculum = (enrolledData.chapters || []).map((ch: any) => ({
                            id: String(ch.id),
                            title: ch.title,
                            lessons: [
                                ...(ch.lectures || []).map((l: any) => ({
                                    id: String(l.id),
                                    title: l.title,
                                    duration: l.duration ? `${Math.ceil(l.duration / 60)} phút` : '0 phút',
                                    isPreview: Boolean(l.isPreview),
                                    videoUrl: l.videoUrl || l.contentUrl,
                                    type: l.type || 'video',
                                    content: l.content,
                                    attachments: l.attachments,
                                    order: l.order || 0
                                })),
                                ...(ch.quizzes || []).map((q: any) => ({
                                    id: `quiz-${q.id}`,
                                    title: q.title,
                                    duration: `${q.timeLimit || 0} phút`,
                                    isPreview: false,
                                    type: 'quiz',
                                    quizId: q.id,
                                    order: q.order || 999
                                }))
                            ].sort((a, b) => a.order - b.order),
                        }));
                        setCurriculum(mappedCurriculum);
                        const idx = buildCurriculumIndex({
                            courseId: String(id),
                            curriculum: mappedCurriculum,
                        });
                        setCurriculumIndex(idx);
                    } catch (err: any) {
                        console.error('Failed to load enrolled content:', err);
                        // If expired, redirect to dashboard for renewal
                        if (err.status === 403 && err.message?.includes('hết hạn')) {
                            toast.error('Khóa học đã hết hạn. Chuyển về trang gia hạn...');
                            navigate(`/course/${id}/dashboard`);
                            return;
                        }
                    }
                }

                // Lấy tiến độ chi tiết để hiển thị Checkmark phần đã học
                if (en && user?.role === 'STUDENT') {
                    const progressData = await progressService.getCourseProgress(id);
                    const completedLectures = progressData.lecturesProgress
                        ?.filter(lp => lp.isCompleted)
                        .map(lp => String(lp.lectureId)) || [];
                    const completedQuizzes = progressData.quizProgress?.quizDetails
                        ?.filter(q => q.passed === true)
                        .map(q => `quiz-${q.quizId}`) || [];
                    
                    setCompletedLessonIds([...completedLectures, ...completedQuizzes]);
                } else {
                    setCompletedLessonIds([]);
                }
            } catch (e) {
                setEnrollment(null);
                setCompletedLessonIds([]);
            }
        };

        loadEnrollmentAndProgress();
    }, [id, user?.id, user?.role]);

    // Check if teacher is owner of this course
    useEffect(() => {
        const checkTeacherOwnership = () => {
            if (!id || !user || !course) return;
            
            // Only check for teachers and admins
            if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
                setIsTeacherOwner(false);
                return;
            }

            // For admin, always allow access
            if (user.role === 'ADMIN') {
                setIsTeacherOwner(true);
                return;
            }

            // For teacher, use stable owner id (if available) instead of display name.
            const isOwner = course.creatorId ? String(course.creatorId) === String(user.id) : false;
            setIsTeacherOwner(isOwner);
        };

        checkTeacherOwnership();
    }, [id, user, course]);

    useEffect(() => {
        setEnrollment(null);
        setIsTeacherOwner(false);
    }, [user?.id]);


    // Only use store curriculumIndex as fallback if enrolled content not loaded
    useEffect(() => {
        if (!id) {
            setCurriculumIndex(undefined);
            return;
        }
        // Skip if already loaded from enrolled content (has lessons)
        if (curriculumIndex && curriculumIndex.lessonIds.length > 0) {
            return;
        }
        const idx = getCurriculumIndex(String(id));
        if (idx && idx.lessonIds.length > 0) {
            setCurriculumIndex(idx);
        }
    }, [getCurriculumIndex, id, course?.curriculum, curriculumIndex]);

    const allLessons = useMemo(() => {
        if (!curriculumIndex) return [];
        return curriculumIndex.lessonIds.map((lessonId) => {
            const lesson = curriculumIndex.lessonsById[lessonId];
            const module = curriculumIndex.modulesById[lesson.moduleId];
            return {
                id: lesson.id,
                title: lesson.title,
                duration: lesson.duration,
                isPreview: lesson.isPreview,
                videoUrl: lesson.videoUrl,
                content: decodeHTML((lesson as any).content || ""),
                moduleId: lesson.moduleId,
                moduleTitle: module?.title || "",
                type: lesson.type,
                attachments: (lesson as any).attachments || []
            };
        });
    }, [curriculumIndex]);

    const currentLesson = useMemo(() => {
        if (!lessonId) return allLessons[0];
        return allLessons.find(l => l.id === lessonId) || allLessons[0];
    }, [allLessons, lessonId]);

    const currentIdx = allLessons.findIndex(l => l.id === currentLesson?.id);

    const canAccessCurrentLesson = Boolean(enrollment) || Boolean(currentLesson?.isPreview) || isTeacherOwner;

    // Curriculum Accordion State
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (currentLesson?.moduleId) {
            setExpandedModules(prev => ({ ...prev, [currentLesson.moduleId]: true }));
        }
    }, [currentLesson?.moduleId]);

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    // Video progress tracking
    const watchedPercentRef = useRef(0);
    const lastSentPercentRef = useRef(0);

    // Function to refresh enrollment and get updated progress
    const refreshEnrollment = useCallback(async () => {
        if (!id) return;
        try {
            enrollmentService.clearCache(); // Clear cache to get fresh data
            const enrollments = await enrollmentService.listMyEnrollments();
            const en = enrollments.find((e) => String(e.courseId) === String(id)) || null;
            if (en) {
                setEnrollment(en);
            }
        } catch (err) {
            console.error('[Enrollment] Error:', err);
        }
    }, [id]);

    // Send progress to server every 10 seconds
    useEffect(() => {
        if (!canAccessCurrentLesson || !currentLesson?.id || isTeacherOwner) return;
        if (!enrollment) return;

        const interval = setInterval(async () => {
            if (currentLesson?.type === 'quiz') return;
            const currentPercent = watchedPercentRef.current;
            // Only send if changed by at least 5% or 80% reached (completion threshold)
            if (currentPercent >= 80 || currentPercent - lastSentPercentRef.current >= 5) {
                try {
                    const result = await progressService.updateLectureProgress(currentLesson.id, currentPercent);
                    const isCompleted = result.data?.progress?.isCompleted;
                    lastSentPercentRef.current = currentPercent;
                    // Refresh enrollment to get updated progress
                    await refreshEnrollment();

                    // Check for certificate eligibility after progress update
                    if (isCompleted) {
                        try {
                            const eligibility = await progressService.getCertificateEligibility(id!);
                            if (eligibility.isEligible) {
                                setLatestCertId(eligibility.certificateData?.certificateId || null);
                                setShowCertCongrats(true);
                            }
                        } catch (certErr) {
                            console.error('Certificate check error:', certErr);
                        }
                    }
                } catch (err: any) {
                    console.error('[Progress] Error updating progress:', err);
                    if (err?.message?.toLowerCase().includes('bất thường')) {
                        import('react-hot-toast').then(({ default: toast }) => {
                            toast.error('⚠️ Cảnh báo: Phát hiện thao tác chạy cóc/tua video bất thường. Tiến độ này sẽ không được ghi nhận!', { duration: 5000, id: 'anti-cheat' });
                        });
                    }
                }
            }
        }, 15000); // 15 seconds

        return () => clearInterval(interval);
    }, [canAccessCurrentLesson, currentLesson?.id, isTeacherOwner, enrollment, refreshEnrollment]);

    // Send final progress on unmount
    useEffect(() => {
        return () => {
            if (canAccessCurrentLesson && currentLesson?.id && !isTeacherOwner && enrollment && currentLesson?.type !== 'quiz') {
                const finalPercent = watchedPercentRef.current;
                const data = JSON.stringify({ watchedPercent: finalPercent });
                const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/progress/lectures/${currentLesson.id}`;
                
                // Get token from storage (same key as api.ts)
                const token = localStorage.getItem('elearning_token') || sessionStorage.getItem('elearning_token');
                
                // Use fetch with keepalive for reliable delivery with auth
                fetch(url, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: data,
                    keepalive: true
                }).catch(() => {});
            }
        };
    }, [canAccessCurrentLesson, currentLesson?.id, isTeacherOwner, enrollment]);

    // Track video time for native videos
    const handleVideoTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        if (video.duration > 0) {
            const percent = (video.currentTime / video.duration) * 100;
            watchedPercentRef.current = Math.min(100, Math.round(percent * 10) / 10);
        }
    }, []);

    // Send progress immediately when video ends (important for short videos)
    const handleVideoEnded = useCallback(async () => {
        if (!canAccessCurrentLesson || !currentLesson?.id || isTeacherOwner) {
            return;
        }
        if (!enrollment) {
            return;
        }

        watchedPercentRef.current = 100; // Mark as 100% watched
        
        try {
            const result = await progressService.updateLectureProgress(currentLesson.id, 100);
            const isCompleted = result.data?.progress?.isCompleted;
            lastSentPercentRef.current = 100;
            await refreshEnrollment();

            // Check for certificate eligibility after progress update
            if (isCompleted) {
                try {
                    const eligibility = await progressService.getCertificateEligibility(id!);
                    if (eligibility.isEligible) {
                        setLatestCertId(eligibility.certificateData?.certificateId || null);
                        setShowCertCongrats(true);
                    }
                } catch (certErr) {
                    console.error('Certificate check error:', certErr);
                }
            }
        } catch (err: any) {
            console.error('[Video] Error updating progress:', err);
            if (err?.message?.toLowerCase().includes('bất thường')) {
                import('react-hot-toast').then(({ default: toast }) => {
                    toast.error('⚠️ Cảnh báo: Phát hiện thao tác chạy cóc/tua video bất thường. Tiến độ này sẽ không được ghi nhận!', { duration: 5000, id: 'anti-cheat' });
                });
            }
        }
    }, [canAccessCurrentLesson, currentLesson?.id, isTeacherOwner, enrollment, refreshEnrollment]);

    const getYouTubeEmbedUrl = (url: string): string | null => {
        const u = String(url || '').trim();
        if (!u) return null;
        try {
            const parsed = new URL(u);
            const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
            const baseParams = "?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&enablejsapi=1";
            if (host === 'youtu.be') {
                const id = parsed.pathname.split('/').filter(Boolean)[0];
                return id ? `https://www.youtube.com/embed/${id}${baseParams}` : null;
            }
            if (host === 'youtube.com' || host === 'm.youtube.com') {
                const id = parsed.searchParams.get('v');
                if (id) return `https://www.youtube.com/embed/${id}${baseParams}`;
                const parts = parsed.pathname.split('/').filter(Boolean);
                const idx = parts.findIndex((p) => p === 'embed');
                if (idx >= 0 && parts[idx + 1]) return `https://www.youtube.com/embed/${parts[idx + 1]}${baseParams}`;
            }
        } catch {
        }
        return null;
    };

    const renderLessonMedia = () => {
        if (!canAccessCurrentLesson) {
            return (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="text-center">
                        <p className="text-white/80 text-sm font-bold">Nội dung bị khóa</p>
                    </div>
                </div>
            );
        }

        const url = String(currentLesson?.videoUrl || '').trim();
        const type = String((currentLesson as any)?.type || 'video');
        if (!url && type !== 'text' && type !== 'quiz') {
            return null; // Trả về null để container cha có thể ẩn đi
        }

        if (type === 'text') {
            return null; // Văn bản sẽ được render ở phần main flow cho đẹp
        }

        if (type === 'video') {
            const yt = getYouTubeEmbedUrl(url);
            if (yt) {
                return (
                    <iframe
                        src={yt}
                        title="YouTube video player"
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        sandbox="allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-presentation"
                    />
                );
            }

            return (
                <video
                    src={url}
                    controls
                    className="absolute inset-0 w-full h-full"
                    onTimeUpdate={handleVideoTimeUpdate}
                    onEnded={handleVideoEnded}
                    autoPlay
                />
            );
        }

        if (type === 'audio') {
            return (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <audio src={url} controls className="w-full max-w-2xl" />
                </div>
            );
        }

        if (type === 'pdf') {
            return (
                <div className="absolute inset-0 flex flex-col bg-white">
                    {/* PDF Viewer */}
                    <iframe
                        src={url}
                        className="flex-1 w-full h-full"
                    />
                    
                    {/* Download Bar - Fixed at bottom */}
                    <div className="p-4 bg-linear-to-r from-slate-900 to-slate-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <FileIcon size={20} className="text-amber-500" />
                            <span className="text-white font-bold text-sm">Tài liệu PDF</span>
                        </div>
                        <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="flex items-center justify-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-amber-600 transition-all shadow-lg"
                        >
                            <Download size={16} />
                            TẢI XUỐNG PDF
                        </a>
                    </div>
                </div>
            );
        }

        if (type === 'quiz') {
            const quizIdUrl = url || (currentLesson as any)?.quizId || (currentLesson?.id?.toString()?.replace('quiz-', ''));
            return (
                <QuizPreviewPanel 
                    courseId={id || ''} 
                    lessonId={currentLesson?.id?.toString() || ''} 
                    quizIdUrl={quizIdUrl?.toString() || ''}
                    title={currentLesson?.title || ''}
                    attachments={currentLesson?.attachments}
                />
            );
        }

        if (type === 'text') {
            // 🛡️ P0-5 FIX: Sanitize HTML content to prevent XSS
            const sanitizedContent = sanitizeHTML((currentLesson as any)?.content);
            
            return (
                <div className="absolute inset-0 bg-white overflow-y-auto p-8 md:p-12 lg:p-16">
                    <div className="max-w-4xl mx-auto">
                        <div
                            className="rich-text-content ql-snow ql-editor"
                            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className="absolute inset-0 flex items-center justify-center p-6">
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white/10 border border-white/20 text-white px-6 py-3 rounded-2xl font-black hover:bg-amber-600 transition-all"
                >
                    MỞ TÀI LIỆU
                </a>
            </div>
        );
    };

    if (!id) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 p-10 text-center">
                <p className="font-bold text-gray-600">Không tìm thấy khóa học</p>
                <button
                    onClick={() => navigate('/courses')}
                    className="mt-4 px-6 py-3 rounded-2xl bg-gray-900 text-white font-black hover:bg-amber-600 transition-all"
                >
                    VỀ DANH SÁCH KHÓA HỌC
                </button>
            </div>
        );
    }

    if (!course || isLoadingDetail) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50">
                <LoaderCircle size={40} className="animate-spin text-amber-500" />
                <p className="mt-4 text-sm font-bold text-gray-500 animate-pulse uppercase tracking-widest">Đang tải nội dung học tập...</p>
            </div>
        );
    }

    const hasLessons = (curriculumIndex?.lessonIds?.length ?? 0) > 0 || (course?.curriculum?.some((m) => m.lessons?.length > 0) ?? false);
    if (!hasLessons) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 p-10 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300">
                    <BookOpen size={40} />
                </div>
                <p className="font-black text-gray-900 text-lg uppercase tracking-tight mb-2">Khóa học chưa có bài học nào</p>
                <p className="text-gray-500 text-sm font-medium mb-8 max-w-xs mx-auto">Giảng viên đang cập nhật nội dung cho khóa học này. Vui lòng quay lại sau nhé!</p>
                <button
                    onClick={() => navigate(`/course/${id}`)}
                    className="mt-4 px-8 py-4 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer"
                >
                    VỀ TRANG CHI TIẾT
                </button>
            </div>
        );
    }

    const handleCertDownload = async () => {
        if (!id) return;
        try {
            toast.loading('Đang tải chứng chỉ...', { id: 'cert' });
            await progressService.downloadCertificate(id);
            toast.success('Tải chứng chỉ thành công!', { id: 'cert' });
        } catch (err: any) {
            toast.error(err.message || 'Lỗi tải chứng chỉ', { id: 'cert' });
        }
    };

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            <CertificateCongratulationModal 
                isOpen={showCertCongrats}
                onClose={() => setShowCertCongrats(false)}
                courseTitle={course?.title || ''}
                certificateId={latestCertId || ''}
                onViewOnline={() => {
                    setShowCertCongrats(false);
                    navigate(`/verify/${latestCertId}`);
                }}
                onDownload={handleCertDownload}
            />
            {/* Top Navigation */}
            <header className="h-16 bg-slate-950 text-white flex items-center justify-between px-4 shrink-0 z-30 border-b border-slate-800 shadow-md">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="hidden md:block">
                        <div className="mb-0.5">
                            <Breadcrumb 
                                items={[
                                    { label: 'Khóa học của tôi', path: '/my-learning' },
                                    { label: course.title, path: `/course/${id}/dashboard` },
                                    { label: currentLesson?.title || 'Bài học' }
                                ]}
                                className="text-white"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {isTeacherOwner ? 'Quản lý khóa học' : currentLesson?.moduleTitle}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {isTeacherOwner && (
                        <span className="px-3 py-1 bg-amber-500 text-gray-900 text-xs font-black uppercase tracking-wider rounded-full">
                            Giảng viên
                        </span>
                    )}
                    {!isTeacherOwner && enrollment && (
                        <div className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10">
                            <BookOpen size={16} className="text-amber-400" />
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Tiến độ khóa học</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-2.5 w-40 bg-white/15 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-linear-to-r from-amber-400 via-amber-300 to-yellow-200 transition-all duration-700 ease-out relative rounded-full"
                                            style={{ width: `${Math.min(Math.round(Number(enrollment.progressPercent ?? 0)), 100)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.8)]"></div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-white tabular-nums min-w-[32px]">{Math.round(Number(enrollment.progressPercent ?? 0))}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {isTeacherOwner && (
                        <button
                            onClick={() => navigate(`/teacher/edit-course/${id}`)}
                            className="flex items-center gap-2 bg-slate-800/80 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-slate-700 hover:bg-slate-700 hover:border-slate-600 shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-95"
                        >
                            <FileText size={14} />
                            QUẢN LÝ
                        </button>
                    )}

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`p-2 hover:bg-white/10 rounded-full transition-all ${viewMode === 'fullscreen' ? 'lg:block' : 'lg:hidden'}`}
                    >
                        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            <div className={`flex flex-1 min-h-0 relative overflow-hidden items-start ${viewMode === 'large' ? 'flex-col' : 'flex-row'}`}>
                {/* Main Content (Video & Info) */}
                <main className={`bg-slate-50 flex flex-col transition-all duration-300 ${
                    viewMode === 'fullscreen' ? (sidebarOpen ? 'w-[calc(100%-400px)]' : 'w-full') : 
                    viewMode === 'large' ? 'w-full h-auto' : 
                    viewMode === 'split' ? 'w-1/2' :
                    viewMode === 'compact' ? 'w-[400px] shrink-0' :
                    sidebarOpen ? 'lg:mr-0 flex-1' : 'flex-1'
                }`}>
                    {/* Lesson Title - Nằm trên video */}
                    <div className="px-5 py-4 bg-white border-b border-slate-100 shrink-0 shadow-sm z-10">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{currentLesson?.title}</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">{currentLesson?.moduleTitle}</p>
                    </div>
                    {/* Lesson Player Container - Chỉ hiện khi có media */}
                    {canAccessCurrentLesson && currentLesson?.type === 'quiz' ? (
                        <div className="w-full flex-1 bg-slate-50 relative overflow-hidden shrink-0 flex flex-col">
                            {renderLessonMedia()}
                        </div>
                    ) : canAccessCurrentLesson && (currentLesson?.videoUrl || currentLesson?.type === 'pdf' || currentLesson?.type === 'audio') && currentLesson?.type !== 'text' && (
                        <div className="w-full aspect-video bg-slate-950 relative overflow-hidden shadow-2xl shadow-black/40 shrink-0">
                            {renderLessonMedia()}

                            {!canAccessCurrentLesson && (
                                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 z-10 transition-all">
                                    <div className="bg-white/95 rounded-[32px] p-8 md:p-10 max-w-md w-full text-center shadow-[0_0_40px_rgba(0,0,0,0.3)] animate-in zoom-in duration-500 border border-white/20 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-linear-to-b from-amber-500/10 to-transparent pointer-events-none"></div>
                                        <div className="relative w-20 h-20 bg-linear-to-br from-amber-100 to-amber-200 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/20 animate-bounce cursor-default">
                                            <Lock size={32} />
                                        </div>
                                        <h3 className="relative text-2xl font-black text-slate-900 mb-3 tracking-tighter uppercase line-clamp-1">Nội dung bị khóa</h3>
                                        <p className="relative text-slate-500 font-medium leading-relaxed mb-8 px-2">
                                            Bạn cần đăng ký khóa học này để truy cập toàn bộ nội dung bài giảng bổ ích.
                                        </p>
                                        <button
                                            onClick={() => navigate(`/course/${id}`)}
                                            className="relative w-full bg-linear-to-r from-slate-900 to-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:from-amber-500 hover:to-orange-500 transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer shadow-xl shadow-slate-900/20"
                                        >
                                            VỀ TRANG KHÓA HỌC
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    <div className={currentLesson?.type === 'quiz' ? 'hidden' : 'p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8 overflow-y-auto'}>
                        {/* PDF Download Section - Nổi bật */}
                        {currentLesson?.type === 'pdf' && currentLesson?.videoUrl && (
                            <div className="bg-linear-to-r from-amber-500 to-orange-500 rounded-3xl p-6 shadow-xl shadow-amber-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                            <FileIcon size={32} className="text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black text-lg">Tài liệu bài học</h4>
                                            <p className="text-white/80 text-xs font-bold uppercase">PDF • Xem trực tiếp hoặc tải về để học offline</p>
                                        </div>
                                    </div>
                                    <a
                                        href={currentLesson.videoUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        download
                                        className="flex items-center justify-center gap-2 bg-white text-amber-600 px-8 py-4 rounded-2xl text-xs font-black hover:bg-slate-100 transition-all shadow-xl hover:scale-105 active:scale-95"
                                    >
                                        <Download size={18} />
                                        TẢI XUỐNG
                                    </a>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Thông tin bài học</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-600 hover:text-amber-600 hover:shadow-md transition-all cursor-pointer">
                                    <MessageSquare size={20} />
                                </button>
                                <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-600 hover:text-amber-600 hover:shadow-md transition-all cursor-pointer">
                                    <FileText size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Rich Text Content - Hiển thị linh hoạt theo dữ liệu */}
                        {Boolean(currentLesson?.content) && (
                            <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {/* 🛡️ P0-5 FIX: Sanitize HTML content */}
                                <div
                                    className="rich-text-content ql-snow ql-editor prose prose-slate max-w-none"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(String(currentLesson?.content)) }}
                                />
                            </div>
                        )}

                        {/* Resources Section - Dynamic Attachments */}
                        {currentLesson?.attachments && currentLesson.attachments.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 ml-1">
                                    <FileText size={18} className="text-amber-500" />
                                    <h4 className="font-black text-gray-900 text-sm uppercase tracking-tight">Tài liệu đính kèm ({currentLesson.attachments.length})</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {currentLesson.attachments.map((file: any) => (
                                        <div
                                            key={file.id}
                                            className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-all duration-300 group-hover:scale-110">
                                                    {file.type === 'image' && <ImageIcon size={24} />}
                                                    {file.type === 'pdf' && <FileIcon size={24} />}
                                                    {file.type === 'audio' && <Music size={24} />}
                                                    {file.type === 'video' && <VideoIcon size={24} />}
                                                    {file.type !== 'image' && file.type !== 'pdf' && file.type !== 'audio' && file.type !== 'video' && <FileIcon size={24} />}
                                                </div>
                                                <div className="flex-1">
                                                    <h5 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">{file.title}</h5>
                                                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em] mt-1">
                                                        {file.type} • {file.url.split('?')[0].split('.').pop()?.toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                                {(file.type === 'image' || file.type === 'pdf') && (
                                                    <button
                                                        onClick={() => {
                                                            if (file.type === 'image') {
                                                                setPreviewImage(file.url);
                                                            } else if (file.type === 'pdf') {
                                                                setPreviewPdf(file.url);
                                                            } else {
                                                                window.open(file.url, '_blank');
                                                            }
                                                        }}
                                                        className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 px-5 py-3 rounded-2xl text-xs font-black hover:bg-amber-100 hover:shadow-md transition-all active:scale-95 cursor-pointer flex-1 md:flex-none"
                                                    >
                                                        <Eye size={16} />
                                                        XEM
                                                    </button>
                                                )}
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    download={file.title}
                                                    className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-5 py-3 rounded-2xl text-xs font-black hover:bg-amber-500 hover:text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all active:scale-95 cursor-pointer flex-1 md:flex-none"
                                                >
                                                    <Download size={16} />
                                                    TẢI XUỐNG
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                <aside
                    className={`bg-white border-l border-slate-100 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.03)] lg:shadow-none transition-all duration-300 md:z-30 z-40 lg:relative ${
                        viewMode === 'fullscreen' ? (sidebarOpen ? 'w-[400px] relative' : 'w-0 overflow-hidden border-0') :
                        viewMode === 'large' ? 'w-full h-[400px] relative' :
                        viewMode === 'split' ? 'w-1/2 relative' :
                        viewMode === 'compact' ? 'flex-1 relative' :
                        'w-full md:w-[400px] lg:w-[550px] relative'
                    } ${viewMode !== 'fullscreen' && !sidebarOpen ? 'translate-x-full lg:translate-x-0' : ''} ${viewMode !== 'fullscreen' && viewMode !== 'large' && !sidebarOpen ? 'lg:absolute lg:right-0 lg:top-0 lg:bottom-0' : ''}`}
                >
                    {/* View Mode Selector - Above Tabs */}
                    <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Hiển thị:</span>
                            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                <button
                                    onClick={() => setViewMode('fullscreen')}
                                    className={`p-1.5 rounded-lg transition-all duration-300 ${viewMode === 'fullscreen' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-105' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`}
                                    title="Toàn màn hình"
                                >
                                    <Maximize size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('large')}
                                    className={`p-1.5 rounded-lg transition-all duration-300 ${viewMode === 'large' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-105' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`}
                                    title="Video lớn"
                                >
                                    <Square size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('split')}
                                    className={`p-1.5 rounded-lg transition-all duration-300 ${viewMode === 'split' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-105' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`}
                                    title="Chia đôi"
                                >
                                    <Columns2 size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('compact')}
                                    className={`p-1.5 rounded-lg transition-all duration-300 ${viewMode === 'compact' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-105' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`}
                                    title="Thu nhỏ video"
                                >
                                    <PictureInPicture size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="h-14 px-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-6 h-full">
                            <button
                                onClick={() => setActiveSidebarTab('content')}
                                className={`h-full relative px-2 flex items-center gap-2 transition-all ${activeSidebarTab === 'content' ? 'text-slate-900 border-b-2 border-amber-500' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <BookOpen size={16} />
                                <span className="text-[11px] font-black uppercase tracking-widest">Nội dung</span>
                            </button>
                            <button
                                onClick={() => setActiveSidebarTab('chat')}
                                className={`h-full relative px-2 flex items-center gap-2 transition-all ${activeSidebarTab === 'chat' ? 'text-slate-900 border-b-2 border-amber-500' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <MessageSquare size={16} />
                                <span className="text-[11px] font-black uppercase tracking-widest">Chat</span>
                            </button>
                            <button
                                onClick={() => setActiveSidebarTab('discussion')}
                                className={`h-full relative px-2 flex items-center gap-2 transition-all ${activeSidebarTab === 'discussion' ? 'text-slate-900 border-b-2 border-amber-500' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <MessageSquare size={16} />
                                <span className="text-[11px] font-black uppercase tracking-widest">Thảo luận</span>
                            </button>
                        </div>
                        <div className={`${viewMode === 'fullscreen' ? 'block' : 'lg:hidden'}`}>
                            <X size={20} onClick={() => setSidebarOpen(false)} className="cursor-pointer text-gray-400 hover:text-slate-900" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {activeSidebarTab === 'content' ? (
                            <div className="p-5 space-y-6">
                                {(curriculum.length > 0 ? curriculum : (course?.curriculum || [])).map((module: any, mIdx) => {
                                    const isExpanded = expandedModules[module.id];
                                    return (
                                        <div key={module.id} className="space-y-3">
                                            <div 
                                                className={`bg-slate-50 border p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-amber-200 hover:shadow-md hover:bg-white transition-all duration-300 ${isExpanded ? 'border-amber-200 bg-white shadow-sm' : 'border-slate-100'}`}
                                                onClick={() => toggleModule(String(module.id))}
                                            >
                                                <div>
                                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Phần {mIdx + 1}</p>
                                                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-amber-700 transition-colors">{module.title}</h4>
                                                </div>
                                                <ChevronDown size={16} className={`text-slate-400 group-hover:text-amber-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>

                                            {isExpanded && module.lessons && (
                                                <div className="space-y-1.5 pl-3 animate-in slide-in-from-top-2 duration-300 fade-in">
                                            {module.lessons.map((lesson: any) => {
                                                const isActive = lesson.id === currentLesson?.id;
                                                const isCompleted = completedLessonIds.includes(String(lesson.id));
                                                const canAccess = Boolean(enrollment) || Boolean(lesson.isPreview) || isTeacherOwner;
                                                return (
                                                    <button
                                                        key={lesson.id}
                                                        onClick={async () => {
                                                            if (!id) return;
                                                            if (!canAccess && !isTeacherOwner) {
                                                                setShowEnrollModal(true);
                                                                return;
                                                            }

                                                            navigate(`/course/${id}/lesson/${lesson.id}`);
                                                        }}
                                                        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-300 border border-transparent group cursor-pointer ${isActive ? 'bg-amber-50/80 border-amber-200 shadow-sm ring-1 ring-amber-500/10 text-amber-700' : 'hover:bg-slate-50 hover:border-slate-200'}`}
                                                    >
                                                        <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-linear-to-br from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/30' : canAccess ? 'bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-100'}`}>
                                                            {!canAccess ? <Lock size={12} /> :
                                                                lesson.type === 'quiz' ? <HelpCircle size={14} /> :
                                                                    lesson.type === 'video' ? <Play size={14} className={lesson.isPreview ? 'fill-current' : ''} /> :
                                                                        lesson.type === 'audio' ? <Trophy size={14} className="rotate-0" /> :
                                                                            lesson.type === 'text' || lesson.type === 'pdf' ? <FileText size={14} /> :
                                                                                <Play size={14} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-bold line-clamp-1 transition-colors ${isActive ? 'text-amber-700' : isCompleted ? 'text-slate-500 group-hover:text-amber-600' : 'text-slate-600 group-hover:text-slate-900'}`}>{lesson.title}</p>
                                                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{lesson.duration}</p>
                                                        </div>
                                                        {isCompleted && !isActive && <CheckCircle2 size={16} className="text-emerald-500 drop-shadow-sm shrink-0" />}
                                                        {isActive && <CheckCircle2 size={16} className="text-amber-500 drop-shadow-sm shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : activeSidebarTab === 'chat' ? (
                            <>
                                {currentLesson?.type === 'quiz' ? (
                                    <div className="p-8 text-center">
                                        <HelpCircle size={48} className="text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 font-medium">Chat không khả dụng cho bài kiểm tra</p>
                                        <p className="text-xs text-gray-400 mt-2">Hãy tập trung làm bài nhé!</p>
                                    </div>
                                ) : (
                                    <LectureChat
                                        lessonId={currentLesson?.id || ''}
                                        courseId={id}
                                        userRole={(user?.role?.toLowerCase() as 'student' | 'teacher' | 'admin') || 'student'}
                                    />
                                )}
                                {/* Quick Actions - Different for teacher and student */}
                                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 shrink-0">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                        {isTeacherOwner ? 'Quản lý' : 'Thao tác nhanh'}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {isTeacherOwner ? (
                                            <>
                                                <button
                                                    onClick={() => navigate(`/teacher/lectures/${currentLesson?.id}`)}
                                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-amber-300 transition-all"
                                                >
                                                    <FileText size={14} className="text-amber-500" />
                                                    Sửa bài giảng
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/teacher/courses/${id}/chapters`)}
                                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-amber-300 transition-all"
                                                >
                                                    <ExternalLink size={14} className="text-amber-500" />
                                                    Quản lý nội dung
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        if (navigator.share) {
                                                            navigator.share({
                                                                title: currentLesson?.title || 'Bài học',
                                                                url: window.location.href,
                                                            });
                                                        } else {
                                                            navigator.clipboard.writeText(window.location.href);
                                                            alert('Đã sao chép link!');
                                                        }
                                                    }}
                                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-amber-300 transition-all"
                                                >
                                                    <Share2 size={14} className="text-amber-500" />
                                                    Chia sẻ
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/course/${id}`)}
                                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-amber-300 transition-all"
                                                >
                                                    <ExternalLink size={14} className="text-amber-500" />
                                                    Khóa học
                                                </button>
                                                <button
                                                    onClick={() => alert('Đã thêm vào yêu thích!')}
                                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-amber-300 transition-all"
                                                >
                                                    <Heart size={14} className="text-amber-500" />
                                                    Yêu thích
                                                </button>
                                                <button
                                                    onClick={() => alert('Đã gửi báo cáo!')}
                                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-amber-300 transition-all"
                                                >
                                                    <Flag size={14} className="text-amber-500" />
                                                    Báo cáo
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-4 h-full">
                                <ForumSection
                                    courseId={id}
                                    lectureId={currentLesson?.id}
                                    type="lecture"
                                />
                            </div>
                        )}
                    </div>

                    {activeSidebarTab === 'content' && (
                        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 shrink-0">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        const prevIdx = currentIdx - 1;
                                        if (prevIdx >= 0 && id) {
                                            const prevLesson = allLessons[prevIdx];
                                            if (prevLesson) {
                                                navigate(`/course/${id}/lesson/${prevLesson.id}`);
                                            }
                                        }
                                    }}
                                    disabled={currentIdx <= 0}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <ArrowLeft size={16} />
                                    Bài trước
                                </button>
                                <button
                                    onClick={() => {
                                        const nextIdx = currentIdx + 1;
                                        if (nextIdx < allLessons.length && id) {
                                            const nextLesson = allLessons[nextIdx];
                                            if (nextLesson) {
                                                navigate(`/course/${id}/lesson/${nextLesson.id}`);
                                            }
                                        }
                                    }}
                                    disabled={currentIdx >= allLessons.length - 1}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    Bài sau
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                </aside>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-10 animate-in fade-in duration-300"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer z-10"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X size={32} />
                    </button>
                    <div
                        className="relative max-w-full max-h-full flex items-center justify-center animate-in zoom-in duration-500"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[90vh] rounded-3xl shadow-2xl object-contain border-4 border-white/10"
                        />
                    </div>
                </div>
            )}

            {/* PDF Preview Modal */}
            {previewPdf && (
                <div
                    className="fixed inset-0 z-50 flex flex-col bg-black/90 animate-in fade-in duration-300"
                    onClick={() => setPreviewPdf(null)}
                >
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-700">
                        <span className="text-white font-bold text-sm">Xem tài liệu PDF</span>
                        <button
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer"
                            onClick={() => setPreviewPdf(null)}
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1" onClick={e => e.stopPropagation()}>
                        <iframe
                            src={previewPdf}
                            className="w-full h-full"
                            title="PDF Preview"
                        />
                    </div>
                </div>
            )}

            {/* Enrollment Required Modal */}
            {showEnrollModal && (
                <div
                    className="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300"
                    onClick={() => setShowEnrollModal(false)}
                >
                    <div
                        className="bg-white/95 max-w-md w-full rounded-[40px] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative animate-in zoom-in slide-in-from-bottom-10 duration-500 border border-white/20 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-amber-500/20 to-transparent pointer-events-none"></div>

                        <button
                            onClick={() => setShowEnrollModal(false)}
                            className="cursor-pointer absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 bg-white/50 hover:bg-slate-100 rounded-full transition-colors z-10"
                        >
                            <X size={24} />
                        </button>

                        <div className="relative flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 bg-linear-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30 transform -rotate-6">
                                <Lock size={36} />
                            </div>
                            
                            <div className="space-y-3">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Mở khóa nội dung!</h3>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed px-2">
                                    Nội dung này hiện đang bị khóa. Hãy ghi danh ngay để mở khóa toàn bộ bài giảng chất lượng cùng tài liệu VIP nhé!
                                </p>
                            </div>

                            <div className="w-full pt-4 space-y-3">
                                <button
                                    onClick={() => {
                                        setShowEnrollModal(false);
                                        navigate(`/course/${id}`);
                                    }}
                                    className="w-full cursor-pointer py-4 bg-linear-to-r from-slate-900 to-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:from-amber-500 hover:to-orange-500 transition-all duration-300 shadow-xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2 group/btn hover:shadow-orange-500/30 hover:-translate-y-1"
                                >
                                    ĐI TỚI TRANG CHI TIẾT KHÓA HỌC
                                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => setShowEnrollModal(false)}
                                    className="w-full cursor-pointer py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-700 transition-colors"
                                >
                                    Để sau nhé
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for Sidebar
const ChevronDown: React.FC<{ size: number, className?: string }> = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);

export default LessonPlayer;
