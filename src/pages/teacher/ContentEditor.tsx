import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus, Trash2, Edit3, GripVertical,
    Video, ChevronDown,
    Save, ArrowLeft, Layout,
    FileText, Image as ImageIcon, Link as LinkIcon,
    File as FileIcon, X, Eye, EyeOff
} from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { type CurriculumModule, type Lesson, type LessonAttachment } from '../../config/mock-data';
import toast from 'react-hot-toast';

const ContentEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { courses, updateCourse } = useCourseStore();

    const course = useMemo(() => courses.find(c => c.id === id), [courses, id]);
    const [curriculum, setCurriculum] = useState<CurriculumModule[]>(course?.curriculum || []);
    const [expandedModules, setExpandedModules] = useState<string[]>(course?.curriculum.map(m => m.id) || []);
    const [editingLesson, setEditingLesson] = useState<{ mIdx: number, lIdx: number } | null>(null);

    if (!course) return null;

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const addModule = () => {
        const newModule: CurriculumModule = {
            id: `m${Date.now()}`,
            title: `Chương ${curriculum.length + 1}: [Tiêu đề chương]`,
            lessons: []
        };
        setCurriculum([...curriculum, newModule]);
        setExpandedModules([...expandedModules, newModule.id]);
    };

    const addLesson = (mIdx: number) => {
        const newLesson: Lesson = {
            id: `l${Date.now()}`,
            title: 'Bài học mới',
            duration: '05:00',
            isPreview: false,
            attachments: []
        };

        const newCurriculum = [...curriculum];
        newCurriculum[mIdx].lessons.push(newLesson);
        setCurriculum(newCurriculum);
        setEditingLesson({ mIdx, lIdx: newCurriculum[mIdx].lessons.length - 1 });
    };

    const handleSave = () => {
        updateCourse(course.id, { curriculum });
        toast.success('Lưu nội dung bài giảng thành công!');
        navigate('/teacher/dashboard');
    };

    const currentLesson = editingLesson ? curriculum[editingLesson.mIdx].lessons[editingLesson.lIdx] : null;

    const updateCurrentLesson = (updates: Partial<Lesson>) => {
        if (!editingLesson) return;
        const newCurriculum = [...curriculum];
        newCurriculum[editingLesson.mIdx].lessons[editingLesson.lIdx] = {
            ...newCurriculum[editingLesson.mIdx].lessons[editingLesson.lIdx],
            ...updates
        };
        setCurriculum(newCurriculum);
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

    return (
        <div className="w-full pb-20">
            <div className="max-w-6xl mx-auto">
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
                        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter italic">
                            Xây dựng <span className="text-amber-600">chương trình học.</span>
                        </h1>
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
                            className="flex items-center gap-3 bg-gray-900 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer"
                        >
                            <Save size={20} />
                            Xác nhận lưu
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start px-4 lg:px-0">
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
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-2 py-0.5 bg-amber-50 rounded-md">Chapter {mIdx + 1}</span>
                                                <span className="text-[10px] font-bold text-gray-400">{module.lessons.length} bài học</span>
                                            </div>
                                            <input
                                                className="text-xl font-black text-gray-900 bg-transparent border-none p-0 outline-none w-full focus:text-amber-600 transition-colors uppercase tracking-tight"
                                                value={module.title}
                                                onChange={(e) => {
                                                    const newCurr = [...curriculum];
                                                    newCurr[mIdx].title = e.target.value;
                                                    setCurriculum(newCurr);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            className="p-3 text-gray-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-2xl"
                                            onClick={() => setCurriculum(curriculum.filter(m => m.id !== module.id))}
                                            title="Xóa chương này"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                        <button
                                            className={`p-3 transition-all rounded-2xl ${expandedModules.includes(module.id) ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-50'}`}
                                            onClick={() => toggleModule(module.id)}
                                        >
                                            <ChevronDown size={20} className={`transition-transform duration-300 ${expandedModules.includes(module.id) ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {expandedModules.includes(module.id) && (
                                    <div className="p-6 lg:p-8 bg-gray-50/50 space-y-4">
                                        {module.lessons.map((lesson, lIdx) => (
                                            <div
                                                key={lesson.id}
                                                onClick={() => setEditingLesson({ mIdx, lIdx })}
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
                                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/lesson:opacity-100"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newCurr = [...curriculum];
                                                            newCurr[mIdx].lessons = newCurr[mIdx].lessons.filter(l => l.id !== lesson.id);
                                                            setCurriculum(newCurr);
                                                            if (editingLesson?.mIdx === mIdx && editingLesson?.lIdx === lIdx) setEditingLesson(null);
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <div className="p-2 text-gray-300">
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
                            className="w-full py-8 border-2 border-dashed border-gray-200 rounded-[40px] text-gray-400 font-black text-lg uppercase tracking-tighter hover:border-amber-400 hover:text-amber-600 hover:bg-white transition-all flex flex-col items-center justify-center gap-3 cursor-pointer shadow-sm hover:shadow-lg"
                        >
                            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                                <Plus size={32} />
                            </div>
                            Tạo thêm chương học mới (Module)
                        </button>
                    </div>

                    {/* Lesson Detail Editor (Right Column - Desktop Only) */}
                    {editingLesson && currentLesson ? (
                        <div className="lg:col-span-12 xl:col-span-5 sticky top-10 space-y-6 animate-in slide-in-from-right-10 duration-500">
                            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden flex flex-col h-full max-h-[85vh]">
                                {/* Editor Header */}
                                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-600/20">
                                            <Edit3 size={18} />
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Chi tiết bài học</h3>
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
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tiêu đề bài học</label>
                                            <input
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 font-bold text-gray-900 transition-all"
                                                value={currentLesson.title}
                                                onChange={e => updateCurrentLesson({ title: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Thời lượng (m:s)</label>
                                                <input
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 font-bold text-gray-900 transition-all text-center"
                                                    value={currentLesson.duration}
                                                    onChange={e => updateCurrentLesson({ duration: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chế độ xem trước</label>
                                                <button
                                                    onClick={() => updateCurrentLesson({ isPreview: !currentLesson.isPreview })}
                                                    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all border ${currentLesson.isPreview ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                                                >
                                                    {currentLesson.isPreview ? <Eye size={18} /> : <EyeOff size={18} />}
                                                    {currentLesson.isPreview ? 'Công khai' : 'Riêng tư'}
                                                </button>
                                            </div>
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
                                <h4 className="text-xl font-black text-gray-300 tracking-tighter uppercase italic">Sẵn sàng chỉnh sửa</h4>
                                <p className="text-gray-300 mt-3 text-sm max-w-[200px] font-bold uppercase tracking-widest leading-loose">Chọn một bài học từ danh sách bên trái để bắt đầu thêm chi tiết và tài liệu</p>
                                <div className="mt-8 flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-100"></div>
                                    <div className="w-2 h-2 rounded-full bg-gray-100"></div>
                                    <div className="w-2 h-2 rounded-full bg-gray-100"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentEditor;
