import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Trophy, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adaptiveService } from '../../services/adaptive.service';
import { placementService } from '../../services/placement.service';
import type { PlacementSessionResult, PlacementReview } from '../../services/placement.service';
import LearningPathAssistant from '../learning-path/LearningPathAssistant';
import { useAuth } from '../../context/AuthContext';

const PersonalizedSection: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState<{ categoryId: number; categoryName: string; level: string; completedAt: string; sessionId?: number } | null>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [sessionResult, setSessionResult] = useState<PlacementSessionResult | null>(null);
    const [resultLoading, setResultLoading] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [reviewData, setReviewData] = useState<PlacementReview | null>(null);
    const [reviewLoading, setReviewLoading] = useState(false);

    const fetchStatus = async () => {
        if (!user) return;
        try {
            console.log('[DEBUG] Fetching assessment status...');
            const res = await adaptiveService.getAssessmentStatus();
            console.log('[DEBUG] Assessment status response:', res);

            // Backend returns { latest, all } or null
            if (res && res.latest) {
                console.log('[DEBUG] Setting status:', res.latest);
                setStatus(res.latest);
                const recs = await adaptiveService.getRecommendations(res.latest.categoryId, res.latest.level);
                console.log('[DEBUG] Recommendations:', recs);
                setRecommendations(recs.suggestedCourses || []);
                
                // Fetch detailed session result
                const latest = res.latest as any;
                console.log('[DEBUG] Looking for sessionId:', latest.sessionId);
                if (latest.sessionId) {
                    setResultLoading(true);
                    try {
                        console.log('[DEBUG] Fetching session result for ID:', latest.sessionId);
                        const detailedResult = await placementService.getResult(latest.sessionId);
                        console.log('[DEBUG] Session result:', detailedResult);
                        setSessionResult(detailedResult);
                    } catch (err) {
                        console.error('[DEBUG] Failed to fetch session result:', err);
                    } finally {
                        setResultLoading(false);
                    }
                }
            } else {
                console.log('[DEBUG] No latest assessment found, status set to null');
                setStatus(null);
            }
        } catch (err) {
            console.error('Failed to fetch assessment status', err);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [user]);

    if (!user) return null;

    const handleOpenReview = async () => {
        if (!sessionResult) return;
        setReviewLoading(true);
        try {
            const reviewData = await placementService.getReview(sessionResult.sessionId);
            console.log('[DEBUG] Review data:', reviewData);
            setReviewData(reviewData);
        } catch (err) {
            console.error('[DEBUG] Failed to fetch review data:', err);
        } finally {
            setReviewLoading(false);
        }
        setShowReview(true);
    };

    return (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 scroll-mt-20" id="personalized-path">
            {!status ? (
                <div className="relative overflow-hidden rounded-[48px] bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-16 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-amber-400 text-sm font-medium border border-white/5">
                                Lộ trình học thông minh
                            </div>
                            <h2 className="text-4xl md:text-6xl font-bold leading-[1.1]">
                                Bạn chưa biết <br /><span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-amber-200">bắt đầu từ đâu?</span>
                            </h2>
                            <p className="text-gray-400 text-lg font-medium max-w-xl">
                                Chỉ với 5 phút thực hiện bài đánh giá, AI của chúng tôi sẽ xây dựng một lộ trình học tập cá nhân hóa hoàn toàn dựa trên điểm mạnh và điểm yếu của bạn.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                                <button
                                    onClick={() => setIsAssistantOpen(true)}
                                    className="w-full cursor-pointer sm:w-auto px-10 py-5 bg-amber-500 text-slate-900 rounded-2xl font-medium text-sm hover:bg-white transition-all shadow-xl shadow-amber-500/20 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    Khám phá lộ trình ngay <ArrowRight size={20} />
                                </button>
                                <p className="text-sm font-bold text-gray-400 decoration-amber-500 underline underline-offset-4">Hoàn toàn miễn phí</p>
                            </div>
                        </div>
                        <div className="hidden lg:flex justify-center relative">
                            <div className="w-full max-w-md aspect-square rounded-[60px] bg-white/5 border border-white/10 p-4 relative animate-float">
                                <div className="absolute inset-4 rounded-[48px] bg-linear-to-br from-amber-500/20 to-indigo-500/20 flex items-center justify-center overflow-hidden">
                                    <img src="/logoStill/student.png" alt="AI Assessment" className="relative z-10 w-64 h-64 object-contain" />
                                </div>
                                <div className="absolute -top-14 -right-6 p-6 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl text-slate-900 space-y-2 animate-bounce-slow border border-white">
                                    <p className="text-sm font-bold text-gray-400">Tối ưu phù hợp</p>
                                    <p className="text-3xl font-bold text-indigo-600">99.8%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* MINI SIDEBAR - Left (25% width on lg) */}
                    <div className="lg:col-span-3">
                        <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl h-full flex flex-col justify-between min-h-[280px]">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-amber-400 text-xs font-medium border border-white/5">
                                    <Sparkles size={14} />
                                    Lộ trình học thông minh
                                </div>
                                <h3 className="text-xl font-bold leading-tight">
                                    Khám phá<br />lộ trình mới
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsAssistantOpen(true)}
                                className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold text-sm hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                Bắt đầu <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* MAIN SHOWCASE - Right (75% width on lg) */}
                    <div className="lg:col-span-9 space-y-6">
                        {/* LEVEL WIDGET */}
                        <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-lg">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                                        <Trophy size={28} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-400">Trình độ hiện tại</p>
                                        <h3 className="text-3xl font-black text-gray-900">
                                            {sessionResult?.finalLevel || status.level}
                                        </h3>
                                        {resultLoading && (
                                            <span className="text-xs text-gray-400">Đang tải...</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {sessionResult && (
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-400">Độ chính xác</p>
                                            <p className="text-lg font-black text-indigo-600">
                                                {Math.round((sessionResult.accuracy || 0) * 100)}%
                                            </p>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleOpenReview}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                        <Eye size={16} />
                                        Xem lại bài đánh giá
                                    </button>
                                </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mt-6">
                                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                                    <span>Tiến độ lộ trình</span>
                                    <span>{sessionResult?.totalQuestions || 20} câu hỏi</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.round((sessionResult?.accuracy || 0.7) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* COURSE CAROUSEL - Best Match */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Khóa học phù hợp nhất</h3>
                                <button 
                                    onClick={() => navigate('/courses')}
                                    className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                                >
                                    Xem tất cả <ArrowRight size={16} />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {recommendations.slice(0, 3).map((course, index) => (
                                    <div
                                        key={course.id}
                                        onClick={() => navigate(`/course/${course.id}`)}
                                        className="bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
                                    >
                                        <div className="aspect-video relative overflow-hidden">
                                            <img
                                                src={course.imageUrl || '/elearning-1.jpg'}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-3 left-3">
                                                <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-black rounded-lg">
                                                    {index === 0 ? 'BEST MATCH' : `TOP ${index + 1}`}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            <h4 className="font-bold text-gray-900 line-clamp-1">{course.title}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-2">{course.description || 'Khóa học phù hợp với trình độ của bạn'}</p>
                                            <div className="flex items-center justify-between pt-2">
                                                <span className="text-xs font-bold text-indigo-600">{course.level}</span>
                                                <span className="text-xs font-bold text-gray-400">{course.duration || '0h'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {recommendations.length === 0 && (
                                    <div className="col-span-3 text-center py-8 bg-gray-50 rounded-[24px]">
                                        <p className="text-gray-400 font-bold">Đang tìm kiếm khóa học phù hợp...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <LearningPathAssistant
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
                onComplete={() => {
                    setIsAssistantOpen(false);
                    fetchStatus(); // Refresh after completing test
                }}
            />

            {/* Review Modal */}
            {showReview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Chi tiết bài đánh giá đầu vào</h3>
                                <p className="text-sm text-gray-500">Xem lại các câu hỏi và giải thích chi tiết</p>
                            </div>
                            <button 
                                onClick={() => setShowReview(false)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50">
                            {reviewLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-gray-500">Đang tải dữ liệu bài làm...</p>
                                </div>
                            ) : reviewData ? (
                                <div className="max-w-4xl mx-auto space-y-8">
                                    {/* Summary Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cấp độ đạt được</p>
                                            <p className="text-2xl font-black text-indigo-600">{reviewData.finalLevel}</p>
                                        </div>
                                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Độ chính xác</p>
                                            <p className="text-2xl font-black text-green-600">{Math.round(reviewData.accuracy * 100)}%</p>
                                        </div>
                                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng câu hỏi</p>
                                            <p className="text-2xl font-black text-amber-600">{reviewData.totalQuestions}</p>
                                        </div>
                                    </div>

                                    {/* Questions List */}
                                    <div className="space-y-6">
                                        {reviewData.questions.map((q, idx) => (
                                            <div key={q.questionId} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                                <div className="flex items-start gap-4">
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                        q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                                q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                {q.isCorrect ? 'Đúng' : 'Sai'}
                                                            </span>
                                                            <span className="text-xs font-medium text-gray-400">|</span>
                                                            <span className="text-xs font-medium text-gray-500 uppercase">{q.skill}</span>
                                                            <span className="text-xs font-medium text-gray-400">|</span>
                                                            <span className="text-xs font-medium text-gray-500 uppercase">{q.cefrLevel}</span>
                                                        </div>
                                                        
                                                        <p className="text-lg font-medium text-gray-900 leading-relaxed">
                                                            {q.content}
                                                        </p>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {q.options.map((opt, optIdx) => {
                                                                const isUserChoice = q.userAnswer === opt;
                                                                const isCorrectAnswer = q.correctAnswer === opt;
                                                                
                                                                let bgColor = "bg-gray-50 border-gray-100";
                                                                let textColor = "text-gray-700";
                                                                let borderColor = "border-gray-100";
                                                                
                                                                if (isCorrectAnswer) {
                                                                    bgColor = "bg-green-50";
                                                                    borderColor = "border-green-200";
                                                                    textColor = "text-green-700";
                                                                } else if (isUserChoice && !q.isCorrect) {
                                                                    bgColor = "bg-red-50";
                                                                    borderColor = "border-red-200";
                                                                    textColor = "text-red-700";
                                                                }

                                                                return (
                                                                    <div 
                                                                        key={optIdx}
                                                                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${bgColor} ${borderColor}`}
                                                                    >
                                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                                            isCorrectAnswer ? 'bg-green-500 text-white' : 
                                                                            isUserChoice ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'
                                                                        }`}>
                                                                            {String.fromCharCode(65 + optIdx)}
                                                                        </div>
                                                                        <span className={`font-medium ${textColor}`}>{opt}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {q.explanation && (
                                                            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                                                <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold text-sm">
                                                                    <Sparkles className="w-4 h-4" />
                                                                    Giải thích từ AI:
                                                                </div>
                                                                <p className="text-indigo-900 text-sm leading-relaxed">
                                                                    {q.explanation}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-500">
                                    Không tìm thấy dữ liệu bài làm.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default PersonalizedSection;
