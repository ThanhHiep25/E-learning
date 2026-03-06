import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus, Trash2, Edit3, GripVertical,
    Video, ChevronDown,
    Save, ArrowLeft, Layout,
    X, Loader2, BookOpen
} from 'lucide-react';
import { teacherService, type BEChapter, type BELecture, type BECourse } from '../../api/teacherService';
import toast from 'react-hot-toast';

const ContentEditor: React.FC = () => {
    const { id: courseId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [course, setCourse] = useState<BECourse | null>(null);
    const [chapters, setChapters] = useState<BEChapter[]>([]);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingLecture, setEditingLecture] = useState<{ chapterId: string, lecture: BELecture } | null>(null);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [showAddChapter, setShowAddChapter] = useState(false);
    const [addingLectureTo, setAddingLectureTo] = useState<string | null>(null);
    const [newLectureTitle, setNewLectureTitle] = useState('');

    const fetchCurriculum = async () => {
        if (!courseId) return;
        setIsLoading(true);
        try {
            const response = await teacherService.getCourseCurriculum(courseId);
            if (response.success && response.data) {
                setCourse(response.data.course);
                setChapters(response.data.chapters);
                // Expand all by default
                setExpandedModules(response.data.chapters.map(c => c.id));
            } else {
                toast.error(response.message || 'Không thể tải nội dung khóa học');
                navigate('/teacher/dashboard');
            }
        } catch (error) {
            toast.error('Lỗi kết nối máy chủ');
            navigate('/teacher/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCurriculum();
    }, [courseId]);

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const handleAddChapter = async () => {
        if (!courseId || !newChapterTitle.trim()) return;

        try {
            const response = await teacherService.createChapter(courseId, {
                title: newChapterTitle.trim(),
                order: chapters.length + 1
            });
            if (response.success && response.data) {
                setChapters([...chapters, response.data.chapter]);
                setExpandedModules([...expandedModules, response.data.chapter.id]);
                toast.success('Đã thêm chương mới');
                setNewChapterTitle('');
                setShowAddChapter(false);
            }
        } catch (error) {
            toast.error('Lỗi khi thêm chương');
        }
    };

    const handleUpdateChapter = async (chapterId: string, newTitle: string) => {
        try {
            const response = await teacherService.updateChapter(chapterId, { title: newTitle });
            if (response.success) {
                setChapters(chapters.map(c => c.id === chapterId ? { ...c, title: newTitle } : c));
                toast.success('Đã cập nhật tên chương');
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật chương');
        }
    };

    const handleDeleteChapter = async (chapterId: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa chương này? Tất cả bài giảng bên trong cũng sẽ bị xóa.')) return;

        try {
            const response = await teacherService.deleteChapter(chapterId);
            if (response.success) {
                setChapters(chapters.filter(c => c.id !== chapterId));
                toast.success('Đã xóa chương');
            }
        } catch (error) {
            toast.error('Lỗi khi xóa chương');
        }
    };

    const handleAddLecture = async (chapterId: string) => {
        if (!newLectureTitle.trim()) return;

        try {
            const response = await teacherService.createLecture(chapterId, {
                title: newLectureTitle.trim(),
                type: 'video',
                order: (chapters.find(c => c.id === chapterId)?.Lectures?.length || 0) + 1
            });
            if (response.success && response.data) {
                const newLecture = response.data.lecture;
                setChapters(chapters.map(c =>
                    c.id === chapterId
                        ? { ...c, Lectures: [...(c.Lectures || []), newLecture] }
                        : c
                ));
                setEditingLecture({ chapterId, lecture: newLecture });
                toast.success('Đã thêm bài giảng mới');
                setNewLectureTitle('');
                setAddingLectureTo(null);
            }
        } catch (error) {
            toast.error('Lỗi khi thêm bài giảng');
        }
    };

    const handleUpdateLecture = async () => {
        if (!editingLecture) return;
        setIsSaving(true);
        try {
            const response = await teacherService.updateLecture(editingLecture.lecture.id, editingLecture.lecture);
            if (response.success) {
                setChapters(chapters.map(c =>
                    c.id === editingLecture.chapterId
                        ? {
                            ...c,
                            Lectures: c.Lectures?.map(l => l.id === editingLecture.lecture.id ? editingLecture.lecture : l)
                        }
                        : c
                ));
                toast.success('Đã lưu bài giảng');
                setEditingLecture(null);
            }
        } catch (error) {
            toast.error('Lỗi khi lưu bài giảng');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteLecture = async (chapterId: string, lectureId: string) => {
        if (!window.confirm('Xóa bài giảng này?')) return;
        try {
            const response = await teacherService.deleteLecture(lectureId);
            if (response.success) {
                setChapters(chapters.map(c =>
                    c.id === chapterId
                        ? { ...c, Lectures: c.Lectures?.filter(l => l.id !== lectureId) }
                        : c
                ));
                toast.success('Đã xóa bài giảng');
                if (editingLecture?.lecture.id === lectureId) setEditingLecture(null);
            }
        } catch (error) {
            toast.error('Lỗi khi xóa bài giảng');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-amber-500" size={48} />
                <p className="text-gray-500 font-bold animate-pulse">ĐANG TẢI DỮ LIỆU...</p>
            </div>
        );
    }

    return (
        <div className="w-full pb-20">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <button
                            onClick={() => navigate('/teacher/dashboard')}
                            className="group flex items-center gap-3 text-gray-400 hover:text-amber-600 font-black uppercase tracking-widest text-[10px] transition-all cursor-pointer mb-4"
                        >
                            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-amber-50 transition-all">
                                <ArrowLeft size={14} />
                            </div>
                            QUAY LẠI DASHBOARD
                        </button>
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                            Nội dung <span className="text-amber-600">Khóa học.</span>
                        </h1>
                        <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-widest">{course?.title}</p>
                    </div>

                    <button
                        onClick={() => navigate('/teacher/dashboard')}
                        className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer"
                    >
                        <Save size={20} />
                        HOÀN TẤT CHỈNH SỬA
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Module List (Left Column) */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                        {chapters.length === 0 && (
                            <div className="bg-white rounded-[40px] border-2 border-dashed border-gray-100 p-20 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                    <Layout size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-400 ">Chưa có chương học</h3>
                                {showAddChapter ? (
                                    <div className="mt-6 max-w-md mx-auto space-y-3">
                                        <input
                                            autoFocus
                                            type="text"
                                            className="w-full px-6 py-4 bg-gray-50 border-2 border-amber-200 rounded-2xl font-bold focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                                            placeholder="Nhập tên chương..."
                                            value={newChapterTitle}
                                            onChange={(e) => setNewChapterTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={handleAddChapter} className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition-all">THÊM</button>
                                            <button onClick={() => setShowAddChapter(false)} className="px-6 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">HỦY</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowAddChapter(true)}
                                        className="mt-6 cursor-pointer text-amber-600 font-bold flex items-center gap-2 mx-auto hover:underline"
                                    >
                                        <Plus size={20} /> THÊM CHƯƠNG ĐẦU TIÊN
                                    </button>
                                )}
                            </div>
                        )}

                        {chapters.map((chapter, index) => (
                            <div key={chapter.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                <div className="p-6 lg:p-8 flex items-center justify-between bg-white border-b border-gray-50">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="p-3 bg-gray-50 text-gray-300 cursor-grab rounded-2xl">
                                            <GripVertical size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest px-2 py-0.5 bg-amber-50 rounded-md">Chapter {index + 1}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{chapter.Lectures?.length || 0} bài học</span>
                                            </div>
                                            <input
                                                className="text-xl font-bold text-gray-900 bg-transparent border-none p-0 outline-none w-full focus:text-amber-600 transition-colors uppercase tracking-tight"
                                                value={chapter.title}
                                                onBlur={(e) => handleUpdateChapter(chapter.id, e.target.value)}
                                                onChange={(e) => {
                                                    setChapters(chapters.map(c => c.id === chapter.id ? { ...c, title: e.target.value } : c));
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            className="p-3 text-gray-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-2xl"
                                            onClick={() => handleDeleteChapter(chapter.id)}
                                            title="Xóa chương này"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                        <button
                                            className={`p-3 transition-all rounded-2xl ${expandedModules.includes(chapter.id) ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-50'}`}
                                            onClick={() => toggleModule(chapter.id)}
                                        >
                                            <ChevronDown size={20} className={`transition-transform duration-300 ${expandedModules.includes(chapter.id) ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {expandedModules.includes(chapter.id) && (
                                    <div className="p-6 lg:p-8 bg-gray-50/50 space-y-4">
                                        {chapter.Lectures?.map((lecture) => (
                                            <div
                                                key={lecture.id}
                                                onClick={() => setEditingLecture({ chapterId: chapter.id, lecture })}
                                                className={`bg-white p-6 rounded-2xl border transition-all cursor-pointer group/lesson flex items-center justify-between ${editingLecture?.lecture.id === lecture.id ? 'border-amber-500 ring-4 ring-amber-500/5 shadow-md' : 'border-gray-100 hover:border-amber-200'}`}
                                            >
                                                <div className="flex items-center gap-5 pr-4 flex-1">
                                                    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-colors ${editingLecture?.lecture.id === lecture.id ? 'bg-amber-600 text-white' : 'bg-gray-50 text-gray-400 group-hover/lesson:bg-amber-50 group-hover/lesson:text-amber-500'}`}>
                                                        <Video size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-gray-900 group-hover/lesson:text-amber-600 transition-colors truncate">{lecture.title}</h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lecture.duration || 0} PHÚT</span>
                                                            <span className="text-[10px] font-black text-blue-500 px-1.5 py-0.5 bg-blue-50 rounded uppercase tracking-tighter">{lecture.type}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/lesson:opacity-100"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteLecture(chapter.id, lecture.id);
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <Edit3 size={16} className="text-gray-300" />
                                                </div>
                                            </div>
                                        ))}

                                        {addingLectureTo === chapter.id ? (
                                            <div className="mt-4 p-4 bg-white rounded-2xl border-2 border-amber-100 space-y-3 shadow-sm">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:outline-none focus:border-amber-500 transition-all"
                                                    placeholder="Nhập tên bài giảng..."
                                                    value={newLectureTitle}
                                                    onChange={(e) => setNewLectureTitle(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddLecture(chapter.id)}
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleAddLecture(chapter.id)} className="flex-1 cursor-pointer bg-amber-600 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-amber-700 transition-all">THÊM BÀI GIẢNG</button>
                                                    <button onClick={() => setAddingLectureTo(null)} className="px-4 cursor-pointer bg-gray-100 text-gray-400 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all">HỦY</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setAddingLectureTo(chapter.id)}
                                                className="w-full py-5 cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold text-[11px] uppercase tracking-widest hover:border-amber-300 hover:text-amber-600 hover:bg-white transition-all flex items-center justify-center gap-3 mt-4"
                                            >
                                                <Plus size={18} />
                                                THÊM BÀI GIẢNG MỚI
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {showAddChapter ? (
                            <div className="w-full p-10 bg-white rounded-[40px] border-4 border-amber-100 shadow-xl space-y-6">
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tighter flex items-center justify-center gap-3">
                                        THÊM CHƯƠNG MỚI
                                        <div className="p-2 bg-amber-500 rounded-xl text-white">
                                            <Plus size={18} />
                                        </div>
                                    </h3>
                                    <p className="text-xs font-bold text-gray-400 mt-2">Dấu mốc kiến thức mới cho học viên</p>
                                </div>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-amber-500 rounded-3xl font-bold text-xl outline-none transition-all shadow-inner"
                                    placeholder="Ví dụ: Giới thiệu khóa học..."
                                    value={newChapterTitle}
                                    onChange={(e) => setNewChapterTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
                                />
                                <div className="flex gap-4">
                                    <button onClick={handleAddChapter} className="flex-1 bg-gray-900 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg active:scale-95">XÁC NHẬN THÊM</button>
                                    <button onClick={() => setShowAddChapter(false)} className="px-10 bg-gray-100 text-gray-400 py-3 rounded-2xl font-bold text-sm uppercase hover:bg-gray-200 transition-all">QUAY LẠI</button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddChapter(true)}
                                className="w-full py-8 border-2 border-dashed border-gray-200 rounded-[40px] text-gray-400 font-bold text-lg uppercase tracking-tighter hover:border-amber-400 hover:text-amber-600 hover:bg-white transition-all flex flex-col items-center justify-center gap-3 cursor-pointer shadow-sm hover:shadow-lg"
                            >
                                <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                                    <Plus size={32} />
                                </div>
                                TẠO THÊM CHƯƠNG HỌC MỚI
                            </button>
                        )}
                    </div>

                    {/* Lesson Detail Editor (Right Column) */}
                    {editingLecture ? (
                        <div className="lg:col-span-12 xl:col-span-5 sticky top-10 space-y-6 animate-in slide-in-from-right-10 duration-500">
                            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden flex flex-col h-full max-h-[85vh]">
                                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-600/20">
                                            <Edit3 size={18} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Bài giảng chi tiết</h3>
                                    </div>
                                    <button
                                        onClick={() => setEditingLecture(null)}
                                        className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tiêu đề bài học</label>
                                            <input
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 font-bold text-gray-900 transition-all uppercase"
                                                value={editingLecture.lecture.title}
                                                onChange={e => setEditingLecture({
                                                    ...editingLecture,
                                                    lecture: { ...editingLecture.lecture, title: e.target.value }
                                                })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Thời lượng (phút)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 font-bold text-gray-900 transition-all text-center"
                                                    value={editingLecture.lecture.duration}
                                                    onChange={e => setEditingLecture({
                                                        ...editingLecture,
                                                        lecture: { ...editingLecture.lecture, duration: parseInt(e.target.value) || 0 }
                                                    })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400  ml-1">Loại học liệu</label>
                                                <select
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 font-bold text-[10px] text-gray-900 transition-all uppercase tracking-widest"
                                                    value={editingLecture.lecture.type}
                                                    onChange={e => setEditingLecture({
                                                        ...editingLecture,
                                                        lecture: { ...editingLecture.lecture, type: e.target.value }
                                                    })}
                                                >
                                                    <option value="video">VIDEO BÀI GIẢNG</option>
                                                    <option value="document">TÀI LIỆU PDF</option>
                                                    <option value="link">LIÊN KẾT NGOÀI</option>
                                                    <option value="quiz">BÀI KIỂM TRA</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL Nội dung (YouTube/Drive/PDF)</label>
                                            <div className="relative">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                                                    <Video size={18} />
                                                </div>
                                                <input
                                                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 font-medium text-xs text-gray-600 truncate transition-all"
                                                    value={editingLecture.lecture.contentUrl || ''}
                                                    onChange={e => setEditingLecture({
                                                        ...editingLecture,
                                                        lecture: { ...editingLecture.lecture, contentUrl: e.target.value }
                                                    })}
                                                    placeholder="Dán link học liệu tại đây..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                                        <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-widest italic">
                                            Lưu ý: Đảm bảo link học liệu ở chế độ công khai để học viên có thể truy cập được.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-8 bg-gray-50 flex items-center justify-between">
                                    <button
                                        onClick={() => setEditingLecture(null)}
                                        className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
                                    >
                                        HỦY BỎ
                                    </button>
                                    <button
                                        onClick={handleUpdateLecture}
                                        disabled={isSaving}
                                        className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg flex items-center gap-2 disabled:bg-gray-400"
                                    >
                                        {isSaving && <Loader2 size={14} className="animate-spin" />}
                                        LƯU THAY ĐỔI
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="lg:col-span-12 xl:col-span-5 hidden xl:block">
                            <div className="bg-white rounded-[40px] border-2 border-dashed border-gray-100 p-20 text-center sticky top-10 flex flex-col items-center justify-center min-h-[500px]">
                                <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6 text-gray-200">
                                    <BookOpen size={40} />
                                </div>
                                <h4 className="text-xl font-bold text-gray-300 ">Sẵn sàng chỉnh sửa</h4>
                                <p className="text-gray-300 mt-3 text-xs max-w-[200px] font-bold leading-loose">Chọn một bài giảng từ danh sách bên trái để bắt đầu thiết lập tài liệu và nội dung</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentEditor;
