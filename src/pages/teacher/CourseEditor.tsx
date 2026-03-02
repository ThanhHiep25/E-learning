import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Trash2,
    BookOpen, BarChart, Clock, Hash,
    Image as ImageIcon, Layout, Plus, X, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { type Course } from '../../config/mock-data';

const CATEGORIES = [
    'Bứt phá vào 10',
    'Luyện thi TOEIC',
    'Combo Lập trình',
    'Tin học văn phòng'
];

const LEVELS = ['Mọi cấp độ', 'Cơ bản', 'Trung cấp', 'Nâng cao'] as const;

const CourseEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { courses, addCourse, updateCourse } = useCourseStore();

    const isEditMode = !!id;
    const [formData, setFormData] = useState<Partial<Course>>({
        title: '',
        description: '',
        category: CATEGORIES[0],
        level: LEVELS[0],
        duration: '',
        teacher: user?.fullName || 'Giảng viên',
        teacherAvatar: user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
        rating: 5.0,
        reviewCount: 0,
        students: 0,
        totalLessons: 0,
        curriculum: [],
        willLearn: [],
        requirements: []
    });

    const [newItem, setNewItem] = useState({ willLearn: '', requirement: '' });

    useEffect(() => {
        if (isEditMode) {
            const course = courses.find(c => c.id === id);
            if (course) {
                setFormData(course);
            } else {
                toast.error('Không tìm thấy khóa học');
                navigate('/teacher/dashboard');
            }
        }
    }, [id, courses, isEditMode, navigate]);

    const handleAddItem = (type: 'willLearn' | 'requirements') => {
        const value = type === 'willLearn' ? newItem.willLearn : newItem.requirement;
        if (!value.trim()) return;

        setFormData(prev => ({
            ...prev,
            [type]: [...(prev[type] || []), value.trim()]
        }));
        setNewItem(prev => ({ ...prev, [type === 'willLearn' ? 'willLearn' : 'requirement']: '' }));
    };

    const handleRemoveItem = (type: 'willLearn' | 'requirements', index: number) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type]?.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.description) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        if (isEditMode && id) {
            updateCourse(id, formData);
            toast.success('Cập nhật khóa học thành công!');
        } else {
            const newCourse: Course = {
                ...formData as Course,
                id: `c${Date.now()}`,
            };
            addCourse(newCourse);
            toast.success('Tạo khóa học thành công!');
        }

        navigate('/teacher/dashboard');
    };

    return (
        <div className="w-full pb-20">
            <div className="max-w-5xl mx-auto">
                {/* Navigation & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <button
                        onClick={() => navigate('/teacher/dashboard')}
                        className="group flex items-center gap-3 text-gray-500 hover:text-amber-600 font-black uppercase tracking-widest text-[10px] transition-all cursor-pointer"
                    >
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-amber-50 group-hover:scale-110 transition-all">
                            <ArrowLeft size={16} />
                        </div>
                        Quay lại Dashboard
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/teacher/dashboard')}
                            className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer"
                        >
                            <Save size={18} />
                            {isEditMode ? 'Cập nhật thay đổi' : 'Công khai khóa học'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Form Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Course Identity */}
                        <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 md:p-10 space-y-8">
                            <div className="flex items-center gap-4 border-l-4 border-amber-500 pl-6">
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                    <Layout size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Định danh khóa học</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Nền tảng của nội dung học thuật</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tiêu đề khóa học <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-medium"
                                        placeholder="Nhập tiêu đề thu hút sinh viên..."
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mô tả chi tiết <span className="text-red-500">*</span></label>
                                    <textarea
                                        required
                                        rows={6}
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium text-gray-900 resize-none leading-relaxed"
                                        placeholder="Mô tả mục tiêu, giá trị và nội dung cốt lõi..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Learning Outcomes & Requirements */}
                        <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 md:p-10 space-y-10">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-6">
                                    <CheckCircle2 size={24} className="text-emerald-500" />
                                    <h2 className="text-lg font-black text-gray-900">Sinh viên sẽ học được gì?</h2>
                                </div>

                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        className="flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-emerald-500 font-medium transition-all"
                                        placeholder="Ví dụ: Nắm vững kiến thức React Hooks..."
                                        value={newItem.willLearn}
                                        onChange={e => setNewItem({ ...newItem, willLearn: e.target.value })}
                                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddItem('willLearn'))}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleAddItem('willLearn')}
                                        className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus size={24} />
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {formData.willLearn?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-100 group animate-in zoom-in duration-300">
                                            <span>{item}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem('willLearn', idx)}
                                                className="hover:text-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-6">
                                    <AlertCircle size={24} className="text-amber-500" />
                                    <h2 className="text-lg font-black text-gray-900">Yêu cầu tham gia</h2>
                                </div>

                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        className="flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 font-medium transition-all"
                                        placeholder="Ví dụ: Có kiến thức cơ bản về HTML/CSS..."
                                        value={newItem.requirement}
                                        onChange={e => setNewItem({ ...newItem, requirement: e.target.value })}
                                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddItem('requirements'))}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleAddItem('requirements')}
                                        className="p-4 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus size={24} />
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {formData.requirements?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold border border-amber-100 animate-in zoom-in duration-300">
                                            <span>{item}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem('requirements', idx)}
                                                className="hover:text-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Metadata & Settings */}
                    <div className="space-y-8">
                        {/* Course Thumbnail */}
                        <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ảnh minh họa</span>
                                <ImageIcon size={16} className="text-gray-400" />
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 relative group">
                                    <img
                                        src={formData.image}
                                        alt="Course Preview"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Preview Mode</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL Hình ảnh</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-amber-500 transition-all font-medium text-xs text-gray-500"
                                        value={formData.image}
                                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Settings Card */}
                        <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        <Hash size={12} className="text-amber-500" />
                                        Danh mục
                                    </div>
                                    <select
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-black text-xs text-gray-900 cursor-pointer appearance-none uppercase tracking-wider"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        <BarChart size={12} className="text-amber-500" />
                                        Cấp độ học viên
                                    </div>
                                    <select
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-black text-xs text-gray-900 cursor-pointer appearance-none uppercase tracking-wider"
                                        value={formData.level}
                                        onChange={e => setFormData({ ...formData, level: e.target.value as Course['level'] })}
                                    >
                                        {LEVELS.map(lvl => (
                                            <option key={lvl} value={lvl}>{lvl}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        <Clock size={12} className="text-amber-500" />
                                        Thời lượng
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-bold text-sm text-gray-900"
                                        placeholder="Ví dụ: 24 giờ 30 phút"
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                    />
                                </div>
                            </div>

                            {isEditMode && (
                                <div className="pt-6 border-t border-gray-50">
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-center gap-2 p-4 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest italic"
                                    >
                                        <Trash2 size={14} />
                                        Xóa khóa học này
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseEditor;
