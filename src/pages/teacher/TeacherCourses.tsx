import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    BookOpen,
    Edit3,
    ExternalLink,
    Users,
    Trash2,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { teacherService, type BackendTeacherCourse } from '../../services/teacher.service';

const TeacherCourses: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<BackendTeacherCourse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [levelFilter, setLevelFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc'>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [courseToDelete, setCourseToDelete] = useState<BackendTeacherCourse | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                const myCourses = await teacherService.listMyCourses();
                setCourses(myCourses);

                // Fetch student counts
                const pairs = await Promise.all(
                    (myCourses || []).map(async (c) => {
                        try {
                            const enrollments = await teacherService.getCourseEnrollments(String(c.id));
                            return [String(c.id), enrollments.length] as const;
                        } catch {
                            return [String(c.id), 0] as const;
                        }
                    }),
                );
                setStudentCounts(Object.fromEntries(pairs));
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Không thể tải danh sách khóa học');
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, []);

    // Reset current page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [query, statusFilter, levelFilter, sortBy]);

    const filtered = useMemo(() => {
        let result = [...courses];

        // Search Query
        const q = query.trim().toLowerCase();
        if (q) {
            result = result.filter((c) => String(c.title || '').toLowerCase().includes(q));
        }

        // Status Filter
        if (statusFilter !== 'all') {
            const isPublished = statusFilter === 'published';
            result = result.filter(c => !!c.published === isPublished);
        }

        // Level Filter
        if (levelFilter !== 'all') {
            result = result.filter(c => c.level === levelFilter);
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            if (sortBy === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            if (sortBy === 'name_asc') return (a.title || '').localeCompare(b.title || '');
            if (sortBy === 'name_desc') return (b.title || '').localeCompare(a.title || '');
            return 0;
        });

        return result;
    }, [courses, query, statusFilter, levelFilter, sortBy]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedCourses = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage]);

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

    return (
        <div className="w-full">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">Quản lý Khóa học</h1>
                        <p className="text-gray-500 font-medium mt-1">Tạo, chỉnh sửa và quản lý nội dung khóa học của bạn</p>
                    </div>
                    <button
                        onClick={() => navigate('/teacher/create-course')}
                        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer"
                    >
                        <Plus size={20} />
                        TẠO KHÓA HỌC
                    </button>
                </div>

                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-gray-50 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Danh sách khóa học</h2>
                                    <p className="text-xs text-gray-500 font-bold">{filtered.length} khóa học</p>
                                </div>
                            </div>

                            <div className="w-full md:w-96 relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                                    <Search size={18} />
                                </div>
                                <input
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-medium text-sm"
                                    placeholder="Tìm theo tên khóa học..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Filter Controls */}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Trạng thái:</span>
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

                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Cấp độ:</span>
                                <select
                                    value={levelFilter}
                                    onChange={(e) => setLevelFilter(e.target.value)}
                                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                                >
                                    <option value="all">Tất cả cấp độ</option>
                                    <option value="Mọi cấp độ">Mọi cấp độ</option>
                                    <option value="Cơ bản">Cơ bản</option>
                                    <option value="Trung cấp">Trung cấp</option>
                                    <option value="Nâng cao">Nâng cao</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Sắp xếp:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                                >
                                    <option value="newest">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                    <option value="name_asc">Tên: A → Z</option>
                                    <option value="name_desc">Tên: Z → A</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-10 text-center">
                            <p className="text-sm font-bold text-gray-500">Đang tải...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold text-gray-400 ">Khóa học</th>
                                        <th className="px-8 py-4 text-xs font-bold text-gray-400 ">Cấp độ</th>
                                        <th className="px-8 py-4 text-xs font-bold text-gray-400 ">Trạng thái</th>
                                        <th className="px-8 py-4 text-xs font-bold text-gray-400 ">Học viên</th>
                                        <th className="px-8 py-4 text-xs font-bold text-gray-400 ">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginatedCourses.length > 0 ? (
                                        paginatedCourses.map((course) => (
                                            <tr key={course.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm">
                                                            <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-1">{course.title}</h4>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ID: {String(course.id)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-full ">
                                                        {course.level}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-full ">
                                                        {course.published ? 'Đã xuất bản' : 'Bản nháp'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                                                        <Users size={14} className="text-blue-500" />
                                                        <span>{studentCounts[String(course.id)] || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/course/${course.id}`); }}
                                                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all cursor-pointer relative z-10"
                                                            title="Xem trang web"
                                                        >
                                                            <ExternalLink size={18} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/teacher/content-editor/${course.id}`); }}
                                                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer relative z-10"
                                                            title="Quản lý bài giảng"
                                                        >
                                                            <BookOpen size={18} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/teacher/edit-course/${course.id}`); }}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer relative z-10"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit3 size={18} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setCourseToDelete(course); }}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer relative z-10"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-16 text-center">
                                                <p className="text-sm font-bold text-gray-500">Không có khóa học nào</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!isLoading && totalPages > 1 && (
                        <div className="p-8 border-t border-gray-50 flex items-center justify-between bg-white">
                            <p className="text-xs font-bold text-gray-400">
                                Hiển thị {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, currentPage * itemsPerPage)} trên {filtered.length} khóa học
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
                                    onClick={() => setCourseToDelete(null)}
                                    className="py-4 rounded-[24px] text-sm font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    Hủy bỏ
                                </button>
                                <button
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

export default TeacherCourses;
