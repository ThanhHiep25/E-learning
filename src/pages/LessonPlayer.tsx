import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Play, Lock,
    CheckCircle2, MessageSquare, FileText,
    Menu, X, ArrowLeft, Trophy, ExternalLink
} from 'lucide-react';
import { useCourseStore } from '../store/useCourseStore';
import { enrollmentService, type BackendEnrollment } from '../services/enrollment.service';
import { useAuth } from '../context/AuthContext';

const LessonPlayer: React.FC = () => {
    const { id, lessonId } = useParams<{ id: string, lessonId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { courses, loadCourseDetail, getCurriculumIndex } = useCourseStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [enrollment, setEnrollment] = useState<BackendEnrollment | null>(null);
    const course = useMemo(() => courses.find(c => c.id === id), [courses, id]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (!id) return;
        if (!course) {
            loadCourseDetail(id);
        }
    }, [id, course, loadCourseDetail]);

    useEffect(() => {
        const loadEnrollment = async () => {
            if (!id) return;
            try {
                enrollmentService.clearCache();
                const enrollments = await enrollmentService.listMyEnrollments();
                const en = enrollments.find((e) => String(e.courseId) === String(id)) || null;
                setEnrollment(en);
            } catch (e) {
                setEnrollment(null);
            }
        };

        loadEnrollment();
    }, [id, user?.id]);

    useEffect(() => {
        setEnrollment(null);
    }, [user?.id]);

    const curriculumIndex = useMemo(() => {
        if (!id) return undefined;
        return getCurriculumIndex(String(id));
    }, [getCurriculumIndex, id, course?.curriculum]);

    // Flatten lessons to find current and next/prev
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
                moduleId: lesson.moduleId,
                moduleTitle: module?.title || "",
            };
        });
    }, [curriculumIndex]);

    const currentLesson = useMemo(() => {
        if (!lessonId) return allLessons[0];
        return allLessons.find(l => l.id === lessonId) || allLessons[0];
    }, [allLessons, lessonId]);

    const currentIdx = allLessons.findIndex(l => l.id === currentLesson?.id);
    const nextLesson = allLessons[currentIdx + 1];
    const prevLesson = allLessons[currentIdx - 1];

    const computedProgressPercent = useMemo(() => {
        if (!allLessons.length || currentIdx < 0) return 0;
        return Math.min(100, Math.max(0, Math.round(((currentIdx + 1) / allLessons.length) * 100)));
    }, [allLessons.length, currentIdx]);

    const displayedProgressPercent = enrollment
        ? Number(enrollment?.progressPercent ?? 0)
        : computedProgressPercent;

    const canAccessCurrentLesson = Boolean(enrollment) || Boolean(currentLesson?.isPreview);

    const getYouTubeEmbedUrl = (url: string): string | null => {
        const u = String(url || '').trim();
        if (!u) return null;
        try {
            const parsed = new URL(u);
            const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
            if (host === 'youtu.be') {
                const id = parsed.pathname.split('/').filter(Boolean)[0];
                return id ? `https://www.youtube.com/embed/${id}` : null;
            }
            if (host === 'youtube.com' || host === 'm.youtube.com') {
                const id = parsed.searchParams.get('v');
                if (id) return `https://www.youtube.com/embed/${id}`;
                const parts = parsed.pathname.split('/').filter(Boolean);
                const idx = parts.findIndex((p) => p === 'embed');
                if (idx >= 0 && parts[idx + 1]) return `https://www.youtube.com/embed/${parts[idx + 1]}`;
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
        if (!url) {
            return (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-white/70 text-sm font-bold">Bài học chưa có nội dung</p>
                    </div>
                </div>
            );
        }

        if (type === 'video') {
            const yt = getYouTubeEmbedUrl(url);
            if (yt) {
                return (
                    <iframe
                        src={yt}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                );
            }

            return (
                <video
                    src={url}
                    controls
                    className="absolute inset-0 w-full h-full"
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
                <iframe
                    src={url}
                    className="absolute inset-0 w-full h-full bg-white"
                />
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

    if (!course) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                <p className="mt-4 text-sm font-bold text-gray-500">Đang tải bài học...</p>
            </div>
        );
    }

    const hasLessons = (curriculumIndex?.lessonIds?.length ?? 0) > 0 || (course.curriculum?.some((m) => m.lessons?.length > 0) ?? false);
    if (!hasLessons) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 p-10 text-center">
                <p className="font-bold text-gray-600">Khóa học chưa có bài học nào</p>
                <button
                    onClick={() => navigate(`/course/${id}`)}
                    className="mt-4 px-6 py-3 rounded-2xl bg-gray-900 text-white font-black hover:bg-amber-600 transition-all"
                >
                    VỀ TRANG KHÓA HỌC
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Top Navigation */}
            <header className="h-16 bg-gray-900 text-white flex items-center justify-between px-4 shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/my-learning')}
                        className="p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="hidden md:block">
                        <h1 className="text-sm font-bold truncate max-w-[300px]">{course.title}</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{currentLesson?.moduleTitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden lg:flex items-center gap-2">
                        <div className="h-2 w-32 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${displayedProgressPercent}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-amber-500">{displayedProgressPercent}% Hoàn thành</span>
                    </div>

                    <button className="flex items-center gap-2 bg-amber-500 text-gray-900 px-4 py-1.5 rounded-full text-xs font-black hover:bg-amber-600 transition-all cursor-pointer">
                        <Trophy size={14} />
                        NHẬN CHỨNG CHỈ
                    </button>

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-white/10 rounded-full transition-all lg:hidden"
                    >
                        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 min-h-0 relative">
                {/* Main Content (Video & Info) */}
                <main className={`flex-1 overflow-y-auto bg-gray-50 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:mr-0' : ''}`}>
                    {/* Lesson Player (Real content from BE) */}
                    <div className="w-full h-auto aspect-video md:h-[600px] bg-black relative overflow-hidden">
                        {renderLessonMedia()}

                        {!canAccessCurrentLesson && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6">
                                <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center">
                                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Lock size={22} />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900">Bạn cần đăng ký khóa học để xem bài này</h3>
                                    <p className="text-sm text-gray-500 font-medium mt-2">
                                        Bài học này không phải preview.
                                    </p>
                                    <button
                                        onClick={() => navigate(`/course/${id}`)}
                                        className="mt-5 w-full bg-gray-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-amber-600 transition-all active:scale-95 cursor-pointer"
                                    >
                                        VỀ TRANG KHÓA HỌC
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Lesson Details */}
                    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">{currentLesson?.title}</h2>
                                <p className="text-gray-500 font-medium">Cập nhật lần cuối: 12/2023 • {currentLesson?.duration}</p>
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

                        {/* Resources Section - Highly Visible */}
                        <div className="bg-amber-50/50 border border-amber-100 rounded-[24px] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-900 text-sm uppercase tracking-tight">Tài liệu học tập</h4>
                                    <p className="text-xs text-gray-500 font-bold">Bao gồm file bài tập, mã nguồn và tài liệu PDF đính kèm</p>
                                </div>
                            </div>
                            <button className="flex items-center gap-2 bg-white border border-amber-200 text-amber-600 px-6 py-3 rounded-xl text-xs font-black hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all shadow-sm active:scale-95 cursor-pointer min-w-fit">
                                <ExternalLink size={16} />
                                TẢI XUỐNG TÀI LIỆU (.ZIP)
                            </button>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                            <button
                                disabled={!prevLesson}
                                onClick={async () => {
                                    if (!id || !prevLesson) return;

                                    const prevIdx = currentIdx - 1;
                                    const prevProgress = Math.min(
                                        100,
                                        Math.max(
                                            Number(enrollment?.progressPercent ?? 0),
                                            Math.round(((prevIdx + 1) / (allLessons.length || 1)) * 100),
                                        ),
                                    );

                                    if (enrollment) {
                                        try {
                                            const updated = await enrollmentService.updateProgress(String(id), prevProgress);
                                            setEnrollment(updated);
                                        } catch (e) {
                                        }
                                    }

                                    navigate(`/course/${id}/lesson/${prevLesson.id}`);
                                }}
                                className="flex items-center gap-2 font-bold text-gray-500 hover:text-gray-900 disabled:opacity-20 disabled:hover:text-gray-50 transition-colors cursor-pointer"
                            >
                                <ChevronLeft size={20} />
                                BÀI TRƯỚC
                            </button>
                            <button
                                disabled={!nextLesson}
                                onClick={async () => {
                                    if (!id || !nextLesson) return;
                                    const nextIdx = currentIdx + 1;
                                    const nextProgress = Math.min(
                                        100,
                                        Math.max(
                                            Number(enrollment?.progressPercent ?? 0),
                                            Math.round(((nextIdx + 1) / (allLessons.length || 1)) * 100),
                                        ),
                                    );

                                    try {
                                        const updated = await enrollmentService.updateProgress(String(id), nextProgress);
                                        setEnrollment(updated);
                                    } catch (e) {
                                    }

                                    navigate(`/course/${id}/lesson/${nextLesson.id}`);
                                }}
                                className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-amber-600 transition-all shadow-lg active:scale-95 disabled:opacity-20 cursor-pointer"
                            >
                                BÀI TIẾP THEO
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </main>

                <aside
                    className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white border-l border-gray-100 flex flex-col shadow-2xl lg:shadow-none transition-transform duration-300 md:z-30 z-40 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:absolute lg:top-0 lg:bottom-0 lg:right-0'}`}
                >
                    <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <h3 className="font-black text-gray-900">NỘI DUNG KHÓA HỌC</h3>
                        <div className="lg:hidden">
                            <X size={20} onClick={() => setSidebarOpen(false)} className="cursor-pointer" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {course.curriculum.map((module, mIdx) => (
                            <div key={module.id} className="space-y-2">
                                <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between group cursor-pointer">
                                    <div>
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Phần {mIdx + 1}</p>
                                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{module.title}</h4>
                                    </div>
                                    <ChevronDown size={16} className="text-gray-400" />
                                </div>

                                <div className="space-y-1 pl-2">
                                    {module.lessons.map((lesson) => {
                                        const isActive = lesson.id === currentLesson?.id;
                                        const canAccess = Boolean(enrollment) || Boolean(lesson.isPreview);
                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={async () => {
                                                    if (!id) return;
                                                    if (!canAccess) {
                                                        navigate(`/course/${id}`);
                                                        return;
                                                    }

                                                    navigate(`/course/${id}/lesson/${lesson.id}`);
                                                }}
                                                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all group cursor-pointer ${isActive ? 'bg-amber-50 text-amber-600' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                                                    {lesson.isPreview ? <Play size={14} /> : <Lock size={14} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-bold line-clamp-1 ${isActive ? 'text-amber-600' : 'text-gray-700'}`}>{lesson.title}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">{lesson.duration}</p>
                                                </div>
                                                {isActive && <CheckCircle2 size={16} className="text-amber-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                </aside>
            </div>
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
