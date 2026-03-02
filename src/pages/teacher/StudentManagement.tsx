import React, { useState, useMemo } from 'react';
import {
    Users, Search, Filter, Mail,
    MoreVertical, Download, CheckCircle2,
    Clock, AlertCircle, GraduationCap,
    ChevronRight, BarChart2
} from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { useAuth } from '../../context/AuthContext';

const StudentManagement: React.FC = () => {
    const { courses } = useCourseStore();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('all');

    const teacherCourses = useMemo(() => {
        return courses.filter(c => c.teacher === user?.fullName);
    }, [courses, user]);

    // Mock student data for the demo
    const mockStudents = useMemo(() => [
        { id: 'st1', name: 'Nguyễn Văn Nam', email: 'nam.nv@gmail.com', courseId: '1', progress: 85, lastActive: '10 phút trước', joiningDate: '12/01/2024', status: 'active' },
        { id: 'st2', name: 'Trần Thị Mai', email: 'mai.tt@yahoo.com', courseId: '1', progress: 45, lastActive: '2 giờ trước', joiningDate: '15/01/2024', status: 'active' },
        { id: 'st3', name: 'Lê Hoàng Long', email: 'long.lh@outlook.com', courseId: '3', progress: 100, lastActive: '1 ngày trước', joiningDate: '01/02/2024', status: 'completed' },
        { id: 'st4', name: 'Phạm Minh Đức', email: 'duc.pm@gmail.com', courseId: '4', progress: 12, lastActive: '5 ngày trước', joiningDate: '20/02/2024', status: 'inactive' },
        { id: 'st5', name: 'Hoàng Công Vinh', email: 'vinh.hc@gmail.com', courseId: '1', progress: 65, lastActive: '30 phút trước', joiningDate: '25/01/2024', status: 'active' },
    ], []);

    const filteredStudents = useMemo(() => {
        return mockStudents.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCourse = selectedCourseId === 'all' || student.courseId === selectedCourseId;
            return matchesSearch && matchesCourse;
        });
    }, [mockStudents, searchTerm, selectedCourseId]);

    const getCourseTitle = (id: string) => courses.find(c => c.id === id)?.title || 'Khóa học không xác định';

    return (
        <div className="w-full pb-20 px-2 lg:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full w-fit mb-4 font-bold text-[10px] uppercase tracking-widest border border-blue-200/50">
                            <Users size={12} />
                            <span>Student Insight</span>
                        </div>
                        <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none italic">
                            Quản lý <span className="text-blue-600">Học viên.</span>
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

                {/* Filters Row */}
                <div className="bg-white/60 backdrop-blur-xl p-4 rounded-[32px] border border-white mb-10 shadow-2xl shadow-gray-200/20 flex flex-col lg:flex-row gap-4 items-center">
                    <div className="flex-1 w-full relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc email học viên..."
                            className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-16 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 shrink-0 text-gray-400 font-black text-[10px] uppercase tracking-widest px-2">
                            <Filter size={14} /> Lọc:
                        </div>
                        <select
                            className="flex-1 lg:w-64 bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm appearance-none cursor-pointer"
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                        >
                            <option value="all">Tất cả khóa học</option>
                            {teacherCourses.map(course => (
                                <option key={course.id} value={course.id}>{course.title}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Dashboard Stats (Student Specific) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 text-blue-500/5 group-hover:scale-110 transition-transform duration-1000">
                            <GraduationCap size={160} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Đang học</p>
                        <h3 className="text-4xl font-black text-gray-900 tracking-tighter">1,250</h3>
                        <p className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center gap-1">
                            <ChevronRight size={10} className="rotate-270" /> +12% so với tháng trước
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 text-emerald-500/5 group-hover:scale-110 transition-transform duration-1000">
                            <CheckCircle2 size={160} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Hoàn thành khóa học</p>
                        <h3 className="text-4xl font-black text-gray-900 tracking-tighter">342</h3>
                        <p className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center gap-1">
                            Tăng trưởng ổn định
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 text-amber-500/5 group-hover:scale-110 transition-transform duration-1000">
                            <BarChart2 size={160} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tỉ lệ tương tác</p>
                        <h3 className="text-4xl font-black text-gray-900 tracking-tighter">78%</h3>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                            <div className="bg-amber-500 h-full w-[78%]"></div>
                        </div>
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-[48px] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Danh sách Học viên</h2>
                        <div className="text-xs font-bold text-gray-400">Hiển thị {filteredStudents.length} kết quả</div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Học viên</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Khóa học</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tiến độ</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Hoạt động cuối</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-blue-50/30 transition-all group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg group-hover:rotate-12 transition-transform shadow-xl shadow-slate-200">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-black text-gray-900 tracking-tight">{student.name}</h4>
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
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
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
                                                <button className="p-3 bg-white text-gray-400 hover:text-blue-600 hover:shadow-xl rounded-xl transition-all border border-gray-50">
                                                    <Mail size={18} />
                                                </button>
                                                <button className="p-3 bg-white text-gray-400 hover:text-amber-600 hover:shadow-xl rounded-xl transition-all border border-gray-50">
                                                    <BarChart2 size={18} />
                                                </button>
                                                <button className="p-3 bg-white text-gray-300 hover:text-gray-600 rounded-xl transition-all">
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
                </div>
            </div>
        </div>
    );
};

export default StudentManagement;
