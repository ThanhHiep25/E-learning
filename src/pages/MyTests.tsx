import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, Clock,
    Calendar, ChevronRight, Search,
    AlertCircle, CheckCircle2,
    Play, RotateCcw, Eye, Loader2,
    Trophy
} from 'lucide-react';
import { quizService, type StudentQuiz } from '../services/quiz.service';
import toast from 'react-hot-toast';

const MyTests: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');


    const [loading, setLoading] = useState(true);
    const [quizzes, setQuizzes] = useState<StudentQuiz[]>([]);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await quizService.listMyQuizzes();
            setQuizzes(data);
        } catch (err: any) {
            toast.error(err?.message || 'Không thể tải danh sách bài kiểm tra');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [loadData]);

    const getQuizStatus = (quiz: StudentQuiz) => {
        return quiz.userStatus?.status || 'not_started';
    };

    const getQuizTimeStatus = (quiz: StudentQuiz) => {
        const now = new Date();
        if (quiz.startTime && new Date(quiz.startTime) > now) return 'early';
        if (quiz.endTime && new Date(quiz.endTime) < now) return 'late';
        return 'open';
    };

    const filteredQuizzes = quizzes.filter(quiz => {
        const status = getQuizStatus(quiz);
        const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (quiz.courseTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'in_progress': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'not_started': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Đã hoàn thành';
            case 'in_progress': return 'Đang làm dở';
            case 'not_started': return 'Chưa bắt đầu';
            default: return status;
        }
    };

    const handleStartQuiz = (quizId: string, attemptId?: string | number | null) => {
        if (attemptId) {
            navigate(`/quiz/${quizId}?attemptId=${attemptId}`);
        } else {
            navigate(`/quiz/${quizId}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDF8EE]">
            {/* Header Section */}
            <div className=" bg-gray-900 pt-28 pb-20 mb-20">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 max-w-[1440px] mx-auto px-6">
                    <div className="max-w-2xl">
                        <h1 className="md:text-6xl text-4xl font-black text-slate-100 mb-4 leading-none">
                            Bài kiểm tra<span className="text-rose-500">.</span>
                        </h1>
                        <p className="text-slate-400 font-medium md:text-lg text-base leading-relaxed max-w-md">
                            Theo dõi và hoàn thành các bài đánh giá từ giảng viên để củng cố kiến thức của bạn.
                        </p>
                    </div>
                    {/* Quick Stats */}
                    <div className="flex flex-wrap gap-4">
                        <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-50 min-w-[160px]">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tổng số</p>
                            <h3 className="text-3xl font-black text-slate-900">{quizzes.length}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-50 min-w-[160px]">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Hoàn thành</p>
                            <h3 className="text-3xl font-black text-slate-900">
                                {quizzes.filter(q => getQuizStatus(q) === 'completed').length}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white/60 backdrop-blur-xl max-w-[1440px] mx-auto mt-10 p-4 rounded-[32px] border border-white mb-10 shadow-2xl shadow-gray-200/30 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài kiểm tra hoặc khóa học..."
                        className="w-full bg-white/50 border border-gray-100 rounded-2xl py-4 pl-16 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'not_started', 'in_progress', 'completed'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-6 py-4 rounded-2xl text-[10px] font-bold uppercase transition-all cursor-pointer border ${statusFilter === status
                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                : 'bg-white text-slate-400 border-gray-100 hover:text-slate-900 hover:border-slate-200'
                                }`}
                        >
                            {status === 'all' ? 'Tất cả' : getStatusLabel(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tests Grid */}
            <div className="grid grid-cols-1 max-w-[1440px] mx-auto mb-10 xl:grid-cols-2 gap-8 px-6">
                {loading ? (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center">
                        <Loader2 size={48} className="text-amber-500 animate-spin mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
                    </div>
                ) : filteredQuizzes.length > 0 ? (
                    filteredQuizzes.map((quiz) => {
                        const status = getQuizStatus(quiz);
                        const attemptId = quiz.userStatus?.latestAttemptId;

                        return (
                            <div
                                key={quiz.id}
                                className="group bg-white rounded-[48px] p-3 shadow-sm border border-gray-50 hover:shadow-2xl hover:shadow-gray-200/40 transition-all duration-700 relative overflow-hidden"
                            >
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="w-18 h-18 bg-slate-50 rounded-[20px] flex items-center justify-center shrink-0 transition-all duration-500">
                                        <ClipboardList size={30} className="text-slate-400 transition-colors" />
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className={`px-4 py-1.5 rounded-2xl text-[12px] font-bold border transition-colors ${getStatusStyle(status)}`}>
                                                {getStatusLabel(status)}
                                            </div>
                                            {quiz.type === 'placement' && (
                                                <div className="px-4 py-1.5 rounded-2xl text-[12px] font-black bg-rose-500 text-white border-rose-500 uppercase tracking-tighter">
                                                    Test Đầu Vào
                                                </div>
                                            )}
                                            {quiz.isLevelFinal && (
                                                <div className="px-4 py-1.5 rounded-2xl text-[12px] font-black bg-amber-500 text-white border-amber-500 uppercase tracking-tighter flex items-center gap-1">
                                                    <Trophy size={12} /> Kiểm tra cuối {quiz.level}
                                                </div>
                                            )}
                                            <span className="text-[11px] font-bold text-slate-400">
                                                {quiz.courseTitle}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <h3 className="md:text-2xl text-xl font-bold text-slate-900 leading-tight group-hover:text-rose-600 transition-colors flex items-center justify-between col-span-full">
                                                {quiz.title}
                                                <ChevronRight className="opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                                            </h3>

                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-slate-300" />
                                                <span className="text-sm font-bold text-slate-900">{quiz.timeLimit} Phút</span>
                                            </div>

                                            {(quiz.startTime || quiz.endTime) && (
                                                <div className="flex items-center gap-2 text-[12px] font-bold text-slate-400 col-span-full">
                                                    <Calendar size={14} />
                                                    {quiz.startTime && <span>Bắt đầu: {new Date(quiz.startTime).toLocaleString('vi-VN')}</span>}
                                                    {quiz.startTime && quiz.endTime && <span> - </span>}
                                                    {quiz.endTime && <span>Kết thúc: {new Date(quiz.endTime).toLocaleString('vi-VN')}</span>}
                                                </div>
                                            )}

                                            <div className="">
                                                <p className="text-[12px] font-bold text-slate-400">Yêu cầu để hoàn thành: {quiz.passingScore} / {quiz.maxScore} điểm</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 flex items-center justify-between p-6 bg-slate-50/50 rounded-[32px] border border-gray-100 group-hover:bg-rose-50 group-hover:border-rose-100 transition-all">
                                    {status === 'completed' ? (
                                        <>
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    onClick={() => handleStartQuiz(String(quiz.id), attemptId)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-bold uppercase hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 cursor-pointer"
                                                >
                                                    <Eye size={18} />
                                                    <span>Xem kết quả</span>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <div className="text-left">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái</p>
                                                    <p className={`text-sm font-bold ${getQuizTimeStatus(quiz) === 'early' ? 'text-blue-500' : getQuizTimeStatus(quiz) === 'late' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        {getQuizTimeStatus(quiz) === 'early' ? 'Sắp diễn ra' : getQuizTimeStatus(quiz) === 'late' ? 'Đã kết thúc' : 'Đang diễn ra'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                disabled={getQuizTimeStatus(quiz) !== 'open'}
                                                onClick={() => handleStartQuiz(String(quiz.id))}
                                                className={`flex items-center gap-3 px-8 py-4 rounded-[24px] text-xs font-bold uppercase transition-all shadow-xl active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${getQuizTimeStatus(quiz) === 'open' ? 'bg-slate-900 text-white hover:bg-rose-500 hover:shadow-2xl hover:shadow-rose-300' : 'bg-gray-200 text-gray-500 shadow-none'}`}
                                            >
                                                {status === 'in_progress' ? (
                                                    <>
                                                        <RotateCcw size={16} />
                                                        <span>Tiếp tục</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play size={16} />
                                                        <span>{getQuizTimeStatus(quiz) === 'early' ? 'Chưa mở' : getQuizTimeStatus(quiz) === 'late' ? 'Hết hạn' : 'Bắt đầu'}</span>
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 group-hover:scale-150 transition-all duration-1000">
                                    <CheckCircle2 size={50} />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-1 xl:col-span-2 bg-white rounded-[48px] p-24 text-center border-2 border-dashed border-gray-100">
                        <AlertCircle size={48} className="mx-auto text-gray-200 mb-6" />
                        <p className="text-xl font-bold text-gray-400">Không tìm thấy bài kiểm tra nào phù hợp.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTests;
