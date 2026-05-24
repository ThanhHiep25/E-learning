import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock, CheckCircle2, PlayCircle, Trophy, Award,
  BookOpen, Headphones, Mic, FileText, PenTool, ChevronRight
} from 'lucide-react';
import { learningPathService, type MyLearningPathProgress, type LevelProgress } from '../services/learningPath.service';
import { levelCertificateService } from '../services/levelCertificate.service';
import { useAuth } from '../context/AuthContext';
import { useEnrollmentStore } from '../store/useEnrollmentStore';
import toast from 'react-hot-toast';

const SKILL_ICONS: Record<string, React.ReactNode> = {
  listening: <Headphones size={16} />,
  speaking: <Mic size={16} />,
  reading: <FileText size={16} />,
  writing: <PenTool size={16} />,
};

const LEVEL_COLORS: Record<string, string> = {
  A1: 'from-green-400 to-emerald-500',
  A2: 'from-blue-400 to-cyan-500',
  B1: 'from-yellow-400 to-amber-500',
  B2: 'from-orange-400 to-red-500',
  C1: 'from-purple-400 to-violet-500',
  C2: 'from-pink-400 to-rose-500',
};

const LEVEL_BG: Record<string, string> = {
  A1: 'bg-emerald-50 border-emerald-200',
  A2: 'bg-cyan-50 border-cyan-200',
  B1: 'bg-amber-50 border-amber-200',
  B2: 'bg-red-50 border-red-200',
  C1: 'bg-violet-50 border-violet-200',
  C2: 'bg-rose-50 border-rose-200',
};

