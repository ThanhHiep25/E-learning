import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Play, Lock,
    CheckCircle2, MessageSquare, FileText,
    Menu, X, ArrowLeft, Trophy, HelpCircle, Eye, BookOpen,
    Image as ImageIcon, File as FileIcon, Music, Video as VideoIcon, Download,
    LoaderCircle, ArrowRight
} from 'lucide-react';
import { useCourseStore } from '../store/useCourseStore';
import { enrollmentService, type BackendEnrollment } from '../services/enrollment.service';
import { useAuth } from '../context/AuthContext';
import ForumSection from '../components/course/ForumSection';
import 'quill/dist/quill.snow.css';

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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [enrollment, setEnrollment] = useState<BackendEnrollment | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'content' | 'discussion'>('content');
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

        if (type === 'quiz') {
            return (
                <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-900 border-2 border-amber-500/20">
                    <div className="text-center space-y-8 max-w-md animate-in fade-in zoom-in duration-700">
                        <div className="w-24 h-24 bg-amber-500 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/40 rotate-12">
                            <HelpCircle size={48} className="text-white -rotate-12" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Sẵn sàng thử thách?</h3>
                            <p className="text-slate-400 font-bold text-sm leading-relaxed px-6">
                                Bài học này là một bài kiểm tra kiến thức quan trọng. Hãy đảm bảo bạn đã nắm vững nội dung trước khi bắt đầu.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate(`/quiz/${url}`)}
                            className="w-full bg-amber-500 text-gray-900 px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 active:scale-95 cursor-pointer"
                        >
                            BẮT ĐẦU BÀI KIỂM TRA
                        </button>
                    </div>
                </div>
            );
        }

        if (type === 'text') {
            return (
                <div className="absolute inset-0 bg-white overflow-y-auto p-8 md:p-12 lg:p-16">
                    <div className="max-w-4xl mx-auto">
                        <div
                            className="rich-text-content ql-snow ql-editor"
                            dangerouslySetInnerHTML={{ __html: (currentLesson as any)?.content || '' }}
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
                    {/* Lesson Player Container - Chỉ hiện khi có media */}
                    {canAccessCurrentLesson && (currentLesson?.videoUrl || currentLesson?.type === 'pdf' || currentLesson?.type === 'audio' || currentLesson?.type === 'quiz') && currentLesson?.type !== 'text' && (
                        <div className="w-full h-auto aspect-video md:max-h-[700px] bg-black relative overflow-hidden shadow-2xl shrink-0">
                            {renderLessonMedia()}

                            {!canAccessCurrentLesson && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6 z-10 transition-all">
                                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-500">
                                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                            <Lock size={28} />
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tighter uppercase">Nội dung bị khóa</h3>
                                        <p className="text-sm text-gray-500 font-bold leading-relaxed mb-8">
                                            Bạn cần đăng ký khóa học này để truy cập toàn bộ nội dung bài giảng.
                                        </p>
                                        <button
                                            onClick={() => navigate(`/course/${id}`)}
                                            className="w-full bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95 cursor-pointer shadow-lg shadow-gray-200"
                                        >
                                            VỀ TRANG KHÓA HỌC
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentLesson?.title}</h2>
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
                            <div className="bg-white p-2 md:p-5 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div
                                    className="rich-text-content ql-snow ql-editor"
                                    dangerouslySetInnerHTML={{ __html: String(currentLesson?.content) }}
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
                                            className="bg-white border border-gray-100 rounded-3xl p-4 flex items-center justify-between group hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                                                    {file.type === 'image' && <ImageIcon size={22} />}
                                                    {file.type === 'pdf' && <FileIcon size={22} />}
                                                    {file.type === 'audio' && <Music size={22} />}
                                                    {file.type === 'video' && <VideoIcon size={22} />}
                                                    {file.type !== 'image' && file.type !== 'pdf' && file.type !== 'audio' && file.type !== 'video' && <FileIcon size={22} />}
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">{file.title}</h5>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                        {file.type} • {file.url.split('?')[0].split('.').pop()?.toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {file.type === 'image' && (
                                                    <button
                                                        onClick={() => setPreviewImage(file.url)}
                                                        className="flex items-center gap-2 bg-amber-50 text-amber-600 px-5 py-2.5 rounded-2xl text-[10px] font-black hover:bg-amber-100 transition-all active:scale-95 cursor-pointer"
                                                    >
                                                        <Eye size={14} />
                                                        XEM
                                                    </button>
                                                )}
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    download={file.title}
                                                    className="flex items-center gap-2 bg-gray-50 text-gray-600 px-5 py-2.5 rounded-2xl text-[10px] font-black hover:bg-amber-500 hover:text-white transition-all active:scale-95 cursor-pointer"
                                                >
                                                    <Download size={14} />
                                                    TẢI XUỐNG
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
                    className={`fixed inset-y-0 right-0 w-full md:w-[400px] lg:w-[550px] bg-white border-l border-gray-100 flex flex-col shadow-2xl lg:shadow-none transition-transform duration-300 md:z-30 z-40 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:absolute lg:top-0 lg:bottom-0 lg:right-0'}`}
                >
                    <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-6 h-full">
                            <button
                                onClick={() => setActiveSidebarTab('content')}
                                className={`h-full relative px-2 flex items-center gap-2 transition-all ${activeSidebarTab === 'content' ? 'text-slate-900 border-b-2 border-amber-500' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <BookOpen size={16} />
                                <span className="text-[11px] font-black uppercase tracking-widest">Nội dung</span>
                            </button>
                            <button
                                onClick={() => setActiveSidebarTab('discussion')}
                                className={`h-full relative px-2 flex items-center gap-2 transition-all ${activeSidebarTab === 'discussion' ? 'text-slate-900 border-b-2 border-amber-500' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <MessageSquare size={16} />
                                <span className="text-[11px] font-black uppercase tracking-widest">Thảo luận</span>
                            </button>
                        </div>
                        <div className="lg:hidden">
                            <X size={20} onClick={() => setSidebarOpen(false)} className="cursor-pointer text-gray-400 hover:text-slate-900" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {activeSidebarTab === 'content' ? (
                            <div className="p-4 space-y-4">
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
                                                                setShowEnrollModal(true);
                                                                return;
                                                            }

                                                            navigate(`/course/${id}/lesson/${lesson.id}`);
                                                        }}
                                                        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all group cursor-pointer ${isActive ? 'bg-amber-50 text-amber-600' : 'hover:bg-gray-50'}`}
                                                    >
                                                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-amber-500 text-white' : canAccess ? 'bg-amber-50 text-amber-500 group-hover:bg-amber-100' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                                                            {!canAccess ? <Lock size={12} /> :
                                                                lesson.type === 'quiz' ? <HelpCircle size={14} /> :
                                                                    lesson.type === 'video' ? <Play size={14} className={lesson.isPreview ? 'fill-current' : ''} /> :
                                                                        lesson.type === 'audio' ? <Trophy size={14} className="rotate-0" /> :
                                                                            lesson.type === 'text' || lesson.type === 'pdf' ? <FileText size={14} /> :
                                                                                <Play size={14} />}
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

            {/* Enrollment Required Modal */}
            {showEnrollModal && (
                <div
                    className="fixed inset-0 z-110 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
                    onClick={() => setShowEnrollModal(false)}
                >
                    <div
                        className="bg-white max-w-md w-full rounded-[40px] p-8 md:p-10 shadow-2xl relative animate-in zoom-in slide-in-from-bottom-10 duration-500"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowEnrollModal(false)}
                            className=" cursor-pointer absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="space-y-3 mt-5">
                                <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-tighter ">Mở khóa tri thức!</h3>
                                <p className="text-gray-500 font-medium text-sm leading-relaxed px-4">
                                    Nội dung này hiện đang bị khóa. Hãy ghi danh ngay để mở khóa toàn bộ bài giảng, tài liệu và nhận hỗ trợ tận tình từ giảng viên nhé!
                                </p>
                            </div>

                            <div className="w-full pt-4 space-y-3">
                                <button
                                    onClick={() => {
                                        setShowEnrollModal(false);
                                        navigate(`/course/${id}`);
                                    }}
                                    className="w-full cursor-pointer py-5 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 flex items-center justify-center gap-2 group/btn"
                                >
                                    ĐI TỚI TRANG CHI TIẾT
                                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => setShowEnrollModal(false)}
                                    className="w-full cursor-pointer py-4 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-gray-600 transition-colors"
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
