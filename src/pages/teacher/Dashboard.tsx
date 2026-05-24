import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Plus, BookOpen,
    Edit3, Trash2, ExternalLink,
    BarChart3, Activity, GraduationCap,
    Search,
    ChevronLeft, ChevronRight,
    AlertCircle, X,
        CalendarDays,
    TrendingUp,
    Award,
    MessageSquare,
    Target,
    Zap,
    FileText,
    ChevronRight as ChevronRightIcon,
    MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { teacherService, type BackendTeacherCourse } from '../../services/teacher.service';

interface CourseAnalytics {
  overview: {
    totalStudents: number;
    averageProgress: number;
    averageScore: number;
    completionRate: number;
  };
  engagement: {
    activeStudents: number;
    inactiveStudents: number;
    averageTimeSpent: number;
  };
  performance: {
    topPerformers: any[];
    strugglingStudents: any[];
    scoreDistribution: any[];
  };
  insights: string[];
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'comment' | 'quiz_completion' | 'lecture_progress';
  title: string;
  description: string;
  timestamp: string;
  courseId?: string;
}

const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [courses, setCourses] = useState<BackendTeacherCourse[]>([]);
    const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'name_asc' | 'students_desc' | 'rating_desc'>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [courseToDelete, setCourseToDelete] = useState<BackendTeacherCourse | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    // 🛡️ P1-3 FIX: Cache enrollments data to prevent N+1 queries
    const [courseEnrollments, setCourseEnrollments] = useState<Record<string, any[]>>({});

    useEffect(() => {
        const load = async () => {
            const myCourses = await teacherService.listMyCourses();
            setCourses(myCourses);

            // 🛡️ P1-3 FIX: Fetch all enrollments in parallel và cache
            const enrollmentsMap: Record<string, any[]> = {};
            const pairs = await Promise.all(
                (myCourses || []).map(async (c) => {
                    const enrollments = await teacherService.getCourseEnrollments(String(c.id));
                    enrollmentsMap[String(c.id)] = enrollments; // Cache for reuse
                    return [String(c.id), enrollments.length] as const;
                }),
            );

            setStudentCounts(Object.fromEntries(pairs));
            setCourseEnrollments(enrollmentsMap); // Store for analytics

            // Load analytics for all courses
            if (myCourses.length > 0) {
                loadAnalytics(enrollmentsMap, myCourses);
            }
        };

        load();
    }, []);

    // 🛡️ P1-3 FIX: Pass cached data instead of re-fetching
    const loadAnalytics = async (enrollmentsMap?: Record<string, any[]>, coursesList?: BackendTeacherCourse[]) => {
        try {
            setLoadingAnalytics(true);
            // Pass first course ID to avoid 400 error, or use 'all' for aggregate analytics
            const coursesToProcess = coursesList || courses;
            const firstCourseId = coursesToProcess.length > 0 ? coursesToProcess[0].id : undefined;
            const analyticsData = await teacherService.getCourseAnalytics(firstCourseId);
            setAnalytics(analyticsData);
            
            // 🛡️ P1-3 FIX: Use cached enrollments instead of re-fetching
            const activities: RecentActivity[] = [];
            
            for (const course of coursesToProcess.slice(0, 3)) {
                // Use cached data or fetch if not available
                const enrollments = enrollmentsMap?.[String(course.id)] || 
                                   courseEnrollments[String(course.id)] || 
                                   [];
                
                // Add recent enrollment activities
                enrollments.slice(0, 3).forEach((enrollment, idx) => {
                    activities.push({
                        id: `enroll-${course.id}-${idx}`,
                        type: 'enrollment',
                        title: 'Học viên mới',
                        description: `${enrollment.User?.name || 'Học viên'} đã tham gia khóa "${course.title}"`,
                        timestamp: enrollment.enrolledAt || new Date().toISOString(),
                        courseId: String(course.id),
                    });
                });
            }
            // Sort by timestamp and take top 5
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setRecentActivities(activities.slice(0, 5));
        } catch (err) {
            console.error('Failed to load analytics:', err);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, sortBy]);

    const filteredCourses = useMemo(() => {
        let result = [...courses];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c => c.title.toLowerCase().includes(term));
        }

        if (statusFilter !== 'all') {
            const isPublished = statusFilter === 'published';
            result = result.filter(c => !!c.published === isPublished);
        }

        result.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            if (sortBy === 'name_asc') return (a.title || '').localeCompare(b.title || '');
            if (sortBy === 'students_desc') return (studentCounts[String(b.id)] || 0) - (studentCounts[String(a.id)] || 0);
            if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
            return 0;
        });

        return result;
    }, [courses, searchTerm, statusFilter, sortBy, studentCounts]);

    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const paginatedCourses = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredCourses.slice(start, start + itemsPerPage);
    }, [filteredCourses, currentPage, itemsPerPage]);

    const handleConfirmDelete = async () => {
        if (!courseToDelete) return;

        try {
            setIsDeleting(true);
            await teacherService.deleteCourse(String(courseToDelete.id));
            setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
            toast.success('Đã xóa khóa học thành công');
            setCourseToDelete(null);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Lỗi khi xóa khóa học');
        } finally {
            setIsDeleting(false);
        }
    };

    const totalStudents = courses.reduce((acc, c) => acc + (studentCounts[String(c.id)] || 0), 0);
    const completionRate = analytics?.overview?.completionRate || 0;
    
    const stats = [
        { label: 'Tổng số khóa học', value: courses.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', trend: courses.length > 0 ? `+${courses.length}` : '0' },
        { label: 'Tổng số học viên', value: totalStudents.toLocaleString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: totalStudents > 0 ? `+${totalStudents}` : '0' },
        {
            label: 'Đánh giá trung bình',
            value: (() => {
                const ratedCourses = courses.filter(c => c.rating && Number(c.rating) > 0);
                if (ratedCourses.length === 0) return '0.0';
                const totalRating = ratedCourses.reduce((acc, c) => acc + Number(c.rating || 0), 0);
                return (totalRating / ratedCourses.length).toFixed(1);
            })(),
            icon: Activity,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            trend: courses.length > 0 ? `${courses.length} khóa` : '0'
        },
        { label: 'Tỷ lệ hoàn thành', value: `${completionRate}%`, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50', trend: loadingAnalytics ? '...' : `${completionRate}%` },
    ];

    return (
        <div className="w-full">
            <div className="max-w-7xl mx-auto md:mt-0 mt-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <GraduationCap size={32} className="text-amber-500" />
                            Bảng điều khiển Giảng viên
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">Chào mừng quay trở lại, {user?.fullName}!</p>
                    </div>
                </div>

                {/* Stats Grid with Trends */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                                    <stat.icon size={24} />
                                </div>
                                <div className="flex items-center gap-1 text-emerald-500 text-sm font-bold">
                                    <TrendingUp size={16} />
                                    {stat.trend}
                                </div>
                            </div>
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <button
                        onClick={() => navigate('/teacher/create-course')}
                        className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all group"
                    >
                        <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold text-sm">Tạo Khóa Học</span>
                    </button>
                                        <button
                        onClick={() => navigate('/teacher/schedule')}
                        className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all group"
                    >
                        <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                            <CalendarDays size={24} />
                        </div>
                        <span className="font-bold text-sm">Lịch Dạy</span>
                    </button>
                    <button
                        onClick={() => navigate('/teacher/statistics')}
                        className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all group"
                    >
                        <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                            <BarChart3 size={24} />
                        </div>
                        <span className="font-bold text-sm">Thống Kê</span>
                    </button>
                    <button
                        onClick={() => navigate('/teacher/chats')}
                        className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all group"
                    >
                        <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                            <MessageCircle size={24} />
                        </div>
                        <span className="font-bold text-sm">Quản Lý Chat</span>
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Courses Table - Takes 2 columns */}
                    <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Khóa học của tôi</h2>
                                    <p className="text-sm text-gray-400 mt-1">Quản lý và cập nhật nội dung khóa học</p>
                                </div>
                                <button
                                    onClick={() => navigate('/teacher/courses')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all"
                                >
                                    Xem tất cả
                                    <ChevronRightIcon size={16} />
                                </button>
                            </div>

                            {/* Search and Filters */}
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex-1 min-w-[250px] relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-600 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Tìm khóa học..."
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all shadow-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="published">Đã xuất bản</option>
                                        <option value="draft">Bản nháp</option>
                                    </select>

                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                                    >
                                        <option value="newest">Mới nhất</option>
                                        <option value="name_asc">Tên A-Z</option>
                                        <option value="students_desc">Học viên nhiều nhất</option>
                                        <option value="rating_desc">Đánh giá cao nhất</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Khóa học</th>
                                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Học viên</th>
                                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginatedCourses.length > 0 ? paginatedCourses.map((course) => (
                                        <tr key={course.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 shadow-sm">
                                                        <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-1">{course.title}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{String(course.categoryId ?? 'Khác')}</span>
                                                            <span className="text-amber-500 text-xs font-bold flex items-center gap-0.5">
                                                                <Activity size={12} />
                                                                {course.rating || 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-tighter ${
                                                    course.published
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {course.published ? 'Đã xuất bản' : 'Bản nháp'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                    <div className="p-1.5 bg-blue-50 rounded-lg">
                                                        <Users size={14} className="text-blue-500" />
                                                    </div>
                                                    {studentCounts[String(course.id)] || 0}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/course/${course.id}`); }}
                                                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                        title="Xem trang web"
                                                    >
                                                        <ExternalLink size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/teacher/content-editor/${course.id}`); }}
                                                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                        title="Quản lý bài giảng"
                                                    >
                                                        <BookOpen size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/teacher/edit-course/${course.id}`); }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setCourseToDelete(course); }}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-16 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                                                        <BookOpen size={40} />
                                                    </div>
                                                    <p className="text-gray-500 font-bold text-lg">Bạn chưa tạo khóa học nào</p>
                                                    <button
                                                        onClick={() => navigate('/teacher/create-course')}
                                                        className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all"
                                                    >
                                                        <Plus size={20} />
                                                        Tạo khóa học đầu tiên
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-6 border-t border-gray-50 flex items-center justify-between bg-white">
                                <p className="text-xs font-bold text-gray-400">
                                    Hiển thị {(currentPage - 1) * itemsPerPage + 1}-{Math.min(filteredCourses.length, currentPage * itemsPerPage)} trên {filteredCourses.length} khóa học
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-all"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${
                                                    currentPage === pageNum
                                                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                                                        : 'text-gray-400 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-all"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-6">
                        {/* Recent Activity */}
                        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Zap size={20} className="text-amber-500" />
                                    Hoạt động gần đây
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {loadingAnalytics ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <div className="animate-pulse flex justify-center mb-2">
                                            <Zap size={24} className="text-amber-400" />
                                        </div>
                                        <p className="text-sm">Đang tải hoạt động...</p>
                                    </div>
                                ) : recentActivities.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <p className="text-sm">Chưa có hoạt động gần đây</p>
                                    </div>
                                ) : (
                                    recentActivities.map((activity) => (
                                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                            <div className={`p-2 rounded-lg shrink-0 ${
                                                activity.type === 'enrollment' ? 'bg-blue-100' :
                                                activity.type === 'comment' ? 'bg-emerald-100' :
                                                activity.type === 'quiz_completion' ? 'bg-purple-100' :
                                                'bg-gray-100'
                                            }`}>
                                                {activity.type === 'enrollment' ? <Users size={16} className="text-blue-600" /> :
                                                 activity.type === 'comment' ? <MessageSquare size={16} className="text-emerald-600" /> :
                                                 activity.type === 'quiz_completion' ? <Award size={16} className="text-purple-600" /> :
                                                 <Activity size={16} className="text-gray-600" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{activity.title}</p>
                                                <p className="text-xs text-gray-500">{activity.description}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {new Date(activity.timestamp).toLocaleDateString('vi-VN', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit',
                                                        day: '2-digit',
                                                        month: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Truy cập nhanh</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => navigate('/teacher/quizzes')}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                                >
                                    <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100 transition-colors">
                                        <FileText size={18} className="text-rose-500" />
                                    </div>
                                    <span className="font-bold text-gray-700 flex-1 text-left">Quản lý đề thi</span>
                                    <ChevronRightIcon size={16} className="text-gray-400" />
                                </button>
                                <button
                                    onClick={() => navigate('/teacher/students')}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                                >
                                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                        <Users size={18} className="text-blue-500" />
                                    </div>
                                    <span className="font-bold text-gray-700 flex-1 text-left">Quản lý học viên</span>
                                    <ChevronRightIcon size={16} className="text-gray-400" />
                                </button>
                                <button
                                    onClick={() => navigate('/teacher/chats')}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                                >
                                    <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                                        <MessageSquare size={18} className="text-emerald-500" />
                                    </div>
                                    <span className="font-bold text-gray-700 flex-1 text-left">Quản lý chat</span>
                                    <ChevronRightIcon size={16} className="text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Xóa Khóa Học */}
            {courseToDelete && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div
                        className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="relative p-8 text-center">
                            <button
                                type="button"
                                onClick={() => setCourseToDelete(null)}
                                className="absolute right-6 top-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
                            >
                                <X size={20} />
                            </button>

                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-100/50">
                                <AlertCircle size={40} strokeWidth={2.5} />
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 mb-2">Xác nhận xóa?</h3>
                            <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                                Bạn có chắc chắn muốn xóa khóa học <br />
                                <span className="text-rose-600 font-bold">"{courseToDelete.title}"</span>? <br />
                                Hành động này không thể hoàn tác và toàn bộ nội dung liên quan sẽ bị gỡ bỏ.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setCourseToDelete(null)}
                                    className="py-4 rounded-[24px] text-sm font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className={`py-4 rounded-[24px] text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${isDeleting
                                        ? 'bg-gray-200 cursor-not-allowed'
                                        : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200 hover:shadow-rose-300'
                                        }`}
                                >
                                    {isDeleting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Trash2 size={18} />
                                            <span>Xóa ngay</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
