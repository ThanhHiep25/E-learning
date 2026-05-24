import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Compass, BookOpen, CheckCircle2, AlertCircle, Clock, Flame, Headphones, Play, Pause, PlayCircle } from 'lucide-react';
import type { PlacementQuiz, PlacementResult } from '../../services/adaptive.service';
import type { PlacementSessionResult } from '../../services/placement.service';
import { adaptiveService } from '../../services/adaptive.service';
import { placementService } from '../../services/placement.service';
import { categoryService } from '../../services/category.service';
import type { BackendCategory } from '../../services/category.service';
import { learningPathService } from '../../services/learningPath.service';
import toast from 'react-hot-toast';

import { useNavigate } from 'react-router-dom';

// Listening Question Player Component
interface ListeningQuestionPlayerProps {
    question: {
        id: number;
        content: string;
        options?: string[];
        audioText?: string;
        audioUrl?: string;
    };
    answer?: string;
    onAnswer: (answer: string) => void;
}

const ListeningQuestionPlayer: React.FC<ListeningQuestionPlayerProps> = ({ question, answer, onAnswer }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);

    const playAudio = () => {
        if (question.audioUrl) {
            // Play from URL if available
            const audio = new Audio(question.audioUrl);
            audio.play();
            setIsPlaying(true);
            audio.onended = () => {
                setIsPlaying(false);
                setHasPlayed(true);
            };
        } else if (question.audioText) {
            // Use Web Speech API as fallback
            const utterance = new SpeechSynthesisUtterance(question.audioText);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            utterance.onstart = () => setIsPlaying(true);
            utterance.onend = () => {
                setIsPlaying(false);
                setHasPlayed(true);
            };
            speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="space-y-6">
            {/* Audio Player */}
            <div className="bg-linear-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={playAudio}
                        disabled={isPlaying}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                            isPlaying
                                ? 'bg-indigo-300 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-lg shadow-indigo-500/30'
                        }`}
                    >
                        {isPlaying ? (
                            <Pause className="text-white" size={24} />
                        ) : (
                            <Play className="text-white ml-1" size={24} />
                        )}
                    </button>
                    <div className="flex-1">
                        <p className="font-bold text-gray-800 flex items-center gap-2">
                            <Headphones size={18} className="text-indigo-600" />
                            {isPlaying ? 'Đang phát audio...' : hasPlayed ? 'Nghe lại audio' : 'Nhấn để nghe audio'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {hasPlayed ? 'Bạn đã nghe xong. Chọn đáp án phù hợp.' : 'Hãy nghe kỹ đoạn audio và chọn đáp án đúng'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Question Content */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="font-medium text-gray-800">{question.content}</p>
            </div>

            {/* Options */}
            {Array.isArray(question.options) && (
                <div className="grid grid-cols-1 gap-3">
                    {question.options.map((opt: string, optIdx: number) => (
                        <button
                            key={optIdx}
                            onClick={() => onAnswer(opt)}
                            className={`w-full p-4 rounded-2xl text-left font-bold text-sm transition-all border-2 cursor-pointer ${
                                answer === opt
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md translate-x-1'
                                    : 'bg-white border-gray-50 text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <span className="flex w-6 h-6 rounded-lg bg-gray-100 items-center justify-center mr-3 text-[10px] text-gray-400 font-black uppercase">
                                {String.fromCharCode(65 + optIdx)}
                            </span>
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

interface LearningPathAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    initialCategory?: string;
}

type Step = 'choose-category' | 'choose-flow' | 'select-level' | 'taking-test' | 'results' | 'no-test' | 'retake-cooldown';

const LearningPathAssistant: React.FC<LearningPathAssistantProps> = ({ isOpen, onClose, onComplete, initialCategory }) => {
    const [step, setStep] = useState<Step>('select-level');
    const [_categories, setCategories] = useState<BackendCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<BackendCategory | null>(null);
    const [quiz, setQuiz] = useState<PlacementQuiz | null>(null);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [submittedQuestions, setSubmittedQuestions] = useState<Set<number>>(new Set()); // Track submitted questions
    const [answerFeedback, setAnswerFeedback] = useState<Record<number, { isCorrect: boolean; explanation?: string }>>({});
    const [fillBlankError, setFillBlankError] = useState<string | null>(null);
    const [result, setResult] = useState<PlacementResult & { sessionId?: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double-submit
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now()); // Track time per question
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [sessionResult, setSessionResult] = useState<PlacementSessionResult | null>(null);

    const [inProgressSession, setInProgressSession] = useState<any>(null);
    const [_progress, setProgress] = useState<{
    currentQuestion: number;
    totalQuestions: number;
    accuracy: number;
} | null>(null);
    const [_selectedSelfLevel, setSelectedSelfLevel] = useState<string | null>(null);
    const [retakeEligibility, setRetakeEligibility] = useState<{
        canRetake: boolean;
        nextRetakeAvailableAt?: string;
        cooldownDays: number;
        lastTestDate?: string;
    } | null>(null);
    // Animation state for question transition
    const [direction, setDirection] = useState(1);
    const [_isAnimating, _setIsAnimating] = useState(false);
    const [demoMode] = useState(() => window.location.search.includes('placement_demo=1'));
    const [demoPaused, setDemoPaused] = useState(false);
    const [adaptiveMetrics, setAdaptiveMetrics] = useState<any>(null);

// Debug: Track currentQuestionNumber changes
    useEffect(() => {
        console.log('[DEBUG] currentQuestionNumber changed to:', currentQuestionNumber);
    }, [currentQuestionNumber]);

    // Auto-assign learning path when results are ready (use CEFR level, not Vietnamese label)
    useEffect(() => {
        if (step === 'results') {
            const cefrLevel = sessionResult?.finalLevel || result?.level;
            // Map Vietnamese back to CEFR if needed
            const reverseMap: Record<string, string> = {
                'Cơ bản': 'A1', 'Sơ cấp': 'A2', 'Trung cấp': 'B1',
                'Trung cấp cao': 'B2', 'Nâng cao': 'C1', 'Thành thạo': 'C2',
            };
            const levelToSend = reverseMap[cefrLevel || ''] || cefrLevel;
            if (levelToSend && /^[A-C][1-2]$/.test(levelToSend)) {
                learningPathService.assignPath(levelToSend).catch(() => {});
            }
        }
    }, [step, sessionResult?.finalLevel, result?.level]);

    // Check for in-progress session when component opens (on any step)
    useEffect(() => {
        if (isOpen && (step === 'select-level' || step === 'choose-category')) {
            checkInProgressSession();
        }
    }, [isOpen, step]);

    const checkInProgressSession = async () => {
        try {
            console.log('[DEBUG] Checking in-progress session...');
            const response = await placementService.getCurrentSession();
            console.log('[DEBUG] getCurrentSession response:', response);
            
            // API may return session directly or wrapped in {success, data}
            const sessionData = response?.data || (response?.sessionId ? response : null);
            
            if (sessionData) {
                console.log('[DEBUG] Found in-progress session:', sessionData);
                setInProgressSession(sessionData);
            } else {
                console.log('[DEBUG] No in-progress session found');
                setInProgressSession(null);
            }
        } catch (err) {
            console.error('[DEBUG] Error checking in-progress session:', err);
            setInProgressSession(null);
        }
    };

    const checkRetakeEligibility = async () => {
        try {
            console.log('[DEBUG] Checking retake eligibility...');
            const eligibility = await placementService.checkRetakeEligibility();
            console.log('[DEBUG] Retake eligibility:', eligibility);
            setRetakeEligibility(eligibility);
            return eligibility;
        } catch (err) {
            console.error('[DEBUG] Error checking retake eligibility:', err);
            // If error, allow retake (fail open)
            return { canRetake: true, cooldownDays: 1 };
        }
    };

    const handleResumeTest = async () => {
        if (!inProgressSession) return;
        setLoading(true);
        try {
            console.log('[DEBUG] Resuming test, sessionId:', inProgressSession.sessionId);
            // Get current question from the session
            const nextQ = await adaptiveService.fetchNextQuestion(inProgressSession.sessionId, demoMode);
            console.log('[DEBUG] fetchNextQuestion returned:', nextQ);

            if (nextQ) {
                setQuiz({
                    id: inProgressSession.sessionId,
                    title: 'Bài kiểm tra đầu vào',
                    description: 'Tiếp tục bài test đang làm dở',
                    totalQuestions: inProgressSession.totalQuestions,
                    questions: [nextQ]
                });
                setCurrentQuestionIndex(0); // API returns current question, so always start at 0
                console.log('[DEBUG] Setting currentQuestionNumber to:', nextQ.currentQuestion);
                setCurrentQuestionNumber(nextQ.currentQuestion ?? null); // Store actual question number from API
                setQuestionStartTime(Date.now()); // Reset timer for resumed question
                setStep('taking-test');
            } else {
                // No more questions or session completed
                console.log('[DEBUG] No question returned, test may be completed');
                alert('Bài test đã hoàn thành hoặc không có câu hỏi nào.');
            }
        } catch (err) {
            console.error('[DEBUG] Resume test failed:', err);
            alert('Không thể tiếp tục bài test. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const navigate = useNavigate();

    // Fetch progress when in taking-test step
    useEffect(() => {
        if (step === 'taking-test' && quiz?.id) {
            const fetchProgress = async () => {
                try {
                    const progressData = await placementService.getProgress(quiz.id);
                    if (progressData) {
                        setProgress({
                            currentQuestion: progressData.currentQuestion,
                            totalQuestions: progressData.totalQuestions,
                            accuracy: progressData.accuracy
                        });
                    }
                } catch (err) {
                    console.error('Error fetching progress:', err);
                }
            };
            fetchProgress();
        }
    }, [step, quiz?.id]);

    useEffect(() => {
        if (isOpen) {
            loadCategories();
            if (initialCategory) {
                // Pre-select category if provided
            }
        }
    }, [isOpen]);

    const loadCategories = async () => {
        try {
            const res = await categoryService.listCategories();
            setCategories(res);
            if (initialCategory) {
                const found = res.find(c => c.name === initialCategory);
                if (found) {
                    setSelectedCategory(found);
                } else if (res.length > 0) {
                    setSelectedCategory(res[0]);
                }
            } else if (res.length > 0) {
                setSelectedCategory(res[0]);
            }
        } catch (err) {
            console.error(err);
        }
    };




    const handleSelectLevel = async (level: string) => {
        if (!selectedCategory) return;
        setSelectedSelfLevel(level);
        setLoading(true);
        try {
            // Check retake eligibility first
            const eligibility = await checkRetakeEligibility();
            if (!eligibility.canRetake) {
                setRetakeEligibility(eligibility);
                setStep('retake-cooldown');
                setLoading(false);
                return;
            }

            // Start placement session with self-assessed level (10 questions)
            const session = await placementService.startSession({
                selfAssessedLevel: level as any
            });
            console.log('[DEBUG] Placement session started:', session);

            // Get first question
            const nextQ = await adaptiveService.fetchNextQuestion(session.sessionId, demoMode);
            if (!nextQ) {
                throw new Error('Không thể lấy câu hỏi đầu tiên');
            }

            setQuiz({
                id: session.sessionId,
                title: 'Bài kiểm tra đầu vào',
                description: `Xác định cấp độ hiện tại của bạn (${session.totalQuestions || 20} câu) - Bạn tự đánh giá: ${level}`,
                totalQuestions: session.totalQuestions || 20,
                questions: [nextQ]
            });
            setCurrentQuestionIndex(0);
            setCurrentQuestionNumber(1);
            setQuestionStartTime(Date.now()); // Reset timer for first question
            setStep('taking-test');
        } catch (err: any) {
            console.error('[DEBUG] Placement start failed:', err);
            setStep('no-test');
        } finally {
            setLoading(false);
        }
    };



    const handleNextQuestion = async () => {
        if (!quiz || isSubmitting) return; // Prevent double-submit

        // Set direction for animation (moving forward)
        setDirection(1);

        const totalQuestions = quiz.totalQuestions || 20;
        const currentQ = quiz.questions[currentQuestionIndex];
        const answer = currentQ ? answers[currentQ.id] : undefined;

        // Validate fill_blank - require at least 1 word
        if (currentQ?.type === 'fill_blank' && answer) {
            const wordCount = answer.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
            if (wordCount < 1) {
                setFillBlankError('Vui lòng nhập ít nhất 1 từ');
                return;
            }
            setFillBlankError(null);
        }

        // Calculate time spent on this question
        const timeSpentSeconds = Math.max(0, (Date.now() - questionStartTime) / 1000);

        // Prevent double-submit
        setIsSubmitting(true);
        setLoading(true);

        try {
            // Submit answer for current question first
            if (currentQ && answer) {
                console.log('[DEBUG] Submitting answer for question', currentQ.id, ':', answer, 'timeSpent:', timeSpentSeconds);
                const result = await placementService.submitAnswer(quiz.id, {
                    questionId: currentQ.id,
                    answer: answer,
                    timeSpentSeconds: timeSpentSeconds
                });
                console.log('[DEBUG] Answer submitted successfully, result:', result);

                // Store feedback for this question
                if (result) {
                    setAnswerFeedback(prev => ({
                        ...prev,
                        [currentQ.id]: {
                            isCorrect: result.isCorrect,
                            explanation: result.explanation
                        }
                    }));
                    // Mark question as submitted
                    setSubmittedQuestions(prev => new Set(prev).add(currentQ.id));

                    // Demo mode: pause to show adaptive metrics before advancing
                    if (demoMode) {
                        setAdaptiveMetrics({
                            isCorrect: result.isCorrect,
                            correctAnswer: result.correctAnswer,
                            currentLevel: result.currentLevel,
                            abilityScore: result.abilityScore,
                            streakCorrect: result.streakCorrect,
                            streakWrong: result.streakWrong,
                            canStopEarly: result.canStopEarly,
                            questionCount: result.questionCount,
                        });
                        setDemoPaused(true);
                        setLoading(false);
                        setIsSubmitting(false);
                        return;
                    }
                }

                // If not all questions answered yet, fetch next
                if (currentQuestionIndex < totalQuestions - 1) {
                    const nextQ = await adaptiveService.fetchNextQuestion(quiz.id, demoMode);
                    if (nextQ) {
                        setQuiz(prev => prev ? { ...prev, questions: [...prev.questions, nextQ] } : null);
                        setCurrentQuestionIndex(prev => prev + 1);
                        setCurrentQuestionNumber(nextQ.currentQuestion ?? null);
                        setFillBlankError(null);
                        // Reset timer for next question
                        setQuestionStartTime(Date.now());
                    } else {
                        await submitTest();
                    }
                }
            }
        } catch (err: any) {
            console.error('[DEBUG] Error in handleNextQuestion:', err);
            // Check for TOO_FAST error (minimum time requirement)
            const errorMessage = err?.message || '';
            if (errorMessage.includes('5 giây') || errorMessage.includes('TOO_FAST')) {
                toast.error('Vui lòng dành ít nhất 5 giây để đọc và trả lời câu hỏi.');
            } else {
                toast.error('Lỗi khi xử lý câu hỏi. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
            setIsSubmitting(false); // Re-enable button
        }
    };

    const handleSkipQuestion = async () => {
        if (!quiz || isSubmitting) return;
        
        const currentQ = quiz.questions[currentQuestionIndex];
        if (!currentQ) return;

        // Set direction for animation (moving forward)
        setDirection(1);
        setIsSubmitting(true);
        setLoading(true);

        try {
            // Calculate time spent
            const timeSpentSeconds = (Date.now() - questionStartTime) / 1000;

            // 1. Tell backend we are skipping this question
            const response = await placementService.skipQuestion(quiz.id, {
                questionId: currentQ.id,
                timeSpentSeconds: Math.round(timeSpentSeconds)
            });

            // 2. Handle the response (which includes the next question)
            if (response.completed) {
                await submitTest();
            } else if (response.nextQuestion) {
                const nextQ = response.nextQuestion;
                setQuiz(prev => prev ? { ...prev, questions: [...prev.questions, nextQ as any] } : null);
                setCurrentQuestionIndex(prev => prev + 1);
                setCurrentQuestionNumber(nextQ.currentQuestion ?? null);
                setFillBlankError(null);
                setQuestionStartTime(Date.now()); // Reset timer
            } else {
                // Fallback if no nextQuestion in response
                const nextQ = await adaptiveService.fetchNextQuestion(quiz.id, demoMode);
                if (nextQ) {
                    setQuiz(prev => prev ? { ...prev, questions: [...prev.questions, nextQ as any] } : null);
                    setCurrentQuestionIndex(prev => prev + 1);
                    setCurrentQuestionNumber(nextQ.currentQuestion ?? null);
                    setFillBlankError(null);
                    setQuestionStartTime(Date.now());
                } else {
                    await submitTest();
                }
            }
        } catch (err: any) {
            console.error('[DEBUG] Skip question failed:', err);
            toast.error('Không thể bỏ qua câu hỏi. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };

    const proceedToNextQuestion = async () => {
        if (!quiz) return;
        setDemoPaused(false);
        setLoading(true);
        try {
            const nextQ = await adaptiveService.fetchNextQuestion(quiz.id, demoMode);
            if (nextQ) {
                setQuiz(prev => prev ? { ...prev, questions: [...prev.questions, nextQ] } : null);
                setCurrentQuestionIndex(prev => prev + 1);
                setCurrentQuestionNumber(nextQ.currentQuestion ?? null);
                setFillBlankError(null);
                setQuestionStartTime(Date.now());
            } else {
                await submitTest();
            }
        } catch (err: any) {
            console.error('[DEBUG] Error fetching next question:', err);
            toast.error('Lỗi khi tải câu hỏi tiếp theo.');
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };

    const handleCancelTest = async () => {
        if (!quiz) return;
        setLoading(true);
        try {
            await placementService.cancelSession(quiz.id);
            setQuiz(null);
            setCurrentQuestionIndex(0);
            setAnswers({});
            setAnswerFeedback({}); // Clear feedback
            setFillBlankError(null); // Clear error
            setInProgressSession(null); // Clear session so cards revert to normal
            setStep('select-level');
        } catch (err) {
            console.error('Cancel test failed:', err);
            alert('Không thể hủy bài test. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setShowCancelConfirm(false);
        }
    };

    const submitTest = async () => {
        if (!quiz) return;
        setLoading(true);
        try {
            // Filter out answers that have already been submitted
            const unsubmittedAnswers: Record<number, any> = {};
            for (const [questionId, answer] of Object.entries(answers)) {
                const qId = parseInt(questionId, 10);
                if (!submittedQuestions.has(qId)) {
                    unsubmittedAnswers[qId] = answer;
                }
            }
            
            console.log('[DEBUG] Submitting test, total answers:', Object.keys(answers).length, 'unsubmitted:', Object.keys(unsubmittedAnswers).length);
            
            // If there are unsubmitted answers, submit them
            // Otherwise just get the result directly
            let res;
            if (Object.keys(unsubmittedAnswers).length > 0) {
                res = await adaptiveService.submitPlacementTest(quiz.id, unsubmittedAnswers);
            } else {
                // All answers already submitted, just get the result
                res = await adaptiveService.getPlacementResult(quiz.id);
            }
            
            setResult(res);
            setStep('results');
            onComplete?.();

            // Save to localStorage for guest (anonymous) users
            const cacheKey = 'placement_recommendations_anonymous';
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    status: { level: (res as any).level || 'A1', categoryName: (res as any).categoryName || 'General', completedAt: new Date().toISOString() },
                    sessionResult: res,
                    recommendations: (res as any).suggestedCourses || [],
                    timestamp: Date.now(),
                }));
            } catch {
                // Ignore storage errors
            }

            // Fetch detailed session result from API
            if (res?.sessionId) {
                try {
                    const detailedResult = await placementService.getResult(res.sessionId);
                    setSessionResult(detailedResult);
                } catch (err) {
                    console.error('[DEBUG] Failed to fetch session result:', err);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteTest = async () => {
        if (!quiz) return;
        setLoading(true);
        try {
            // Call complete session API at question 10
            const result = await placementService.completeSession(quiz.id);
            console.log('[DEBUG] Test completed, result:', result);
            
            // Handle case where result might be undefined or missing sessionId
            if (!result) {
                console.error('[DEBUG] completeSession returned undefined result');
                // Fallback: try to get result directly
                const fallbackResult = await adaptiveService.getPlacementResult(quiz.id);
                console.log('[DEBUG] Fallback result:', fallbackResult);
                if (fallbackResult) {
                    setResult(fallbackResult);
                    setStep('results');
                } else {
                    alert('Không thể lấy kết quả bài test. Vui lòng thử lại.');
                }
                return;
            }
            
            const finalResult = {
                sessionId: result.sessionId || quiz.id,
                score: result.correctAnswers || 0,
                maxScore: result.totalQuestions || 20,
                percentage: Math.round(((result.correctAnswers || 0) / (result.totalQuestions || 20)) * 100),
                level: result.finalCefrLevel || 'A1',
                suggestedCourses: [] // Will be populated from sessionResult
            };
            setResult(finalResult);
            setStep('results');
            onComplete?.();

            // Save to localStorage for guest (anonymous) users
            const cacheKey = 'placement_recommendations_anonymous';
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    status: { level: finalResult.level, categoryName: (result as any).categoryName || 'General', completedAt: new Date().toISOString() },
                    sessionResult: finalResult,
                    recommendations: (result as any).suggestedCourses || [],
                    timestamp: Date.now(),
                }));
            } catch {
                // Ignore storage errors
            }

            // Fetch detailed session result
            try {
                const sessionId = result.sessionId || quiz.id;
                const detailedResult = await placementService.getResult(sessionId);
                setSessionResult(detailedResult);
            } catch (err) {
                console.error('[DEBUG] Failed to fetch session result:', err);
            }
        } catch (err) {
            console.error('[DEBUG] Error completing test:', err);
            alert('Lỗi khi hoàn thành bài test. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-4 pointer-events-auto">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-[98vw] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[95vh]">
                {/* Left Panel: Sidebar Branding */}
                <div className="w-full md:w-80 bg-linear-to-br from-indigo-600 via-blue-600 to-amber-500 p-8 text-white hidden md:flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center mb-6">
                            <Brain className="text-white" size={28} />
                        </div>
                        <h2 className="text-2xl font-bold mb-4 leading-tight uppercase tracking-tight">Lộ Trình Học Tập <br /><span className="text-amber-200">Thông Minh</span></h2>
                        <p className="text-blue-50/80 text-sm font-medium leading-relaxed italic">
                            Hệ thống sẽ phân tích năng lực hiện tại của bạn để đề xuất những khóa học phù hợp nhất, giúp tiết kiệm tối đa thời gian.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                            <Compass className="text-amber-300" size={20} />
                            <div className="text-sm font-bold">
                                Adaptive Learning Path
                                <span className="block text-[9px] text-blue-100/60 font-medium">Bản quyền E-Learning</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Content */}
                <div className="flex-1 flex flex-col bg-gray-50/30 overflow-hidden relative">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10 font-bold text-xl text-gray-500">
                        <span className="flex items-center gap-2">
                            {step === 'select-level' ? 'Xác định cấp độ' : step === 'taking-test' ? 'Bài kiểm tra đầu vào' : 'Kết quả phân tích'}
                            {demoMode && step === 'taking-test' && (
                                <span className="bg-amber-400 text-amber-900 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">
                                    Demo Mode
                                </span>
                            )}
                        </span>
                        <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-all cursor-pointer">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">

                        {step === 'select-level' && (
                            <div className="space-y-6">
                                <div className="text-center md:text-left mb-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Bạn tự đánh giá trình độ của mình ở đâu?</h3>
                                    <p className="text-gray-500 font-medium italic">Chọn cấp độ phù hợp nhất để hệ thống tạo bài test thích hợp.</p>
                                </div>

                                {/* Resume in-progress session */}
                                {inProgressSession && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                            <PlayCircle size={24} />
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <p className="font-bold text-gray-900">Bạn đang có bài test chưa hoàn thành</p>
                                            <p className="text-sm text-gray-500">Câu {inProgressSession.currentQuestion || '?'}/{inProgressSession.totalQuestions || 20} — Trình độ: {inProgressSession.currentLevel || '?'}</p>
                                        </div>
                                        <button
                                            onClick={handleResumeTest}
                                            disabled={loading}
                                            className="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                                        >
                                            {loading ? 'Đang tải...' : 'Tiếp tục làm'}
                                        </button>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { level: 'A1', label: 'A1 - Beginner', desc: 'Mới bắt đầu' },
                                        { level: 'A2', label: 'A2 - Elementary', desc: 'Cơ bản' },
                                        { level: 'B1', label: 'B1 - Intermediate', desc: 'Trung cấp' },
                                        { level: 'B2', label: 'B2 - Upper-Intermediate', desc: 'Trung cấp cao' },
                                        { level: 'C1', label: 'C1 - Advanced', desc: 'Nâng cao' },
                                        { level: 'C2', label: 'C2 - Proficiency', desc: 'Thành thạo' },
                                    ].map(({ level, label, desc }) => (
                                        <button
                                            key={level}
                                            onClick={() => handleSelectLevel(level)}
                                            disabled={loading}
                                            className="flex flex-col items-center p-6 bg-white border border-gray-100 rounded-3xl text-center hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all group cursor-pointer disabled:opacity-50"
                                        >
                                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform mb-3">
                                                <span className="text-2xl font-black">{level}</span>
                                            </div>
                                            <h4 className="font-bold text-gray-900">{label}</h4>
                                            <p className="text-gray-500 text-sm">{desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 'no-test' && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-4">
                                    <AlertCircle size={48} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-gray-900">Đã xảy ra lỗi!</h3>
                                    <p className="text-gray-500 font-medium max-w-sm mx-auto">
                                        Không thể tạo bài test đầu vào. Vui lòng thử lại sau.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setStep('select-level')} className="px-8 py-4 bg-gray-100 rounded-2xl font-bold text-gray-600 border border-transparent hover:border-gray-300 cursor-pointer">Quay lại</button>
                                </div>
                            </div>
                        )}

                        {step === 'retake-cooldown' && retakeEligibility && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-4 animate-pulse">
                                    <Clock size={48} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-gray-900">Vui lòng chờ!</h3>
                                    <p className="text-gray-500 font-medium max-w-sm mx-auto">
                                        Bạn đã hoàn thành bài đánh giá gần đây. Hệ thống yêu cầu chờ <span className="font-bold text-amber-600">{retakeEligibility.cooldownDays} ngày</span> giữa các lần làm test.
                                    </p>
                                    {retakeEligibility.lastTestDate && (
                                        <p className="text-sm text-gray-400">
                                            Bài test gần nhất: <span className="font-medium">{new Date(retakeEligibility.lastTestDate).toLocaleDateString('vi-VN')}</span>
                                        </p>
                                    )}
                                    {retakeEligibility.nextRetakeAvailableAt && (
                                        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                                            <p className="text-sm text-amber-700 font-medium mb-1">Có thể làm lại vào:</p>
                                            <p className="text-xl font-black text-amber-600">
                                                {new Date(retakeEligibility.nextRetakeAvailableAt).toLocaleDateString('vi-VN', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setStep('select-level')} className="px-8 py-4 bg-gray-100 rounded-2xl font-bold text-gray-600 border border-transparent hover:border-gray-300 cursor-pointer">
                                        ← Quay lại
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'taking-test' && quiz && (
                            <div className="space-y-10 pb-20">
                                <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-500/20">
                                    <div className="flex items-center gap-3 mb-2 font-black uppercase text-xs tracking-tighter decoration-amber-300 underline">
                                        <BookOpen size={16} /> Bài Kiểm Tra Năng Lực
                                    </div>
                                    <h3 className="text-2xl font-black">{quiz.title}</h3>
                                    <p className="text-blue-100 text-sm italic font-medium mt-1">{quiz.description}</p>
                                    {/* Progress Bar */}
                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between text-xs font-medium text-blue-100">
                                            <span>Câu {currentQuestionNumber || currentQuestionIndex + 1} / {quiz?.totalQuestions || 20}</span>
                                            <span>{Math.round(((currentQuestionNumber || currentQuestionIndex + 1) / (quiz?.totalQuestions || 20)) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-blue-800/50 rounded-full h-2 relative overflow-hidden">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-500 relative ${
                                                    quiz?.totalQuestions && [Math.floor(quiz.totalQuestions * 0.25), Math.floor(quiz.totalQuestions * 0.5), Math.floor(quiz.totalQuestions * 0.75), quiz.totalQuestions].includes(currentQuestionNumber || currentQuestionIndex + 1)
                                                        ? 'animate-pulse bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500'
                                                        : 'bg-amber-400'
                                                }`}
                                                style={{ width: `${((currentQuestionNumber || currentQuestionIndex + 1) / (quiz?.totalQuestions || 20)) * 100}%` }}
                                            >
                                                {quiz?.totalQuestions && [Math.floor(quiz.totalQuestions * 0.25), Math.floor(quiz.totalQuestions * 0.5), Math.floor(quiz.totalQuestions * 0.75), quiz.totalQuestions].includes(currentQuestionNumber || currentQuestionIndex + 1) && (
                                                    <div className="absolute inset-0 bg-white/50 animate-shimmer" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    <AnimatePresence mode="wait" custom={direction}>
                                        {(() => {
                                            const q = quiz.questions[currentQuestionIndex];
                                            console.log('[DEBUG] Current question:', q);
                                            console.log('[DEBUG] Question type:', q?.type, '| Options:', q?.options, '| IsArray:', Array.isArray(q?.options));
                                            if (!q) return <div className="text-center text-gray-500">Đang tải câu hỏi...</div>;
                                            return (
                                                <motion.div
                                                    key={q.id}
                                                    custom={direction}
                                                    initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="space-y-6"
                                                >
                                                <div className="flex items-start gap-4">
                                                    <div className="flex flex-col items-center gap-1 shrink-0">
                                                        <span className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black shadow-lg">
                                                            {currentQuestionNumber || currentQuestionIndex + 1}
                                                        </span>
                                                        {(q as any).cefrLevel && (
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                                                (q as any).cefrLevel === 'A1' ? 'bg-emerald-100 text-emerald-700' :
                                                                (q as any).cefrLevel === 'A2' ? 'bg-teal-100 text-teal-700' :
                                                                (q as any).cefrLevel === 'B1' ? 'bg-amber-100 text-amber-700' :
                                                                (q as any).cefrLevel === 'B2' ? 'bg-orange-100 text-orange-700' :
                                                                (q as any).cefrLevel === 'C1' ? 'bg-rose-100 text-rose-700' :
                                                                'bg-purple-100 text-purple-700'
                                                            }`}>
                                                                {(q as any).cefrLevel}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="text-lg font-black text-gray-800 leading-snug pt-2">
                                                        {q.content}
                                                    </h4>
                                                </div>

                                                {/* Demo Mode: Show correct answer before selecting */}
                                                {demoMode && q.correctAnswer && (
                                                    <div className="ml-14 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                                                        <span className="bg-amber-400 text-amber-900 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Demo</span>
                                                        <span className="text-sm font-bold text-amber-800">Đáp án đúng: <span className="text-amber-600">{q.correctAnswer}</span></span>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 gap-3 pl-14">
                                                    {q.type === 'multiple_choice' && Array.isArray(q.options) && q.options.map((opt: string, optIdx: number) => (
                                                        <button
                                                            key={optIdx}
                                                            onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                                                            className={`w-full p-4 rounded-2xl text-left font-bold text-sm transition-all border-2 cursor-pointer ${answers[q.id] === opt
                                                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md translate-x-1'
                                                                : 'bg-white border-gray-50 text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <span className="flex w-6 h-6 rounded-lg bg-gray-100 items-center justify-center mr-3 text-[10px] text-gray-400 font-black uppercase">
                                                                {String.fromCharCode(65 + optIdx)}
                                                            </span>
                                                            {opt}
                                                        </button>
                                                    ))}
                                                    {q.type === 'true_false' && ['Đúng', 'Sai'].map((opt) => (
                                                        <button
                                                            key={opt}
                                                            onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                                                            className={`w-full p-4 rounded-2xl text-left font-bold text-sm transition-all border-2 cursor-pointer ${answers[q.id] === opt
                                                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md translate-x-1'
                                                                : 'bg-white border-gray-50 text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                    {q.type === 'fill_blank' && (
                                                        <div className="space-y-3">
                                                            <input
                                                                type="text"
                                                                value={answers[q.id] || ''}
                                                                onChange={(e) => {
                                                                    setAnswers({ ...answers, [q.id]: e.target.value });
                                                                    if (fillBlankError) setFillBlankError(null);
                                                                }}
                                                                placeholder="Nhập đáp án..."
                                                                className={`w-full p-4 rounded-2xl border-2 ${fillBlankError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'} outline-none text-gray-800 font-medium`}
                                                            />
                                                            {fillBlankError && (
                                                                <p className="text-xs text-red-500 font-medium">{fillBlankError}</p>
                                                            )}
                                                            <p className="text-xs text-gray-400 italic">Nhập từ thích hợp điền vào chỗ trống ____</p>
                                                            {answerFeedback[q.id] && (
                                                                <div className={`p-4 rounded-xl ${answerFeedback[q.id].isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        {answerFeedback[q.id].isCorrect ? (
                                                                            <>
                                                                                <CheckCircle2 className="text-green-600" size={20} />
                                                                                <span className="font-bold text-green-700">Chính xác!</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <AlertCircle className="text-red-600" size={20} />
                                                                                <span className="font-bold text-red-700">Chưa đúng!</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    {answerFeedback[q.id].explanation && (
                                                                        <p className="text-sm text-gray-700">{answerFeedback[q.id].explanation}</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {q.type === 'sentence_ordering' && Array.isArray(q.segments) && (
                                                        <div className="space-y-4">
                                                            <p className="text-sm text-gray-600 font-medium mb-3">Sắp xếp các phần để tạo thành câu hoàn chỉnh:</p>
                                                            <div className="flex flex-wrap gap-2 mb-4">
                                                                {q.segments.map((segment: string, idx: number) => (
                                                                    <button
                                                                        key={idx}
                                                                        onClick={() => {
                                                                            const currentOrder = answers[q.id] ? answers[q.id].split(' ') : [];
                                                                            if (!currentOrder.includes(String(idx))) {
                                                                                setAnswers({ ...answers, [q.id]: [...currentOrder, idx].join(' ') });
                                                                            }
                                                                        }}
                                                                        disabled={answers[q.id]?.includes(String(idx))}
                                                                        className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                                                            answers[q.id]?.includes(String(idx))
                                                                                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                                                                : 'bg-blue-50 text-blue-700 border-2 border-blue-200 hover:bg-blue-100'
                                                                        }`}
                                                                    >
                                                                        {segment}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <div className="p-4 bg-gray-50 rounded-xl min-h-[60px] border-2 border-dashed border-gray-200">
                                                                <p className="text-sm text-gray-500 mb-2">Thứ tự đã chọn:</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {answers[q.id] ? answers[q.id].split(' ').map((idx: string) => (
                                                                        <span key={idx} className="px-3 py-1 bg-white rounded-lg text-sm font-medium border border-gray-200">
                                                                            {q.segments?.[parseInt(idx)]}
                                                                        </span>
                                                                    )) : <span className="text-gray-400 italic text-sm">Chưa chọn...</span>}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => setAnswers({ ...answers, [q.id]: '' })}
                                                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                                                            >
                                                                Xóa và chọn lại
                                                            </button>
                                                        </div>
                                                    )}
                                                    {((q as any).questionType === 'listening') && (
                                                        <ListeningQuestionPlayer
                                                            question={q as any}
                                                            answer={answers[q.id]}
                                                            onAnswer={(answer: string) => setAnswers({ ...answers, [q.id]: answer })}
                                                        />
                                                    )}
                                                </div>
                                                    </motion.div>
                                            );
                                        })()}
                                    </AnimatePresence>

                                    {/* Demo Mode: Adaptive Metrics Overlay */}
                                    {demoPaused && adaptiveMetrics && (
                                        <div className="bg-gray-900 text-white rounded-2xl p-5 space-y-3 border border-gray-700 shadow-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-amber-400 text-amber-900 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Adaptive Debug</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="bg-white/10 rounded-xl p-3">
                                                    <p className="text-gray-400 text-xs">Kết quả</p>
                                                    <p className={`font-bold ${adaptiveMetrics.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                                        {adaptiveMetrics.isCorrect ? '✅ Chính xác' : '❌ Chưa chính xác'}
                                                    </p>
                                                </div>
                                                <div className="bg-white/10 rounded-xl p-3">
                                                    <p className="text-gray-400 text-xs">Trình độ hiện tại</p>
                                                    <p className="font-black text-lg">{adaptiveMetrics.currentLevel}</p>
                                                </div>
                                                <div className="bg-white/10 rounded-xl p-3">
                                                    <p className="text-gray-400 text-xs">Ability Score</p>
                                                    <p className="font-mono font-bold">{adaptiveMetrics.abilityScore?.toFixed(2)}</p>
                                                </div>
                                                <div className="bg-white/10 rounded-xl p-3">
                                                    <p className="text-gray-400 text-xs">Streak</p>
                                                    <p className="font-bold">✓ {adaptiveMetrics.streakCorrect} / ✗ {adaptiveMetrics.streakWrong}</p>
                                                </div>
                                            </div>
                                            {adaptiveMetrics.correctAnswer && (
                                                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3">
                                                    <p className="text-emerald-300 text-xs font-bold uppercase">Đáp án đúng</p>
                                                    <p className="text-white font-bold text-sm">{adaptiveMetrics.correctAnswer}</p>
                                                </div>
                                            )}
                                            {adaptiveMetrics.canStopEarly && (
                                                <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3">
                                                    <p className="text-amber-300 text-xs font-bold uppercase">Có thể kết thúc sớm!</p>
                                                    <p className="text-white text-sm">Đã đủ {adaptiveMetrics.minQuestions} câu với độ tin cậy cao.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 'results' && result && (
                            <div className="space-y-10">
                                {/* Result Header */}
                                <div className="bg-linear-to-br from-emerald-500 to-teal-600 p-8 rounded-[32px] text-white text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                                    <div className="relative z-10">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-4">
                                            Kết quả đánh giá
                                        </div>
                                        <h3 className="text-3xl font-black mb-2">
                                            Trình độ của bạn: {sessionResult?.finalLevel || result?.level || 'N/A'}
                                        </h3>
                                        {sessionResult && (
                                            <p className="text-white/80 text-sm font-medium">
                                                {sessionResult.correctAnswers}/{sessionResult.totalQuestions} câu đúng
                                                {' • '}
                                                Chính xác: {Math.round((sessionResult.accuracy || 0) * 100)}%
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Level Progress Visual */}
                                <div className="bg-gray-50 rounded-3xl p-6 space-y-4">
                                    <h4 className="text-lg font-bold text-gray-900">Lộ trình học tập của bạn</h4>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Hệ thống đã xác định bạn phù hợp với trình độ <span className="font-bold text-gray-900">{sessionResult?.finalLevel || result?.level}</span>.
                                        Bạn sẽ học 4 kỹ năng <strong>Nghe, Nói, Đọc, Viết</strong> trong cùng một cấp độ theo khung CEFR.
                                    </p>
                                    <div className="flex gap-2">
                                        {(() => {
                                            const reverseMap: Record<string, string> = {
                                                'Cơ bản': 'A1', 'Sơ cấp': 'A2', 'Trung cấp': 'B1',
                                                'Trung cấp cao': 'B2', 'Nâng cao': 'C1', 'Thành thạo': 'C2',
                                            };
                                            const rawLevel = sessionResult?.finalLevel || result?.level || 'A1';
                                            const current = reverseMap[rawLevel] || rawLevel;
                                            const levels = ['A1','A2','B1','B2','C1','C2'];
                                            const currentIdx = levels.indexOf(current);
                                            return levels.map(lvl => {
                                                const idx = levels.indexOf(lvl);
                                                const isActive = idx === currentIdx;
                                                const isPast = idx < currentIdx;
                                                return (
                                                    <div key={lvl} className={`flex-1 py-2 rounded-xl text-center text-xs font-bold ${
                                                        isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : isPast ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                        {lvl}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>

                                {/* CTA Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={() => {
                                            onClose();
                                            navigate('/my-path');
                                        }}
                                        className="flex-1 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <Compass size={20} />
                                        Bắt đầu lộ trình học
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cancel Confirm Dialog */}
                    {showCancelConfirm && (
                        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCancelConfirm(false)} />
                            <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                        <AlertCircle className="text-red-600" size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Xác nhận hủy bài test</h3>
                                </div>
                                <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn hủy bài test? Tiến độ hiện tại sẽ không được lưu.</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCancelConfirm(false)}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                                    >
                                        Không, tiếp tục
                                    </button>
                                    <button
                                        onClick={handleCancelTest}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Đang hủy...' : 'Có, hủy bài'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between sticky bottom-0 z-10">
                        {step === 'taking-test' && (
                            <>
                                <button onClick={() => setShowCancelConfirm(true)} className="px-6 py-3 font-bold text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Hủy bài test</button>
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const showSkip = currentQuestionNumber
                                            ? currentQuestionNumber < (quiz?.totalQuestions || 20)
                                            : currentQuestionIndex < (quiz?.totalQuestions || 20) - 1;
                                        return showSkip && (
                                            <button
                                                onClick={handleSkipQuestion}
                                                disabled={loading}
                                                className="px-6 py-3 font-bold text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                Bỏ qua
                                            </button>
                                        );
                                    })()}
                                    <button
                                        onClick={demoPaused ? proceedToNextQuestion : (currentQuestionNumber ? (currentQuestionNumber >= (quiz?.totalQuestions || 20) ? () => handleCompleteTest() : handleNextQuestion) : (currentQuestionIndex >= (quiz?.totalQuestions || 20) - 1 ? () => handleCompleteTest() : handleNextQuestion))}
                                        disabled={loading || (demoPaused ? false : (!quiz?.questions[currentQuestionIndex]?.id || !answers[quiz?.questions[currentQuestionIndex]?.id]))}
                                        className={`px-10 py-4 text-white rounded-2xl font-black text-sm transition-all flex items-center gap-2 cursor-pointer relative overflow-hidden ${
                                            demoPaused
                                                ? 'bg-amber-500 hover:bg-amber-600 shadow-xl shadow-amber-500/40'
                                                : (currentQuestionNumber || currentQuestionIndex + 1) < 5 
                                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30' 
                                                    : (currentQuestionNumber || currentQuestionIndex + 1) < 10
                                                        ? 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-indigo-500/40'
                                                        : (currentQuestionNumber || currentQuestionIndex + 1) < 15
                                                            ? 'bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl shadow-purple-500/50 animate-pulse'
                                                            : 'bg-linear-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 shadow-xl shadow-red-500/60 animate-pulse scale-105'
                                        } disabled:opacity-50`}
                                    >
                                        {loading ? 'Đang tải...' : (() => {
                                            if (demoPaused) return 'Tiếp theo →';
                                            const isComplete = currentQuestionNumber
                                                ? currentQuestionNumber >= (quiz?.totalQuestions || 20)
                                                : currentQuestionIndex >= (quiz?.totalQuestions || 20) - 1;
                                            const showFlame = currentQuestionNumber 
                                                ? currentQuestionNumber >= 10 
                                                : currentQuestionIndex >= 10;
                                            
                                            if (isComplete) return 'Hoàn thành';
                                            return (
                                                <React.Fragment>
                                                    Tiếp theo
                                                    {showFlame && <Flame size={18} className="animate-bounce" />}
                                                </React.Fragment>
                                            );
                                        })()}
                                        {(() => {
                                            if (demoPaused) return null;
                                            const showCheck = currentQuestionNumber 
                                                ? currentQuestionNumber < 10 
                                                : currentQuestionIndex < 10;
                                            return showCheck ? <CheckCircle2 size={18} /> : null;
                                        })()}
                                    </button>
                                </div>
                            </>
                        )}
                        {step === 'results' && (
                            <div className="w-full flex justify-center">
                                <span className="text-sm text-gray-500">Bạn có thể đóng cửa sổ này để tiếp tục học.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearningPathAssistant;
