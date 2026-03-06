import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Plus, BookOpen, Clock,
    MoreVertical, Edit3, Trash2, ExternalLink,
    BarChart3, Activity, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService, type BECourse } from '../../api/teacherService';
import toast from 'react-hot-toast';

const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [courses, setCourses] = useState<BECourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await teacherService.getCourses();
                if (response.success && response.data) {
                    setCourses(response.data.courses);
                } else {
                    toast.error(response.message || 'Không thể tải danh sách khóa học');
                }
            } catch (error) {
                console.error(error);
                toast.error('Lỗi kết nối máy chủ');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const handleDeleteCourse = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
            try {
                const response = await teacherService.deleteCourse(id);
                if (response.success) {
                    toast.success('Đã xóa khóa học');
                    setCourses(courses.filter(c => c.id !== id));
                } else {
                    toast.error(response.message || 'Không thể xóa khóa học');
                }
            } catch (error) {
                toast.error('Lỗi khi xóa khóa học');
            }
        }
    };

    const stats = useMemo(() => [
        { label: 'Tổng số khóa học', value: courses.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Tổng số sinh viên', value: '1,250', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Đánh giá trung bình', value: '4.8', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Giờ giảng dạy', value: '128+', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    ], [courses]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <GraduationCap size={32} className="text-amber-500" />
                            Bảng điều khiển Giảng viên
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">Chào mừng quay trở lại, {(user as any)?.name || user?.fullName || 'Giảng viên'}!</p>
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
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Khóa học của tôi</h2>
                        <button className="text-sm font-bold text-amber-600 hover:underline">Xem tất cả</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Khóa học</th>
                                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Sinh viên</th>
                                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Đánh giá</th>
                                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {courses.length > 0 ? courses.map((course) => (
                                    <tr key={course.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm">
                                                    <img src={'/elearning-1.jpg'} alt={course.title} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-1">{course.title}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{course.categoryId ? `ID: ${course.categoryId}` : 'Chưa phân loại'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${course.published ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {course.published ? 'Đang hoạt động' : 'Bản nháp'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                                                <Users size={14} className="text-blue-500" />
                                                {'0'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-amber-500">
                                                <Activity size={14} />
                                                {'0'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/course/${course.id}`)}
                                                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                                    title="Xem trang web"
                                                >
                                                    <ExternalLink size={18} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/teacher/content-editor/${course.id}`)}
                                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                    title="Quản lý bài giảng"
                                                >
                                                    <BookOpen size={18} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/teacher/edit-course/${course.id}`)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCourse(course.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <button className="p-2 text-gray-300 hover:text-gray-600 rounded-xl transition-all">
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
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
