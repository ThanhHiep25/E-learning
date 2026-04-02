import React, { useEffect, useMemo, useState } from 'react';
import {
    Search, Filter, Mail,
    MoreVertical, Download, CheckCircle2,
    Clock, AlertCircle, GraduationCap,
    ChevronRight, ChevronLeft, BarChart2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService, type BackendCourseEnrollment, type BackendTeacherCourse } from '../../services/teacher.service';

const StudentManagement: React.FC = () => {
    useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [sortBy, setBySort] = useState<'recent' | 'name_asc' | 'name_desc' | 'progress_desc' | 'progress_asc'>('recent');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [courses, setCourses] = useState<BackendTeacherCourse[]>([]);
    const [enrollments, setEnrollments] = useState<BackendCourseEnrollment[]>([]);

    useEffect(() => {
        const loadCourses = async () => {
            try {
                const myCourses = await teacherService.listMyCourses();
                setCourses(myCourses);
            } finally {
            }
        };

        loadCourses();
    }, []);

    useEffect(() => {
        const loadEnrollments = async () => {
            try {
                if (selectedCourseId === 'all') {
                    const all = await Promise.all(
                        courses.map(async (c) => {
                            return teacherService.getCourseEnrollments(String(c.id));
                        }),
                    );
                    setEnrollments(all.flat());
                    return;
                }

                const list = await teacherService.getCourseEnrollments(selectedCourseId);
                setEnrollments(list);
            } finally {
            }
        };

        if (courses.length === 0) {
            setEnrollments([]);
            return;
        }

        loadEnrollments();
    }, [courses, selectedCourseId]);

    // Reset current page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCourseId, statusFilter, sortBy]);

    const teacherCourses = useMemo(() => courses, [courses]);

    const filteredStudents = useMemo(() => {
        return enrollments
            .map((en) => {
                const name = en.User?.name || en.User?.username || 'Học viên';
                const email = en.User?.email || '';
                const progress = Number(en.progressPercent ?? 0);
                const status = progress >= 100 ? 'completed' : 'active';
                return {
                    id: String(en.id),
                    name,
                    email,
                    courseId: String(en.courseId),
                    progress,
                    lastActive: '-',
                    joiningDate: en.enrolledAt ? new Date(en.enrolledAt).toLocaleDateString('vi-VN') : '-',
                    originalEnrolledAt: en.enrolledAt ? new Date(en.enrolledAt).getTime() : 0,
                    status,
                };
            })
            .filter(student => {
                const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student.email.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCourse = selectedCourseId === 'all' || student.courseId === selectedCourseId;
                const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
                return matchesSearch && matchesCourse && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === 'recent') return b.originalEnrolledAt - a.originalEnrolledAt;
                if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
                if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
                if (sortBy === 'progress_desc') return b.progress - a.progress;
                if (sortBy === 'progress_asc') return a.progress - b.progress;
                return 0;
            });
    }, [enrollments, searchTerm, selectedCourseId, statusFilter, sortBy]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStudents.slice(start, start + itemsPerPage);
    }, [filteredStudents, currentPage]);

    const getCourseTitle = (id: string) => courses.find(c => String(c.id) === id)?.title || 'Khóa học không xác định';

    const stats = useMemo(() => {
        const total = filteredStudents.length;
        const completed = filteredStudents.filter(s => s.progress >= 100).length;
        const avgProgress = total > 0
            ? Math.round((filteredStudents.reduce((acc, s) => acc + (s.progress || 0), 0) / total) * 10) / 10
            : 0;

        return { total, completed, avgProgress };
    }, [filteredStudents]);

    return (
        <div className="w-full pb-20 px-2 lg:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            Quản lý Học viên.
                        </h1>
                        <p className="text-gray-500 mt-4 font-medium text-lg leading-relaxed max-w-lg">
                            Theo dõi tiến độ, tương tác và quản lý danh sách học viên trong các khóa học của bạn.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 bg-white text-gray-900 border border-gray-100 px-6 py-4 rounded-2xl font-bold hover:shadow-xl transition-all shadow-sm cursor-pointer active:scale-95">
                            <Download size={18} />
                            XUẤT BÁO CÁO
                        </button>
                    </div>
                </div>


                {/* Dashboard Stats (Student Specific) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 text-blue-500/5 group-hover:scale-110 transition-transform duration-1000">
                            <GraduationCap size={160} />
                        </div>
                        <p className="text-sm font-bold text-gray-400 mb-2">Đang học</p>
                        <h3 className="text-2xl font-bold text-gray-900 ">{stats.total}</h3>
                        <p className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center gap-1">
                            <ChevronRight size={10} className="rotate-270" /> +12% so với tháng trước
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 text-emerald-500/5 group-hover:scale-110 transition-transform duration-1000">
                            <CheckCircle2 size={160} />
                        </div>
                        <p className="text-sm font-bold text-gray-400 mb-2">Hoàn thành khóa học</p>
                        <h3 className="text-2xl font-bold text-gray-900 ">{stats.completed}</h3>
                        <p className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center gap-1">
                            Tăng trưởng ổn định
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 text-amber-500/5 group-hover:scale-110 transition-transform duration-1000">
                            <BarChart2 size={160} />
                        </div>
                        <p className="text-sm font-bold text-gray-400 mb-2">Tỉ lệ tương tác</p>
                        <h3 className="text-2xl font-bold text-gray-900 ">{stats.avgProgress}%</h3>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                            <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, Math.max(0, stats.avgProgress))}%` }}></div>
                        </div>
                    </div>
                </div>


                {/* Filters Row */}
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-[32px] border border-white mb-10 shadow-2xl shadow-gray-200/20 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm học viên..."
                            className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-16 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                <Filter size={14} /> Khóa học:
                            </div>
                            <select
                                className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm cursor-pointer min-w-[180px]"
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                            >
                                <option value="all">Tất cả khóa học</option>
                                {teacherCourses.map(course => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                Trạng thái:
                            </div>
                            <select
                                className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm cursor-pointer min-w-[140px]"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="all">Tất cả</option>
                                <option value="active">Đang học</option>
                                <option value="completed">Đã xong</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                Sắp xếp:
                            </div>
                            <select
                                className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm cursor-pointer min-w-[160px]"
                                value={sortBy}
                                onChange={(e) => setBySort(e.target.value as any)}
                            >
                                <option value="recent">Mới nhất</option>
                                <option value="name_asc">Tên: A → Z</option>
                                <option value="name_desc">Tên: Z → A</option>
                                <option value="progress_desc">Tiến độ: Cao nhất</option>
                                <option value="progress_asc">Tiến độ: Thấp nhất</option>
                            </select>
                        </div>
                    </div>
                </div>


                {/* Students Table */}
                <div className="bg-white rounded-[48px] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 ">Danh sách Học viên</h2>
                        <div className="text-xs font-bold text-gray-400">Hiển thị {filteredStudents.length} kết quả</div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-10 py-6 text-sm font-bold text-gray-400">Học viên</th>
                                    <th className="px-8 py-6 text-sm font-bold text-gray-400">Khóa học</th>
                                    <th className="px-8 py-6 text-sm font-bold text-gray-400">Tiến độ</th>
                                    <th className="px-8 py-6 text-sm font-bold text-gray-400">Hoạt động cuối</th>
                                    <th className="px-8 py-6 text-sm font-bold text-gray-400 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedStudents.length > 0 ? paginatedStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-blue-50/30 transition-all group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name)}`}
                                                    alt={student.name}
                                                    className="w-10 h-10 rounded-full object-cover shadow-sm"
                                                />
                                                <div>
                                                    <h4 className="text-base font-bold text-gray-900 tracking-tight">{student.name}</h4>
                                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mt-1">
                                                        <Mail size={12} />
                                                        {student.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-2 max-w-[200px]">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
                                                <span className="text-sm font-bold text-gray-700 truncate">{getCourseTitle(student.courseId)}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
                                                    <span>{student.progress}%</span>
                                                    <span>{student.status === 'completed' ? 'Xong' : 'Học'}</span>
                                                </div>
                                                <div className="w-40 bg-gray-100 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${student.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${student.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-gray-300" />
                                                <span className="text-sm font-bold text-gray-500">{student.lastActive}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-3 cursor-pointer bg-white text-gray-400 hover:text-blue-600 hover:shadow-xl rounded-xl transition-all border border-gray-50">
                                                    <Mail size={18} />
                                                </button>
                                                <button className="p-3 cursor-pointer bg-white text-gray-400 hover:text-amber-600 hover:shadow-xl rounded-xl transition-all border border-gray-50">
                                                    <BarChart2 size={18} />
                                                </button>
                                                <button className="p-3 cursor-pointer bg-white text-gray-300 hover:text-gray-600 rounded-xl transition-all">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-24 text-center">
                                            <AlertCircle size={48} className="mx-auto text-gray-200 mb-4" />
                                            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Không tìm thấy học viên nào trong điều kiện lọc này.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 0 && (
                        <div className="p-8 border-t border-gray-50 flex items-center justify-between bg-white">
                            <p className="text-xs font-bold text-gray-400">
                                Hiển thị {Math.min(filteredStudents.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredStudents.length, currentPage * itemsPerPage)} trên {filteredStudents.length} học viên
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
        </div>
    );
};

export default StudentManagement;