export default function MyPath() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enrolledCourses, syncEnrollments } = useEnrollmentStore();
  const [progress, setProgress] = useState<MyLearningPathProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [levelCerts, setLevelCerts] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch existing level certificates to map level -> certificateId
    levelCertificateService.getMyCertificates().then(certs => {
      console.log('[DEBUG MyPath] levelCerts raw:', certs);
      const map: Record<string, string> = {};
      certs.forEach(c => { map[c.level] = c.certificateId; });
      console.log('[DEBUG MyPath] levelCerts map:', map);
      setLevelCerts(map);
    }).catch((e) => { console.error('[DEBUG MyPath] getMyCertificates error:', e); });
  }, []);

  // Build set of actually enrolled course IDs from enrollment store (handles stale pathData)
  const enrolledCourseIds = React.useMemo(() => new Set(enrolledCourses.map(ec => ec.id)), [enrolledCourses]);

  useEffect(() => {
    loadProgress();
    if (user) syncEnrollments();
  }, [user]);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const data = await learningPathService.getMyProgress();
      console.log('[DEBUG MyPath] LearningPath data:', data);
      console.log('[DEBUG MyPath] B1 level:', data?.levels?.find((l: any) => l.level === 'B1'));
      setProgress(data);
      if (data?.levels?.length) {
        // Auto-expand current level
        const active = data.levels.find(l => l.progressPercent > 0 && l.progressPercent < 100);
        if (active) setExpandedLevel(active.level);
      }
    } catch {
      toast.error('Không thể tải lộ trình học tập');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-white">
          <BookOpen size={36} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3">Bạn chưa có lộ trình học tập</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Hãy làm bài kiểm tra đầu vào để xác định trình độ và nhận lộ trình cá nhân hóa.
        </p>
        <button
          onClick={() => navigate('/?placement=true')}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg"
        >
          Làm bài kiểm tra đầu vào
        </button>
      </div>
    );
  }

  const allLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const getLevelData = (level: string): LevelProgress | undefined => {
    return progress.levels?.find(l => l.level === level);
  };

  const isLevelLocked = (level: string) => {
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIdx = levelOrder.indexOf(progress.currentLevel || 'A1');
    const levelIdx = levelOrder.indexOf(level);
    // A1/A2 always unlocked (review allowed), levels above current locked
    if (level === 'A1' || level === 'A2') return false;
    return levelIdx > currentIdx;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
            <Trophy size={20} />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Lộ trình của bạn</h1>
        </div>
        <p className="text-slate-500 font-medium">
          {progress.pathName} · Cấp độ hiện tại: <span className="font-bold text-slate-900">{progress.currentLevel || 'A1'}</span>
          · Tiến độ tổng: <span className="font-bold text-amber-600">{progress.overallProgress}%</span>
        </p>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-12 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-slate-500">Tiến độ tổng thể</span>
          <span className="text-sm font-black text-slate-900">{progress.overallProgress}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-amber-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress.overallProgress}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      {/* Roadmap */}
      <div className="space-y-6">
        {allLevels.map((level, idx) => {
          const levelData = getLevelData(level);
          const locked = isLevelLocked(level);
          const isCurrent = level === progress.currentLevel;
          const isCompleted = levelData ? levelData.progressPercent >= 100 : false;
          console.log(`[DEBUG MyPath] Level ${level}: isCompleted=${isCompleted}, progress=${levelData?.progressPercent}, cert=${levelCerts[level] || 'none'}`);
          const isExpanded = expandedLevel === level;

          return (
            <motion.div
              key={level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div
                className={`relative rounded-3xl border-2 p-6 transition-all cursor-pointer ${
                  isCurrent
                    ? `${LEVEL_BG[level]} border-opacity-100`
                    : locked
                    ? 'bg-slate-50 border-slate-200 opacity-70'
                    : 'bg-white border-slate-100 hover:border-slate-300'
                }`}
                onClick={() => !locked && setExpandedLevel(isExpanded ? null : level)}
              >
                {/* Level Header */}
                <div className="flex items-center gap-5">
                  {/* Level Badge */}
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${
                      isCompleted
                        ? 'bg-gradient-to-br from-green-400 to-emerald-600'
                        : locked
                        ? 'bg-slate-300'
                        : `bg-gradient-to-br ${LEVEL_COLORS[level]}`
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={28} /> : locked ? <Lock size={24} /> : level}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black text-slate-900">{level}</h2>
                      {isCurrent && !isCompleted && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                          Đang học
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          Hoàn thành
                        </span>
                      )}
                      {isCompleted && levelCerts[level] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/verify-level/${levelCerts[level]}`);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-bold hover:bg-violet-200 transition-colors"
                          title="Xem chứng chỉ hoàn thành khóa học"
                        >
                          <Award size={12} /> Chứng chỉ
                        </button>
                      )}
                      {isCompleted && !levelCerts[level] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/final-quiz/${level}`);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold hover:bg-amber-600 transition-colors shadow-md animate-pulse"
                          title="Làm bài kiểm tra cuối khóa học để nhậ̣n chứng chỉ hoàn thành"
                        >
                          <Trophy size={12} /> Kiểm tra ngay
                        </button>
                      )}
                      {locked && (
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
                          Khóa
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      {levelData
                        ? `${levelData.completedCourses}/${levelData.totalCourses} khóa hoàn thành`
                        : 'Chưa có khóa học nào'}
                    </p>
                    {/* Mini progress */}
                    {levelData && (
                      <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-xs">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${LEVEL_COLORS[level]}`}
                          style={{ width: `${levelData.progressPercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <ChevronRight
                    size={20}
                    className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </div>

                {/* Expanded Courses */}
                {isExpanded && levelData && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {levelData.courses.map((course) => (
                      <div
                        key={course.courseId}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                          enrolledCourseIds.has(String(course.courseId))
                            ? 'bg-white border-slate-200'
                            : locked
                            ? 'bg-slate-50 border-slate-100 opacity-60'
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!locked || enrolledCourseIds.has(String(course.courseId))) {
                            navigate(enrolledCourseIds.has(String(course.courseId)) ? `/course/${course.courseId}/dashboard` : `/course/${course.courseId}`);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                            {SKILL_ICONS[course.skill || ''] || <BookOpen size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-slate-900 truncate">{course.title}</p>
                              {course.isRequired && (
                                <span className="shrink-0 px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-black uppercase tracking-wider">
                                  Bắt buộc
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 capitalize">{course.skill}</p>
                          </div>
                          {course.progress >= 100 ? (
                            <CheckCircle2 size={20} className="text-green-500" />
                          ) : enrolledCourseIds.has(String(course.courseId)) ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-600">{course.progress}%</span>
                              <PlayCircle size={18} className="text-blue-500" />
                            </div>
                          ) : locked ? (
                            <Lock size={18} className="text-slate-300" />
                          ) : (
                            <span className="text-xs font-bold text-blue-600">Đăng ký</span>
                          )}
                        </div>
                        {/* Course progress bar */}
                        {enrolledCourseIds.has(String(course.courseId)) && course.progress < 100 && (
                          <div className="mt-3 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
