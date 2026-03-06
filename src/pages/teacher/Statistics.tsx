import React, { useState, useEffect } from 'react';
import {
    Users,
    TrendingUp,
    Award,
    BookOpen,
    Target,
    AlertCircle,
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService, type BECourse } from '../../api/teacherService';
import toast from 'react-hot-toast';

// Mock detailed statistics data for the dashboard
// (mock data remains same for charts/insights/students until BE supports them)
const mockStats = {
    overview: [
        { label: 'Học viên hoạt động', value: '1,284', trend: '+12.5%', isPositive: true, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Tỉ lệ hoàn thành', value: '78.2%', trend: '+5.4%', isPositive: true, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Điểm trung bình', value: '8.4', trend: '-2.1%', isPositive: false, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Bài giảng đã xem', value: '15.6k', trend: '+18.2%', isPositive: true, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
    ],
    scoreDistribution: [
        { range: '9-10', count: 120, color: 'bg-emerald-500' },
        { range: '8-9', count: 350, color: 'bg-teal-500' },
        { range: '7-8', count: 420, color: 'bg-blue-500' },
        { range: '5-7', count: 210, color: 'bg-amber-500' },
        { range: '<5', count: 45, color: 'bg-red-500' },
    ],
    topStudents: [
        { id: 1, name: 'Nguyễn Thanh Hiệp', score: 9.8, progress: 100, avatar: 'https://i.pravatar.cc/150?u=1', course: 'Toán học 10' },
        { id: 2, name: 'Trần Minh Quân', score: 9.6, progress: 95, avatar: 'https://i.pravatar.cc/150?u=2', course: 'Lập trình Python' },
        { id: 3, name: 'Lê Thị Hồng', score: 9.5, progress: 98, avatar: 'https://i.pravatar.cc/150?u=3', course: 'Ngữ văn 9' },
        { id: 4, name: 'Phạm Gia Bảo', score: 9.4, progress: 92, avatar: 'https://i.pravatar.cc/150?u=4', course: 'TOEIC 550+' },
        { id: 5, name: 'Hoàng Anh Tuấn', score: 9.2, progress: 100, avatar: 'https://i.pravatar.cc/150?u=5', course: 'Fullstack Web' },
    ],
    insights: [
        {
            title: 'Chương 3 có tỉ lệ rớt cao',
            description: 'Điểm trung bình bài kiểm tra chương 3 giảm 15% so with tháng trước. Cần xem xét lại nội dung video.',
            type: 'warning',
            action: 'Xem bài giảng'
        },
        {
            title: 'Nhu cầu bài tập thực hành tăng',
            description: '80% học viên hoàn thành xong bài giảng nhưng chưa thực hiện bài tập về nhà ngay.',
            type: 'info',
            action: 'Thêm bài tập'
        },
        {
            title: 'Tỉ lệ giữ chân học viên tốt',
            description: 'Học viên quay lại học mỗi ngày tăng 25% sau khi cập nhật giao diện mới.',
            type: 'success',
            action: 'Xem chi tiết'
        }
    ]
};

const TeacherStatistics: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<BECourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await teacherService.getCourses();
                if (response.success && response.data) {
                    setCourses(response.data.courses);
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to fetch courses.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Derived stats from real courses where possible
    const statsOverview = [
        { label: 'Học viên hoạt động', value: '1,284', trend: '+12.5%', isPositive: true, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Tỉ lệ hoàn thành', value: '78.2%', trend: '+5.4%', isPositive: true, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Tổng khóa học', value: courses.length.toString(), trend: '+1', isPositive: true, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Điểm trung bình', value: '8.4', trend: '-2.1%', isPositive: false, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        Thống Kê Chi Tiết
                        <div className="p-2 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-500/20">
                            <TrendingUp size={24} strokeWidth={3} />
                        </div>
                    </h1>
                    <p className="text-gray-500 font-bold mt-2">Phân tích hiệu suất khóa học và học viên của {(user as any)?.name || user?.fullName}</p>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsOverview.map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                        <div className="flex items-start justify-between mb-6">
                            <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl shadow-sm`}>
                                <stat.icon size={28} strokeWidth={2.5} />
                            </div>
                            <div className={`flex items-center cursor-pointer gap-1 text-[11px] font-black px-2.5 py-1.5 rounded-full ${stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {stat.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {stat.trend}
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight group-hover:text-amber-500 transition-colors">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Score Chart (SVG Visualization) */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Phân phối điểm số</h2>
                            <p className="text-sm font-bold text-gray-400 mt-1">Dựa trên kết quả bài kiểm tra gần nhất</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Xuất sắc</span>
                            </div>
                            <div className="flex items-center gap-1.5 ml-4">
                                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Cần cải thiện</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative h-64 flex items-end justify-between gap-4 px-4 pt-10">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between py-1 px-4 pointer-events-none">
                            {[0, 1, 2, 3, 4].map((_, i) => (
                                <div key={i} className="w-full border-t border-gray-50 relative">
                                    <span className="absolute right-full mr-4 -top-2 text-[10px] font-black text-gray-300">{(4 - i) * 100}</span>
                                </div>
                            ))}
                        </div>

                        {/* Bars */}
                        {mockStats.scoreDistribution.map((bar, i) => (
                            <div key={i} className="relative flex-1 group">
                                <div
                                    className={`w-full ${bar.color} rounded-t-2xl transition-all duration-700 ease-out origin-bottom relative z-10 group-hover:brightness-110 shadow-lg`}
                                    style={{ height: `${(bar.count / 500) * 100}%` }}
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                                        {bar.count} HV
                                    </div>
                                </div>
                                <p className="text-center mt-4 text-[11px] font-bold text-gray-400 uppercase">{bar.range}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Insights for Innovation */}
                <div className="bg-gray-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-20 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-amber-500/20 transition-colors duration-500"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl text-amber-500">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Gợi ý đổi mới</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase mt-1">Sử dụng AI Phân tích</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {mockStats.insights.map((insight, i) => (
                                <div key={i} className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-2 h-2 rounded-full ${insight.type === 'warning' ? 'bg-amber-500' :
                                            insight.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                                            }`}></div>
                                        <h4 className="text-[13px] font-bold text-gray-100">{insight.title}</h4>
                                    </div>
                                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium mb-4">
                                        {insight.description}
                                    </p>
                                    <button className="text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1 hover:translate-x-1 transition-transform">
                                        {insight.action} <ChevronRight size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Student Ranking Section */}
            <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden p-2">
                <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-10 border-b border-gray-50 gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Bảng Xếp Hạng Học Viên
                            <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest">Top 5</div>
                        </h2>
                        <p className="text-sm font-bold text-gray-400 mt-1">Dựa trên điểm trung bình và tiến độ hoàn thành</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm học viên..."
                                className="pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all w-64"
                            />
                        </div>
                        <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase">Học viên</th>
                                <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase">Khóa học</th>
                                <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase">Tiến độ</th>
                                <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase">Điểm Trung Bình</th>
                                <th className="py-6 text-[11px] font-bold text-gray-400 uppercase text-right px-10">Thành tích</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {mockStats.topStudents.map((student, i) => (
                                <tr key={student.id} className="hover:bg-gray-50/50 transition-all group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-2xl overflow-hidden ring-4 ring-white shadow-md">
                                                    <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
                                                    {i + 1}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors">{student.name}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">MSHV: 2026-{student.id}00</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className="text-[12px] font-bold text-gray-600">{student.course}</span>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="w-40 space-y-2">
                                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                                                <span>{student.progress}%</span>
                                                <span>Duyệt tốt</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000"
                                                    style={{ width: `${student.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-bold text-gray-900">{student.score}</span>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3].map(s => <Star key={s} size={10} className="fill-amber-400 text-amber-400" />)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex justify-end">
                                            {i === 0 && <div className="px-4 py-1.5 bg-amber-100 text-amber-600 rounded-xl text-[10px] font-bold uppercase shadow-xs">Học bổng A+</div>}
                                            {i === 1 && <div className="px-4 py-1.5 bg-blue-100 text-blue-600 rounded-xl text-[10px] font-bold uppercase shadow-xs">Sáng tạo</div>}
                                            {i > 1 && <button className="p-2.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"><ChevronRight size={20} /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-8 text-center border-t border-gray-50 flex items-center justify-center group ">
                    <button className="text-[11px] font-bold uppercase gap-2 text-amber-600 hover:underline cursor-pointer">
                        Xem toàn bộ danh sách (1,284 học viên)

                    </button> <ChevronRight size={20} className='text-amber-600 group-hover:translate-x-1 transition-all' />
                </div>
            </div>
        </div>
    );
};

export default TeacherStatistics;
