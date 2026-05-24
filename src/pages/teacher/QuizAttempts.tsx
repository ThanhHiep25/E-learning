import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Users,
    BarChart3,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    ArrowUpRight,
    Loader2,
    Calendar,
    FileText,
    Trophy,
    Trash2,
    AlertTriangle,
    X,
    Edit3,
    Save
} from 'lucide-react';
import { teacherService, type QuizAttemptsResponse } from '../../services/teacher.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const QuizAttempts: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<QuizAttemptsResponse | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
    const [sortBy, setBySort] = useState<'recent' | 'score_desc' | 'score_asc' | 'name_asc'>('recent');
    const [activeTab, setActiveTab] = useState<'attempts' | 'ranking' | 'unattempted'>('attempts');
    const [isDeletingId, setIsDeletingId] = useState<string | number | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [attemptToDelete, setAttemptToDelete] = useState<string | number | null>(null);
    const [selectedViolationLogs, setSelectedViolationLogs] = useState<{ type: string; time: string; message: string }[] | null>(null);
    const [selectedStudentName, setSelectedStudentName] = useState<string>('');

    // Grading Modal State
    const [gradingModalOpen, setGradingModalOpen] = useState(false);
    const [gradingAttempt, setGradingAttempt] = useState<any>(null);
    const [gradingQuestions, setGradingQuestions] = useState<any[]>([]);
    const [gradingData, setGradingData] = useState<Record<string, { points: number; feedback: string }>>({});
    const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

    const loadData = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await teacherService.getQuizAttempts(id);

            // Xử lý dữ liệu theo cấu trúc mới { success: true, data: { quiz: { ..., attempts: [] } } }
            // Nếu API trả về trực tiếp đối tượng chứa quiz
            const quizData = res.quiz || res;

            // Tìm thông tin quiz từ bản ghi đầu tiên nếu không có ở ngoài
            const firstAttemptQuiz = quizData.attempts?.[0]?.quiz;

            // Calculate actualMaxScore from attempts if res.quiz not available
            // Formula: maxScore = score / (percentageScore / 100)
            const calculateMaxScoreFromAttempt = (attempt: any) => {
                const score = Number(attempt?.score) || 0;
                const percentage = Number(attempt?.percentageScore) || 0;
                if (score > 0 && percentage > 0) {
                    return Math.round(score / (percentage / 100));
                }
                return null;
            };
            
            // Find first attempt that can be used to calculate maxScore
            const firstAttempt = quizData.attempts?.[0];
            const validAttempt = quizData.attempts?.find((a: any) => 
                Number(a.score) > 0 && Number(a.percentageScore) > 0
            );
            const calculatedMaxScore = calculateMaxScoreFromAttempt(validAttempt || firstAttempt);

            // Get actualMaxScore from API response or calculate from attempts
            const actualMaxScore = res.quiz?.maxScore || quizData.maxScore || calculatedMaxScore || firstAttemptQuiz?.maxScore || 100;
            
            // Override maxScore in each attempt's quiz data
            const attemptsWithCorrectMaxScore = (quizData.attempts || []).map((a: any) => ({
                ...a,
                quiz: a.quiz ? { ...a.quiz, maxScore: actualMaxScore } : undefined
            }));
            
            const safeData: QuizAttemptsResponse = {
                quiz: {
                    id: quizData.id || firstAttemptQuiz?.id || id,
                    title: quizData.title || firstAttemptQuiz?.title || 'Đề thi không tên',
                    maxScore: actualMaxScore || firstAttemptQuiz?.maxScore || 100,
                    passingScore: quizData.passingScore || firstAttemptQuiz?.passingScore || 0,
                    attempts: attemptsWithCorrectMaxScore
                },
                statistics: res.statistics,
                ranking: res.ranking,
                unattemptedUsers: res.unattemptedUsers || []
            };

            setData(safeData);
        } catch (err: any) {
            toast.error(err?.message || 'Lỗi khi tải danh sách bài làm');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredAttempts = (data?.quiz?.attempts || [])
        .filter(a => {
            const user = a.User || (a as any).user;
            const name = (user?.name || user?.username || '').toLowerCase();
            const email = (user?.email || '').toLowerCase();
            const term = (searchTerm || '').toLowerCase();
            const matchesSearch = name.includes(term) || email.includes(term);

            // Calculate percentage-based pass/fail
            const score = Number(a.score) || 0;
            const maxScore = a.quiz?.maxScore || data?.quiz?.maxScore || 100;
            const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
            const passingScore = a.quiz?.passingScore || data?.quiz?.passingScore || 50;
            const isPassed = percentage >= passingScore;

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'passed' && isPassed) ||
                (statusFilter === 'failed' && !isPassed);

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'recent') {
                return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
            }
            if (sortBy === 'score_desc') {
                return (Number(b.score) || 0) - (Number(a.score) || 0);
            }
            if (sortBy === 'score_asc') {
                return (Number(a.score) || 0) - (Number(b.score) || 0);
            }
            if (sortBy === 'name_asc') {
                const nameA = ((a.User || (a as any).user)?.name || '').toLowerCase();
                const nameB = ((b.User || (b as any).user)?.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            }
            return 0;
        });

    // Tự động tính toán bảng xếp hạng từ danh sách bài nộp
    const calculatedRanking = useMemo(() => {
        if (!data?.quiz?.attempts) return [];
        const atts = data.quiz.attempts;
        const userMap = new Map();

        atts.forEach(a => {
            const user = a.User || (a as any).user;
            const userId = a.userId || user?.id;
            
            // Calculate percentage for fair comparison across different quiz sizes
            const score = Number(a.score) || 0;
            const maxScore = a.quiz?.maxScore || data.quiz?.maxScore || 100;
            const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
            const passingScore = a.quiz?.passingScore || data.quiz?.passingScore || 50;
            const isPassed = percentage >= passingScore;

            if (!userMap.has(userId) || percentage > userMap.get(userId).highestScore) {
                userMap.set(userId, {
                    userName: user?.name || user?.username || 'Học viên ẩn danh',
                    highestScore: percentage, // Store percentage for ranking
                    passed: isPassed,
                    completedAt: a.completedAt || a.startedAt
                });
            }
        });

        // Convert map to array and assign base rank by percentage desc
        let ranking = Array.from(userMap.values())
            .sort((a, b) => b.highestScore - a.highestScore)
            .map((item, index) => ({
                ...item,
                rank: index + 1
            }));

        // Apply Status Filter
        if (statusFilter !== 'all') {
            ranking = ranking.filter(r => (statusFilter === 'passed' ? r.passed : !r.passed));
        }

        // Apply Search Term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            ranking = ranking.filter(r => r.userName.toLowerCase().includes(term));
        }

        // Apply Sorting
        ranking.sort((a, b) => {
            if (sortBy === 'score_desc') return b.highestScore - a.highestScore;
            if (sortBy === 'score_asc') return a.highestScore - b.highestScore;
            if (sortBy === 'name_asc') return a.userName.localeCompare(b.userName);
            if (sortBy === 'recent') return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
            return 0; // Keep current order (rank based)
        });

        return ranking;
    }, [data?.quiz?.attempts, statusFilter, searchTerm, sortBy]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-20 bg-white rounded-[48px] border border-gray-100 shadow-sm mx-6">
                <Loader2 size={48} className="text-amber-500 animate-spin mb-6" />
                <p className="text-xl font-black text-gray-900 uppercase tracking-widest italic">Đang tổng hợp dữ liệu...</p>
            </div>
        );
    }

    if (!data) return null;

    const stats = [
        {
            label: 'Tổng bài nộp',
            value: data.quiz.attempts?.length || 0,
            icon: Users,
            color: 'bg-indigo-50 text-indigo-500',
            detail: 'Học viên đã hoàn thành'
        },
        {
            label: 'Điểm trung bình',
            value: (() => {
                const atts = data.quiz.attempts || [];
                if (atts.length === 0) return '0.0đ';
                const total = atts.reduce((sum, a) => sum + (Number(a.score) || 0), 0);
                return (total / atts.length).toFixed(1) + 'đ';
            })(),
            icon: BarChart3,
            color: 'bg-amber-50 text-amber-500',
            detail: 'Trên thang điểm ' + (data.quiz.maxScore)
        },
        {
            label: 'Tỷ lệ đạt',
            value: (() => {
                const atts = data.quiz.attempts || [];
                if (atts.length === 0) return '0%';
                const passedCount = atts.filter(a => a.passed || a.isPassed).length;
                return Math.round((passedCount / atts.length) * 100) + '%';
            })(),
            icon: CheckCircle2,
            color: 'bg-emerald-50 text-emerald-500',
            detail: 'Vượt qua bài kiểm tra'
        },
        {
            label: 'Chưa làm bài',
            value: data.unattemptedUsers?.length || 0,
            icon: BarChart3,
            color: 'bg-rose-50 text-rose-500',
            detail: 'Học viên trong khóa'
        },
    ];

    const handleDeleteAttempt = async () => {
        if (!attemptToDelete) return;
        try {
            setIsDeletingId(attemptToDelete);
            await teacherService.deleteAttempt(attemptToDelete);
            toast.success('Đã xóa bài nộp thành công');
            setShowDeleteModal(false);
            setAttemptToDelete(null);
            loadData();
        } catch (err: any) {
            toast.error(err?.message || 'Không thể xóa bài nộp');
        } finally {
            setIsDeletingId(null);
        }
    };

    const confirmDelete = (attemptId: string | number) => {
        setAttemptToDelete(attemptId);
        setShowDeleteModal(true);
    };

    const openGradingModal = async (attemptId: string | number) => {
        try {
            const attempt = await teacherService.getAttemptForGrading(attemptId);
            setGradingAttempt(attempt);
            setGradingQuestions(attempt.questions || []);
            
            // Initialize grading data for essay questions
            const initialGradingData: Record<string, { points: number; feedback: string }> = {};
            (attempt.questions || []).forEach((q: any) => {
                if (q.type === 'essay') {
                    initialGradingData[String(q.id)] = {
                        points: q.pointsEarned || 0,
                        feedback: q.feedback || ''
                    };
                }
            });
            setGradingData(initialGradingData);
            setGradingModalOpen(true);
        } catch (err: any) {
            toast.error(err?.message || 'Không thể tải dữ liệu chấm điểm');
        }
    };

    const submitGrades = async () => {
        if (!gradingAttempt) return;
        try {
            setIsSubmittingGrade(true);
            
            // Submit grades for each essay question
            for (const [questionId, data] of Object.entries(gradingData)) {
                await teacherService.gradeQuestion(
                    gradingAttempt.id,
                    questionId,
                    data.points,
                    data.feedback
                );
            }
            
            toast.success('Đã lưu điểm thành công');
            setGradingModalOpen(false);
            loadData();
        } catch (err: any) {
            toast.error(err?.message || 'Không thể lưu điểm');
        } finally {
            setIsSubmittingGrade(false);
        }
    };

    return (
        <div className="w-full pb-20 px-2 lg:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 px-4">
                    <div>
                        <button
                            onClick={() => navigate('/teacher/quizzes')}
                            className="group flex items-center gap-3 text-gray-400 hover:text-amber-600 font-black uppercase tracking-widest text-[10px] transition-all cursor-pointer mb-6"
                        >
                            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-amber-50 transition-all border border-gray-100">
                                <ChevronLeft size={16} />
                            </div>
                            Quay lại quản lý
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-4">
                            Phân tích kết quả
                        </h1>
                        <p className="text-gray-500 font-bold text-lg leading-relaxed mt-2">
                            {data.quiz?.title}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <div className="pr-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID Đề thi</p>
                                <p className="text-sm font-bold text-gray-900">#QUIZ-{data.quiz.id}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {stats.map((s, i) => (
                        <div key={i} className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm group hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-700">
                            <div className="flex items-start justify-between mb-6">
                                <div className={`w-14 h-14 ${s.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <s.icon size={28} />
                                </div>
                                <ArrowUpRight className="text-gray-200 group-hover:text-amber-500 transition-colors" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                                <h3 className="text-3xl font-bold text-gray-900 mb-2">{s.value}</h3>
                                <p className="text-[11px] font-bold text-gray-400 leading-relaxed italic">{s.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
                    {/* Tabs */}
                    <div className="px-8 pt-8 border-b border-gray-50 flex items-center gap-8">
                        <button
                            onClick={() => setActiveTab('attempts')}
                            className={`pb-4 text-sm cursor-pointer font-bold transition-all relative ${activeTab === 'attempts' ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'}`}
                        >
                            Danh sách bài nộp
                            {activeTab === 'attempts' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('ranking')}
                            className={`pb-4 text-sm cursor-pointer font-bold transition-all relative ${activeTab === 'ranking' ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'}`}
                        >
                            Bảng xếp hạng
                            {activeTab === 'ranking' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('unattempted')}
                            className={`pb-4 text-sm cursor-pointer font-bold transition-all relative ${activeTab === 'unattempted' ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'}`}
                        >
                            Chưa làm bài ({data.unattemptedUsers?.length || 0})
                            {activeTab === 'unattempted' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-full"></div>}
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="p-8 border-b border-gray-50 flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-4 bg-gray-50 px-6 py-4 rounded-3xl border border-gray-100 focus-within:bg-white focus-within:border-amber-300 transition-all flex-1 min-w-[300px]">
                            <Search className="text-gray-300" size={20} />
                            <input
                                placeholder={activeTab === 'attempts' ? "Tìm tên học viên hoặc email..." : activeTab === 'unattempted' ? "Tìm học viên chưa làm..." : "Tìm tên học viên..."}
                                className="bg-transparent border-none outline-none text-md text-gray-700 w-full placeholder:text-gray-300"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {(activeTab === 'attempts' || activeTab === 'ranking') && (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                        <Filter size={14} /> Lọc:
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                        className="px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-xs text-gray-600 outline-none cursor-pointer focus:bg-white transition-all"
                                    >
                                        <option value="all">Tất cả bài làm</option>
                                        <option value="passed">Đạt yêu cầu</option>
                                        <option value="failed">Chưa đạt</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                        Sắp xếp:
                                    </div>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setBySort(e.target.value as any)}
                                        className="px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-xs text-gray-600 outline-none cursor-pointer focus:bg-white transition-all"
                                    >
                                        <option value="recent">Mới nhất</option>
                                        <option value="score_desc">Điểm: Cao → Thấp</option>
                                        <option value="score_asc">Điểm: Thấp → Cao</option>
                                        <option value="name_asc">Tên: A → Z</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="flex items-center gap-3 ml-auto">
                            <button className="flex items-center gap-2 px-6 py-4 bg-gray-900 rounded-2xl font-bold text-xs text-white hover:bg-amber-600 transition-all cursor-pointer shadow-xl shadow-gray-200 active:scale-95">
                                Xuất Excel
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {activeTab === 'attempts' ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Học viên</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thời gian nộp</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thời gian làm</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Điểm số</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vi phạm</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái</th>
                                        <th className="px-8 py-6"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredAttempts.map((a, i) => {
                                        // Hỗ trợ cả camelCase và snake_case cho các trường
                                        const user = a.User || (a as any).user;

                                        // Ưu tiên các trường anh mới bổ sung
                                        const submittedAtStr = a.completionTime || (a as any).submittedAt || (a as any).submitted_at || a.completedAt;
                                        const duration = a.duration;

                                        const submittedAt = submittedAtStr ? new Date(submittedAtStr) : null;

                                        // Tính toán dự phòng nếu không có duration từ API
                                        let displayDuration = duration;
                                        if (!displayDuration && a.startedAt && a.completedAt) {
                                            const diff = new Date(a.completedAt).getTime() - new Date(a.startedAt).getTime();
                                            displayDuration = Math.round(diff / 60000) + ' phút';
                                        }

                                        return (
                                            <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-amber-100/70 flex items-center justify-center font-bold text-amber-700 text-lg">
                                                            <img
                                                                src={user?.avatar || '/default-avatar.png'}
                                                                alt={user?.name || user?.username || 'Avatar'}
                                                                className="w-10 h-10 rounded-full object-cover shadow-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{user?.name || user?.username || 'Học viên ẩn danh'}</p>
                                                            <p className="text-xs font-medium text-gray-400">{user?.email || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                                        <Calendar size={14} className="text-gray-300" />
                                                        {submittedAt && !isNaN(submittedAt.getTime()) ? format(submittedAt, 'HH:mm dd/MM/yyyy') : '--'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                                        <Clock size={14} className="text-gray-300" />
                                                        {displayDuration || '--'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {(() => {
                                                        const score = Number(a.score) || 0;
                                                        const maxScore = a.quiz?.maxScore || data.quiz?.maxScore || 100;
                                                        const percentage = Math.round((score / maxScore) * 100);
                                                        return (
                                                            <div className="flex flex-col">
                                                                <div className="text-lg font-black text-gray-900 group-hover:text-amber-600 transition-colors">
                                                                    {score}<span className="text-xs text-gray-400">/{maxScore}</span>
                                                                </div>
                                                                <div className={`text-xs font-bold ${percentage >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {percentage}%
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className={`flex items-center gap-2 font-bold ${a.isCheated || (a as any).is_cheated ? 'text-rose-500' : (a.violationsCount || (a as any).violations_count) > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                                                        {(a.isCheated || (a as any).is_cheated) && <AlertTriangle size={14} className="animate-pulse" />}
                                                        {a.violationsCount || (a as any).violations_count || 0} lần
                                                        {(a.violationLogs && (Array.isArray(a.violationLogs) || typeof a.violationLogs === 'string')) && (
                                                            <button
                                                                onClick={() => {
                                                                    let logs = a.violationLogs;
                                                                    if (typeof logs === 'string') {
                                                                        try {
                                                                            logs = JSON.parse(logs);
                                                                            // Xử lý trường hợp double stringified
                                                                            if (typeof logs === 'string') {
                                                                                logs = JSON.parse(logs);
                                                                            }
                                                                        } catch (e) {
                                                                            logs = [];
                                                                        }
                                                                    }
                                                                    setSelectedViolationLogs(Array.isArray(logs) ? logs : []);
                                                                    setSelectedStudentName(user?.name || user?.username || 'Học viên');
                                                                }}
                                                                className="ml-1 p-1.5 bg-gray-100 hover:bg-gray-900 hover:text-white rounded-lg transition-all cursor-pointer"
                                                                title="Xem chi tiết vi phạm"
                                                            >
                                                                <ArrowUpRight size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {(() => {
                                                        const score = Number(a.score) || 0;
                                                        const maxScore = a.quiz?.maxScore || data.quiz?.maxScore || 100;
                                                        const percentage = Math.round((score / maxScore) * 100);
                                                        const passingScore = a.quiz?.passingScore || data.quiz?.passingScore || 50;
                                                        const isPassed = percentage >= passingScore;
                                                        return (
                                                            <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${isPassed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                                {isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Check if attempt has essay questions that need grading */}
                                                        {(a as any).manualGradingCount > 0 && (
                                                            <button
                                                                onClick={() => openGradingModal(a.id)}
                                                                className="p-3 bg-amber-50 rounded-xl border border-amber-100 shadow-sm text-amber-600 hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
                                                                title="Chấm điểm bài tự luận"
                                                            >
                                                                <Edit3 size={18} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => navigate(`/quiz/${data.quiz?.id}?attemptId=${a.id}`)}
                                                            className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-400 hover:bg-gray-900 hover:text-white transition-all cursor-pointer"
                                                            title="Xem chi tiết"
                                                        >
                                                            <ArrowUpRight size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(a.id)}
                                                            disabled={isDeletingId === a.id}
                                                            className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                                                            title="Xóa bài làm (Cho làm lại)"
                                                        >
                                                            {isDeletingId === a.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : activeTab === 'ranking' ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24">Xếp hạng</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Học viên</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Điểm cao nhất</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thời gian</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {calculatedRanking
                                        .map((r, i) => (
                                            <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${r.rank === 1 ? 'bg-amber-100 text-amber-600' :
                                                        r.rank === 2 ? 'bg-gray-100 text-gray-500' :
                                                            r.rank === 3 ? 'bg-orange-100 text-orange-600' :
                                                                'bg-gray-50 text-gray-400'
                                                        }`}>
                                                        {r.rank === 1 ? <Trophy size={20} /> : r.rank}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-bold text-gray-900">{r.userName}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {(() => {
                                                        const maxScore = data.quiz?.maxScore || 100;
                                                        const percentage = r.highestScore; // highestScore is already percentage
                                                        const actualScore = Math.round((percentage / 100) * maxScore);
                                                        return (
                                                            <div className="flex flex-col">
                                                                <div className="text-lg font-bold text-gray-900">
                                                                    {actualScore}<span className="text-xs text-gray-400">/{maxScore}</span>
                                                                </div>
                                                                <div className={`text-xs font-bold ${percentage >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {Math.round(percentage)}%
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                                        <Calendar size={14} className="text-gray-300" />
                                                        {r.completedAt ? format(new Date(r.completedAt), 'dd/MM/yyyy HH:mm') : '--'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-left">
                                                    {(() => {
                                                        const passingScore = data.quiz?.passingScore || 50;
                                                        const isPassed = r.highestScore >= passingScore;
                                                        return (
                                                            <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${isPassed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                                {isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Học viên</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(data.unattemptedUsers || [])
                                        .filter(u => u.userName.toLowerCase().includes(searchTerm.toLowerCase()) || u.userEmail.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((u, i) => (
                                            <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <img
                                                            src={'/default-avatar.png'}
                                                            alt={u.userName}
                                                            className="w-10 h-10 rounded-full object-cover shadow-sm"
                                                        />
                                                        <p className="font-bold text-gray-900">{u.userName}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-medium text-gray-600">{u.userEmail}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.status === 'not_started' ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-600'}`}>
                                                        {u.status === 'not_started' ? 'CHƯA BẮT ĐẦU' : 'ĐANG LÀM'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-left">
                                                    <button className="text-amber-600 font-bold text-xs hover:underline cursor-pointer uppercase tracking-widest">
                                                        Nhắc nhở
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {(filteredAttempts.length === 0 && activeTab === 'attempts') && (
                        <div className="py-24 text-center">
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Không tìm thấy bài nộp nào phù hợp.</p>
                        </div>
                    )}
                    {(activeTab === 'unattempted' && (data.unattemptedUsers || []).length === 0) && (
                        <div className="py-24 text-center">
                            <p className="text-amber-500 font-bold uppercase tracking-widest text-xs">Tất cả học viên đã làm bài!</p>
                        </div>
                    )}
                </div>
            </div>
            {/* Violation Logs Modal */}
            {selectedViolationLogs && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white max-w-2xl w-full rounded-[40px] p-10 shadow-2xl relative animate-in zoom-in duration-500 max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Chi tiết vi phạm</h3>
                                <p className="text-gray-500 font-bold text-sm tracking-tight mt-1 capitalize">Học viên: {selectedStudentName}</p>
                            </div>
                            <button
                                onClick={() => setSelectedViolationLogs(null)}
                                className="p-3 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-2xl transition-all cursor-pointer"
                            >
                                <ChevronLeft size={20} className="rotate-90 md:rotate-0" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 pr-2 space-y-4">
                            {(Array.isArray(selectedViolationLogs) && selectedViolationLogs.length > 0) ? (
                                selectedViolationLogs.map((log, index) => (
                                    <div key={index} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-start gap-4 hover:border-amber-200 transition-all group">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm group-hover:bg-amber-50 transition-all">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-bold text-[10px] text-amber-600">{log.type}</p>
                                                <p className="text-xs font-bold text-gray-400">{log.time}</p>
                                            </div>
                                            <p className="text-gray-900 font-bold text-sm leading-relaxed">{log.message}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center">
                                    <p className="text-gray-400 font-bold text-sm">Không có nhật ký chi tiết.</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-8">
                            <button
                                onClick={() => setSelectedViolationLogs(null)}
                                className="w-full bg-gray-900 text-white py-5 rounded-3xl font-bold text-sm hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer"
                            >
                                Đóng cửa sổ
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showDeleteModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white max-w-md w-full rounded-[40px] p-10 shadow-2xl relative animate-in zoom-in duration-500">
                        <div className="text-center space-y-6">

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-gray-900">Xác nhận xóa bài nộp?</h3>
                                <p className="text-red-500 font-medium">
                                    Học viên sẽ bị mất kết quả hiện tại và có thể thực hiện lại bài kiểm tra này. Hành động này không thể hoàn tác.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={handleDeleteAttempt}
                                    disabled={!!isDeletingId}
                                    className="w-full bg-rose-500 text-white py-5 rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-200 active:scale-95 cursor-pointer disabled:opacity-50"
                                >
                                    {isDeletingId ? 'ĐANG XÓA...' : 'ĐỒNG Ý XÓA'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setAttemptToDelete(null);
                                    }}
                                    className="w-full bg-white text-gray-500 py-5 rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all cursor-pointer"
                                >
                                    HỦY BỎ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Grading Modal */}
            {gradingModalOpen && gradingAttempt && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white max-w-4xl w-full rounded-[40px] p-10 shadow-2xl relative animate-in zoom-in duration-500 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Chấm điểm bài tự luận</h3>
                                <p className="text-gray-500 font-bold text-sm tracking-tight mt-1">
                                    {gradingAttempt.User?.name || (gradingAttempt as any).user?.name || 'Học viên'}
                                </p>
                            </div>
                            <button
                                onClick={() => setGradingModalOpen(false)}
                                className="p-3 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-2xl transition-all cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 pr-2 space-y-6">
                            {gradingQuestions.filter((q: any) => q.type === 'essay').map((q: any) => {
                                const questionId = String(q.id);
                                const grading = gradingData[questionId] || { points: 0, feedback: '' };
                                const maxPoints = q.points || 10;
                                
                                return (
                                    <div key={questionId} className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">Tự luận</span>
                                                <span className="text-xs font-bold text-gray-400">{maxPoints} điểm tối đa</span>
                                            </div>
                                            <p className="text-gray-900 font-bold text-sm leading-relaxed">{q.content}</p>
                                        </div>
                                        
                                        <div className="mb-4 p-4 bg-white rounded-2xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Bài làm của học viên</p>
                                            <p className="text-gray-700 font-medium text-sm">{q.userAnswer || '(Chưa có câu trả lời)'}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Điểm</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={maxPoints}
                                                    value={grading.points}
                                                    onChange={(e) => setGradingData(prev => ({
                                                        ...prev,
                                                        [questionId]: { ...prev[questionId], points: Math.min(maxPoints, Math.max(0, Number(e.target.value))) }
                                                    }))}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-amber-500 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Nhận xét</label>
                                                <input
                                                    type="text"
                                                    value={grading.feedback}
                                                    onChange={(e) => setGradingData(prev => ({
                                                        ...prev,
                                                        [questionId]: { ...prev[questionId], feedback: e.target.value }
                                                    }))}
                                                    placeholder="Nhận xét cho học viên..."
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-900 outline-none focus:border-amber-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {gradingQuestions.filter((q: any) => q.type === 'essay').length === 0 && (
                                <div className="py-20 text-center">
                                    <p className="text-gray-400 font-bold text-sm">Không có câu hỏi tự luận nào cần chấm điểm.</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-8 flex gap-4">
                            <button
                                onClick={() => setGradingModalOpen(false)}
                                className="flex-1 bg-white text-gray-500 py-5 rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={submitGrades}
                                disabled={isSubmittingGrade}
                                className="flex-1 bg-gray-900 text-white py-5 rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmittingGrade ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {isSubmittingGrade ? 'Đang lưu...' : 'Lưu điểm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizAttempts;
