import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Clock, CheckCircle2,
    ChevronLeft, ChevronRight, Loader2,
    ArrowLeft,
    FileText, Image as ImageIcon, Volume2, PlayCircle, Sparkles
} from 'lucide-react';
import { quizService, type QuizAttempt, type StudentQuiz, type QuizResults } from '../services/quiz.service';
import { teacherService } from '../services/teacher.service';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TakeQuiz: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const explicitAttemptId = searchParams.get('attemptId');
    const { user: currentUser } = useAuth();
    const isTeacher = currentUser?.role === 'TEACHER';

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
    const [quiz, setQuiz] = useState<StudentQuiz | null>(null);
    const [results, setResults] = useState<QuizResults[]>([]);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [warnedOneMin, setWarnedOneMin] = useState(false);
    const [violationsCount, setViolationsCount] = useState(0);
    const [violationLogs, setViolationLogs] = useState<{ type: string; time: string; message: string }[]>([]);
    const [showCheatWarning, setShowCheatWarning] = useState(false);
    const [showStartModal, setShowStartModal] = useState(true);
    const initialLoadCalled = useRef(false);
    const isSubmittingRef = useRef(false);
    const lastViolationTimeRef = useRef<{ time: number; type: string }>({ time: 0, type: '' });
    // Stable state ref to prevent re-render loops in event listeners
    const quizStateRef = useRef({ answers, violationsCount, violationLogs });

    useEffect(() => {
        quizStateRef.current = { answers, violationsCount, violationLogs };
    }, [answers, violationsCount, violationLogs]);

    // Load initial state or resume attempt
    const loadQuiz = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);

            // 1. Nếu có attemptId cụ thể (từ nút "Xem kết quả"), tải thẳng kết quả đó
            if (explicitAttemptId) {
                const detail = isTeacher
                    ? await teacherService.getAttemptDetail(explicitAttemptId)
                    : await quizService.getAttemptDetail(explicitAttemptId);

                // Ép kiểu hoặc chuyển đổi dữ liệu từ teacherService nếu cần
                const attemptData = detail.attempt as any;
                const quizData = (detail.quiz || attemptData?.quiz) as any;

                setAttempt(attemptData);
                setQuiz(quizData);
                setResults((detail.results || []) as any);

                // Parse answers if it's a string from Backend
                let parsedAnswers = attemptData?.answers || {};
                if (typeof parsedAnswers === 'string') {
                    try {
                        parsedAnswers = JSON.parse(parsedAnswers);
                    } catch (e) {
                        console.error('Error parsing answers:', e);
                        parsedAnswers = {};
                    }
                }
                setAnswers(parsedAnswers);
                return;
            }

            const res = await quizService.startQuiz(id);
            console.log('Quiz loaded:', res);

            const currentAttempt = res.attempt;
            const currentQuiz = res.quiz || currentAttempt?.quiz;

            // Normalize status if missing
            if (currentAttempt && !currentAttempt.status) {
                currentAttempt.status = currentAttempt.completedAt || currentAttempt.submittedAt ? 'submitted' : 'in_progress';
            }

            setAttempt(currentAttempt);
            setQuiz(currentQuiz);
            setAnswers(currentAttempt?.answers || {});

            if (currentAttempt?.status === 'submitted' || currentAttempt?.status === 'graded') {
                const detail = await quizService.getAttemptDetail(String(currentAttempt.id));
                setResults(detail.results || []);
            }

            // Calculate remaining time
            const timeLimit = currentQuiz?.timeLimit || currentAttempt?.timeLimit;
            if (currentAttempt?.status === 'in_progress' && timeLimit) {
                const startedAt = new Date(currentAttempt.startedAt).getTime();
                const now = new Date().getTime();
                const elapsedSeconds = Math.floor((now - startedAt) / 1000);
                const limitSeconds = timeLimit * 60;
                const remaining = Math.max(0, limitSeconds - elapsedSeconds);
                setTimeLeft(remaining);

                if (remaining === 0) {
                    toast.error('Bài kiểm tra này đã hết thời gian làm bài.');
                }
            }
        } catch (err: any) {
            console.error('Quiz load error:', err);
            // Handle 409 Conflict - resume existing attempt
            if (err.status === 409 && err.payload?.data?.attempt) {
                const existingAttempt = err.payload.data.attempt;
                const quizData = err.payload.data.quiz || existingAttempt.quiz;

                if (!existingAttempt.status) {
                    existingAttempt.status = existingAttempt.completedAt || existingAttempt.submittedAt ? 'submitted' : 'in_progress';
                }

                setAttempt(existingAttempt);
                setQuiz(quizData);
                setAnswers(existingAttempt.answers || {});

                const timeLimit = quizData?.timeLimit || existingAttempt.timeLimit;
                if (timeLimit) {
                    const startedAt = new Date(existingAttempt.startedAt).getTime();
                    const now = new Date().getTime();
                    const elapsedSeconds = Math.floor((now - startedAt) / 1000);
                    const limitSeconds = timeLimit * 60;
                    const remaining = Math.max(0, limitSeconds - elapsedSeconds);
                    setTimeLeft(remaining);
                }
            } else if (err.status === 403) {
                const msg = err.payload?.message || err.message;
                if (msg.includes('chưa đến giờ') || msg.includes('startTime')) {
                    toast.error('Bài kiểm tra này chưa đến giờ bắt đầu.');
                } else if (msg.includes('hết giờ') || msg.includes('endTime')) {
                    toast.error('Bài kiểm tra này đã hết thời gian thực hiện.');
                } else {
                    toast.error(msg || 'Bạn không có quyền tham gia bài kiểm tra này');
                }
                navigate(-1);
            } else {
                toast.error(err?.message || 'Không thể bắt đầu bài kiểm tra');
                navigate(-1);
            }
        } finally {
            setLoading(false);
        }
    }, [id, navigate, explicitAttemptId]);

    useEffect(() => {
        if (initialLoadCalled.current) return;
        initialLoadCalled.current = true;
        loadQuiz();
    }, [loadQuiz]);

    // Timer effect
    useEffect(() => {
        if (attempt?.status !== 'in_progress' || timeLeft <= 0) return;

        // Cảnh báo 1 phút
        if (timeLeft === 60 && !warnedOneMin) {
            toast('Sắp hết thời gian! Còn 1 phút cuối cùng.', {
                duration: 5000,
                style: {
                    borderRadius: '20px',
                    background: '#0F172A',
                    color: 'red',
                    fontWeight: 'bold'
                },
            });
            setWarnedOneMin(true);
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    autoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [attempt?.status, timeLeft, warnedOneMin]);

    const formatTime = useCallback((seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, []);

    const handleAnswerChange = useCallback((questionId: string | number, value: any) => {
        if (attempt?.status !== 'in_progress') return;
        setAnswers(prev => ({
            ...prev,
            [String(questionId)]: value
        }));
    }, [attempt]);

    const handleSubmit = useCallback(async (overrideViolationsCount?: number, overrideViolationLogs?: { type: string; time: string; message: string }[]) => {
        if (!attempt || attempt.status !== 'in_progress' || isSubmittingRef.current) return;

        try {
            isSubmittingRef.current = true;
            setSubmitting(true);
            setShowConfirmModal(false);
            
            // Use latest values from ref to avoid stale closure issues or re-render loops
            const currentAnswers = quizStateRef.current.answers;
            const currentCount = quizStateRef.current.violationsCount;
            const currentLogs = quizStateRef.current.violationLogs;

            const finalViolations = overrideViolationsCount !== undefined ? overrideViolationsCount : currentCount;
            const finalLogs = overrideViolationLogs !== undefined ? overrideViolationLogs : currentLogs;

            const res = await quizService.submitQuiz(String(attempt.id), currentAnswers, finalViolations, finalLogs);
            setAttempt(res.attempt);
            setResults(res.results || []);
            if (res.quiz) setQuiz(res.quiz);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            toast.error(err?.message || 'Nộp bài thất bại');
            isSubmittingRef.current = false;
        } finally {
            setSubmitting(false);
        }
    }, [attempt]);

    const autoSubmit = useCallback(async (vCount?: number, vLogs?: { type: string; time: string; message: string }[]) => {
        if (!attempt || attempt.status !== 'in_progress' || isSubmittingRef.current) return;
        toast.error('Ghi nhận hành vi gian lận! Đang tự động nộp bài...');
        await handleSubmit(vCount, vLogs);
    }, [attempt, handleSubmit]);

    const addViolationLog = useCallback((type: string, message: string, increment: boolean = true) => {
        const now = Date.now();
        // Nếu cùng loại (rời trang/blur) trong < 2s thì bỏ qua (nâng lên 2s cho chắc)
        if (now - lastViolationTimeRef.current.time < 2000 && 
            (type.includes('VISIBLE') || type.includes('BLUR') || type.includes('WINDOW')) &&
            (lastViolationTimeRef.current.type.includes('VISIBLE') || lastViolationTimeRef.current.type.includes('BLUR') || lastViolationTimeRef.current.type.includes('WINDOW'))
        ) {
            return;
        }
        
        lastViolationTimeRef.current = { time: now, type };

        const timestamp = new Date().toLocaleTimeString('vi-VN');
        setViolationLogs(prev => {
            const nextLogs = [...prev, { type, time: timestamp, message }];
            
            if (increment) {
                setViolationsCount(vPrev => {
                    const nextCount = vPrev + 1;
                    if (nextCount >= 5) {
                        autoSubmit(nextCount, nextLogs);
                    }
                    return nextCount;
                });
            }

            return nextLogs;
        });

        // Chỉ hiện modal cảnh báo nếu là các lỗi rời trang/mất tập trung
        if (type.includes('VISIBLE') || type.includes('BLUR') || type.includes('WINDOW') || type.includes('FULLSCREEN')) {
            setShowCheatWarning(true);
        }
        
        toast.error(`CẢNH BÁO: ${message}`);
    }, [autoSubmit]);

    // Anti-Cheating: Prevent leaving page, blur detection, visibility detection
    useEffect(() => {
        if (attempt?.status !== 'in_progress' || !quiz?.antiCheat) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                addViolationLog('VISIBILITY_HIDDEN', 'Rời khỏi tab làm bài');
            }
        };

        const handleWindowBlur = () => {
            // Only report blur if the tab is still visible, otherwise VisibilityChange handles it
            if (document.visibilityState === 'visible') {
                addViolationLog('WINDOW_BLUR', 'Mất tập trung khỏi cửa sổ làm bài');
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && attempt?.status === 'in_progress' && !showStartModal) {
                addViolationLog('FULLSCREEN_EXIT', 'Thoát chế độ toàn màn hình');
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            addViolationLog('CONTEXT_MENU', 'Cố gắng mở menu chuột phải', false);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Chống Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+S, F12
            if (
                (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u' || e.key === 's')) ||
                e.key === 'F12'
            ) {
                e.preventDefault();
                addViolationLog('KEY_RESTRICTED', `Cố gắng sử dụng phím tắt: ${e.key}`, false);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [attempt?.status, addViolationLog, showStartModal]);

    const handleConfirmSubmit = () => {
        if (!attempt) return;
        setShowConfirmModal(true);
    };

    const requestFullscreen = async () => {
        try {
            const elem = document.documentElement;
            if (quiz?.antiCheat && elem.requestFullscreen) {
                await elem.requestFullscreen();
            }
            setShowStartModal(false);
        } catch (err) {
            console.error('Error attempting to enable full-screen mode:', err);
            setShowStartModal(false);
        }
    };

    const questions = quiz?.questions || attempt?.questions || attempt?.quiz?.questions || [];
    const currentQuestion = questions[currentQuestionIndex];

    const getSafeOptions = (q: any) => {
        if (!q || !q.options) return [];
        if (Array.isArray(q.options)) return q.options;
        try {
            if (typeof q.options === 'string') {
                return JSON.parse(q.options);
            }
        } catch (e) {
            console.error('Error parsing quiz options:', e);
        }
        return [];
    };

    const extractMedia = (content: string) => {
        const image = content.match(/\[image\](.*?)\[\/image\]/)?.[1]?.trim();
        const audio = content.match(/\[audio\](.*?)\[\/audio\]/)?.[1]?.trim();
        const video = content.match(/\[video\](.*?)\[\/video\]/)?.[1]?.trim();
        const cleaned = content
            .replace(/\n?\n?\[image\].*?\[\/image\]/g, '')
            .replace(/\n?\n?\[audio\].*?\[\/audio\]/g, '')
            .replace(/\n?\n?\[video\].*?\[\/video\]/g, '')
            .trim();
        return { cleaned, image, audio, video };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDF8EE] flex flex-col items-center justify-center">
                <div className="p-10 bg-white rounded-[48px] shadow-2xl flex flex-col items-center">
                    <Loader2 size={48} className="text-amber-500 animate-spin mb-6" />
                    <p className="text-xl font-black text-gray-900 uppercase tracking-widest">Đang tải bài thi...</p>
                </div>
            </div>
        );
    }

    if (!attempt) return null;

    // View: Start Modal
    if (showStartModal && attempt.status === 'in_progress' && !explicitAttemptId) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
                <div className="bg-white max-w-2xl w-full rounded-[48px] p-12 shadow-2xl space-y-8 text-center animate-in zoom-in duration-500">
                    <div className="space-y-4">
                        <h2 className="text-4xl font-bold text-gray-900 ">Sẵn sàng làm bài?</h2>
                        <p className="text-gray-500 font-medium text-lg leading-relaxed">
                            {quiz?.antiCheat ? (
                                <>Để đảm bảo sự công bằng, bài thi sẽ được thực hiện ở chế độ <span className="font-bold text-amber-500">Toàn màn hình</span>. Bạn không được thoát khỏi màn hình này cho đến khi nộp bài.</>
                            ) : (
                                <>Sẵn sàng bắt đầu bài kiểm tra của bạn chưa? Hãy tập trung hoàn thành tốt nhất có thể nhé.</>
                            )}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                            <Clock className="mx-auto mb-2 text-amber-500" size={24} />
                            <p className="text-sm font-bold text-gray-400">Thời gian</p>
                            <p className="text-xl font-bold text-gray-900">
                                {(quiz?.timeLimit || attempt.timeLimit) ? `${quiz?.timeLimit || attempt.timeLimit} Phút` : 'Không giới hạn'}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                            <FileText className="mx-auto mb-2 text-blue-500" size={24} />
                            <p className="text-sm font-bold text-gray-400">Số câu hỏi</p>
                            <p className="text-xl font-bold text-gray-900">{questions.length} Câu</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-4">
                        <button
                            onClick={requestFullscreen}
                            className="w-full bg-gray-900 text-white py-6 rounded-[32px] font-bold text-sm hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer"
                        >
                            Bắt đầu làm bài
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full bg-white text-gray-400 py-4 rounded-[32px] font-bold text-xs hover:text-gray-900 transition-all cursor-pointer"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // View: Results
    const isCompleted = attempt.status === 'submitted' || attempt.status === 'graded' || !!attempt.completedAt || !!attempt.submittedAt;
    const isPlacement = (quiz?.type === 'placement' || (attempt as any).quiz?.type === 'placement');

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-[#FDF8EE] pb-20">
                {/* Result Header */}
                <div className="bg-gray-900 pt-32 pb-24 text-center px-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl"></div>
                    
                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-amber-500 text-xs font-black uppercase tracking-widest border border-white/5 mb-8">
                           {isPlacement ? 'Phân tích năng lực đầu vào' : 'Kết quả bài kiểm tra'}
                        </div>
                        
                        <h1 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight">
                            {quiz?.title || attempt.quiz?.title || 'KẾT QUẢ BÀI THI'}
                        </h1>

                        {isPlacement && attempt.level && (
                            <div className="mb-12 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Phân loại cấp độ của bạn:</p>
                                <div className="text-5xl md:text-6xl font-black text-amber-400 underline decoration-white/20 underline-offset-8">
                                    {attempt.level}
                                </div>
                            </div>
                        )}

                        {isTeacher && (attempt as any).user && (
                            <div className="flex flex-col items-center gap-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                                <h2 className="text-xl font-bold text-white">
                                    {(attempt as any).user.name || (attempt as any).user.username}
                                </h2>
                                <p className="text-gray-400 font-bold text-sm">
                                    {(attempt as any).user.email}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 text-center">
                            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 group hover:bg-white/10 transition-all">
                                <p className="text-[12px] font-bold text-gray-400 mb-2">Điểm số</p>
                                <h3 className="text-2xl font-bold text-white">
                                    {attempt.score}<span className="text-xl text-gray-500">/{attempt.maxScore || attempt.quiz?.maxScore || 100}</span>
                                </h3>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 group hover:bg-white/10 transition-all">
                                <p className="text-[12px] font-bold text-gray-400 mb-2">Tỉ lệ</p>
                                <h3 className="text-2xl font-bold text-white">{attempt.percentageScore}%</h3>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 group hover:bg-white/10 transition-all">
                                <p className="text-[12px] font-bold text-gray-400 mb-2">Câu đúng</p>
                                <h3 className="text-2xl font-bold text-white">
                                    {attempt.summary?.correctCount ?? (results || []).filter(r => r?.isCorrect).length}
                                    <span className="text-xl text-gray-500">/{attempt.summary?.totalQuestions ?? (results?.length || questions.length || '--')}</span>
                                </h3>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 group hover:bg-white/10 transition-all">
                                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2">Kết quả</p>
                                <h3 className={`text-2xl font-bold ${attempt.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {attempt.passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto -mt-12 px-4 space-y-12">
                    {/* Placement Recommendations */}
                    {isPlacement && attempt.suggestedCourses && attempt.suggestedCourses.length > 0 && (
                        <div className="bg-white rounded-[48px] p-10 md:p-16 shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
                           
                           <div className="relative z-10 space-y-10">
                               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                   <div className="space-y-2">
                                       <div className="flex items-center gap-3 text-amber-600 font-black uppercase text-xs tracking-[0.2em]">
                                           <Sparkles size={16} /> Lộ trình học tập đề xuất
                                       </div>
                                       <h2 className="text-3xl font-black text-gray-900">Dành riêng cho <span className="text-amber-500">năng lực</span> của bạn</h2>
                                   </div>
                                    <button 
                                        onClick={() => navigate('/')} 
                                        className="px-10 py-5 bg-gray-900 text-white rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl active:scale-95 cursor-pointer"
                                    >
                                        Về trang lộ trình
                                    </button>
                               </div>

                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                   {attempt.suggestedCourses.map((course: any) => (
                                       <div 
                                           key={course.id}
                                           onClick={() => navigate(`/course/${course.id}`)}
                                           className="bg-gray-50/50 border border-gray-100 p-3 rounded-[40px] hover:bg-white hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-500/10 transition-all cursor-pointer group/card h-full flex flex-col"
                                       >
                                           <div className="aspect-video rounded-[32px] overflow-hidden mb-4 relative">
                                                <img src={course.imageUrl || '/elearning-1.jpg'} alt="" className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700" />
                                                <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-2xl text-[10px] font-black uppercase text-amber-600 shadow-xl">
                                                    {course.level || 'Tất cả'}
                                                </div>
                                           </div>
                                           <div className="flex-1 px-3 pb-4 space-y-2">
                                                <h3 className="font-black text-gray-900 leading-tight group-hover/card:text-amber-600 transition-colors uppercase italic text-sm line-clamp-2">
                                                    {course.title}
                                                </h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {course.duration || '0:00'} • {course.price === 0 ? 'Miễn phí' : `${course.price?.toLocaleString()}đ`}
                                                </p>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                        </div>
                    )}

                    {/* Score breakdown & Review */}
                    <div className="bg-white rounded-3xl p-10 shadow-2xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-xl font-bold text-gray-900">Xem lại câu hỏi</h2>
                            <button
                                onClick={() => navigate(-1)}
                                className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-amber-600 transition-all cursor-pointer"
                            >
                                <ArrowLeft size={16} />
                                Quay lại
                            </button>
                        </div>

                        <div className="space-y-12">
                            {(questions || []).map((q: any, idx: number) => {
                                const m = extractMedia(q?.content || '');
                                const safeResults = results || [];
                                const result = safeResults.find(r => r && String(r.questionId) === String(q?.id));
                                const isCorrect = result ? result.isCorrect : false;
                                const isEssay = q?.type === 'essay';

                                return (
                                    <div key={idx} className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-sm ${isCorrect ? 'bg-emerald-50 text-emerald-600' : isEssay ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-lg font-bold text-gray-900 leading-relaxed mb-4">{m.cleaned}</div>

                                                {(m.image || m.audio || m.video) && (
                                                    <div className="mb-6 p-4 bg-gray-50 rounded-3xl border border-gray-100 inline-block max-w-full">
                                                        {m.image && <img src={m.image} alt="Question" className="max-h-64 rounded-2xl shadow-sm" />}
                                                        {m.audio && <audio src={m.audio} controls className="w-full mt-2" />}
                                                        {m.video && <video src={m.video} controls className="max-h-64 rounded-2xl mt-2" />}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className={`p-4 rounded-2xl border-2 ${isEssay ? 'bg-amber-50 border-amber-100' : isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                                            {isEssay ? 'Bài làm của bạn' : 'Câu trả lời của bạn'}
                                                        </p>
                                                        <p className={`font-bold ${isEssay ? 'text-amber-700' : isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                            {result?.userAnswer || '(Trống)'}
                                                        </p>
                                                    </div>

                                                    {!isEssay && (quiz?.showResults !== false) && (
                                                        <div className="p-4 rounded-2xl bg-gray-50 border-2 border-gray-100">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Đáp án đúng</p>
                                                            <p className="font-bold text-gray-700">{result?.correctAnswer || q.correctAnswer}</p>
                                                        </div>
                                                    )}

                                                    {isEssay && (
                                                        <div className="p-4 rounded-2xl bg-amber-50/50 border-2 border-amber-100/50">
                                                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Trạng thái chấm điểm</p>
                                                            <p className="font-bold text-amber-700">Đang chờ giảng viên chấm</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {(quiz?.showResults !== false) && result?.explanation && (
                                                    <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Giải thích</p>
                                                        <p className="text-sm font-medium text-amber-800">{result.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {idx < questions.length - 1 && <div className="h-px bg-gray-100"></div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // View: Taking Quiz
    const m = currentQuestion ? extractMedia(currentQuestion.content) : { cleaned: '', image: null, audio: null, video: null };

    return (
        <div className="min-h-screen bg-[#FDF8EE] flex flex-col">
            {/* Quiz Header */}
            <div className="h-20 bg-gray-900 flex items-center justify-between px-6 sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 hover:bg-white/10 rounded-2xl text-white transition-all cursor-pointer"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-white font-black text-sm uppercase tracking-tight line-clamp-1">
                            {quiz?.title || attempt.quiz?.title || 'BÀI KIỂM TRA'}
                        </h2>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Câu hỏi {currentQuestionIndex + 1} / {questions.length}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {(quiz?.timeLimit || attempt.timeLimit) ? (
                        <div className={`hidden md:flex items-center gap-3 px-6 py-2.5 rounded-full border-2 ${timeLeft < 300 ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-white/5 border-white/10 text-white shadow-xl'} transition-all duration-500`}>
                            <Clock size={18} className={timeLeft < 300 ? 'animate-pulse' : ''} />
                            <span className="text-lg font-black tracking-tighter tabular-nums">{formatTime(timeLeft)}</span>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-3 px-6 py-2.5 rounded-full border-2 bg-white/5 border-white/10 text-gray-400">
                             <Clock size={18} />
                             <span className="text-sm font-black tracking-widest uppercase">Vô hạn thời gian</span>
                        </div>
                    )}
                    <button
                        onClick={handleConfirmSubmit}
                        disabled={submitting}
                        className="bg-amber-500 text-gray-900 px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                    >
                        {submitting ? 'ĐANG NỘP...' : 'NỘP BÀI'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                {/* Main Question Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20">
                    <div className="max-w-4xl mx-auto space-y-12">
                        {/* Question Content */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <span className="w-30 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-xl font-bold">
                                    Câu {currentQuestionIndex + 1} :
                                </span>
                                <div className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                                    {m.cleaned}
                                </div>
                            </div>

                            {/* Media Section */}
                            {(m.image || m.audio || m.video) && (
                                <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-xl inline-block max-w-full">
                                    {m.image && (
                                        <div className="relative group">
                                            <img src={m.image} alt="Question" className="max-h-[500px] rounded-3xl shadow-lg border border-gray-100" />
                                            <div className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-2xl shadow-xl">
                                                <ImageIcon size={20} className="text-gray-900" />
                                            </div>
                                        </div>
                                    )}

                                    {m.audio && (
                                        <div className="flex flex-col gap-4 min-w-[300px]">
                                            <div className="flex items-center gap-4 text-amber-600 font-black uppercase tracking-widest text-[10px]">
                                                <Volume2 size={16} /> Nghe File âm thanh
                                            </div>
                                            <audio src={m.audio} controls className="w-full" />
                                        </div>
                                    )}

                                    {m.video && (
                                        <div className="relative group">
                                            <div className="flex items-center gap-4 text-amber-600 font-black uppercase tracking-widest text-[10px] mb-4">
                                                <PlayCircle size={16} /> Xem Video đính kèm
                                            </div>
                                            <video src={m.video} controls className="max-h-[500px] rounded-3xl shadow-2xl bg-black" />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 pt-10">
                                {currentQuestion?.type === 'multiple_choice' && getSafeOptions(currentQuestion).map((opt: string, idx: number) => {
                                    const isSelected = answers[String(currentQuestion.id)] === opt;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswerChange(currentQuestion.id, opt)}
                                            className={`group w-full text-left p-2 md:p-3 rounded-[32px] border-2 transition-all duration-500 flex items-center gap-8 ${isSelected ? 'bg-amber-500 border-amber-500 shadow-2xl shadow-amber-200 scale-102' : 'bg-white border-white hover:border-amber-200 hover:shadow-xl'
                                                } cursor-pointer`}
                                        >
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${isSelected ? 'bg-white text-gray-900 scale-110 shadow-lg' : 'bg-gray-100 text-gray-400 group-hover:bg-amber-100 '}`}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <div className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                                                {opt}
                                            </div>
                                            {isSelected && <CheckCircle2 size={28} className="ml-auto text-white animate-in zoom-in" />}
                                        </button>
                                    );
                                })}

                                {currentQuestion?.type === 'true_false' && (
                                    <div className="grid grid-cols-2 gap-8 h-20">
                                        {['true', 'false'].map((v: string) => {
                                            const isSelected = answers[String(currentQuestion.id)] === v;
                                            const isTrue = v === 'true';
                                            return (
                                                <button
                                                    key={v}
                                                    onClick={() => handleAnswerChange(currentQuestion.id, v)}
                                                    className={`group  rounded-[48px] border-4 transition-all duration-700 flex items-center justify-center gap-4 ${isSelected
                                                        ? isTrue ? 'bg-emerald-500 border-emerald-500 shadow-2xl shadow-emerald-200 text-white' : 'bg-rose-500 border-rose-500 shadow-2xl shadow-rose-200 text-white'
                                                        : 'bg-white border-white hover:border-gray-100 text-gray-400 hover:text-gray-900 shadow-xl'
                                                        } cursor-pointer`}
                                                >
                                                    <span className="text-xl font-bold uppercase tracking-tighter">
                                                        {v === 'true' ? 'TRUE' : 'FALSE'}
                                                    </span>
                                                    {isSelected && <CheckCircle2 size={30} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {currentQuestion?.type === 'short_answer' && (
                                    <div className="space-y-4">
                                        <div className="text-md font-bold text-amber-600 mb-2 px-2">Nhập đáp án của bạn:</div>
                                        <input
                                            type="text"
                                            value={answers[String(currentQuestion.id)] || ''}
                                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                            className="w-full bg-white rounded-xl px-3 py-3 border-2 border-gray-200 focus:border-amber-500 outline-none font-black text-md text-gray-900 transition-all placeholder:text-gray-200"
                                            placeholder=""
                                            autoFocus
                                        />
                                    </div>
                                )}

                                {currentQuestion?.type === 'essay' && (
                                    <div className="space-y-4">
                                        <div className="text-md font-bold text-amber-600 mb-2 px-2">Nhập bài luận của bạn:</div>
                                        <textarea
                                            value={answers[String(currentQuestion.id)] || ''}
                                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                            className="w-full bg-white rounded-xl px-10 py-10 border-2 border-gray-200 focus:border-amber-500 outline-none font-medium text-md text-gray-900 transition-all placeholder:text-gray-200 min-h-[400px] leading-relaxed"
                                            placeholder="Ghi lại suy nghĩ của bạn tại đây..."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pagination Buttons */}
                        <div className="flex items-center justify-between pt-12 border-t border-gray-100">
                            <button
                                disabled={currentQuestionIndex === 0}
                                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                className="group flex items-center gap-4 px-8 py-5 rounded-3xl font-bold text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:bg-white transition-all disabled:opacity-0 cursor-pointer"
                            >
                                <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                                CÂU TRƯỚC
                            </button>

                            <div className="flex gap-2">
                                {(questions || []).map((_: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${idx === currentQuestionIndex ? 'bg-amber-500 w-8' : answers[String(questions[idx]?.id)] ? 'bg-gray-400' : 'bg-gray-200'}`}
                                    />
                                ))}
                            </div>

                            {currentQuestionIndex < questions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                    className="group flex items-center gap-4 px-10 py-5 bg-gray-900 text-white rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl active:scale-95 cursor-pointer"
                                >
                                    CÂU TIẾP
                                    <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleConfirmSubmit}
                                    disabled={submitting}
                                    className="px-10 py-5 bg-emerald-500 text-white rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 cursor-pointer"
                                >
                                    HOÀN TẤT & NỘP BÀI
                                </button>
                            )}
                        </div>
                    </div>
                </main>

                {/* Sidebar Navigation */}
                <aside className="hidden lg:block w-96 bg-white border-l border-gray-100 overflow-y-auto p-10">
                    <div className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <FileText size={20} className="text-amber-500" />
                        Danh sách câu hỏi
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {(questions || []).map((q: any, idx: number) => {
                            const isCurrent = idx === currentQuestionIndex;
                            const isAnswered = !!answers[String(q?.id)];
                            return (
                                <button
                                    key={q?.id || idx}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={`h-12 rounded-xl flex items-center justify-center font-black text-sm transition-all border-2 cursor-pointer ${isCurrent ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100 scale-110' : isAnswered ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-100 text-gray-400 hover:border-amber-200 hover:text-amber-600'}`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-12 p-8 bg-gray-50 rounded-[20px] border border-gray-100">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Chú thích</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-amber-500 shadow-lg shadow-amber-200"></div>
                                <span className="text-xs font-bold text-gray-600">Đang làm</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-gray-900"></div>
                                <span className="text-xs font-bold text-gray-600">Đã trả lời</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                                <span className="text-xs font-bold text-gray-600">Chưa làm</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Submission Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white max-w-lg w-full rounded-[48px] p-10 shadow-2xl relative animate-in zoom-in duration-500">
                        <div className="text-center space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-tighter">Xác nhận nộp bài?</h3>
                                <p className="text-red-500 font-medium mt-4">
                                    Vui lòng kiểm tra lại tất cả các câu hỏi trước khi nộp. Bạn sẽ không thể sửa đổi đáp án sau khi hoàn tất.
                                </p>
                            </div>

                            {/* Summary Statistics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Đã trả lời</p>
                                    <p className="text-3xl font-bold text-emerald-500">
                                        {Object.keys(answers).filter(id => !!answers[id]).length}
                                        <span className="text-sm text-gray-300 ml-1">/{questions.length}</span>
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Chưa làm</p>
                                    <p className="text-3xl font-bold text-rose-500">
                                        {questions.length - Object.keys(answers).filter(id => !!answers[id]).length}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={() => handleSubmit()}
                                    className="w-full bg-gray-900 text-white py-5 rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer"
                                >
                                    NỘP BÀI NGAY
                                </button>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="w-full bg-white text-gray-500 py-5 rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all cursor-pointer"
                                >
                                    QUAY LẠI KIỂM TRA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Cheat Warning Modal */}
            {showCheatWarning && attempt?.status === 'in_progress' && (
                <div className="fixed inset-0 z-200 flex items-center justify-center bg-rose-900/60 backdrop-blur-xl p-4 animate-in zoom-in duration-300">
                    <div className="bg-white max-w-md w-full rounded-[40px] p-10 shadow-2xl text-center space-y-6">
                        <h3 className="text-2xl font-bold text-gray-900">Vui lòng quay lại bài thi!</h3>
                        <p className="text-gray-500 font-medium">
                            Hệ thống ghi nhận bạn đã rời khỏi màn hình làm bài <span className="text-rose-600 font-bold">{violationsCount} lần</span>.
                        </p>
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <p className="text-xs font-bold text-rose-600 leading-relaxed">
                                Nếu vi phạm quá <span className="text-lg">5 lần</span>, bài thi sẽ bị tự động nộp và ghi nhận gian lận.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setShowCheatWarning(false);
                                if (!document.fullscreenElement) {
                                    requestFullscreen();
                                }
                            }}
                            className="w-full bg-gray-900 text-white py-5 rounded-3xl font-black text-sm hover:bg-rose-600 transition-all shadow-xl active:scale-95 cursor-pointer"
                        >
                            Quay lại làm bài
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TakeQuiz;
