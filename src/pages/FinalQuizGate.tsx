import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Unlock, Trophy, ArrowRight, Loader2, AlertCircle, CheckCircle2, FileText, History, Eye } from 'lucide-react';
import { finalQuizService, type FinalQuiz, type UnlockStatus } from '../services/finalQuiz.service';
import { quizService } from '../services/quiz.service';
import toast from 'react-hot-toast';

const CEFR_LABELS: Record<string, string> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper-Intermediate',
  C1: 'Advanced',
  C2: 'Proficiency',
};

const FinalQuizGate: React.FC = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<FinalQuiz | null>(null);
  const [unlock, setUnlock] = useState<UnlockStatus | null>(null);
  const [passedAttempt, setPassedAttempt] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [maxAttempts, setMaxAttempts] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!level) return;
    loadData();
  }, [level]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[DEBUG FinalQuizGate] Fetching final quiz for level:', level);
      const data = await finalQuizService.getFinalQuiz(level!);
      console.log('[DEBUG FinalQuizGate] API response:', data);
      setQuiz(data?.quiz || null);
      setUnlock(data?.unlockStatus || null);
      setPassedAttempt(data?.passedAttempt || null);
      setAttempts(data?.attempts || []);
      setMaxAttempts(data?.maxAttempts || null);
    } catch (err: any) {
      console.error('[DEBUG FinalQuizGate] Error:', err);
      toast.error(err?.message || 'Không thể tải bài kiểm tra');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!quiz?.id) return;
    try {
      setStarting(true);
      const res = await quizService.startQuiz(quiz.id);
      console.log('[DEBUG FinalQuizGate] startQuiz response:', res);
      navigate(`/take-quiz/${quiz.id}?attemptId=${res.attempt.id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể bắt đầu bài kiểm tra');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Chưa có bài kiểm tra</h2>
        <p className="text-gray-500 mt-2">Bài kiểm tra cuối trình độ {level} chưa được tạo.</p>
      </div>
    );
  }

  const isUnlocked = unlock?.unlocked ?? false;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-black mb-1">Bài kiểm tra cuối trình độ</h1>
            <p className="text-white/70 font-medium">
              Cấp độ {level} — {CEFR_LABELS[level || ''] || ''}
            </p>
          </div>

          <div className="p-8 space-y-8">
            {/* Quiz info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <FileText className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <div className="text-lg font-black text-gray-900">{quiz.maxScore || 100}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Điểm tối đa</div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <div className="w-5 h-5 rounded-full border-2 border-amber-500 mx-auto mb-2 flex items-center justify-center text-[9px] font-black text-amber-500">
                  {quiz.passingScore || 60}%
                </div>
                <div className="text-lg font-black text-gray-900">{quiz.passingScore || 60}%</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Điểm đạt</div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <div className="w-5 h-5 rounded-full border-2 border-sky-500 mx-auto mb-2 flex items-center justify-center text-[9px] font-black text-sky-500">
                  {quiz.timeLimit || 60}
                </div>
                <div className="text-lg font-black text-gray-900">{quiz.timeLimit || 60}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phút</div>
              </div>
            </div>

            {/* Unlock conditions */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                {isUnlocked ? <Unlock className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-rose-500" />}
                Điều kiện mở khóa
              </h3>

              {unlock?.requiredCourses.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-sm font-bold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Không có khóa học bắt buộc. Bạn có thể làm bài kiểm tra ngay!
                </div>
              ) : (
                <div className="space-y-2">
                  {unlock?.requiredCourses.map((rc) => {
                    const completed = unlock.completedCourses.some((id) => String(id) === String(rc.id));
                    return (
                      <div
                        key={String(rc.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-bold transition-all ${
                          completed
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-gray-50 border-gray-100 text-gray-500'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {completed ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                          {rc.title}
                        </span>
                        {!completed ? (
                          <button
                            onClick={() => navigate(`/course/${rc.id}`)}
                            className="text-[10px] uppercase tracking-wider font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                          >
                            Học ngay <ArrowRight size={12} />
                          </button>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider font-black">
                            Hoàn thành
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action */}
            <div className="pt-4">
              {passedAttempt ? (
                <div className="space-y-3">
                  <div className="w-full bg-emerald-50 border border-emerald-100 text-emerald-700 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Đã hoàn thành — {passedAttempt.percentageScore}% điểm
                  </div>
                  <button
                    onClick={() => {
                      const levels = ['A1','A2','B1','B2','C1','C2'];
                      const idx = levels.indexOf(level || '');
                      const next = idx >= 0 && idx < levels.length - 1 ? levels[idx + 1] : null;
                      if (next) navigate(`/my-path`);
                      else navigate('/my-path');
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 text-gray-900 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl active:scale-95 cursor-pointer"
                  >
                    Học tiếp <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ) : isUnlocked ? (
                <button
                  onClick={handleStart}
                  disabled={starting}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {starting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Bắt đầu làm bài
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-400 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest cursor-not-allowed">
                  <Lock className="w-5 h-5" />
                  Hoàn thành tất cả khóa học bắt buộc để mở khóa
                </div>
              )}
            </div>

            {/* Attempts History */}
            {attempts.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest mb-4">
                  <History size={18} className="text-slate-400" />
                  Lịch sử làm bài
                  {maxAttempts && (
                    <span className="ml-auto text-xs font-bold text-slate-400 normal-case tracking-normal">
                      Đã dùng {attempts.length}/{maxAttempts} lần
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {attempts.map((att, idx) => (
                    <div
                      key={att.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border text-sm ${
                        att.passed
                          ? 'bg-emerald-50 border-emerald-100'
                          : 'bg-rose-50 border-rose-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-black text-slate-400 border border-gray-100">
                          {attempts.length - idx}
                        </span>
                        <div>
                          <p className={`font-bold ${att.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {att.percentageScore}% điểm {att.passed ? '(Đạt)' : '(Chưa đạt)'}
                          </p>
                          <p className="text-xs text-slate-400 font-medium">
                            {att.completedAt ? new Date(att.completedAt).toLocaleDateString('vi-VN') : new Date(att.startedAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/take-quiz/${quiz?.id}?attemptId=${att.id}`)}
                        className="flex items-center gap-1 px-3 py-2 bg-white rounded-xl text-xs font-bold text-slate-600 border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Eye size={14} /> Xem
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalQuizGate;
