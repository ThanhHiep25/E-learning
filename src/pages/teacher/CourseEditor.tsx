import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Trash2,
    BarChart, Clock, Hash,
    Image as ImageIcon, Layout, Plus, X, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { type Course } from '../../config/mock-data';
import { teacherService } from '../../services/teacher.service';
import { categoryService, type BackendCategory } from '../../services/category.service';

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
    const { courses } = useCourseStore();

    const isEditMode = !!id;
    const [isSaving, setIsSaving] = useState(false);
    const [isThumbUploading, setIsThumbUploading] = useState(false);
    const [previewThumb, setPreviewThumb] = useState<string | null>(null);
    const [categories, setCategories] = useState<BackendCategory[]>([]);
    const [visibility, setVisibility] = useState<'draft' | 'published' | 'private'>('draft');
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
        const loadCategories = async () => {
            try {
                const list = await categoryService.listCategories();
                setCategories(list || []);

                if (list?.length && !(formData as any).categoryId) {
                    setFormData((prev) => ({
                        ...prev,
                        categoryId: list[0].id,
                    }));
                }
            } catch (e) {
                setCategories([]);
            }
        };

        loadCategories();
    }, []);

    useEffect(() => {
        const load = async () => {
            if (!isEditMode || !id) return;

            const course = courses.find(c => String(c.id) === String(id));
            if (course) {
                setFormData(course as any);
                return;
            }

            try {
                const ownerCourse = await teacherService.getCourseForOwner(String(id));
                setFormData((prev) => ({
                    ...prev,
                    title: ownerCourse.title || '',
                    description: ownerCourse.description || '',
                    image: ownerCourse.imageUrl || prev.image,
                    level: (ownerCourse.level as any) || LEVELS[0],
                    duration: ownerCourse.duration || '',
                    willLearn: Array.isArray(ownerCourse.willLearn) ? ownerCourse.willLearn : [],
                    requirements: Array.isArray(ownerCourse.requirements) ? ownerCourse.requirements : [],
                }));

                setVisibility(ownerCourse.published ? 'published' : 'draft');
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Không thể tải khóa học');
                navigate('/teacher/dashboard');
            }
        };

        load();
    }, [id, courses, isEditMode, navigate]);

    useEffect(() => {
        return () => {
            if (previewThumb) {
                URL.revokeObjectURL(previewThumb);
            }
        };
    }, [previewThumb]);

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

    const handleSubmit = async (e?: React.SyntheticEvent) => {
        e?.preventDefault();

        if (!formData.title || !formData.description) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        try {
            setIsSaving(true);
            const published = visibility === 'published';
            if (isEditMode && id) {
                await teacherService.updateCourse(String(id), {
                    title: String(formData.title),
                    description: String(formData.description),
                    level: String(formData.level || LEVELS[0]),
                    duration: String(formData.duration || ''),
                    willLearn: Array.isArray(formData.willLearn) ? formData.willLearn : [],
                    requirements: Array.isArray(formData.requirements) ? formData.requirements : [],
                    published,
                    categoryId: (formData as any).categoryId ?? null,
                    imageUrl: String(formData.image || ''),
                });
                toast.success('Cập nhật khóa học thành công!');
                navigate(`/teacher/content-editor/${encodeURIComponent(String(id))}`);
                return;
            }

            const created = await teacherService.createCourse({
                title: String(formData.title),
                description: String(formData.description),
                imageUrl: String(formData.image || ''),
                level: String(formData.level || LEVELS[0]),
                duration: String(formData.duration || ''),
                willLearn: Array.isArray(formData.willLearn) ? formData.willLearn : [],
                requirements: Array.isArray(formData.requirements) ? formData.requirements : [],
                published,
                price: 0,
                categoryId: (formData as any).categoryId ?? null,
                tags: [],
            });

            toast.success('Tạo khóa học thành công!');
            navigate(`/teacher/content-editor/${encodeURIComponent(String(created.id))}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Lưu khóa học thất bại');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full pb-20">
            <div className="">
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
                            className="cursor-pointer px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer"
                        >
                            <Save size={18} />
                            {isEditMode ? 'Cập nhật thay đổi' : visibility === 'published' ? 'Công khai khóa học' : 'Lưu khóa học'}
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
                                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Định danh khóa học</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Nền tảng của nội dung học thuật</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-md font-bold text-gray-400 ml-1">Tiêu đề khóa học <span className="text-red-500">*</span></label>
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
                                    <label className="text-md font-bold text-gray-400 ml-1">Mô tả chi tiết <span className="text-red-500">*</span></label>
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
                                    <h2 className="text-lg font-bold text-gray-900">Sinh viên sẽ học được gì?</h2>
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
                                        className="cursor-pointer p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
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
                                                className="hover:text-red-500 transition-colors cursor-pointer"
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
                                    <h2 className="text-lg font-bold text-gray-900">Yêu cầu tham gia</h2>
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
                                        className="cursor-pointer p-4 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-600 hover:text-white transition-all shadow-sm"
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
                                                className="hover:text-red-500 transition-colors cursor-pointer"
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
                                <span className="text-md font-bold text-gray-400 ml-1">Ảnh minh họa</span>
                                <ImageIcon size={16} className="text-gray-400" />
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 relative group">
                                    <img
                                        src={previewThumb || formData.image}
                                        alt="Course Preview"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    {(isThumbUploading || previewThumb) && (
                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                                            {isThumbUploading ? (
                                                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Local Preview</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <label className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all ${isThumbUploading ? 'bg-amber-100 text-amber-700' : 'bg-gray-900 text-white hover:bg-amber-600'}`}>
                                        {isThumbUploading ? 'Đang upload...' : 'Chọn ảnh từ máy'}
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const f = e.target.files?.[0];
                                                e.target.value = '';
                                                if (!f) return;

                                                try {
                                                    setIsThumbUploading(true);

                                                    // Local preview
                                                    const url = URL.createObjectURL(f);
                                                    if (previewThumb) URL.revokeObjectURL(previewThumb);
                                                    setPreviewThumb(url);

                                                    const res = await teacherService.uploadQuizMedia(f);
                                                    setFormData((prev) => ({ ...prev, image: res.url }));
                                                    toast.success('Đã upload ảnh minh họa');
                                                } catch (err: any) {
                                                    toast.error(err?.message || 'Upload ảnh thất bại');
                                                } finally {
                                                    setIsThumbUploading(false);
                                                }
                                            }}
                                        />
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData((prev) => ({ ...prev, image: '' }));
                                            if (previewThumb) {
                                                URL.revokeObjectURL(previewThumb);
                                                setPreviewThumb(null);
                                            }
                                        }}
                                        className="cursor-pointer w-full px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                                    >
                                        Xóa URL
                                    </button>
                                </div>

                            </div>
                        </section>

                        {/* Settings Card */}
                        <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-md font-bold text-gray-400 ml-1">
                                        <Hash size={12} className="text-amber-500" />
                                        Danh mục
                                    </div>
                                    <select
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-bold text-xs text-gray-900 cursor-pointer appearance-none uppercase tracking-wider"
                                        value={String((formData as any).categoryId ?? '')}
                                        onChange={e => setFormData({ ...formData, categoryId: Number(e.target.value) } as any)}
                                    >
                                        {categories.length > 0 ? categories.map((cat) => (
                                            <option key={String(cat.id)} value={String(cat.id)}>{cat.name}</option>
                                        )) : (
                                            <option value="">Không có danh mục</option>
                                        )}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-md font-bold text-gray-400 ml-1">
                                        <Layout size={12} className="text-amber-500" />
                                        Trạng thái hiển thị
                                    </div>
                                    <select
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-bold text-xs text-gray-900 cursor-pointer appearance-none uppercase tracking-wider"
                                        value={visibility}
                                        onChange={(e) => setVisibility(e.target.value as any)}
                                    >
                                        <option value="draft">Nháp</option>
                                        <option value="published">Công khai</option>
                                        <option value="private">Không công khai</option>
                                    </select>
                                    {visibility === 'private' && (
                                        <div className="text-xs font-bold text-gray-400">
                                            Hiện backend mới có trường "published". Tùy chọn "Không công khai" sẽ được lưu tương đương "Nháp".
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-md font-bold text-gray-400 ml-1">
                                        <BarChart size={12} className="text-amber-500" />
                                        Cấp độ học viên
                                    </div>
                                    <select
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-bold text-xs text-gray-900 cursor-pointer appearance-none uppercase tracking-wider"
                                        value={formData.level}
                                        onChange={e => setFormData({ ...formData, level: e.target.value as Course['level'] })}
                                    >
                                        {LEVELS.map(lvl => (
                                            <option key={lvl} value={lvl}>{lvl}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-md font-bold text-gray-400 ml-1">
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
