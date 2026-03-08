import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    User as UserIcon, Mail, Phone, MapPin, Calendar,
    Star, Award, BookOpen,
    ChevronRight, CheckCircle2, MessageSquare,
    Plus, Edit2, Zap
} from 'lucide-react';
import { useCourseStore } from '../store/useCourseStore';
import { useNavigate } from 'react-router-dom';
import { enrollmentService, type BackendEnrollment } from '../services/enrollment.service';
import { authService } from '../services/auth.service';

async function compressImage(file: File, opts: { maxSize: number; quality: number }): Promise<File> {
    if (!String(file.type || '').startsWith('image/')) return file;

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = URL.createObjectURL(file);
    });

    const { maxSize, quality } = opts;
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    URL.revokeObjectURL(img.src);

    const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b || file), 'image/jpeg', quality);
    });

    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}

const Profile: React.FC = () => {
    const { user, updateUser } = useAuth();
    useCourseStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('learning');
    const [enrollments, setEnrollments] = useState<BackendEnrollment[]>([]);
    const [loadingEnrollments, setLoadingEnrollments] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editFullName, setEditFullName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editAvatar, setEditAvatar] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [editError, setEditError] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    useEffect(() => {
        const load = async () => {
            if (!user) return;
            try {
                setLoadingEnrollments(true);
                const list = await enrollmentService.listMyEnrollments();
                setEnrollments(Array.isArray(list) ? list : []);
            } catch {
                setEnrollments([]);
            } finally {
                setLoadingEnrollments(false);
            }
        };

        load();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        if (!isEditOpen) {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
            return;
        }
        setEditFullName(user.fullName || '');
        setEditPhone(user.phone || '');
        setEditAvatar(user.avatar || '');
        setEditError('');
    }, [isEditOpen, user]);




    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-black text-gray-900 mb-4">Bạn cần đăng nhập để xem thông tin này</h2>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all cursor-pointer"
                    >
                        VỀ TRANG CHỦ
                    </button>
                </div>
            </div>
        );
    }

    const enrolledCourses = enrollments
        .map((en) => {
            const course = en.Course;
            if (!course) return null;
            return {
                enrollment: en,
                course,
            };
        })
        .filter(Boolean) as { enrollment: BackendEnrollment; course: NonNullable<BackendEnrollment['Course']> }[];

    const joinDateLabel = (() => {
        const raw = (user as any)?.joinDate;
        if (!raw) return '';
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return String(raw);
        return d.toLocaleDateString('vi-VN');
    })();

    return (
        <div className="min-h-screen bg-[#FDF8EE] pt-28 pb-20">
            <div className="max-w-[1440px] mx-auto px-6 md:px-10">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* LEFT SIDEBAR - PROFILE INFO */}
                    <aside className="w-full lg:w-96 space-y-6">
                        {/* Avatar & Basic Info Card */}
                        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-br from-amber-500/10 to-orange-500/5 z-0"></div>

                            <div className="relative z-10">
                                <div className="relative inline-block mb-6">
                                    <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                                        <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg border border-gray-50">
                                        <div className="flex gap-0.5">
                                            <Star size={14} fill="currentColor" className="text-amber-500" />
                                            <Star size={14} fill="currentColor" className="text-amber-500" />
                                        </div>
                                    </div>
                                </div>

                                <h1 className="text-2xl font-bold text-gray-700 mb-2">{user.fullName}</h1>

                                {/* Experience Bar */}
                                <div className="mt-6 space-y-2">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                                            <Zap size={10} fill="currentColor" />
                                            <span className="text-[10px] font-black uppercase">Coming soon</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-400">--/-- EXP</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                                        <div
                                            className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000"
                                            style={{ width: '0%' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Information */}
                        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 space-y-8">
                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase mb-6 flex items-center justify-between">
                                    Thông tin
                                    <button
                                        type="button"
                                        onClick={() => setIsEditOpen(true)}
                                        className="text-gray-300 cursor-pointer hover:text-amber-500 transition-colors"
                                        aria-label="Chỉnh sửa thông tin"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                                            <UserIcon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Username</p>
                                            <p className="text-sm font-bold text-gray-700">{user.username || 'n/a'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                                            <Mail size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
                                            <p className="text-sm font-bold text-gray-700 truncate">{user.email}</p>
                                        </div>
                                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                    </div>
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                                            <Phone size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Phone</p>
                                            <p className="text-sm font-bold text-gray-700">{user.phone || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                                            <MapPin size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Vị trí</p>
                                            <p className="text-sm font-bold text-gray-700">{user.location || 'Vietnam'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Ngày tham gia</p>
                                            <p className="text-sm font-bold text-gray-700">{joinDateLabel || '--'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-50" />

                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase mb-6">Kỹ năng</h3>
                                <div className="space-y-4">
                                    {user.skills?.map((skill, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                <span className="text-sm font-bold text-gray-700">{skill.name}</span>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={12}
                                                        fill={i < skill.level ? "currentColor" : "none"}
                                                        className={i < skill.level ? "text-amber-500" : "text-gray-200"}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {!user.skills?.length && <p className="text-sm text-gray-400 text-center italic">Coming soon</p>}
                                </div>
                            </div>
                        </div>

                        {/* Experience & Education */}
                        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 space-y-8">
                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase mb-6 flex items-center justify-between">
                                    Kinh nghiệm
                                    <Plus size={16} className="text-gray-300 cursor-pointer hover:text-amber-500" />
                                </h3>
                                <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-gray-100 before:z-0">
                                    {user.experienceList?.map((exp, index) => (
                                        <div key={index} className="relative z-10 pl-10">
                                            <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-amber-500"></div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{exp.period}</p>
                                            <p className="text-sm font-black text-gray-900">{exp.position}</p>
                                            <p className="text-xs font-bold text-amber-600">{exp.company}</p>
                                        </div>
                                    ))}
                                    {!user.experienceList?.length && <p className="text-sm text-gray-400 text-center italic">Coming soon</p>}
                                </div>
                            </div>

                            <hr className="border-gray-50" />

                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase mb-6 flex items-center justify-between">
                                    Học vấn
                                    <Plus size={16} className="text-gray-300 cursor-pointer hover:text-amber-500" />
                                </h3>
                                <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-gray-100 before:z-0">
                                    {user.educationList?.map((edu, index) => (
                                        <div key={index} className="relative z-10 pl-10">
                                            <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-emerald-500"></div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{edu.period}</p>
                                            <p className="text-sm font-black text-gray-900">{edu.major}</p>
                                            <p className="text-xs font-bold text-emerald-600">{edu.school}</p>
                                        </div>
                                    ))}
                                    {!user.educationList?.length && <p className="text-sm text-gray-400 text-center italic">Coming soon</p>}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* RIGHT CONTENT AREA */}
                    <main className="flex-1 space-y-8">

                        {/* MAIN TABS */}
                        <div className="bg-white rounded-[40px] p-3 shadow-sm border border-gray-100 inline-flex gap-2">
                            <button
                                onClick={() => setActiveTab('learning')}
                                className={`px-8 py-3.5 rounded-[28px] text-[13px] font-black uppercase transition-all cursor-pointer ${activeTab === 'learning' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <BookOpen size={18} />
                                    <span>Học tập</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'learning' ? 'bg-white/20' : 'bg-gray-100'}`}>
                                        {enrolledCourses.length}
                                    </span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('contests')}
                                className={`px-8 py-3.5 rounded-[28px] text-[13px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'contests' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Award size={18} />
                                    <span>Cuộc thi</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'contests' ? 'bg-white/20' : 'bg-gray-100'}`}>0</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('discussions')}
                                className={`px-8 py-3.5 rounded-[28px] text-[13px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'discussions' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={18} />
                                    <span>Thảo luận</span>
                                </div>
                            </button>
                        </div>

                        {activeTab === 'learning' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {loadingEnrollments ? (
                                    <div className="col-span-full py-20 bg-white rounded-[40px] border border-gray-100 text-center">
                                        <p className="text-sm font-bold text-gray-500">Đang tải...</p>
                                    </div>
                                ) : enrolledCourses.map(({ enrollment, course }) => (
                                    <div
                                        key={String(course.id)}
                                        className="bg-white rounded-[32px] overflow-hidden border border-gray-100 group hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 cursor-pointer"
                                        onClick={() => navigate(`/course/${course.id}`)}
                                    >
                                        <div className="aspect-video relative overflow-hidden">
                                            <img src={(course.imageUrl as any) || '/elearning-1.jpg'} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"
                                                        style={{ width: `${Math.min(100, Math.max(0, Number(enrollment.progressPercent ?? 0)))}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h4 className="font-black text-gray-900 line-clamp-2 mb-4 group-hover:text-amber-600 transition-colors uppercase text-sm tracking-tight leading-tight min-h-[40px]">{course.title}</h4>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <Star size={14} fill="currentColor" className="text-amber-500" />
                                                    <span className="text-xs font-bold text-gray-400">--</span>
                                                </div>
                                                <div className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                                    {Math.min(100, Math.max(0, Number(enrollment.progressPercent ?? 0)))}% ĐÃ HỌC
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {!loadingEnrollments && enrolledCourses.length === 0 && (
                                    <div className="col-span-full py-20 bg-white rounded-[40px] border border-dashed border-gray-200 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <BookOpen size={32} className="text-gray-300" />
                                        </div>
                                        <p className="text-gray-500 font-bold">Bạn chưa tham gia khóa học nào</p>
                                        <button
                                            onClick={() => navigate('/courses')}
                                            className="mt-6 text-amber-600 font-black uppercase text-xs tracking-widest hover:underline"
                                        >
                                            Khám phá ngay →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'contests' && (
                            <div className="bg-white rounded-[40px] p-12 shadow-sm border border-gray-100 text-center">
                                <div className="w-24 h-24 bg-amber-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                                    <Award size={48} className="text-amber-500" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Coming soon</h3>
                                <p className="text-gray-400 font-bold max-w-sm mx-auto mb-8">Tính năng này sẽ được cập nhật sau.</p>
                            </div>
                        )}

                        {/* Practice Section - High Score Summary */}
                        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100 space-y-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-gray-400 uppercase">Luyện tập & Phân tích</h3>
                                <button className="flex items-center gap-2 text-amber-600 font-black text-[11px] uppercase tracking-widest hover:underline cursor-pointer">
                                    Thống kê chi tiết <ChevronRight size={14} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-50 text-center group hover:bg-blue-50 transition-all">
                                    <p className="text-3xl font-black text-blue-600 mb-1 group-hover:scale-110 transition-transform">--</p>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Tổng điểm</p>
                                </div>
                                <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-50 text-center group hover:bg-emerald-50 transition-all">
                                    <p className="text-3xl font-black text-emerald-600 mb-1 group-hover:scale-110 transition-transform">--</p>
                                    <div className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">Coming soon</div>
                                </div>
                                <div className="bg-amber-50/50 p-6 rounded-[32px] border border-amber-50 text-center group hover:bg-amber-50 transition-all">
                                    <p className="text-3xl font-black text-amber-600 mb-1 group-hover:scale-110 transition-transform">--</p>
                                    <div className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">Coming soon</div>
                                </div>
                                <div className="bg-rose-50/50 p-6 rounded-[32px] border border-rose-50 text-center group hover:bg-rose-50 transition-all">
                                    <p className="text-3xl font-black text-rose-600 mb-1 group-hover:scale-110 transition-transform">--</p>
                                    <div className="inline-flex items-center gap-1.5 bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">Coming soon</div>
                                </div>
                            </div>

                            {/* Recent Table */}
                            <div className="overflow-hidden border border-gray-50 rounded-3xl">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tên bài tập</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Độ khó</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ngôn ngữ</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Điểm số</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center">
                                                <span className="text-sm font-bold text-gray-400 italic">Coming soon</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 uppercase">Chỉnh sửa thông tin</h3>
                            <button
                                type="button"
                                onClick={() => setIsEditOpen(false)}
                                className="p-2 rounded-xl text-gray-400 cursor-pointer hover:text-gray-700 hover:bg-gray-50 transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">

                            <div className="flex flex-col items-center justify-center py-6 bg-gray-50/50 rounded-[28px] border border-dashed border-gray-100">
                                <div className="relative group">
                                    <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={previewUrl || editAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky'}
                                            className="w-full h-full object-cover"
                                            alt="Avatar Preview"
                                        />
                                        {uploadingAvatar && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white text-white shadow-md">
                                        <Edit2 size={12} />
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Xem trước ảnh đại diện</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all ${uploadingAvatar ? 'bg-amber-100 text-amber-700' : 'bg-gray-900 text-white hover:bg-amber-600'}`}>
                                    {uploadingAvatar ? 'Đang upload...' : 'Chọn ảnh từ máy'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const f = e.target.files?.[0];
                                            e.target.value = '';
                                            if (!f) return;

                                            if (!String(f.type || '').startsWith('image/')) {
                                                setEditError('Chỉ hỗ trợ file ảnh');
                                                return;
                                            }

                                            try {
                                                setEditError('');
                                                setUploadingAvatar(true);

                                                // Create preview URL
                                                const localUrl = URL.createObjectURL(f);
                                                if (previewUrl) URL.revokeObjectURL(previewUrl);
                                                setPreviewUrl(localUrl);

                                                const compressed = await compressImage(f, { maxSize: 512, quality: 0.8 });
                                                const res = await authService.uploadAvatar(compressed);
                                                if (res.uploadedUrl) {
                                                    setEditAvatar(res.uploadedUrl);
                                                }
                                            } catch (err: any) {
                                                setEditError(err?.message || 'Upload ảnh thất bại');
                                            } finally {
                                                setUploadingAvatar(false);
                                            }
                                        }}
                                    />
                                </label>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditAvatar('');
                                        if (previewUrl) {
                                            URL.revokeObjectURL(previewUrl);
                                            setPreviewUrl(null);
                                        }
                                    }}
                                    aria-label="Xóa avatar"
                                    className="cursor-pointer w-full px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                                >
                                    Xóa avatar
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400 ml-1">Họ và tên</label>
                                <input
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-bold text-gray-900"
                                    value={editFullName}
                                    onChange={(e) => setEditFullName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400 ml-1">Số điện thoại</label>
                                <input
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-bold text-gray-900"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-6 py-3 cursor-pointer rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={savingProfile}
                                    onClick={async () => {
                                        if (!user) return;
                                        try {
                                            setSavingProfile(true);
                                            const ok = await updateUser({
                                                fullName: editFullName,
                                                phone: editPhone,
                                                avatar: editAvatar,
                                            });
                                            if (!ok) {
                                                setEditError('Không thể lưu. Vui lòng thử lại.');
                                                return;
                                            }
                                            setIsEditOpen(false);
                                        } finally {
                                            setSavingProfile(false);
                                        }
                                    }}
                                    className="px-6 py-3 rounded-2xl cursor-pointer font-black text-xs uppercase tracking-widest bg-gray-900 text-white hover:bg-amber-600 transition-all disabled:opacity-60"
                                >
                                    {savingProfile ? 'Đang lưu...' : 'Lưu'}
                                </button>
                            </div>

                            {editError && (
                                <div className="text-sm font-bold text-red-500">
                                    {editError}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
