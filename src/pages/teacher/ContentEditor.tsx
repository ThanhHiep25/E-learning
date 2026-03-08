import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus, Trash2, Edit3, GripVertical,
    Video, ChevronDown,
    Save, ArrowLeft, Layout,
    FileText, Image as ImageIcon, Link as LinkIcon,
    File as FileIcon, X, Eye, EyeOff,
    LoaderCircle
} from 'lucide-react';
import { type CurriculumModule, type Lesson, type LessonAttachment } from '../../config/mock-data';
import toast from 'react-hot-toast';
import { teacherService, type BackendTeacherChapter, type BackendTeacherLecture } from '../../services/teacher.service';

const ContentEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [courseTitle, setCourseTitle] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [curriculum, setCurriculum] = useState<CurriculumModule[]>([]);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);
    const [editingLesson, setEditingLesson] = useState<{ mIdx: number, lIdx: number } | null>(null);
    const [editingModuleIdx, setEditingModuleIdx] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewLectureUrl, setPreviewLectureUrl] = useState<string | null>(null);
    const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);

    // Create Chapter Modal State
    const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [isCreatingChapter, setIsCreatingChapter] = useState(false);

    const mapBackendLectureToLesson = (lecture: BackendTeacherLecture): Lesson => {
        const sec = Number(lecture.duration ?? 0);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        const duration = sec > 0 ? `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : '00:00';

        return {
            id: String(lecture.id),
            title: lecture.title,
            duration,
            isPreview: Boolean((lecture as any).isPreview),
            attachments: Array.isArray((lecture as any).attachments) ? (lecture as any).attachments : [],
            videoUrl: lecture.contentUrl || '',
            type: lecture.type,
        } as any;
    };

    const mapBackendChapterToModule = (chapter: BackendTeacherChapter): CurriculumModule => {
        return {
            id: String(chapter.id),
            title: chapter.title,
            lessons: (chapter.Lectures || []).map(mapBackendLectureToLesson),
        } as any;
    };

    const parseDurationToSeconds = (duration: string | undefined): number | undefined => {
        if (!duration) return undefined;
        const d = String(duration).trim();
        const m = d.match(/^(\d{1,2}):(\d{1,2})$/);
        if (m) {
            const mm = Number(m[1]);
            const ss = Number(m[2]);
            if (!Number.isFinite(mm) || !Number.isFinite(ss)) return undefined;
            return mm * 60 + ss;
        }
        const onlyNumber = Number(d);
        if (Number.isFinite(onlyNumber)) return onlyNumber;
        return undefined;
    };

    const guessLectureTypeFromFile = (file: File): string => {
        const mime = String(file.type || '').toLowerCase();
        if (mime.startsWith('video/')) return 'video';
        if (mime.startsWith('audio/')) return 'audio';
        if (mime === 'application/pdf') return 'pdf';
        return 'file';
    };

    const getAcceptForLectureType = (type: string): string | undefined => {
        const t = String(type || '').toLowerCase();
        if (t === 'video') return 'video/*';
        if (t === 'audio') return 'audio/*';
        if (t === 'pdf') return 'application/pdf';
        return undefined;
    };

    const isFileAllowedForLectureType = (file: File, type: string): boolean => {
        const t = String(type || '').toLowerCase();
        const mime = String(file.type || '').toLowerCase();
        if (t === 'video') return mime.startsWith('video/');
        if (t === 'audio') return mime.startsWith('audio/');
        if (t === 'pdf') return mime === 'application/pdf';
        return true;
    };

    const getAcceptForAttachmentType = (type: LessonAttachment['type']): string | undefined => {
        if (type === 'pdf') return 'application/pdf';
        if (type === 'image') return 'image/*';
        return undefined;
    };

    useEffect(() => {
        return () => {
            if (previewLectureUrl) URL.revokeObjectURL(previewLectureUrl);
            if (previewAttachmentUrl) URL.revokeObjectURL(previewAttachmentUrl);
        };
    }, [previewLectureUrl, previewAttachmentUrl]);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                setIsLoading(true);
                const data = await teacherService.getCourseContent(String(id));
                setCourseTitle(String((data as any)?.course?.title || ''));
                const modules = (data.chapters || []).map(mapBackendChapterToModule);
                setCurriculum(modules);
                setExpandedModules(modules.map((m) => m.id));
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Không thể tải nội dung khóa học');
                navigate('/teacher/dashboard');
            } finally {
                setTimeout(() => {
                    setIsLoading(false)
                }, 1000)
            }
        };

        load();
    }, [id]);

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const addModule = () => {
        setNewChapterTitle(`Chương ${curriculum.length + 1}: `);
        setIsChapterModalOpen(true);
    };

    const confirmAddModule = async () => {
        if (!id || !newChapterTitle.trim()) {
            toast.error('Vui lòng nhập tiêu đề chương');
            return;
        }

        setIsCreatingChapter(true);
        try {
            const chapter = await teacherService.createChapter({
                courseId: String(id),
                title: newChapterTitle.trim(),
                order: curriculum.length,
            });
            const newModule = mapBackendChapterToModule({ ...chapter, Lectures: [] });
            setCurriculum((prev) => [...prev, newModule]);
            setExpandedModules((prev) => [...prev, newModule.id]);
            setEditingModuleIdx(curriculum.length);
            setEditingLesson(null);
            setIsChapterModalOpen(false);
            setNewChapterTitle('');
            toast.success('Đã tạo chương mới');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Tạo chương thất bại');
        } finally {
            setIsCreatingChapter(false);
        }
    };

    const addLesson = (mIdx: number) => {
        const run = async () => {
            const module = curriculum[mIdx];
            if (!module) return;

            try {
                const lecture = await teacherService.createLecture({
                    chapterId: String(module.id),
                    title: 'Bài học mới',
                    type: 'video',
                    duration: parseDurationToSeconds('05:00'),
                    order: module.lessons.length,
                });

                const newLesson = mapBackendLectureToLesson(lecture);
                setCurriculum((prev) => {
                    const next = [...prev];
                    next[mIdx] = { ...next[mIdx], lessons: [...next[mIdx].lessons, newLesson] } as any;
                    return next;
                });

                setEditingLesson({ mIdx, lIdx: module.lessons.length });
                setEditingModuleIdx(null);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Tạo bài giảng thất bại');
            }
        };

        run();
    };

    const handleSave = () => {
        const run = async () => {
            try {
                await Promise.all(
                    curriculum.map((module, mIdx) =>
                        teacherService.updateChapter({
                            chapterId: String(module.id),
                            title: module.title,
                            order: mIdx,
                        }),
                    ),
                );

                const lectureUpdates: Promise<unknown>[] = [];
                for (let mIdx = 0; mIdx < curriculum.length; mIdx += 1) {
                    const module = curriculum[mIdx];
                    for (let lIdx = 0; lIdx < (module.lessons || []).length; lIdx += 1) {
                        const lesson = module.lessons[lIdx];
                        lectureUpdates.push(
                            teacherService.updateLecture({
                                lectureId: String((lesson as any).id),
                                title: lesson.title,
                                type: String((lesson as any).type || 'video'),
                                contentUrl: (lesson as any).videoUrl || undefined,
                                duration: parseDurationToSeconds(lesson.duration),
                                isPreview: Boolean((lesson as any).isPreview),
                                attachments: Array.isArray((lesson as any).attachments) ? (lesson as any).attachments : [],
                                order: lIdx,
                            }),
                        );
                    }
                }

                await Promise.all(lectureUpdates);
                toast.success('Lưu nội dung bài giảng thành công!');
                navigate('/teacher/dashboard');
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Lưu nội dung thất bại');
            }
        };

        run();
    };

    const currentLesson = editingLesson ? curriculum[editingLesson.mIdx].lessons[editingLesson.lIdx] : null;
    const currentModule = editingModuleIdx !== null ? curriculum[editingModuleIdx] : null;

    const updateCurrentLesson = (updates: Partial<Lesson>) => {
        if (!editingLesson) return;
        const newCurriculum = [...curriculum];
        newCurriculum[editingLesson.mIdx].lessons[editingLesson.lIdx] = {
            ...newCurriculum[editingLesson.mIdx].lessons[editingLesson.lIdx],
            ...updates
        };
        // Reset preview if we are switching lessons or completing update
        if (updates.videoUrl) {
            if (previewLectureUrl) URL.revokeObjectURL(previewLectureUrl);
            setPreviewLectureUrl(null);
        }
        setCurriculum(newCurriculum);
    };

    const updateCurrentModule = (updates: Partial<CurriculumModule>) => {
        if (editingModuleIdx === null) return;
        const newCurriculum = [...curriculum];
        newCurriculum[editingModuleIdx] = {
            ...newCurriculum[editingModuleIdx],
            ...updates
        };
        setCurriculum(newCurriculum);
    };

    const uploadLectureFile = async (file: File) => {
        if (!editingLesson || !currentLesson) return;
        try {
            setIsUploading(true);
            const lectureId = String((currentLesson as any).id);
            const type = String((currentLesson as any).type || guessLectureTypeFromFile(file));

            // Local preview
            const url = URL.createObjectURL(file);
            if (previewLectureUrl) URL.revokeObjectURL(previewLectureUrl);
            setPreviewLectureUrl(url);

            const updated = await teacherService.updateLecture({
                lectureId,
                file,
                type,
            });

            updateCurrentLesson({
                videoUrl: updated.contentUrl || '',
                type: updated.type,
            } as any);

            toast.success('Upload file thành công');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Upload file thất bại');
        } finally {
            setIsUploading(false);
        }
    };

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

    const addAttachment = (type: LessonAttachment['type']) => {
        if (!editingLesson || !currentLesson) return;
        const newAttachment: LessonAttachment = {
            id: `at${Date.now()}`,
            type,
            title: `Tài liệu ${type.toUpperCase()}`,
            url: ''
        };
        updateCurrentLesson({
            attachments: [...(currentLesson.attachments || []), newAttachment]
        });
    };

    const updateAttachment = (atIdx: number, updates: Partial<LessonAttachment>) => {
        if (!editingLesson || !currentLesson) return;
        const newAttachments = [...(currentLesson.attachments || [])];
        newAttachments[atIdx] = { ...newAttachments[atIdx], ...updates };
        updateCurrentLesson({ attachments: newAttachments });
    };

    const removeAttachment = (atIdx: number) => {
        if (!editingLesson || !currentLesson) return;
        const newAttachments = [...(currentLesson.attachments || [])];
        newAttachments.splice(atIdx, 1);
        updateCurrentLesson({ attachments: newAttachments });
    };

    const uploadAttachmentFile = async (atIdx: number, file: File) => {
        if (!editingLesson || !currentLesson) return;
        const item = currentLesson.attachments?.[atIdx];
        if (!item) return;

        const mime = String(file.type || '').toLowerCase();
        if (item.type === 'pdf' && mime !== 'application/pdf') {
            toast.error('Vui lòng chọn đúng file PDF');
            return;
        }
        if (item.type === 'image' && !mime.startsWith('image/')) {
            toast.error('Vui lòng chọn đúng file hình ảnh');
            return;
        }
        if (item.type === 'link') {
            toast.error('Tài liệu dạng link không upload file');
            return;
        }

        try {
            setIsUploading(true);

            // Local preview
            const url = URL.createObjectURL(file);
            if (previewAttachmentUrl) URL.revokeObjectURL(previewAttachmentUrl);
            setPreviewAttachmentUrl(url);

            const res = await teacherService.uploadAttachmentMedia(file);
            updateAttachment(atIdx, { url: res.url });
            toast.success('Upload tài liệu thành công');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Upload tài liệu thất bại');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full pb-20">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 px-4 lg:px-0">
                    <div>
                        <button
                            onClick={() => navigate('/teacher/dashboard')}
                            className="group flex items-center gap-3 text-gray-400 hover:text-amber-600 font-black uppercase tracking-widest text-[10px] transition-all cursor-pointer mb-4"
                        >
                            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-amber-50 transition-all">
                                <ArrowLeft size={14} />
                            </div>
                            Dashboard
                        </button>
                        <h1 className="md:text-3xl text-xl font-bold text-gray-900 flex items-center gap-3">
                            Xây dựngchương trình học.
                        </h1>
                        {courseTitle && (
                            <p className="md:text-xs text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{courseTitle}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/teacher/dashboard')}
                            className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-3 bg-gray-900 text-white px-10 py-4 rounded-2xl font-bold md:text-sm text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer"
                        >
                            <Save size={20} />
                            Xác nhận lưu
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="px-4 lg:px-0">
                        <div className="flex flex-col items-center justify-center bg-white rounded-[40px] border border-gray-100 shadow-sm p-10 text-center">
                            <LoaderCircle size={40} className="text-amber-600 animate-spin" />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start md:px-4 lg:px-0">
                        {/* Module List (Left Column) */}
                        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                            {curriculum.length === 0 && (
                                <div className="bg-white rounded-[40px] border-2 border-dashed border-gray-100 p-20 text-center">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                        <Layout size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-400">Chưa có chương học nào</h3>
                                    <p className="text-gray-400 mt-2 text-sm max-w-xs mx-auto">Bắt đầu bằng cách thêm chương (module) đầu tiên cho khóa học của bạn</p>
                                </div>
                            )}

                            {curriculum.map((module, mIdx) => (
                                <div key={module.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                    <div className="p-6 lg:p-8 flex items-center justify-between bg-white border-b border-gray-50">
                                        <div className="flex items-center gap-6 flex-1 pr-4">
                                            <div className="p-3 bg-gray-50 text-gray-300 cursor-grab active:cursor-grabbing rounded-2xl">
                                                <GripVertical size={20} />
                                            </div>
                                            <div
                                                className="flex-1 cursor-pointer"
                                                onClick={() => {
                                                    setEditingModuleIdx(mIdx);
                                                    setEditingLesson(null);
                                                }}
                                            >
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-2 py-0.5 bg-amber-50 rounded-md">Chapter {mIdx + 1}</span>
                                                    <span className="text-[10px] font-bold text-gray-400">{module.lessons.length} bài học</span>
                                                </div>
                                                <div className="md:text-xl text-md font-bold text-gray-900 group-hover:text-amber-600 transition-colors uppercase tracking-tight">
                                                    {module.title}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                className={`p-3 cursor-pointer transition-all rounded-2xl ${editingModuleIdx === mIdx ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:bg-gray-50'}`}
                                                onClick={() => {
                                                    setEditingModuleIdx(mIdx);
                                                    setEditingLesson(null);
                                                }}
                                                title="Sửa tiêu đề chương"
                                            >
                                                <Edit3 size={20} />
                                            </button>
                                            <button
                                                className="p-3 cursor-pointer text-gray-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-2xl"
                                                onClick={async () => {
                                                    if (!confirm('Xóa chương học này và tất cả bài giảng bên trong?')) return;
                                                    try {
                                                        await teacherService.deleteChapter(String(module.id));
                                                        setCurriculum(curriculum.filter(m => m.id !== module.id));
                                                        setExpandedModules(expandedModules.filter((x) => x !== module.id));
                                                        setEditingLesson(null);
                                                        setEditingModuleIdx(null);
                                                        toast.success('Đã xóa chương');
                                                    } catch (e) {
                                                        toast.error(e instanceof Error ? e.message : 'Xóa chương thất bại');
                                                    }
                                                }}
                                                title="Xóa chương này"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                            <button
                                                className={`p-3 cursor-pointer transition-all rounded-2xl ${expandedModules.includes(module.id) ? 'text-amber-500 ' : 'text-gray-300 hover:bg-gray-50'}`}
                                                onClick={() => toggleModule(module.id)}
                                            >
                                                <ChevronDown size={20} className={` transition-transform duration-300 ${expandedModules.includes(module.id) ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {expandedModules.includes(module.id) && (
                                        <div className="p-6 lg:p-8 bg-gray-50/50 space-y-4">
                                            {module.lessons.map((lesson, lIdx) => (
                                                <div
                                                    key={lesson.id}
                                                    onClick={() => {
                                                        setEditingLesson({ mIdx, lIdx });
                                                        setEditingModuleIdx(null);
                                                    }}
                                                    className={`bg-white p-6 rounded-2xl border transition-all cursor-pointer group/lesson flex items-center justify-between ${editingLesson?.mIdx === mIdx && editingLesson?.lIdx === lIdx ? 'border-amber-500 ring-4 ring-amber-500/5 shadow-md' : 'border-gray-100 hover:border-amber-200'}`}
                                                >
                                                    <div className="flex items-center gap-5 pr-4 flex-1">
                                                        <div className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-colors ${editingLesson?.mIdx === mIdx && editingLesson?.lIdx === lIdx ? 'bg-amber-600 text-white' : 'bg-gray-50 text-gray-400 group-hover/lesson:bg-amber-50 group-hover/lesson:text-amber-500'}`}>
                                                            <Video size={20} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-gray-900 group-hover/lesson:text-amber-600 transition-colors truncate">{lesson.title}</h4>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase">{lesson.duration}</span>
                                                                {lesson.isPreview && <span className="text-[10px] font-black text-emerald-500 px-1.5 py-0.5 bg-emerald-50 rounded uppercase">Xem trước</span>}
                                                                {lesson.attachments && lesson.attachments.length > 0 && (
                                                                    <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1">
                                                                        <FileIcon size={10} /> {lesson.attachments.length} tài liệu
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            className="p-2 cursor-pointer text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/lesson:opacity-100"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const run = async () => {
                                                                    try {
                                                                        await teacherService.deleteLecture(String(lesson.id));
                                                                        const newCurr = [...curriculum];
                                                                        newCurr[mIdx].lessons = newCurr[mIdx].lessons.filter(l => l.id !== lesson.id);
                                                                        setCurriculum(newCurr);
                                                                        if (editingLesson?.mIdx === mIdx && editingLesson?.lIdx === lIdx) setEditingLesson(null);
                                                                        toast.success('Đã xóa bài giảng');
                                                                    } catch (err) {
                                                                        toast.error(err instanceof Error ? err.message : 'Xóa bài giảng thất bại');
                                                                    }
                                                                };

                                                                run();
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <div className="p-2 cursor-pointer text-gray-300">
                                                            <ChevronDown size={14} className="-rotate-90" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => addLesson(mIdx)}
                                                className="w-full py-5 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-black text-[11px] uppercase tracking-widest hover:border-amber-300 hover:text-amber-600 hover:bg-white transition-all flex items-center justify-center gap-3 mt-4"
                                            >
                                                <Plus size={18} />
                                                Thêm bài giảng mới
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <button
                                onClick={addModule}
                                className="w-full py-8 border-2 border-dashed border-gray-200 rounded-[40px] text-gray-400 font-bold md:text-lg text-md uppercase tracking-tighter hover:border-amber-400 hover:text-amber-600 hover:bg-white transition-all flex flex-col items-center justify-center gap-3 cursor-pointer shadow-sm hover:shadow-lg"
                            >
                                <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                                    <Plus size={32} />
                                </div>
                                Tạo thêm chương học mới
                            </button>
                        </div>

                        {/* Detail Editor (Right Column - Desktop Only) */}
                        {editingModuleIdx !== null && currentModule ? (
                            <div className="lg:col-span-12 xl:col-span-5 sticky top-10 space-y-6 animate-in slide-in-from-right-10 duration-500">
                                <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden flex flex-col h-full">
                                    {/* Editor Header */}
                                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Cài đặt chương học</h3>
                                        </div>
                                        <button
                                            onClick={() => setEditingModuleIdx(null)}
                                            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="p-8 space-y-8">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-md font-bold text-gray-400 ml-1">Tiêu đề chương</label>
                                                <input
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 font-bold text-gray-900 transition-all uppercase"
                                                    value={currentModule.title}
                                                    onChange={e => updateCurrentModule({ title: e.target.value })}
                                                    placeholder="Nhập tiêu đề chương..."
                                                />
                                            </div>

                                            <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                                                <div className="flex gap-4">

                                                    <div>
                                                        <h4 className="text-sm font-bold text-blue-900">Quản lý nội dung chương</h4>
                                                        <p className="text-xs text-blue-700/70 mt-1 leading-relaxed">
                                                            Bạn đang chỉnh sửa chương học {editingModuleIdx + 1}. Thay đổi tiêu đề này sẽ được phản ánh trong mục lục khóa học.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : editingLesson && currentLesson ? (
                            <div className="lg:col-span-12 xl:col-span-5 sticky top-10 space-y-6 animate-in slide-in-from-right-10 duration-500">
                                <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden flex flex-col h-full max-h-[85vh]">
                                    {/* Editor Header */}
                                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                                                <Edit3 size={18} />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Chi tiết bài học</h3>
                                        </div>
                                        <button
                                            onClick={() => setEditingLesson(null)}
                                            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                        {/* Main Fields */}
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-md font-bold text-gray-400 ml-1">Tiêu đề bài học</label>
                                                <input
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 text-gray-900 transition-all"
                                                    value={currentLesson.title}
                                                    onChange={e => updateCurrentLesson({ title: e.target.value })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-md font-bold text-gray-400 ml-1">Thời lượng (m:s)</label>
                                                    {(() => {
                                                        const raw = String(currentLesson.duration || '00:00');
                                                        const m = raw.match(/^(\d{1,3}):(\d{1,2})$/);
                                                        const mm = m ? Math.max(0, Math.min(999, Number(m[1]) || 0)) : 0;
                                                        const ss = m ? Math.max(0, Math.min(59, Number(m[2]) || 0)) : 0;
                                                        const minuteOptions = Array.from({ length: 181 }, (_, i) => i);
                                                        const secondOptions = Array.from({ length: 60 }, (_, i) => i);

                                                        const set = (nextMm: number, nextSs: number) => {
                                                            const safeMm = Math.max(0, Math.min(999, nextMm));
                                                            const safeSs = Math.max(0, Math.min(59, nextSs));
                                                            updateCurrentLesson({
                                                                duration: `${String(safeMm).padStart(2, '0')}:${String(safeSs).padStart(2, '0')}`,
                                                            });
                                                        };

                                                        return (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <select
                                                                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500  text-gray-900 transition-all text-center"
                                                                    value={mm}
                                                                    onChange={(e) => set(Number(e.target.value), ss)}
                                                                >
                                                                    {minuteOptions.map((v) => (
                                                                        <option key={v} value={v}>{String(v).padStart(2, '0')} m</option>
                                                                    ))}
                                                                </select>
                                                                <select
                                                                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500  text-gray-900 transition-all text-center"
                                                                    value={ss}
                                                                    onChange={(e) => set(mm, Number(e.target.value))}
                                                                >
                                                                    {secondOptions.map((v) => (
                                                                        <option key={v} value={v}>{String(v).padStart(2, '0')} s</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-md font-bold text-gray-400 ml-1">Chế độ xem trước</label>
                                                    <button
                                                        onClick={() => updateCurrentLesson({ isPreview: !currentLesson.isPreview })}
                                                        className={`w-full cursor-pointer py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border ${currentLesson.isPreview ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                                                    >
                                                        {currentLesson.isPreview ? <Eye size={18} /> : <EyeOff size={18} />}
                                                        {currentLesson.isPreview ? 'Công khai' : 'Riêng tư'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-md font-bold text-gray-400 ml-1">Loại bài giảng</label>
                                                <select
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 font-bold text-gray-900 transition-all"
                                                    value={String((currentLesson as any).type || 'video')}
                                                    onChange={(e) => updateCurrentLesson({ type: e.target.value } as any)}
                                                >
                                                    <option value="video">Video</option>
                                                    <option value="audio">Audio</option>
                                                    <option value="pdf">PDF</option>
                                                    <option value="file">File</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Upload từ máy (Video/Audio/PDF/File)</label>
                                                <input
                                                    type="file"
                                                    accept={getAcceptForLectureType(String((currentLesson as any).type || 'video'))}
                                                    disabled={isUploading}
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 font-medium text-sm text-gray-600 transition-all"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        const lectureType = String((currentLesson as any).type || guessLectureTypeFromFile(file));
                                                        if (!isFileAllowedForLectureType(file, lectureType)) {
                                                            toast.error(`Vui lòng chọn đúng loại file: ${lectureType.toUpperCase()}`);
                                                            e.currentTarget.value = '';
                                                            return;
                                                        }
                                                        uploadLectureFile(file);
                                                        e.currentTarget.value = '';
                                                    }}
                                                />
                                                {isUploading && (
                                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Đang upload...</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL Video Minh họa (YouTube/MP4)</label>
                                                <div className="relative">
                                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                                                        <Video size={18} />
                                                    </div>
                                                    <input
                                                        className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 font-medium text-sm text-gray-600 truncate transition-all"
                                                        value={currentLesson.videoUrl || ''}
                                                        onChange={e => updateCurrentLesson({ videoUrl: e.target.value })}
                                                        placeholder="Dán link video tại đây..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preview</label>
                                                    {currentLesson.videoUrl ? (
                                                        <a
                                                            href={currentLesson.videoUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-[10px] font-black uppercase tracking-widest text-amber-600 hover:underline"
                                                        >
                                                            Mở link
                                                        </a>
                                                    ) : null}
                                                </div>

                                                {(() => {
                                                    const url = String(previewLectureUrl || currentLesson.videoUrl || '').trim();
                                                    const type = String((currentLesson as any).type || 'video');
                                                    if (!url) {
                                                        return (
                                                            <div className="p-6 border-2 border-dashed border-gray-100 rounded-[32px] text-center">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                                                                    Chưa có nội dung để preview
                                                                </p>
                                                            </div>
                                                        );
                                                    }

                                                    const yt = type === 'video' ? getYouTubeEmbedUrl(url) : null;
                                                    if (yt) {
                                                        return (
                                                            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-gray-100">
                                                                <iframe
                                                                    src={yt}
                                                                    className="w-full h-full"
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                    allowFullScreen
                                                                />
                                                            </div>
                                                        );
                                                    }

                                                    if (type === 'video') {
                                                        return (
                                                            <video
                                                                src={url}
                                                                controls
                                                                className="w-full rounded-2xl border border-gray-100 bg-black"
                                                            />
                                                        );
                                                    }

                                                    if (type === 'audio') {
                                                        return (
                                                            <audio
                                                                src={url}
                                                                controls
                                                                className="w-full"
                                                            />
                                                        );
                                                    }

                                                    if (type === 'pdf') {
                                                        return (
                                                            <iframe
                                                                src={url}
                                                                className="w-full h-[420px] rounded-2xl border border-gray-100 bg-white"
                                                            />
                                                        );
                                                    }

                                                    return (
                                                        <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl">
                                                            <a
                                                                href={url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-sm font-bold text-amber-600 hover:underline break-all"
                                                            >
                                                                {url}
                                                            </a>
                                                        </div>
                                                    );
                                                })()}
                                                {previewLectureUrl && !isUploading && (
                                                    <div className="flex items-center justify-center -mt-2">
                                                        <span className="bg-amber-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Local File Preview</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Attachments Section */}
                                        <div className="space-y-6 pt-6 border-t border-gray-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} className="text-amber-500" />
                                                    <h4 className="font-black text-gray-900 text-sm italic">Tài liệu đính kèm</h4>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => addAttachment('pdf')}
                                                        className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                        title="Thêm PDF"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => addAttachment('image')}
                                                        className="p-2 bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                                                        title="Thêm Hình ảnh"
                                                    >
                                                        <ImageIcon size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => addAttachment('link')}
                                                        className="p-2 bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                                                        title="Thêm Link"
                                                    >
                                                        <LinkIcon size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {currentLesson.attachments && currentLesson.attachments.length > 0 ? (
                                                <div className="space-y-3">
                                                    {currentLesson.attachments.map((item, idx) => (
                                                        <div key={item.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3 group animate-in slide-in-from-top-2 duration-300">
                                                            <div className="flex items-center justify-between">
                                                                <div className="p-1.5 bg-white rounded-lg text-gray-400">
                                                                    {item.type === 'pdf' ? <FileText size={14} className="text-red-500" /> : item.type === 'image' ? <ImageIcon size={14} className="text-blue-500" /> : <LinkIcon size={14} className="text-emerald-500" />}
                                                                </div>
                                                                <button
                                                                    onClick={() => removeAttachment(idx)}
                                                                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                            <input
                                                                className="w-full px-0 bg-transparent border-none text-xs font-black text-gray-800 outline-none uppercase tracking-wider"
                                                                placeholder="Tiêu đề tài liệu..."
                                                                value={item.title}
                                                                onChange={e => updateAttachment(idx, { title: e.target.value })}
                                                            />
                                                            <input
                                                                className="w-full px-0 bg-transparent border-none text-[10px] text-blue-500 font-medium outline-none underline"
                                                                placeholder="URL tài liệu (Public link)..."
                                                                value={item.url}
                                                                onChange={e => updateAttachment(idx, { url: e.target.value })}
                                                            />

                                                            {(item.type === 'pdf' || item.type === 'image') && (
                                                                <div className="pt-1">
                                                                    <input
                                                                        type="file"
                                                                        accept={getAcceptForAttachmentType(item.type)}
                                                                        disabled={isUploading}
                                                                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-amber-500 font-medium text-xs text-gray-600 transition-all"
                                                                        onChange={(e) => {
                                                                            const f = e.target.files?.[0];
                                                                            if (!f) return;
                                                                            uploadAttachmentFile(idx, f);
                                                                            e.currentTarget.value = '';
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 border-2 border-dashed border-gray-100 rounded-[32px] text-center">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                                                        Nhấn các biểu tượng trên để thêm <br /> tài liệu PDF, Hình ảnh hoặc Liên kết
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-8 bg-gray-50 flex items-center justify-between">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase italic">Tự động sao lưu dữ liệu tạm thời</p>
                                        <button
                                            onClick={() => setEditingLesson(null)}
                                            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all"
                                        >
                                            Hoàn tất chi tiết
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Empty State for Editor (Right Column) */
                            <div className="lg:col-span-12 xl:col-span-5 hidden xl:block">
                                <div className="bg-white rounded-[40px] border-2 border-dashed border-gray-100 p-20 text-center sticky top-10 flex flex-col items-center justify-center min-h-[500px]">
                                    <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6 text-gray-200">
                                        <Edit3 size={40} />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-300">Sẵn sàng chỉnh sửa</h4>
                                    <p className="text-gray-300 mt-3 text-sm max-w-[200px] font-bold leading-loose">Chọn một bài học từ danh sách bên trái để bắt đầu thêm chi tiết và tài liệu</p>
                                    <div className="mt-8 flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-gray-100"></div>
                                        <div className="w-2 h-2 rounded-full bg-gray-100"></div>
                                        <div className="w-2 h-2 rounded-full bg-gray-100"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Chapter Modal */}
                {isChapterModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                        <div className="w-full max-w-lg bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden scale-in-center transition-all duration-300 relative">
                            <div className="md:p-10 p-2 text-center mt-12">
                                <h3 className="md:text-3xl text-xl font-bold text-gray-900 tracking-tight leading-tight">Thêm chương học mới</h3>
                                <p className="text-gray-500 text-xs font-medium mt-2">Dùng tiêu đề rõ ràng để học viên dễ dàng định vị bài học của bạn.</p>
                            </div>

                            <div className="md:px-10 px-4 pb-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-400 ml-1">Tiêu đề chương</label>
                                    <input
                                        autoFocus
                                        className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 font-bold text-gray-900 md:text-lg transition-all uppercase"
                                        placeholder="Ví dụ: Giới thiệu chung..."
                                        value={newChapterTitle}
                                        onChange={(e) => setNewChapterTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !isCreatingChapter) confirmAddModule();
                                        }}
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium ml-2 uppercase tracking-wide">* Gợi ý: Hãy đặt tên ngắn gọn và súc tích</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        disabled={isCreatingChapter}
                                        onClick={() => setIsChapterModalOpen(false)}
                                        className="px-8 py-5 cursor-pointer rounded-3xl font-bold text-gray-400 hover:bg-gray-50 transition-all text-md border border-gray-100 active:scale-95 disabled:opacity-50"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        disabled={isCreatingChapter || !newChapterTitle.trim()}
                                        onClick={confirmAddModule}
                                        className="px-8 py-5 cursor-pointer bg-gray-900 text-white rounded-3xl font-bold text-md hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                    >
                                        {isCreatingChapter ? (
                                            <>
                                                <LoaderCircle size={18} className="animate-spin" />
                                                Đang tạo...
                                            </>
                                        ) : 'Xác nhận tạo'}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => !isCreatingChapter && setIsChapterModalOpen(false)}
                                className="absolute cursor-pointer top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-50 rounded-xl"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContentEditor;
