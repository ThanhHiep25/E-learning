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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { teacherService, type BackendTeacherCourse } from '../../services/teacher.service';

const TeacherCourses: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<BackendTeacherCourse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                const myCourses = await teacherService.listMyCourses();
                setCourses(myCourses);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Không thể tải danh sách khóa học');
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return courses;
        return courses.filter((c) => String(c.title || '').toLowerCase().includes(q));
    }, [courses, query]);

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
                    <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900">Danh sách khóa học</h2>
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

                    {isLoading ? (
                        <div className="p-10 text-center">
                            <p className="text-sm font-bold text-gray-500">Đang tải...</p>
                        </div>
                    ) : (
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
                                    {filtered.length > 0 ? (
                                        filtered.map((course) => (
                                            <tr key={course.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm">
                                                            <img src={'/elearning-1.jpg'} alt={course.title} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-1">{course.title}</h4>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ID: {String(course.id)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
                                                        {course.published ? 'Đã xuất bản' : 'Bản nháp'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                                                        <Users size={14} className="text-blue-500" />
                                                        <span>--</span>
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
                                                            onClick={() => toast.error('Chưa hỗ trợ xóa khóa học')}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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
                </div>
            </div>
        </div>
    );
};

export default TeacherCourses;
