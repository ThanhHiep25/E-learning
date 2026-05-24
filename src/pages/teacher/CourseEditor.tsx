import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Trash2,
    BarChart, Hash,
    Image as ImageIcon, Layout, Plus, X, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { type Course } from '../../config/mock-data';
import { teacherService } from '../../services/teacher.service';
import { categoryService, type BackendCategory } from '../../services/category.service';
import { CourseDurationEditor } from '../../components/teacher/CourseDurationEditor';

const CATEGORIES = [
    'Bứt phá vào 10',
    'Luyện thi TOEIC',
    'Combo Lập trình',
    'Tin học văn phòng'
];

const LEVELS = ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced', 'proficiency', 'all-levels'] as const;

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
    const [formData, setFormData] = useState<Partial<Course>>({
        title: '',
        description: '',
        category: CATEGORIES[0],
        level: LEVELS[0],
        teacher: user?.fullName || 'Giảng viên',
        teacherAvatar: user?.avatar || '/default-avatar.png',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
        rating: 5.0,
        reviewCount: 0,
        students: 0,
        totalLessons: 0,
        curriculum: [],
        willLearn: [],
        requirements: [],
        price: 0,
        isRequired: false,
    } as any);

    // Duration settings (separate from formData type)
    const [durationSettings, setDurationSettings] = useState({
        durationType: 'lifetime' as 'lifetime' | 'fixed' | 'subscription',
        durationValue: undefined as number | undefined,
        durationUnit: undefined as 'days' | 'months' | 'years' | undefined,
        renewalDiscountPercent: 0,
        gracePeriodDays: 7,
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

            // Always fetch from API to get full data including duration settings
            try {
                const ownerCourse = await teacherService.getCourseForOwner(String(id));
                setFormData((prev) => {
                    const parseArray = (data: any) => {
                        if (Array.isArray(data)) return data;
                        if (typeof data === 'string' && data.startsWith('[')) {
                            try {
                                return JSON.parse(data);
                            } catch (e) {
                                console.error("Failed to parse JSON string:", data);
                                return [];
                            }
                        }
                        return [];
                    };

                    const oc = ownerCourse as any;

                    // Map chapters/lectures to curriculum format
                    const mapCurriculum = (chapters: any[]) => {
                        if (!Array.isArray(chapters)) return [];
                        return chapters.map((ch: any) => ({
                            id: ch.id,
                            title: ch.title,
                            lessons: ch.lectures?.map((lec: any) => ({
                                id: lec.id,
                                title: lec.title,
                                duration: lec.duration || 0,
                                isPreview: lec.isPreview || false,
                                videoUrl: lec.videoUrl || '',
                                attachments: lec.attachments || []
                            })) || []
                        }));
                    };

                    // Set duration settings separately
                    setDurationSettings({
                        durationType: oc.durationType || 'lifetime',
                        durationValue: oc.durationValue,
                        durationUnit: oc.durationUnit,
                        renewalDiscountPercent: oc.renewalDiscountPercent || 0,
                        gracePeriodDays: oc.gracePeriodDays || 7,
                    });

                    return {
                        ...prev,
                        id: oc.id,
                        title: oc.title || '',
                        description: oc.description || '',
                        image: oc.imageUrl || prev.image,
                        level: (oc.level as any) || LEVELS[0],
                        categoryId: oc.categoryId,
                        willLearn: parseArray(oc.willLearn),
                        requirements: parseArray(oc.requirements),
                        price: Number(oc.price || 0),
                        curriculum: mapCurriculum(oc.chapters),
                        published: oc.published || false,
                        totalLessons: oc.totalLessons || 0,
                        students: oc.students || 0,
                        isRequired: oc.isRequired || false,
                    };
                });

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
            if (isEditMode && id) {
                await teacherService.updateCourse(String(id), {
                    title: String(formData.title),
                    description: String(formData.description),
                    level: String(formData.level || LEVELS[0]),
                    willLearn: Array.isArray(formData.willLearn) ? formData.willLearn : [],
                    requirements: Array.isArray(formData.requirements) ? formData.requirements : [],
                    categoryId: (formData as any).categoryId ?? null,
                    imageUrl: String(formData.image || ''),
                    price: Number(formData.price || 0),
                    // Duration settings
                    durationType: durationSettings.durationType,
                    durationValue: durationSettings.durationValue,
                    durationUnit: durationSettings.durationUnit,
                    renewalDiscountPercent: durationSettings.renewalDiscountPercent,
                    gracePeriodDays: durationSettings.gracePeriodDays,
                    isRequired: Boolean((formData as any).isRequired),
                } as any);
                toast.success('Cập nhật thành công. Nếu khóa học đã xuất bản trước đó, hệ thống sẽ tự chuyển về trạng thái chờ duyệt.');
                navigate(`/teacher/content-editor/${encodeURIComponent(String(id))}`);
                return;
            }

            const created = await teacherService.createCourse({
                title: String(formData.title),
                description: String(formData.description),
                imageUrl: String(formData.image || ''),
                level: String(formData.level || LEVELS[0]),
                willLearn: Array.isArray(formData.willLearn) ? formData.willLearn : [],
                requirements: Array.isArray(formData.requirements) ? formData.requirements : [],
                price: Number(formData.price || 0),
                categoryId: (formData as any).categoryId ?? null,
                isRequired: Boolean((formData as any).isRequired),
                tags: [],
                // Duration settings
                durationType: durationSettings.durationType,
                durationValue: durationSettings.durationValue,
                durationUnit: durationSettings.durationUnit,
                renewalDiscountPercent: durationSettings.renewalDiscountPercent,
                gracePeriodDays: durationSettings.gracePeriodDays,
            } as any);

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
                            {isEditMode ? 'Cập nhật thay đổi' : 'Lưu khóa học'}
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

                                <div className="space-y-4">
                                    <label className="text-md font-bold text-gray-400 ml-1">Mô tả chi tiết <span className="text-red-500">*</span></label>
                                    <textarea
                                        required
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-medium"
                                        placeholder=""
                                        value={formData.description}
                                        rows={5}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                    {/* <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:border-amber-500 transition-all">
                                        <ReactQuill
                                            theme="snow"
                                            value={String(formData.description || '')}
                                            onChange={(val: any) => setFormData({ ...formData, description: val })}
                                            className="quill-course-editor"
                                        />
                                       
                                    </div> */}
                                    {/* <style>{`
                                            .quill-course-editor .ql-container {
                                                min-height: 200px;
                                                font-family: inherit;
                                                font-size: 1rem;
                                            }
                                            .quill-course-editor .ql-toolbar {
                                                border: none;
                                                border-bottom: 1px solid #f3f4f6;
                                                background: #fff;
                                            }
                                            .quill-course-editor.ql-container.ql-snow {
                                                border: none;
                                            }
                                            .quill-course-editor .ql-editor {
                                                padding: 1.5rem;
                                            }
                                        `}</style> */}
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
                                        <span className="text-amber-500 font-black">₫</span>
                                        Giá khóa học (VNĐ)
                                    </div>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-bold text-sm text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="Ví dụ: 299000 (0 = Miễn phí)"
                                        value={formData.price === 0 ? '' : formData.price}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setFormData({ ...formData, price: val === '' ? 0 : Number(val) });
                                        }}
                                    />
                                    <p className="text-[10px] font-bold text-gray-400 ml-1 italic">
                                        * Nhập 0 để đặt khóa học này là MIỄN PHÍ
                                    </p>
                                </div>

                                {/* Course Duration Settings - Compact */}
                                <div className="pt-3 border-t border-gray-100">
                                    <CourseDurationEditor
                                        value={durationSettings}
                                        onChange={setDurationSettings}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-md font-bold text-gray-400 ml-1">
                                        <Layout size={12} className="text-amber-500" />
                                        Trạng thái hiển thị
                                    </div>
                                    <div className="w-full px-5 py-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs font-bold text-amber-700">
                                        Giáo viên không thể tự publish. Sau khi chỉnh sửa, hãy gửi khóa học để admin duyệt.
                                    </div>
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

                                <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl">
                                    <input
                                        id="isRequired"
                                        type="checkbox"
                                        className="w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
                                        checked={Boolean((formData as any).isRequired)}
                                        onChange={e => setFormData({ ...formData, isRequired: e.target.checked } as any)}
                                    />
                                    <label htmlFor="isRequired" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                                        Khóa học bắt buộc
                                    </label>
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
