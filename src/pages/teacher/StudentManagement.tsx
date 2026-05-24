import React, { useEffect, useMemo, useState } from 'react';
import {
    Search, Filter, Mail, Download, CheckCircle2,
    Clock, AlertCircle, ChevronRight, ChevronLeft,
    BarChart2, Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService, type BackendCourseEnrollment, type BackendTeacherCourse } from '../../services/teacher.service';
import toast from 'react-hot-toast';

interface Student {
    id: string;
    name: string;
    email: string;
    courseId: string;
    courseName: string;
    progress: number;
    status: 'active' | 'completed' | 'inactive';
    joinedAt: string;
    lastActive: string;
    avatar: string;
}

const StudentManagement: React.FC = () => {
    useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'inactive'>('all');
    const [sortBy, setSortBy] = useState<'recent' | 'name_asc' | 'name_desc' | 'progress_desc' | 'progress_asc'>('recent');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const itemsPerPage = 12;

    const [courses, setCourses] = useState<BackendTeacherCourse[]>([]);
    const [enrollments, setEnrollments] = useState<BackendCourseEnrollment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const myCourses = await teacherService.listMyCourses();
                setCourses(myCourses);

                if (myCourses.length > 0) {
                    const allEnrollments = await Promise.all(
                        myCourses.map(async (c) => {
                            return teacherService.getCourseEnrollments(String(c.id));
                        }),
                    );
                    setEnrollments(allEnrollments.flat());
                }
            } catch (error) {
                console.error('Failed to load data:', error);
                toast.error('Không thể tải dữ liệu học viên');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        const loadEnrollments = async () => {
            if (courses.length === 0) return;
            
            try {
                if (selectedCourseId === 'all') {
                    const all = await Promise.all(
                        courses.map(async (c) => {
                            return teacherService.getCourseEnrollments(String(c.id));
                        }),
                    );
                    setEnrollments(all.flat());
                } else {
                    const list = await teacherService.getCourseEnrollments(selectedCourseId);
                    setEnrollments(list);
                }
            } catch (error) {
                console.error('Failed to load enrollments:', error);
            }
        };

        loadEnrollments();
    }, [courses, selectedCourseId]);

    // Reset current page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCourseId, statusFilter, sortBy]);

    const students: Student[] = useMemo(() => {
        return enrollments.map((en) => {
            const name = en.User?.name || en.User?.username || 'Học viên';
            const email = en.User?.email || '';
            const progress = Number(en.progressPercent ?? 0);
            const status: 'active' | 'completed' | 'inactive' = progress >= 100 ? 'completed' : progress > 0 ? 'active' : 'inactive';
            const course = courses.find(c => String(c.id) === String(en.courseId));
            
            return {
                id: String(en.id),
                name,
                email,
                courseId: String(en.courseId),
                courseName: course?.title || 'Khóa học không xác định',
                progress,
                status,
                joinedAt: en.enrolledAt ? new Date(en.enrolledAt).toLocaleDateString('vi-VN') : '-',
                lastActive: '-',
                avatar: '/default-avatar.png',
            };
        });
    }, [enrollments, courses]);

    const filteredStudents = useMemo(() => {
        return students
            .filter(student => {
                const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student.courseName.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCourse = selectedCourseId === 'all' || student.courseId === selectedCourseId;
                const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
                return matchesSearch && matchesCourse && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === 'recent') return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
                if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
                if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
                if (sortBy === 'progress_desc') return b.progress - a.progress;
                if (sortBy === 'progress_asc') return a.progress - b.progress;
                return 0;
            });
    }, [students, searchTerm, selectedCourseId, statusFilter, sortBy]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStudents.slice(start, start + itemsPerPage);
    }, [filteredStudents, currentPage]);

    const stats = useMemo(() => {
        // Group by user email to count unique users (a student may enroll in multiple courses)
        const userMap = new Map<string, { status: 'active' | 'completed' | 'inactive'; progress: number }>();
        students.forEach((s) => {
            const existing = userMap.get(s.email);
            // Higher priority: completed > active > inactive
            const statusPriority = { completed: 3, active: 2, inactive: 1 };
            const currentPriority = statusPriority[s.status];
            if (!existing || currentPriority > statusPriority[existing.status]) {
                userMap.set(s.email, { status: s.status, progress: s.progress });
            }
        });

        const uniqueUsers = Array.from(userMap.values());
        const total = uniqueUsers.length;
        const active = uniqueUsers.filter((u) => u.status === 'active').length;
        const completed = uniqueUsers.filter((u) => u.status === 'completed').length;
        const inactive = uniqueUsers.filter((u) => u.status === 'inactive').length;
        const avgProgress = total > 0
            ? Math.round((uniqueUsers.reduce((acc, u) => acc + u.progress, 0) / total) * 10) / 10
            : 0;

        return { total, active, completed, inactive, avgProgress };
    }, [students]);

    const handleExport = () => {
        const csvContent = [
            ['ID', 'Họ tên', 'Email', 'Khóa học', 'Tiến độ', 'Trạng thái', 'Ngày tham gia'].join(','),
            ...filteredStudents.map(s => [
                s.id, s.name, s.email, s.courseName, `${s.progress}%`, s.status, s.joinedAt
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Đã xuất danh sách học viên');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'active': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'inactive': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Hoàn thành';
            case 'active': return 'Đang học';
            case 'inactive': return 'Chưa bắt đầu';
            default: return status;
        }
    };

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

                    <div className="flex gap-3">
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-gray-200 cursor-pointer active:scale-95"
                        >
                            <Download size={18} />
                            Xuất CSV
                        </button>
                    </div>
                </div>


                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl text-white shadow-lg shadow-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <Users size={20} />
                            </div>
                            <span className="text-blue-100 text-sm font-medium">Tổng học viên</span>
                        </div>
                        <p className="text-3xl font-bold">{stats.total}</p>
                        <p className="text-blue-200 text-xs mt-1">{courses.length} khóa học</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-100 rounded-xl">
                                <CheckCircle2 size={20} className="text-emerald-600" />
                            </div>
                            <span className="text-gray-500 text-sm font-medium">Hoàn thành</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
                        <p className="text-emerald-600 text-xs mt-1 font-medium">
                            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% tổng số
                        </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <Clock size={20} className="text-blue-600" />
                            </div>
                            <span className="text-gray-500 text-sm font-medium">Đang học</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                        <p className="text-blue-600 text-xs mt-1 font-medium">
                            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% tổng số
                        </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-amber-100 rounded-xl">
                                <BarChart2 size={20} className="text-amber-600" />
                            </div>
                            <span className="text-gray-500 text-sm font-medium">Tiến độ TB</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.avgProgress}%</p>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats.avgProgress}%` }}></div>
                        </div>
                    </div>
                </div>


                {/* Filters Bar - Improved Layout */}
                <div className="bg-white p-5 rounded-3xl border border-gray-100 mb-8 shadow-sm">
                    {/* Row 1: Search */}
                    <div className="mb-4">
                        <div className="relative max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên, email hoặc tên khóa học..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {/* Row 2: Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Filter size={14} />
                            <span>Lọc theo:</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                            <select
                                className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer min-w-[160px]"
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                            >
                                <option value="all">Tất cả khóa học</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </select>

                            <select
                                className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer min-w-[140px]"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="active">Đang học</option>
                                <option value="completed">Hoàn thành</option>
                                <option value="inactive">Chưa bắt đầu</option>
                            </select>

                            <select
                                className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer min-w-[140px]"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                            >
                                <option value="recent">Mới nhất</option>
                                <option value="name_asc">Tên A-Z</option>
                                <option value="name_desc">Tên Z-A</option>
                                <option value="progress_desc">Tiến độ cao nhất</option>
                                <option value="progress_asc">Tiến độ thấp nhất</option>
                            </select>
                        </div>
                    </div>
                </div>


                {/* Students Table */}
                <div className="bg-white rounded-[48px] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Danh sách Học viên</h2>
                        <div className="text-xs font-bold text-gray-400">
                            {loading ? 'Đang tải...' : `Hiển thị ${filteredStudents.length} kết quả`}
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-amber-500 rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-400">Đang tải danh sách học viên...</p>
                        </div>
                    ) : (
                    <div className="min-w-full">
                        <table className="w-full text-left table-fixed">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="w-[28%] px-6 py-4 text-sm font-bold text-gray-400">Học viên</th>
                                    <th className="w-[25%] px-6 py-4 text-sm font-bold text-gray-400">Khóa học</th>
                                    <th className="w-[20%] px-6 py-4 text-sm font-bold text-gray-400">Tiến độ</th>
                                    <th className="w-[17%] px-6 py-4 text-sm font-bold text-gray-400">Tham gia</th>
                                    <th className="w-[10%] px-6 py-4 text-sm font-bold text-gray-400 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedStudents.length > 0 ? paginatedStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-blue-50/30 transition-all group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={student.avatar || '/default-avatar.png'}
                                                    alt={student.name}
                                                    className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-bold text-gray-900 truncate">{student.name}</h4>
                                                    <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                                                        <Mail size={10} />
                                                        <span className="truncate">{student.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
                                                <span className="text-sm text-gray-700 truncate">{student.courseName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-gray-700">{student.progress}%</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(student.status)}`}>
                                                        {getStatusLabel(student.status)}
                                                    </span>
                                                </div>
                                                <div className="w-full max-w-[140px] bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            student.progress === 100 ? 'bg-emerald-500' : 
                                                            student.progress > 50 ? 'bg-blue-500' : 
                                                            student.progress > 0 ? 'bg-amber-500' : 'bg-gray-300'
                                                        }`}
                                                        style={{ width: `${student.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Clock size={12} className="text-gray-400" />
                                                    <span>{student.joinedAt}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-400">ID: {student.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button 
                                                    onClick={() => window.open(`mailto:${student.email}`)}
                                                    className="p-2 bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-lg transition-all"
                                                    title="Gửi email"
                                                >
                                                    <Mail size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedStudent(student)}
                                                    className="p-2 bg-white text-gray-400 hover:text-amber-600 hover:bg-amber-50 border border-gray-200 rounded-lg transition-all"
                                                    title="Xem chi tiết"
                                                >
                                                    <BarChart2 size={14} />
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
                    )}

                    {/* Pagination - Compact with limited page numbers */}
                    {!loading && totalPages > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
                            <p className="text-xs text-gray-500">
                                Trang {currentPage}/{totalPages} • {filteredStudents.length} học viên
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-medium"
                                >
                                    Đầu
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {/* Page numbers - show limited range */}
                                <div className="flex items-center gap-1">
                                    {(() => {
                                        const pages = [];
                                        const maxVisible = 5;
                                        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                                        let end = Math.min(totalPages, start + maxVisible - 1);
                                        
                                        if (end - start + 1 < maxVisible) {
                                            start = Math.max(1, end - maxVisible + 1);
                                        }

                                        if (start > 1) {
                                            pages.push(
                                                <button key="1" onClick={() => setCurrentPage(1)} className="w-8 h-8 rounded-lg font-medium text-xs text-gray-500 hover:bg-gray-50 transition-all">1</button>
                                            );
                                            if (start > 2) {
                                                pages.push(<span key="dots1" className="px-1 text-gray-400">...</span>);
                                            }
                                        }

                                        for (let i = start; i <= end; i++) {
                                            pages.push(
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i)}
                                                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                                                        currentPage === i
                                                            ? 'bg-amber-500 text-white shadow-md'
                                                            : 'text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {i}
                                                </button>
                                            );
                                        }

                                        if (end < totalPages) {
                                            if (end < totalPages - 1) {
                                                pages.push(<span key="dots2" className="px-1 text-gray-400">...</span>);
                                            }
                                            pages.push(
                                                <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className="w-8 h-8 rounded-lg font-medium text-xs text-gray-500 hover:bg-gray-50 transition-all">{totalPages}</button>
                                            );
                                        }

                                        return pages;
                                    })()}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-medium"
                                >
                                    Cuối
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-16 h-16 rounded-2xl" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
                                <p className="text-gray-500 text-sm">{selectedStudent.email}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between py-3 border-b border-gray-100">
                                <span className="text-gray-500">Khóa học</span>
                                <span className="font-bold text-gray-900 text-right">{selectedStudent.courseName}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-gray-100">
                                <span className="text-gray-500">Tiến độ</span>
                                <span className="font-bold text-gray-900">{selectedStudent.progress}%</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-gray-100">
                                <span className="text-gray-500">Trạng thái</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedStudent.status)}`}>
                                    {getStatusLabel(selectedStudent.status)}
                                </span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-gray-100">
                                <span className="text-gray-500">Ngày tham gia</span>
                                <span className="font-bold text-gray-900">{selectedStudent.joinedAt}</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => window.open(`mailto:${selectedStudent.email}`)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all"
                            >
                                <Mail size={18} />
                                Gửi email
                            </button>
                            <button 
                                onClick={() => setSelectedStudent(null)}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManagement;
