import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, HelpCircle, Clock,
    ChevronRight, Edit3,
    MoreVertical, Zap, AlertCircle, FileText,
    Layout
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService, type BECourse } from '../../api/teacherService';
import toast from 'react-hot-toast';

interface QuizTemplate {
    id: string;
    courseId: string;
    title: string;
    questionsCount: number;
    duration: number;
    assignedStudents: number;
    status: 'draft' | 'published';
    createdAt: string;
}

const QuizManagement: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<BECourse[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    // Mock quiz data - until BE has quiz endpoints
    const [quizzes] = useState<QuizTemplate[]>([
        { id: 'q1', courseId: 'temp1', title: 'Kiểm tra Chương 1: Căn bậc hai', questionsCount: 20, duration: 45, assignedStudents: 125, status: 'published', createdAt: '10/02/2024' },
        { id: 'q2', courseId: 'temp1', title: 'Ôn tập Chương 2: Hàm số', questionsCount: 15, duration: 30, assignedStudents: 102, status: 'draft', createdAt: '15/02/2024' },
        { id: 'q3', courseId: 'temp2', title: 'Mini Test: TOEIC Part 1 & 2', questionsCount: 25, duration: 40, assignedStudents: 85, status: 'published', createdAt: '20/02/2024' },
    ]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setIsLoading(true);
                const response = await teacherService.getCourses();
                if (response.success && response.data) {
                    setCourses(response.data.courses);
                }
            } catch (error) {
                toast.error('Lỗi khi tải danh sách khóa học');
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const filteredQuizzes = useMemo(() => {
        return selectedCourseId === 'all'
            ? quizzes
            : quizzes.filter(q => q.courseId === selectedCourseId);
    }, [quizzes, selectedCourseId]);

    const getCourseTitle = (id: string) => courses.find(c => c.id === id)?.title || 'Khóa học không xác định';

    return (
        <div className="w-full pb-20 px-2 lg:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16 px-4">
                    <div className="max-w-3xl">
                        <h1 className="text-6xl font-bold text-gray-900 leading-none italic mb-4">
                            Kiến tạo <span className="text-amber-500">Đề thi.</span>
                        </h1>
                        <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-lg">
                            Thiết kế các bài kiểm tra đa dạng, theo dõi kết quả và đánh giá năng lực học viên một cách chính xác.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button className="flex items-center gap-3 bg-gray-900 text-white px-8 py-5 rounded-[28px] font-bold text-xs uppercase tracking-[0.2em] hover:bg-amber-600 transition-all shadow-2xl shadow-gray-200 active:scale-95 cursor-pointer">
                            <Plus size={20} />
                            Tạo Đề Mới
                        </button>
                    </div>
                </div>

                {/* Top Control Bar */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
                    <div className="lg:col-span-1 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tổng đề thi</p>
                            <h3 className="text-3xl font-bold text-gray-900">42</h3>
                        </div>
                        <div className="mt-4 flex gap-1">
                            {[...Array(5)].map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i < 3 ? 'bg-amber-500' : 'bg-gray-100'}`}></div>)}
                        </div>
                    </div>

                    <div className="lg:col-span-3 bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm flex items-center">
                        <div className="flex items-center gap-4 w-full px-4">
                            <Layout size={20} className="text-gray-300" />
                            <div className="flex-1">
                                <p className="text-[12px] font-bold text-gray-400 uppercase mb-1">Của {(user as any)?.name || user?.fullName}</p>
                                <select
                                    className="w-full text-base font-bold bg-transparent focus:outline-none appearance-none cursor-pointer"
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                >
                                    <option value="all">Tất cả khóa học ({courses.length})</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>
                            <ChevronRight size={20} className="text-gray-200" />
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredQuizzes.length > 0 ? (
                            filteredQuizzes.map(quiz => (
                                <div key={quiz.id} className="group bg-white rounded-[48px] p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-700 relative overflow-hidden flex flex-col">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform ${quiz.status === 'published' ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-400'}`}>
                                            <FileText size={28} />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button className="p-2 text-gray-300 hover:text-gray-600 rounded-xl transition-all"><MoreVertical size={18} /></button>
                                        </div>
                                    </div>

                                    <div className="mb-8 flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border ${quiz.status === 'published' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                {quiz.status === 'published' ? 'Công khai' : 'Bản nháp'}
                                            </span>
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{quiz.createdAt}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-amber-600 transition-colors mb-3">
                                            {quiz.title}
                                        </h3>
                                        <p className="text-sm font-bold text-gray-400 line-clamp-1 truncate max-w-full">
                                            {getCourseTitle(quiz.courseId)}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pb-8 border-b border-gray-50 mb-8">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Thời gian</p>
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                                                <Clock size={14} className="text-gray-300" />
                                                {quiz.duration} Phút
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Câu hỏi</p>
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                                                <HelpCircle size={14} className="text-gray-300" />
                                                {quiz.questionsCount} Câu
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {[...Array(3)].map((_, i) => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">?</div>)}
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase">+{quiz.assignedStudents} Học viên</span>
                                        </div>
                                        <button className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-amber-500 transition-all cursor-pointer">
                                            <Edit3 size={20} />
                                        </button>
                                    </div>

                                    {/* Hover Reveal Background Icon */}
                                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 group-hover:scale-150 transition-all duration-1000 rotate-12">
                                        <Zap size={100} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-32 text-center bg-white rounded-[48px] border-2 border-dashed border-gray-100">
                                <AlertCircle size={48} className="mx-auto text-gray-200 mb-6" />
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Không tìm thấy bài kiểm tra nào phù hợp.</p>
                                <button className="mt-4 text-amber-600 font-black text-sm uppercase tracking-widest hover:underline cursor-pointer">Tạo đề thi mới ngay</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizManagement;
