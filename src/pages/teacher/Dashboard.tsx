import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Plus, BookOpen, Clock,
    MoreVertical, Edit3, Trash2, ExternalLink,
    BarChart3, Activity, GraduationCap,
    Search, Filter,
    ChevronLeft, ChevronRight,
    AlertCircle, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { teacherService, type BackendTeacherCourse } from '../../services/teacher.service';

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

    useEffect(() => {
        const load = async () => {
            const myCourses = await teacherService.listMyCourses();
            setCourses(myCourses);

            const pairs = await Promise.all(
                (myCourses || []).map(async (c) => {
                    const enrollments = await teacherService.getCourseEnrollments(String(c.id));
                    return [String(c.id), enrollments.length] as const;
                }),
            );

            setStudentCounts(Object.fromEntries(pairs));
        };

        load();
    }, []);

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

    const stats = [
        { label: 'Tổng số khóa học', value: courses.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Tổng số sinh viên', value: courses.reduce((acc, c) => acc + (studentCounts[String(c.id)] || 0), 0).toLocaleString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
            bg: 'bg-amber-50'
        },
        { label: 'Giờ giảng dạy', value: '128+', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
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
                    <button
                        onClick={() => navigate('/teacher/create-course')}
                        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer"
                    >
                        <Plus size={20} />
                        TẠO KHÓA HỌC MỚI
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                                    <stat.icon size={24} />
                                </div>
                                <BarChart3 size={20} className="text-gray-200" />
                            </div>
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Courses Table/List */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Khóa học của tôi</h2>
                            <button
                                onClick={() => navigate('/teacher/courses')}
                                className="text-sm font-bold text-amber-600 hover:underline cursor-pointer"
                            >
                                Xem tất cả
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
                                <div className="text-[10px] font-bold text-gray-400 px-1 flex items-center gap-1">
                                    <Filter size={12} /> Trạng thái:
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="published">Đã xuất bản</option>
                                    <option value="draft">Bản nháp</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-[10px] font-bold text-gray-400 px-1">
                                    Sắp xếp:
                                </div>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                                >
                                    <option value="newest">Mới nhất</option>
                                    <option value="name_asc">Tên (A-Z)</option>
                                    <option value="students_desc">Học viên đông nhất</option>
                                    <option value="rating_desc">Đánh giá cao nhất</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-xs font-bold text-gray-400">Khóa học</th>
                                    <th className="px-8 py-4 text-xs font-bold text-gray-400">Trạng thái</th>
                                    <th className="px-8 py-4 text-xs font-bold text-gray-400">Sinh viên</th>
                                    <th className="px-8 py-4 text-xs font-bold text-gray-400">Đánh giá</th>
                                    <th className="px-8 py-4 text-xs font-bold text-gray-400 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedCourses.length > 0 ? paginatedCourses.map((course) => (
                                    <tr key={course.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm">
                                                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-1">{course.title}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{String(course.categoryId ?? 'Khác')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                                                {course.published ? 'Đã xuất bản' : 'Bản nháp'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                                                <Users size={14} className="text-blue-500" />
                                                {studentCounts[String(course.id)] || 0}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-amber-500">
                                                <Activity size={14} />
                                                {course.rating || 0}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/course/${course.id}`); }}
                                                    className="cursor-pointer p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all relative z-10"
                                                    title="Xem trang web"
                                                >
                                                    <ExternalLink size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/teacher/content-editor/${course.id}`); }}
                                                    className="cursor-pointer p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all relative z-10"
                                                    title="Quản lý bài giảng"
                                                >
                                                    <BookOpen size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/teacher/edit-course/${course.id}`); }}
                                                    className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative z-10"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setCourseToDelete(course); }}
                                                    className="cursor-pointer p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all relative z-10"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="cursor-pointer p-2 text-gray-300 hover:text-gray-600 rounded-xl transition-all relative z-10"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                                    <BookOpen size={32} />
                                                </div>
                                                <p className="text-gray-500 font-bold">Bạn chưa tạo khóa học nào.</p>
                                                <button
                                                    onClick={() => navigate('/teacher/create-course')}
                                                    className="text-amber-600 font-bold hover:underline"
                                                >
                                                    Tạo khóa học đầu tiên ngay
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
                        <div className="p-8 border-t border-gray-50 flex items-center justify-between bg-white">
                            <p className="text-xs font-bold text-gray-400 ">
                                Hiển thị {Math.min(filteredCourses.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredCourses.length, currentPage * itemsPerPage)} trên {filteredCourses.length} khóa học
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${currentPage === i + 1
                                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                                                : 'text-gray-400 hover:bg-gray-50'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
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
