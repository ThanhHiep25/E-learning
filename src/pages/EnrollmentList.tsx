import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trash2, ArrowLeft, BookOpen, GraduationCap, CheckCircle2
} from 'lucide-react';
import { useEnrollmentStore } from '../store/useEnrollmentStore';
import toast from 'react-hot-toast';

const EnrollmentList: React.FC = () => {
    const navigate = useNavigate();
    const { enrolledCourses, unenrollCourse, clearEnrollments, syncEnrollments } = useEnrollmentStore();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        syncEnrollments();
    }, []);

    if (enrolledCourses.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <BookOpen size={48} className="text-gray-300" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Danh sách trống</h2>
                <p className="text-gray-500 mb-8 max-w-md text-center font-medium">
                    Bạn chưa chọn khóa học nào để ghi danh. Hãy khám phá các khóa học hấp dẫn ngay nhé!
                </p>
                <button
                    onClick={() => navigate('/courses')}
                    className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-amber-600 transition-all shadow-xl active:scale-95 cursor-pointer flex items-center gap-2"
                >
                    <ArrowLeft size={20} />
                    KHÁM PHÁ KHÓA HỌC
                </button>
            </div>
        );
    }

    const handleConfirm = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'Đang xử lý ghi danh...',
                success: 'Ghi danh thành công! Chào mừng bạn đến với khóa học.',
                error: 'Có lỗi xảy ra, vui lòng thử lại.',
            }
        ).then(() => {
            navigate('/my-learning');
        });
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-gray-900 flex items-center gap-4">
                        <GraduationCap size={40} className="text-amber-500" />
                        Danh sách ghi danh
                    </h1>
                    <p className="text-gray-500 font-medium mt-2">Xác nhận các khóa học bạn muốn tham gia học tập.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-1 gap-10">
                    {/* Course List */}
                    <div className="lg:col-span-8">
                        <div className="space-y-4 max-h-[720px] overflow-y-auto pr-2 custom-scrollbar">
                            {enrolledCourses.map((item) => (
                                <div key={item.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow group">
                                    <div className="w-full sm:w-48 h-32 rounded-2xl overflow-hidden shrink-0 bg-gray-100">
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex justify-between items-start gap-4">
                                                <h3 className="text-lg font-bold text-gray-900 line-clamp-2 hover:text-amber-600 cursor-pointer transition-colors leading-snug" onClick={() => navigate(`/course/${item.id}`)}>
                                                    {item.title}
                                                </h3>
                                                <button
                                                    onClick={() => unenrollCourse(item.id)}
                                                    className="text-gray-300 hover:text-red-500 p-2 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                            <p className="text-gray-500 text-xs font-semibold mt-1">Giảng viên: <span className="text-gray-700">{item.teacher}</span></p>
                                        </div>
                                        <div className="flex items-end justify-between mt-4">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-amber-100 text-amber-600 text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                                                    {item.category}
                                                </span>
                                                <span className="text-gray-400 text-[11px] font-semibold">{item.level}</span>
                                            </div>
                                            <span className="text-emerald-600 text-xs font-black bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-tight">MIỄN PHÍ</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => clearEnrollments()}
                            className="mt-6 text-gray-400 hover:text-red-500 font-bold text-sm transition-colors cursor-pointer flex items-center gap-2 pl-2"
                        >
                            <Trash2 size={16} />
                            XÓA TẤT CẢ DANH SÁCH
                        </button>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-4 hidden">
                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm sticky top-24">
                            <h2 className="text-xl font-black text-gray-900 mb-6">Tổng kết ghi danh</h2>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                                    <span className="text-gray-500 font-medium">Số lượng khóa học</span>
                                    <span className="font-bold text-gray-900">{enrolledCourses.length}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                                    <span className="text-gray-500 font-medium">Hình thức</span>
                                    <span className="font-bold text-gray-900">Nội bộ (LMS)</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-lg font-black text-gray-900">Chi phí học tập</span>
                                    <span className="text-2xl font-black text-emerald-600">0đ</span>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirm}
                                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer mb-6"
                            >
                                XÁC NHẬN GHI DANH
                            </button>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-gray-400">
                                    <CheckCircle2 size={16} className="text-amber-500" />
                                    <span className="text-[11px] font-bold text-gray-600 leading-tight">Môi trường học tập chuyên nghiệp, hiện đại</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <CheckCircle2 size={16} className="text-amber-500" />
                                    <span className="text-[11px] font-bold text-gray-600 leading-tight">Quyền truy cập khóa học ngay sau khi xác nhận</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnrollmentList;
