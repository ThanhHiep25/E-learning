import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Clock, CheckCircle2,
    ChevronLeft, Loader2,
    ArrowLeft,
    FileText, Sparkles, Trophy, Award
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
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [warnedOneMin, setWarnedOneMin] = useState(false);
    const [violationsCount, setViolationsCount] = useState(0);
    const [violationLogs, setViolationLogs] = useState<{ type: string; time: string; message: string }[]>([]);
    const [showStartModal, setShowStartModal] = useState(true);
    const [isResumed, setIsResumed] = useState(false);
    const [maxAttemptsError, setMaxAttemptsError] = useState<string | null>(null);
    const [finalQuizRewards, setFinalQuizRewards] = useState<{ certificate?: any; levelUp?: any } | null>(null);
    const initialLoadCalled = useRef(false);
    const isSubmittingRef = useRef(false);
    const lastViolationTimeRef = useRef<{ time: number; type: string }>({ time: 0, type: '' });
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const quizStateRef = useRef({ answers, violationsCount, violationLogs });
    const timerPausedRef = useRef(false);

    useEffect(() => {
        quizStateRef.current = { answers, violationsCount, violationLogs };
    }, [answers, violationsCount, violationLogs]);

    /** Compute timer from server remainingSeconds or fall back to client-side calc */
    const computeTimeLeft = (currentAttempt: QuizAttempt, timeLimit?: number): number => {
        // Prefer server-provided remainingSeconds (accurate, set during auto-submit check)
        if (typeof currentAttempt.remainingSeconds === 'number' && currentAttempt.remainingSeconds > 0) {
            return currentAttempt.remainingSeconds;
        }
        // Fallback: calculate from startedAt
        const limit = timeLimit || currentAttempt.timeLimit;
        if (!limit) return 0;
        const elapsedSeconds = Math.floor((Date.now() - new Date(currentAttempt.startedAt).getTime()) / 1000);
        return Math.max(0, limit * 60 - elapsedSeconds);
    };

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
                console.log('[DEBUG TakeQuiz] detail:', detail);

                const attemptData = detail?.attempt as any;
                const quizData = (detail?.quiz || attemptData?.quiz) as any;
                console.log('[DEBUG TakeQuiz] attemptData:', attemptData, 'quizData:', quizData);

                setAttempt(attemptData);
                setQuiz(quizData);
                setResults((detail?.results || []) as any);

                // Set timer for explicit attempt
                const timeLimit = quizData?.timeLimit || attemptData?.timeLimit;
                if (timeLimit && attemptData?.status === 'in_progress') {
                    setTimeLeft(computeTimeLeft(attemptData, timeLimit));
                } else if (typeof attemptData?.remainingSeconds === 'number') {
                    setTimeLeft(attemptData.remainingSeconds);
                }

                let parsedAnswers = attemptData?.answers || {};
                if (typeof parsedAnswers === 'string') {
                    try { parsedAnswers = JSON.parse(parsedAnswers); } catch { parsedAnswers = {}; }
                }
                setAnswers(parsedAnswers);
                // Keep start modal open for in_progress attempts so user sees quiz info
                if (attemptData?.status !== 'in_progress') {
                    setShowStartModal(false);
                } else {
                    setIsResumed(true);
                }
                return;
            }

            const res = await quizService.startQuiz(id);

            const currentAttempt = res.attempt;
            const currentQuiz = res.quiz || currentAttempt?.quiz;

            // Normalize status if missing
            if (currentAttempt && !currentAttempt.status) {
                currentAttempt.status = currentAttempt.completedAt || currentAttempt.submittedAt ? 'submitted' : 'in_progress';
            }

            setAttempt(currentAttempt);
            setQuiz(currentQuiz);
            setAnswers(currentAttempt?.answers || {});
            setShowStartModal(false);

            // Mark as resumed if server says so
            if (res.resumed) setIsResumed(true);

            if (currentAttempt?.status === 'submitted' || currentAttempt?.status === 'graded') {
                const detail = await quizService.getAttemptDetail(String(currentAttempt.id));
                setResults(detail.results || []);
            }

            // Set timer — use server remainingSeconds
            const timeLimit = currentQuiz?.timeLimit || currentAttempt?.timeLimit;
            if (currentAttempt?.status === 'in_progress' && timeLimit) {
                const remaining = computeTimeLeft(currentAttempt, timeLimit);
                setTimeLeft(remaining);
                if (remaining === 0) toast.error('Bài kiểm tra này đã hết thời gian làm bài.');
            }
        } catch (err: any) {
            console.error('Quiz load error:', err);

            // maxAttempts exceeded — show a clear message
            const errMsg: string = err?.payload?.message || err?.message || '';
            if (err.status === 403 && (errMsg.includes('tối đa') || errMsg.includes('maxAttempts'))) {
                const { maxAttempts, usedAttempts } = err?.payload?.data || {};
                setMaxAttemptsError(
                    `Bạn đã làm bài ${usedAttempts ?? ''}/${maxAttempts ?? ''} lần — đã đạt tối đa số lần cho phép.`
                );
                return;
            }

            // Handle 409 Conflict - resume existing attempt
            if (err.status === 409 && err.payload?.data?.attempt) {
                const existingAttempt = err.payload.data.attempt;
                const quizData = err.payload.data.quiz || existingAttempt?.quiz;

                if (!existingAttempt.status) {
                    existingAttempt.status = existingAttempt.completedAt || existingAttempt.submittedAt ? 'submitted' : 'in_progress';
                }

                setAttempt(existingAttempt);
                setQuiz(quizData);
                setAnswers(existingAttempt.answers || {});
                setIsResumed(true);

                const timeLimit = quizData?.timeLimit || existingAttempt.timeLimit;
                if (timeLimit) {
                    setTimeLeft(computeTimeLeft(existingAttempt, timeLimit));
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
        console.log('[DEBUG TakeQuiz] useEffect loadQuiz, initialLoadCalled=', initialLoadCalled.current);
        if (initialLoadCalled.current) return;
        initialLoadCalled.current = true;
        loadQuiz();
    }, [loadQuiz]);

    // ⏸️ Pause timer when tab hidden, refresh from server when visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                timerPausedRef.current = true;
            } else {
                timerPausedRef.current = false;
                // Refresh remaining time from server when tab becomes visible
                if (attempt?.status === 'in_progress' && attempt?.id) {
                    quizService.getAttemptDetail(String(attempt.id)).then(detail => {
                        if (typeof detail?.attempt?.remainingSeconds === 'number') {
                            setTimeLeft(detail.attempt.remainingSeconds);
                        }
                    }).catch(() => {});
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [attempt]);

    // 🛡️ P0-1 FIX: Timer effect with proper cleanup and race condition prevention
    useEffect(() => {
        // Only start timer when in progress and not submitting and not paused
        if (attempt?.status !== 'in_progress' || submitting || timeLeft <= 0 || timerPausedRef.current) {
            // Cleanup existing timer if status changes
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        // Warning at 1 minute
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

        // Create interval only if not exists (prevent duplicate)
        if (!timerRef.current) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        // Timer will be cleaned up by effect when status changes
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        // Cleanup function
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [attempt?.status, submitting]); // 🛡️ Remove timeLeft from deps to prevent recreate

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

        // 🛡️ P0-1 FIX: Clear timer before submitting to prevent race
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

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
            if (res.certificate || res.levelUp) {
              setFinalQuizRewards({ certificate: res.certificate, levelUp: res.levelUp });
            }
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
        // if (type.includes('VISIBLE') || type.includes('BLUR') || type.includes('WINDOW') || type.includes('FULLSCREEN')) {
        //     setShowCheatWarning(true);
        // }
        
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

    if (!attempt && maxAttemptsError) {
        return (
            <div className="min-h-screen bg-[#FDF8EE] flex flex-col items-center justify-center p-6">
                <div className="bg-white max-w-md w-full rounded-[48px] p-12 shadow-2xl space-y-6 text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-4xl">🚫</span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">Đã hết lượt làm bài</h2>
                    <p className="text-gray-500 font-medium">{maxAttemptsError}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full bg-gray-900 text-white py-4 rounded-[24px] font-bold hover:bg-amber-600 transition-all cursor-pointer"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    if (!attempt) return null;

    // View: Start Modal
    if (showStartModal && attempt.status === 'in_progress') {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
                <div className="bg-white max-w-2xl w-full rounded-[48px] p-12 shadow-2xl space-y-8 text-center animate-in zoom-in duration-500">
                    <div className="space-y-4">
                        {isResumed && (
                            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-2">
                                ⏱️ Tiếp tục bài làm trước
                            </div>
                        )}
                        <h2 className="text-4xl font-bold text-gray-900">{isResumed ? 'Tiếp tục làm bài?' : 'Sẵn sàng làm bài?'}</h2>
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
                                {(quiz?.timeLimit || attempt.timeLimit)
                                    ? isResumed
                                        ? `Còn ${Math.floor(timeLeft / 60)}p ${timeLeft % 60}s`
                                        : `${quiz?.timeLimit || attempt.timeLimit} Phút`
                                    : 'Không giới hạn'}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                            <FileText className="mx-auto mb-2 text-blue-500" size={24} />
                            <p className="text-sm font-bold text-gray-400">Số câu hỏi</p>
                            <p className="text-xl font-bold text-gray-900">{questions.length} Câu</p>
                        </div>
                        {quiz?.maxAttempts && (
                            <div className="bg-red-50 p-4 rounded-3xl border border-red-100 col-span-2">
                                <p className="text-sm font-bold text-red-400">
                                    ⚠️ Giới hạn {quiz.maxAttempts} lần làm bài
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4 pt-4">
                        <button
                            onClick={requestFullscreen}
                            className="w-full bg-gray-900 text-white py-6 rounded-[32px] font-bold text-sm hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer"
                        >
                            {isResumed ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài'}
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
    console.log('[DEBUG TakeQuiz] Render state - attempt.status:', attempt.status, 'completedAt:', attempt.completedAt, 'submittedAt:', attempt.submittedAt, 'isCompleted:', isCompleted, 'quiz:', quiz?.title, 'timeLeft:', timeLeft);
    const isPlacement = (quiz?.type === 'placement' || (attempt as any).quiz?.type === 'placement');

    // Time expired overlay
    if (!isCompleted && timeLeft === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="bg-white rounded-[32px] p-12 shadow-xl border border-gray-100 text-center max-w-md">
                    <Clock className="w-16 h-16 text-rose-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Hết thời gian!</h2>
                    <p className="text-gray-500 mb-8">Bài kiểm tra này đã hết thời gian làm bài.</p>
                    <button
                        onClick={() => navigate(`/final-quiz/${(quiz as any)?.level || ''}`)}
                        className="px-8 py-4 bg-amber-500 text-gray-900 rounded-2xl font-black hover:bg-amber-600 transition-all"
                    >
                        Bắt đầu bài mới
                    </button>
                </div>
            </div>
        );
    }

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
                            {quiz?.title || attempt?.quiz?.title || 'KẾT QUẢ BÀI THI'}
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
                                    {attempt.score}<span className="text-xl text-gray-500">/{attempt.maxScore || attempt?.quiz?.maxScore || 100}</span>
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
                                <h3 className={`text-2xl font-bold ${attempt.passed === true ? 'text-emerald-400' : attempt.passed === false ? 'text-rose-400' : 'text-amber-400'}`}>
                                    {attempt.passed === true ? 'ĐẠT' : attempt.passed === false ? 'KHÔNG ĐẠT' : 'CHỜ CHẤM ĐIỂM'}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto -mt-12 px-4 space-y-12">
                    {/* Final Quiz Rewards */}
                    {finalQuizRewards && (
                        <div className="bg-white rounded-[48px] p-10 md:p-16 shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
                            <div className="relative z-10 text-center space-y-6">
                                <Trophy size={48} className="mx-auto text-amber-500" />
                                <h2 className="text-2xl md:text-3xl font-black text-gray-900">Chúc mừng bạn!</h2>
                                {finalQuizRewards.certificate && (
                                    <div className="space-y-2">
                                        <p className="text-gray-600 font-medium">Bạn đã nhận được chứng chỉ</p>
                                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-lg border border-emerald-100">
                                            <Award size={20} />
                                            Chứng chỉ hoàn thành khóa học {(quiz as any)?.level || ''}
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono">ID: {finalQuizRewards.certificate.certificateId}</p>
                                    </div>
                                )}
                                {finalQuizRewards.levelUp?.leveledUp && (
                                    <div className="space-y-2">
                                        <p className="text-gray-600 font-medium">Bạn đã mở khóa lộ trình tiếp theo</p>
                                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-violet-50 text-violet-700 rounded-2xl font-black text-lg border border-violet-100">
                                            <Sparkles size={20} />
                                            Lộ trình {finalQuizRewards.levelUp.newLevel}
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                    {finalQuizRewards.certificate && (
                                        <button
                                            onClick={() => navigate(`/verify-level/${finalQuizRewards!.certificate.certificateId}`)}
                                            className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl cursor-pointer"
                                        >
                                            Xem chứng chỉ
                                        </button>
                                    )}
                                    <button
                                        onClick={() => navigate('/my-path')}
                                        className="px-8 py-4 bg-amber-500 text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl cursor-pointer"
                                    >
                                        Về lộ trình học
                                    </button>
                                    <button
                                        onClick={() => navigate('/my-learning')}
                                        className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all cursor-pointer"
                                    >
                                        Tiếp tục học tập
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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
                                                    {course.durationType === 'lifetime' 
                                                        ? 'Vĩnh viễn' 
                                                        : course.durationType === 'fixed' && course.durationValue
                                                            ? `${course.durationValue} ${course.durationUnit === 'months' ? 'tháng' : course.durationUnit === 'years' ? 'năm' : 'ngày'}`
                                                            : 'Vĩnh viễn'
                                                    } • {course.price === 0 ? 'Miễn phí' : `${course.price?.toLocaleString()}đ`}
                                                </p>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                        </div>
                    )}

                    {/* Score breakdown & Review */}
                    <div className="bg-white rounded-[48px] p-10 md:p-16 shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        
                        <div className="relative z-10 flex items-center justify-between mb-12">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-gray-900">Chi tiết câu hỏi</h2>
                                <p className="text-gray-500 font-medium">Xem lại đáp án và giải thích</p>
                            </div>
                            <button
                                onClick={() => navigate(-1)}
                                className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-amber-600 transition-all cursor-pointer shadow-xl"
                            >
                                <ArrowLeft size={16} />
                                Quay lại
                            </button>
                        </div>

                        <div className="space-y-8">
                            {(questions || []).map((q: any, idx: number) => {
                                const m = extractMedia(q?.content || '');
                                const safeResults = results || [];
                                const result = safeResults.find(r => r && String(r.questionId) === String(q?.id));
                                const isCorrect = result ? result.isCorrect : false;
                                const isEssay = q?.type === 'essay';

                                return (
                                    <div key={idx} className="bg-gray-50 rounded-3xl p-8 border-2 border-gray-100 hover:border-gray-200 transition-all">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl shadow-lg ${isCorrect ? 'bg-emerald-500 text-white' : isEssay ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xl font-bold text-gray-900 leading-relaxed mb-2">{m.cleaned}</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                                        {q.points || 1} điểm
                                                    </span>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-700' : isEssay ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {isCorrect ? 'ĐÚNG' : isEssay ? 'CHỜ CHẤM' : 'SAI'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {(m.image || m.audio || m.video) && (
                                            <div className="mb-6 p-4 bg-white rounded-2xl border border-gray-200 inline-block max-w-full">
                                                {m.image && <img src={m.image} alt="Question" className="max-h-64 rounded-xl shadow-sm" />}
                                                {m.audio && <audio src={m.audio} controls className="w-full mt-2" />}
                                                {m.video && <video src={m.video} controls className="max-h-64 rounded-xl mt-2" />}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className={`p-4 rounded-2xl border-2 ${isEssay ? 'bg-amber-50 border-amber-200' : isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                                    {isEssay ? 'Bài làm của bạn' : 'Câu trả lời của bạn'}
                                                </p>
                                                <p className={`font-bold ${isEssay ? 'text-amber-700' : isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {result?.userAnswer || '(Trống)'}
                                                </p>
                                            </div>

                                            {!isEssay && (quiz?.showResults !== false) ? (
                                                <div className="p-4 rounded-2xl bg-white border-2 border-gray-200">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Đáp án đúng</p>
                                                    <p className="font-bold text-gray-700">{result?.correctAnswer || q.correctAnswer}</p>
                                                </div>
                                            ) : !isEssay && (
                                                <div className="p-4 rounded-2xl bg-gray-100 border-2 border-gray-200">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Đáp án đúng</p>
                                                    <p className="font-bold text-gray-500 italic">Đã bị ẩn bởi giáo viên</p>
                                                </div>
                                            )}

                                            {isEssay && (
                                                <div className="p-4 rounded-2xl bg-amber-50/50 border-2 border-amber-200/50">
                                                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Trạng thái chấm điểm</p>
                                                    <p className="font-bold text-amber-700">Đang chờ giảng viên chấm</p>
                                                </div>
                                            )}
                                        </div>

                                        {(quiz?.showResults !== false) && result?.explanation ? (
                                            <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Giải thích</p>
                                                <p className="text-sm font-medium text-blue-800">{result.explanation}</p>
                                            </div>
                                        ) : result?.explanation && (
                                            <div className="mt-4 p-4 bg-gray-100 rounded-2xl border border-gray-200">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Giải thích</p>
                                                <p className="text-sm font-medium text-gray-500 italic">Đã bị ẩn bởi giáo viên</p>
                                            </div>
                                        )}
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
    // Calculate progress
    const answeredCount = Object.keys(answers).length;
    const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-[#FDF8EE] flex flex-col">
            {/* Quiz Header */}
            <div className="bg-gray-900 flex flex-col sticky top-0 z-50">
                {/* Top Bar */}
                <div className="h-20 flex items-center justify-between px-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 hover:bg-white/10 rounded-2xl text-white transition-all cursor-pointer"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-white font-black text-sm uppercase tracking-tight line-clamp-1">
                                {quiz?.title || attempt?.quiz?.title || 'BÀI KIỂM TRA'}
                            </h2>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                {answeredCount} / {questions.length} câu đã trả lời
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

                {/* Progress Bar */}
                <div className="h-2 bg-gray-800">
                    <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                {/* Main Question Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20">
                    <div className="max-w-6xl mx-auto space-y-12">
                        {/* Questions List - Display 10 at a time */}
                        <div className="space-y-8">
                            {questions.map((q: any, idx: number) => {
                                const qm = extractMedia(q?.content || '');
                                const isAnswered = !!answers[String(q?.id)];
                                
                                return (
                                    <div key={q?.id || idx} id={`question-${idx}`} className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
                                        {/* Question Header */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${isAnswered ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                                                        {qm.cleaned}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                                            {q.points || 1} điểm
                                                        </span>
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                            {q.type === 'multiple_choice' ? 'Trắc nghiệm' : q.type === 'true_false' ? 'Đúng/Sai' : q.type === 'short_answer' ? 'Trả lời ngắn' : 'Tự luận'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Media Section */}
                                        {(qm.image || qm.audio || qm.video) && (
                                            <div className="mb-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 inline-block max-w-full">
                                                {qm.image && (
                                                    <div className="relative group">
                                                        <img src={qm.image} alt="Question" className="max-h-[300px] rounded-2xl shadow-sm" />
                                                    </div>
                                                )}
                                                {qm.audio && <audio src={qm.audio} controls className="w-full mt-2" />}
                                                {qm.video && <video src={qm.video} controls className="max-h-[300px] rounded-2xl mt-2" />}
                                            </div>
                                        )}

                                        {/* Answer Input */}
                                        <div className="space-y-4">
                                            {q?.type === 'multiple_choice' && getSafeOptions(q).map((opt: string, optIdx: number) => {
                                                const isSelected = answers[String(q.id)] === opt;
                                                return (
                                                    <button
                                                        key={optIdx}
                                                        onClick={() => handleAnswerChange(q.id, opt)}
                                                        className={`group w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 ${isSelected ? 'bg-amber-500 border-amber-500 shadow-lg' : 'bg-gray-50 border-gray-200 hover:border-amber-300 hover:bg-white'
                                                            } cursor-pointer`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${isSelected ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-600'}`}>
                                                            {String.fromCharCode(65 + optIdx)}
                                                        </div>
                                                        <div className={`font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                                                            {opt}
                                                        </div>
                                                        {isSelected && <CheckCircle2 size={20} className="ml-auto text-white" />}
                                                    </button>
                                                );
                                            })}

                                            {q?.type === 'true_false' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {['true', 'false'].map((v: string) => {
                                                        const isSelected = answers[String(q.id)] === v;
                                                        const isTrue = v === 'true';
                                                        return (
                                                            <button
                                                                key={v}
                                                                onClick={() => handleAnswerChange(q.id, v)}
                                                                className={`group rounded-2xl border-2 transition-all duration-300 flex items-center justify-center gap-3 p-4 ${isSelected
                                                                    ? isTrue ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-rose-500 border-rose-500 text-white'
                                                                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                                                                    } cursor-pointer`}
                                                            >
                                                                <span className="font-bold uppercase tracking-tighter">
                                                                    {v === 'true' ? 'TRUE' : 'FALSE'}
                                                                </span>
                                                                {isSelected && <CheckCircle2 size={20} />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {q?.type === 'short_answer' && (
                                                <input
                                                    type="text"
                                                    value={answers[String(q.id)] || ''}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    className="w-full bg-gray-50 rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-amber-500 outline-none font-medium text-gray-900 transition-all placeholder:text-gray-400"
                                                    placeholder="Nhập đáp án của bạn..."
                                                />
                                            )}

                                            {q?.type === 'essay' && (
                                                <textarea
                                                    value={answers[String(q.id)] || ''}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    className="w-full bg-gray-50 rounded-xl px-4 py-4 border-2 border-gray-200 focus:border-amber-500 outline-none font-medium text-gray-900 transition-all placeholder:text-gray-400 min-h-[200px] leading-relaxed"
                                                    placeholder="Nhập bài luận của bạn..."
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </main>

                {/* Sidebar Navigation - Quick Jump to Questions */}
                <aside className="hidden lg:block w-80 bg-white border-l border-gray-100 overflow-y-auto p-6">
                    <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <FileText size={18} className="text-amber-500" />
                        Danh sách câu hỏi
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {(questions || []).map((q: any, idx: number) => {
                            const isAnswered = !!answers[String(q?.id)];
                            return (
                                <button
                                    key={q?.id || idx}
                                    onClick={() => {
                                        const element = document.getElementById(`question-${idx}`);
                                        if (element) {
                                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }
                                    }}
                                    className={`h-10 rounded-lg flex items-center justify-center font-black text-sm transition-all border-2 cursor-pointer ${isAnswered ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-gray-100 border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600'}`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Chú thích</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-lg bg-emerald-500"></div>
                                <span className="text-xs font-bold text-gray-600">Đã trả lời</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-lg bg-gray-200"></div>
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
        </div>
    );
};

export default TakeQuiz;
