import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, HelpCircle, Clock, Play, ArrowRight, Download, File as FileIcon, LoaderCircle } from 'lucide-react';
import { quizService } from '../../services/quiz.service';

interface QuizPreviewPanelProps {
    courseId: string;
    lessonId: string;
    quizIdUrl: string;
    title: string;
    attachments?: any[];
}

const QuizPreviewPanel: React.FC<QuizPreviewPanelProps> = ({ 
    courseId, 
    lessonId, 
    quizIdUrl, 
    title, 
    attachments 
}) => {
    const navigate = useNavigate();
    const [lessonQuizInfo, setLessonQuizInfo] = useState<any>(null);
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

    const specificQuizId = quizIdUrl ? String(quizIdUrl).replace('quiz-', '') : '';

    useEffect(() => {
        const loadQuizData = async () => {
            setIsLoadingQuiz(true);
            try {
                const lessonIdStr = String(lessonId);
                const qId = lessonIdStr.startsWith('quiz-') ? lessonIdStr.replace('quiz-', '') : specificQuizId;
                
                if (qId && courseId) {
                    const quizzes = await quizService.getQuizzesByCourse(courseId);
                    const specificQuiz = quizzes.find((q: any) => String(q.id) === String(qId));
                    setLessonQuizInfo(specificQuiz);
                }
            } catch (err) {
                console.error("Error loading quiz preview data", err);
            } finally {
                setIsLoadingQuiz(false);
            }
        };

        if (lessonId && courseId) {
            loadQuizData();
        }
    }, [lessonId, courseId, specificQuizId]);

    return (
        <div className="relative flex flex-col flex-1 p-6 md:p-12 bg-slate-50 overflow-y-auto w-full h-full custom-scrollbar items-center">
            {/* Light gradient backdrop */}
            <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50/50 pointer-events-none"></div>
            
            <div className="relative z-10 w-full max-w-4xl space-y-8 animate-in fade-in zoom-in duration-500 m-auto mt-0">
                {/* Header Title */}
                <div className="text-left mb-2 flex items-center justify-between">
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                        <span>Bài kiểm tra:</span> 
                        <span className="text-amber-500">{title}</span>
                    </h2>
                </div>

                {isLoadingQuiz ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                        <LoaderCircle size={40} className="animate-spin text-amber-500 mb-4" />
                        <span className="text-slate-400 font-bold uppercase text-xs tracking-widest animate-pulse">Đang tải thông tin đề thi</span>
                    </div>
                ) : lessonQuizInfo ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            {/* Left Status Donut */}
                            <div className="md:col-span-2 bg-white rounded-[32px] p-8 border border-slate-100 relative flex flex-col items-center justify-center text-center shadow-2xl shadow-slate-200/50">
                                <div className="absolute -top-4 bg-rose-50 text-rose-600 px-5 py-2 rounded-full text-xs font-black ring-1 ring-rose-100 shadow-sm uppercase tracking-widest">
                                    Điều kiện qua: {lessonQuizInfo.passingScore}% đúng
                                </div>
                                
                                <div className="relative w-40 h-40 mt-4 mb-4 drop-shadow-md">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" 
                                            strokeDasharray={`${(lessonQuizInfo.userStatus?.lastScore || 0) * 2.51} 251`} 
                                            className={lessonQuizInfo.userStatus?.isPassed ? 'text-emerald-500' : 'text-slate-300'} 
                                            strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Điểm của bạn</span>
                                        <span className={`text-4xl font-black tracking-tighter ${lessonQuizInfo.userStatus?.isPassed ? 'text-emerald-500' : 'text-slate-800'}`}>{Math.round(lessonQuizInfo.userStatus?.lastScore || 0)}</span>
                                    </div>
                                    {lessonQuizInfo.userStatus?.isPassed && (
                                        <div className="absolute top-0 right-4 bg-amber-500 text-white rounded-full p-1.5 shadow-lg shadow-amber-500/50 ring-4 ring-white">
                                            <CheckCircle2 size={20} className="stroke-[3px]" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-slate-500 font-medium text-sm mt-4 px-2 tracking-tight leading-relaxed">
                                    Hoàn thành bài thi với mức điểm <span className="text-rose-500 font-bold">trên {lessonQuizInfo.passingScore}%</span> để vượt qua xuất sắc nhé!
                                </p>
                            </div>

                            {/* Right Statistical Grid */}
                            <div className="md:col-span-3 grid grid-cols-2 gap-4 auto-rows-max h-full">
                                <div className="bg-white rounded-[32px] p-6 border border-slate-100 flex flex-col justify-center shadow-lg shadow-slate-200/40">
                                    <p className="text-xs text-slate-400 font-bold mb-3 uppercase tracking-widest">Số câu hỏi</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                            <HelpCircle size={20} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-2xl font-black text-slate-800">{lessonQuizInfo.questions?.length || lessonQuizInfo.maxScore || '--'}</span>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[32px] p-6 border border-slate-100 flex flex-col justify-center shadow-lg shadow-slate-200/40">
                                    <p className="text-xs text-slate-400 font-bold mb-3 uppercase tracking-widest">Thời gian làm bài</p>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                                                <Clock size={20} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-2xl font-black text-slate-800">{lessonQuizInfo.timeLimit}:00</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest shrink-0">(Tối đa)</span>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[32px] p-6 border border-slate-100 flex flex-col justify-center shadow-lg shadow-slate-200/40">
                                    <p className="text-xs text-slate-400 font-bold mb-3 uppercase tracking-widest">Số lần làm bài</p>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                                <Play size={20} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-2xl font-black text-slate-800">{lessonQuizInfo.userStatus?.attemptCount || 0}<span className="text-slate-400 font-semibold text-lg">/{lessonQuizInfo.maxAttempts || '∞'}</span></span>
                                        </div>
                                    </div>
                                </div>

                                {/* Entry Button */}
                                <div className="flex items-end justify-end mt-4 col-span-2 md:col-span-1">
                                    <button
                                        onClick={() => navigate(`/quiz/${specificQuizId}`)}
                                        className="w-full h-16 bg-rose-500 text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/30 active:scale-95 hover:-translate-y-1 cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        LÀM BÀI <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Attachment Bar */}
                        {attachments && attachments.length > 0 && (
                            <div className="bg-white rounded-[32px] p-6 border border-slate-100 flex flex-wrap items-center justify-between group md:hover:border-slate-300 transition-all shadow-lg shadow-slate-200/40 gap-4 cursor-pointer"
                                onClick={() => window.open(attachments[0]?.url, '_blank')}
                            >
                                <div className="space-y-1.5 flex-1 min-w-0 pr-4 w-full md:w-auto">
                                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-3">Tài liệu đi kèm bài thi</h3>
                                    <div className="flex flex-wrap items-center gap-2 text-cyan-600 text-sm md:hover:underline">
                                        <FileIcon size={14} className="shrink-0" />
                                        <span className="break-all md:truncate font-medium">{attachments[0]?.name || `${title}.pdf`}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center text-slate-800 shrink-0 w-full md:w-auto mt-4 md:mt-0 pt-4 border-t border-slate-100 md:pt-0 md:border-transparent">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5">Tải về</span>
                                    <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-cyan-50 flex items-center justify-center transition-colors">
                                        <Download size={18} className="text-slate-500 group-hover:text-cyan-600 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                            <HelpCircle size={32} className="text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-bold max-w-sm text-center px-4">Không thể tải cấu hình bài thi. Vui lòng liên hệ Giảng viên hoặc thử lại sau.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizPreviewPanel;
