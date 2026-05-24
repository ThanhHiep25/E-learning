import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Mail, Phone, Calendar,
    Star, BookOpen,
    CheckCircle2,
    Edit2, X,
    Receipt, CheckCircle, Clock, XCircle
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useCourseStore } from '../store/useCourseStore';
import { useNavigate } from 'react-router-dom';
import { enrollmentService, type BackendEnrollment } from '../services/enrollment.service';
import { authService } from '../services/auth.service';
import { quizService, type PerformanceStats } from '../services/quiz.service';

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
    // Role-based tab initialization
    const getInitialTab = () => {
        const role = (user?.role as string)?.toLowerCase();
        if (role === 'teacher') return 'courses';
        if (role === 'admin') return 'overview';
        return 'learning';
    };
    const [activeTab, setActiveTab] = useState(getInitialTab());
    const [payments, setPayments] = useState<any[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);

    // Fetch payment history when payments tab is active
    useEffect(() => {
        if (activeTab === 'payments') {
            fetchPayments();
        }
    }, [activeTab]);

    const fetchPayments = async () => {
        try {
            setLoadingPayments(true);
            const response = await apiRequest('/student/payments/history', { method: 'GET' }) as { payments: any[] };
            setPayments(response.payments || []);
        } catch (error) {
            console.error('Failed to fetch payments:', error);
        } finally {
            setLoadingPayments(false);
        }
    };
    const [enrollments, setEnrollments] = useState<BackendEnrollment[]>([]);
    const [loadingEnrollments, setLoadingEnrollments] = useState(false);
    const [teacherStats, setTeacherStats] = useState<any>(null);
    const [adminStats, setAdminStats] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editFullName, setEditFullName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editAvatar, setEditAvatar] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [editError, setEditError] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Pagination for learning section
    const [learningPage, setLearningPage] = useState(1);
    const COURSES_PER_PAGE = 6;


    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    // Reset learning page when switching to learning tab
    useEffect(() => {
        if (activeTab === 'learning') {
            setLearningPage(1);
        }
    }, [activeTab]);

    useEffect(() => {
        const load = async () => {
            if (!user) return;
            const role = (user.role as string)?.toLowerCase();
            
            try {
                setLoadingEnrollments(true);
                setLoadingStats(true);
                
                if (role === 'student') {
                    // Student: load enrollments and quiz stats
                    const list = await enrollmentService.listMyEnrollments();
                    setEnrollments(Array.isArray(list) ? list : []);
                    
                    try {
                        const stats = await quizService.getPerformanceStats();
                        setPerformanceStats(stats);
                    } catch (statsErr) {
                        console.warn('Performance stats endpoint not available:', statsErr);
                        setPerformanceStats(null);
                    }
                } else if (role === 'teacher') {
                    // Teacher: load teacher statistics
                    try {
                        const stats = await apiRequest('/teacher/statistics', { method: 'GET' }) as any;
                        console.log('Teacher stats:', stats);
                        setTeacherStats(stats);
                    } catch (err) {
                        console.warn('Teacher stats not available:', err);
                        setTeacherStats(null);
                    }
                } else if (role === 'admin') {
                    // Admin: load dashboard stats
                    try {
                        const stats = await apiRequest('/admin/dashboard', { method: 'GET' }) as any;
                        console.log('Admin stats:', stats);
                        setAdminStats(stats);
                    } catch (err) {
                        console.warn('Admin stats not available:', err);
                        setAdminStats(null);
                    }
                }
            } catch (err) {
                console.error('Error loading profile data:', err);
                setEnrollments([]);
            } finally {
                setLoadingEnrollments(false);
                setLoadingStats(false);
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Bạn cần đăng nhập để xem thông tin này</h2>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all cursor-pointer"
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

    const formatCurrency = (amount: number, currency?: string) => {
        const value = Number(amount || 0);
        if (currency === 'USD') {
            return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `${value.toLocaleString('vi-VN')}đ`;
    };
    const joinDateLabel = (() => {
        const raw = (user as any)?.joinDate;
        if (!raw) return '';
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return String(raw);
        return d.toLocaleDateString('vi-VN');
    })();

    return (
        <div className="min-h-screen bg-[#FDF8EE] pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                {/* HEADER - Profile Card */}
                <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 mb-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-amber-100 shadow-xl overflow-hidden bg-white">
                                <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1.5 shadow-lg">
                                <CheckCircle2 size={16} />
                            </div>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{user.fullName}</h1>
                            <p className="text-gray-500 mb-3">@{user.username}</p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                                <span className="flex items-center gap-1.5 text-gray-600">
                                    <Mail size={14} className="text-amber-500" />
                                    {user.email}
                                </span>
                                {user.phone && (
                                    <span className="flex items-center gap-1.5 text-gray-600">
                                        <Phone size={14} className="text-amber-500" />
                                        {user.phone}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 text-gray-600">
                                    <Calendar size={14} className="text-amber-500" />
                                    Tham gia {joinDateLabel}
                                </span>
                            </div>
                        </div>
                        
                        {/* Edit Button */}
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all"
                        >
                            <Edit2 size={16} />
                            Chỉnh sửa
                        </button>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT - Quick Stats */}
                    <aside className="space-y-6">
                        {/* STUDENT Quick Stats */}
                        {(user.role as string)?.toLowerCase() === 'student' && (
                            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-4">Thông tin nhanh</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <span className="text-sm text-gray-600">Khóa học</span>
                                        <span className="text-sm font-bold text-gray-700">{enrolledCourses.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <span className="text-sm text-gray-600">Giao dịch</span>
                                        <span className="text-sm font-bold text-gray-700">{payments.length}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TEACHER Quick Stats */}
                        {(user.role as string)?.toLowerCase() === 'teacher' && (
                            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-4">Thống kê giảng viên</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                                        <span className="text-sm text-gray-600">Khóa học</span>
                                        <span className="text-sm font-bold text-amber-600">{teacherStats?.summary?.totalCourses ?? '--'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                                        <span className="text-sm text-gray-600">Học viên</span>
                                        <span className="text-sm font-bold text-blue-600">{teacherStats?.summary?.activeStudents ?? '--'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                                        <span className="text-sm text-gray-600">Điểm TB</span>
                                        <span className="text-sm font-bold text-emerald-600">{teacherStats?.summary?.averageScore ?? '--'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/teacher/dashboard')}
                                    className="w-full mt-4 px-4 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all"
                                >
                                    Vào Dashboard Giảng viên →
                                </button>
                            </div>
                        )}

                        {/* ADMIN Quick Stats */}
                        {(user.role as string)?.toLowerCase() === 'admin' && (
                            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-4">Thống kê hệ thống</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                                        <span className="text-sm text-gray-600">Tổng users</span>
                                        <span className="text-sm font-bold text-purple-600">{adminStats?.totalUsers ?? '--'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                                        <span className="text-sm text-gray-600">Khóa học</span>
                                        <span className="text-sm font-bold text-amber-600">{adminStats?.totalCourses ?? '--'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                                        <span className="text-sm text-gray-600">Giao dịch</span>
                                        <span className="text-sm font-bold text-emerald-600">{adminStats?.totalPayments ?? '--'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/admin/dashboard')}
                                    className="w-full mt-4 px-4 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all"
                                >
                                    Vào Admin Panel →
                                </button>
                            </div>
                        )}
                    </aside>

                    {/* RIGHT - Main Content */}
                    <main className="lg:col-span-2 space-y-6">
                        {/* STUDENT - Practice Stats */}
                        {(user.role as string)?.toLowerCase() === 'student' && (
                            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-4">Luyện tập & Phân tích</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-blue-50 p-4 rounded-2xl text-center">
                                        <p className="text-2xl font-bold text-blue-600 mb-1">
                                            {performanceStats?.statistics?.totalScore ?? 0}
                                        </p>
                                        <p className="text-xs font-medium text-blue-400">Tổng điểm</p>
                                    </div>
                                    <div className="bg-emerald-50 p-4 rounded-2xl text-center">
                                        <p className="text-2xl font-bold text-emerald-600 mb-1">
                                            {performanceStats?.statistics?.passRate ?? 0}%
                                        </p>
                                        <p className="text-xs font-medium text-emerald-400">Tỉ lệ đạt</p>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-2xl text-center">
                                        <p className="text-2xl font-bold text-amber-600 mb-1">
                                            {performanceStats?.statistics?.averagePercentage ?? 0}%
                                        </p>
                                        <p className="text-xs font-medium text-amber-400">Điểm TB</p>
                                    </div>
                                    <div className="bg-rose-50 p-4 rounded-2xl text-center">
                                        <p className="text-2xl font-bold text-rose-600 mb-1">
                                            {performanceStats?.statistics?.totalAttempts ?? 0}
                                        </p>
                                        <p className="text-xs font-medium text-rose-400">Lần thực hiện</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STUDENT TABS */}
                        {(user.role as string)?.toLowerCase() === 'student' && (
                            <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 flex gap-1">
                                <button
                                    onClick={() => setActiveTab('learning')}
                                    className={`flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'learning' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <span>Học tập</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'learning' ? 'bg-white/20' : 'bg-gray-100'}`}>
                                        {enrolledCourses.length}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('payments')}
                                    className={`flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'payments' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <span>Thanh toán</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'payments' ? 'bg-white/20' : 'bg-gray-100'}`}>
                                        {payments.length}
                                    </span>
                                </button>
                            </div>
                        )}

                        {/* TEACHER TABS */}
                        {(user.role as string)?.toLowerCase() === 'teacher' && (
                            <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 flex gap-1">
                                <button
                                    onClick={() => setActiveTab('courses')}
                                    className={`flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'courses' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <span>Khóa học</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'reviews' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <span>Đánh giá</span>
                                </button>
                            </div>
                        )}

                        {/* ADMIN TABS */}
                        {(user.role as string)?.toLowerCase() === 'admin' && (
                            <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 flex gap-1">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <span>Tổng quan</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('reports')}
                                    className={`flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'reports' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <span>Báo cáo</span>
                                </button>
                            </div>
                        )}

                        {activeTab === 'learning' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {loadingEnrollments ? (
                                        <div className="col-span-full py-20 bg-white rounded-[40px] border border-gray-100 text-center">
                                            <p className="text-sm font-bold text-gray-500">Đang tải...</p>
                                        </div>
                                    ) : (
                                        enrolledCourses
                                            .slice((learningPage - 1) * COURSES_PER_PAGE, learningPage * COURSES_PER_PAGE)
                                            .map(({ enrollment, course }, index) => (
                                                <div
                                                    key={`${course.id}-${index}`}
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
                                                        <h4 className="font-bold text-gray-900 line-clamp-2 mb-4 group-hover:text-amber-600 transition-colors text-sm tracking-tight leading-tight min-h-[40px]">{course.title}</h4>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5">
                                                                <Star size={14} fill="currentColor" className="text-amber-500" />
                                                                <span className="text-xs font-bold text-gray-400">
                                                                    {course.rating ? Number(course.rating).toFixed(1) : '0.0'}
                                                                    {course.reviewCount ? ` (${course.reviewCount})` : ''}
                                                                </span>
                                                            </div>
                                                            <div className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                                                {Math.min(100, Math.max(0, Number(enrollment.progressPercent ?? 0)))}% Đã học
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                    {!loadingEnrollments && enrolledCourses.length === 0 && (
                                        <div className="col-span-full py-20 bg-white rounded-[40px] border border-dashed border-gray-200 text-center">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <BookOpen size={32} className="text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 font-bold">Bạn chưa tham gia khóa học nào</p>
                                            <button
                                                onClick={() => navigate('/courses')}
                                                className="mt-6 text-amber-600 font-bold text-sm hover:underline"
                                            >
                                                Khám phá ngay →
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Pagination */}
                                {!loadingEnrollments && enrolledCourses.length > COURSES_PER_PAGE && (
                                    <div className="flex items-center justify-center gap-2 pt-4">
                                        <button
                                            onClick={() => setLearningPage(p => Math.max(1, p - 1))}
                                            disabled={learningPage === 1}
                                            className="px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                        >
                                            ← Trước
                                        </button>
                                        <span className="px-4 py-2 text-sm font-bold text-gray-700">
                                            {learningPage} / {Math.ceil(enrolledCourses.length / COURSES_PER_PAGE)}
                                        </span>
                                        <button
                                            onClick={() => setLearningPage(p => Math.min(Math.ceil(enrolledCourses.length / COURSES_PER_PAGE), p + 1))}
                                            disabled={learningPage >= Math.ceil(enrolledCourses.length / COURSES_PER_PAGE)}
                                            className="px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                        >
                                            Sau →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-bold text-gray-900">Lịch sử thanh toán</h3>
                                    <button
                                        onClick={() => navigate('/payment-history')}
                                        className="text-amber-600 font-bold text-xs hover:underline"
                                    >
                                        Xem tất cả →
                                    </button>
                                </div>
                                {loadingPayments ? (
                                    <div className="text-center py-10">
                                        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-gray-500 text-sm">Đang tải...</p>
                                    </div>
                                ) : payments.length === 0 ? (
                                    <div className="text-center py-10">
                                        <Receipt size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p className="text-gray-500 font-bold">Chưa có giao dịch nào</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {payments.slice(0, 5).map((payment) => (
                                            <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                        payment.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                                        payment.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                                        'bg-rose-100 text-rose-600'
                                                    }`}>
                                                        {payment.status === 'completed' ? <CheckCircle size={20} /> :
                                                         payment.status === 'pending' ? <Clock size={20} /> :
                                                         <XCircle size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{payment.courseTitle || 'Khóa học'}</p>
                                                        <p className="text-xs text-gray-500">{new Date(payment.createdAt).toLocaleDateString('vi-VN')}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">{formatCurrency(payment.amount, payment.currency)}</p>
                                                    <p className={`text-xs font-medium ${
                                                        payment.status === 'completed' ? 'text-emerald-600' :
                                                        payment.status === 'pending' ? 'text-amber-600' :
                                                        'text-rose-600'
                                                    }`}>
                                                        {payment.status === 'completed' ? 'Thành công' :
                                                         payment.status === 'pending' ? 'Đang xử lý' :
                                                         'Thất bại'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STUDENT - Recent Attempts */}
                        {(user.role as string)?.toLowerCase() === 'student' && (
                            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-4">Bài tập gần đây</h3>
                                <div className="overflow-hidden border border-gray-100 rounded-2xl">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500">Bài tập</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-right">Điểm</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {loadingStats ? (
                                                <tr>
                                                    <td colSpan={2} className="px-4 py-8 text-center text-sm text-gray-500">Đang tải...</td>
                                                </tr>
                                            ) : performanceStats?.recentAttempts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={2} className="px-4 py-8 text-center text-sm text-gray-400">Chưa có bài tập nào</td>
                                                </tr>
                                            ) : (
                                                performanceStats?.recentAttempts.slice(0, 5).map((att) => (
                                                    <tr key={att.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-bold text-gray-700">{att.quizTitle}</p>
                                                            <p className="text-xs text-gray-400">{att.courseTitle}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`text-sm font-bold ${att.passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {att.score}/{att.maxScore}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TEACHER - Courses Tab */}
                        {(user.role as string)?.toLowerCase() === 'teacher' && activeTab === 'courses' && (
                            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 text-center">
                                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BookOpen size={32} className="text-amber-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Quản lý khóa học</h3>
                                <p className="text-gray-500 text-sm mb-6">Xem và quản lý các khóa học bạn đang giảng dạy</p>
                                <button
                                    onClick={() => navigate('/teacher/courses')}
                                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all"
                                >
                                    Vào trang quản lý khóa học →
                                </button>
                            </div>
                        )}

                        {/* TEACHER - Reviews Tab */}
                        {(user.role as string)?.toLowerCase() === 'teacher' && activeTab === 'reviews' && (
                            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 text-center">
                                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Star size={32} className="text-amber-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Đánh giá từ học viên</h3>
                                <p className="text-gray-500 text-sm">Tính năng đang phát triển. Bạn có thể xem đánh giá trong từng khóa học.</p>
                            </div>
                        )}

                        {/* ADMIN - Overview Tab */}
                        {(user.role as string)?.toLowerCase() === 'admin' && activeTab === 'overview' && (
                            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Tổng quan hệ thống</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-purple-50 rounded-2xl text-center">
                                        <p className="text-3xl font-bold text-purple-600 mb-1">{adminStats?.totalUsers ?? '--'}</p>
                                        <p className="text-xs text-purple-400">Tổng người dùng</p>
                                    </div>
                                    <div className="p-4 bg-amber-50 rounded-2xl text-center">
                                        <p className="text-3xl font-bold text-amber-600 mb-1">{adminStats?.totalCourses ?? '--'}</p>
                                        <p className="text-xs text-amber-400">Khóa học</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-2xl text-center">
                                        <p className="text-3xl font-bold text-emerald-600 mb-1">{adminStats?.totalEnrollments ?? '--'}</p>
                                        <p className="text-xs text-emerald-400">Đăng ký</p>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-2xl text-center">
                                        <p className="text-3xl font-bold text-blue-600 mb-1">{adminStats?.totalRevenue ? formatCurrency(adminStats.totalRevenue) : '--'}</p>
                                        <p className="text-xs text-blue-400">Doanh thu</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ADMIN - Reports Tab */}
                        {(user.role as string)?.toLowerCase() === 'admin' && activeTab === 'reports' && (
                            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Receipt size={32} className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Báo cáo hệ thống</h3>
                                <p className="text-gray-500 text-sm mb-6">Xem báo cáo chi tiết về hoạt động của nền tảng</p>
                                <button
                                    onClick={() => navigate('/admin/dashboard')}
                                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all"
                                >
                                    Vào Admin Dashboard →
                                </button>
                            </div>
                        )}
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
                                aria-label='Đóng'
                                title='Đóng'
                                className="p-2 rounded-xl text-gray-400 cursor-pointer hover:text-gray-700 hover:bg-gray-50 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">

                            <div className="flex flex-col items-center justify-center py-6 bg-gray-50/50 rounded-[28px] border border-dashed border-gray-100">
                                <div className="relative group">
                                    <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={previewUrl || editAvatar || '/default-avatar.png'}
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
                                <p className="text-xs font-medium text-gray-400 mt-4">Xem trước ảnh đại diện</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs cursor-pointer transition-all ${uploadingAvatar ? 'bg-amber-100 text-amber-700' : 'bg-gray-900 text-white hover:bg-amber-600'}`}>
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
                                    className="cursor-pointer w-full px-4 py-3 rounded-2xl font-bold text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
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
                                    aria-label='Hủy'
                                    title='Hủy'
                                    className="px-6 py-3 cursor-pointer rounded-2xl font-bold text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={savingProfile}
                                    aria-label='Lưu thay đổi'
                                    title='Lưu thay đổi'
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
                                    className="px-6 py-3 rounded-2xl cursor-pointer font-bold text-xs bg-gray-900 text-white hover:bg-amber-600 transition-all disabled:opacity-60"
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
