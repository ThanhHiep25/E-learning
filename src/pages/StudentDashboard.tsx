import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, CheckCircle2, PlayCircle, Flame, Trophy,
  BarChart2, Calendar, ChevronRight, Award,
  Zap, Target, TrendingUp, Loader2, AlertCircle, Download, Copy
} from 'lucide-react';
import { progressService, type StudentDashboardResponse } from '../services/progress.service';
import { levelCertificateService, type LevelCertificate } from '../services/levelCertificate.service';
import { Breadcrumb } from '../components/common/Breadcrumb';
import toast from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' }
  }),
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<StudentDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  const [levelCertificates, setLevelCertificates] = useState<LevelCertificate[]>([]);
  const [levelCertificatesLoading, setLevelCertificatesLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    progressService.getStudentDashboard()
      .then(setDashboard)
      .catch(err => {
        console.error('Dashboard error:', err);
        setError('Không thể tải dashboard. Vui lòng thử lại.');
      })
      .finally(() => setLoading(false));

    // Fetch course certificates
    setCertificatesLoading(true);
    progressService.getMyCertificates()
      .then(setCertificates)
      .catch(err => {
        console.error('Certificates error:', err);
      })
      .finally(() => setCertificatesLoading(false));

    // Fetch level certificates
    setLevelCertificatesLoading(true);
    levelCertificateService.getMyCertificates()
      .then(setLevelCertificates)
      .catch(err => {
        console.error('Level certificates error:', err);
      })
      .finally(() => setLevelCertificatesLoading(false));
  }, []);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'short', day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).format(d);
  };

  const formatLastAccess = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Chưa học';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}p trước`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h trước`;
    return `${Math.floor(diffH / 24)}n trước`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 mx-auto text-amber-500 animate-spin" />
        <p className="text-gray-500 font-medium">Đang tải dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4 max-w-sm">
        <AlertCircle className="w-12 h-12 mx-auto text-red-400" />
        <p className="text-gray-700 font-semibold">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-amber-500 text-white px-6 py-2 rounded-xl font-bold">
          Thử lại
        </button>
      </div>
    </div>
  );

  const d = dashboard!;
  const enrollments = d.enrollments;
  const streak = d.streak;
  const quizzes = d.quizzes;
  const recentProgress = d.recentProgress ?? [];

  const quizPassRate = quizzes.completed > 0
    ? Math.round((quizzes.passed / quizzes.completed) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4">

        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={[
            { label: 'Khóa học của tôi', path: '/my-learning' },
            { label: 'Dashboard học sinh' }
          ]} />
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 rounded-[32px] p-8 mb-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest">
                <Trophy size={16} />
                Student Dashboard
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white">
                Tổng quan <span className="text-amber-400">học tập</span>
              </h1>
              {streak.current > 0 && (
                <div className="flex items-center gap-2 bg-orange-500/30 border border-orange-500/50 px-5 py-2.5 rounded-2xl w-fit shadow-lg shadow-orange-500/20 animate-in zoom-in duration-500">
                  <div className="relative">
                    <Flame size={20} className="text-orange-400 animate-pulse" />
                    <div className="absolute inset-0 bg-orange-400 blur-sm opacity-50 animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-orange-300 text-xs font-black uppercase tracking-widest leading-none mb-1">
                      Learning Streak
                    </span>
                    <span className="text-white text-sm font-bold leading-none">
                      {streak.current} ngày liên tiếp — kỷ lục: {streak.longest}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {d.nextEvent && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[220px]">
                <p className="text-gray-400 text-xs uppercase font-bold mb-2 flex items-center gap-1">
                  <Calendar size={12} /> Sự kiện tiếp theo
                </p>
                <p className="text-white font-bold text-sm line-clamp-2">{d.nextEvent.title}</p>
                <p className="text-amber-400 text-xs mt-1">{formatDate(d.nextEvent.startAt)}</p>
                {d.nextEvent.courseTitle && (
                  <p className="text-gray-500 text-[10px] mt-1">{d.nextEvent.courseTitle}</p>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Tổng khóa học', value: enrollments.total,
              icon: BookOpen, color: 'from-blue-50 to-blue-100', iconColor: 'text-blue-600',
              sub: `${enrollments.inProgress} đang học`, i: 0
            },
            {
              label: 'Hoàn thành', value: enrollments.completed,
              icon: CheckCircle2, color: 'from-emerald-50 to-emerald-100', iconColor: 'text-emerald-600',
              sub: `${enrollments.notStarted} chưa bắt đầu`, i: 1
            },
            {
              label: 'Quiz đã làm', value: quizzes.completed,
              icon: BarChart2, color: 'from-purple-50 to-purple-100', iconColor: 'text-purple-600',
              sub: `${quizzes.pending} chờ làm`, i: 2
            },
            {
              label: 'Tỷ lệ pass quiz', value: `${quizPassRate}%`,
              icon: Target, color: 'from-amber-50 to-amber-100', iconColor: 'text-amber-600',
              sub: `${quizzes.passed}/${quizzes.completed} passed`, i: 3
            },
          ].map(({ label, value, icon: Icon, color, iconColor, sub, i }) => (
            <motion.div
              key={label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className={`bg-gradient-to-br ${color} rounded-2xl p-5 border border-white shadow-sm`}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon size={20} className={iconColor} />
                <TrendingUp size={14} className="text-gray-300" />
              </div>
              <p className="text-3xl font-black text-gray-900">{value}</p>
              <p className="text-xs font-bold text-gray-500 mt-0.5 uppercase tracking-wide">{label}</p>
              <p className="text-[10px] text-gray-400 mt-1">{sub}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Continue Learning */}
          <div className="lg:col-span-2">
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <h2 className="font-black text-gray-900 flex items-center gap-2">
                    <PlayCircle size={18} className="text-amber-500" />
                    Tiếp tục học
                  </h2>
                  <button
                    onClick={() => navigate('/my-learning')}
                    className="text-xs font-bold text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-1"
                  >
                    Xem tất cả <ChevronRight size={14} />
                  </button>
                </div>

                {recentProgress.length === 0 ? (
                  <div className="p-8 text-center">
                    <BookOpen size={36} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400 font-medium">Chưa có lịch sử học. Hãy bắt đầu học nhé!</p>
                    <button
                      onClick={() => navigate('/courses')}
                      className="mt-4 bg-amber-500 text-white px-5 py-2 rounded-xl font-bold text-sm"
                    >
                      Khám phá khóa học
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {recentProgress.map((item, idx) => (
                      <motion.div
                        key={item.courseId}
                        custom={5 + idx}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/course/${item.courseId}/dashboard`)}
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center flex-shrink-0 group-hover:from-amber-200 transition-all">
                          {item.courseImage ? (
                            <img src={item.courseImage} alt={item.courseTitle} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <BookOpen size={20} className="text-amber-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate group-hover:text-amber-600 transition-colors">
                            {item.courseTitle}
                          </p>
                          <div className="mt-1.5">
                            <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase mb-1">
                              <span>Tiến độ</span>
                              <span className={item.progressPercent >= 100 ? 'text-emerald-600' : 'text-amber-600'}>
                                {item.progressPercent}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${item.progressPercent >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${item.progressPercent}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {formatLastAccess(item.lastAccessedAt)}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quiz Summary */}
            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-purple-500" />
                  <h3 className="font-black text-gray-900">Quiz của bạn</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Chờ làm', value: quizzes.pending, color: 'bg-amber-500', bg: 'bg-amber-50' },
                    { label: 'Đã hoàn thành', value: quizzes.completed, color: 'bg-purple-500', bg: 'bg-purple-50' },
                    { label: 'Đã pass', value: quizzes.passed, color: 'bg-emerald-500', bg: 'bg-emerald-50' },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                        <span className="text-sm text-gray-600 font-medium">{label}</span>
                      </div>
                      <div className={`${bg} px-3 py-1 rounded-lg`}>
                        <span className="text-sm font-black text-gray-900">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {quizzes.pending > 0 && (
                  <button
                    onClick={() => navigate('/my-tests')}
                    className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    Làm quiz ngay <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Level Certificates Section */}
            <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 shadow-lg shadow-violet-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Award size={18} className="text-white" />
                    </div>
                    <h3 className="font-black text-white">Chứng chỉ hoàn thành khóa học</h3>
                  </div>
                  <span className="text-xs font-bold text-white bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    {levelCertificates.length}
                  </span>
                </div>

                {levelCertificatesLoading ? (
                  <div className="flex items-center justify-center py-6 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Loader2 size={20} className="text-white animate-spin" />
                  </div>
                ) : levelCertificates.length > 0 ? (
                  <div className="space-y-3">
                    {levelCertificates.map((cert) => (
                      <div
                        key={cert.certificateId}
                        onClick={() => navigate(`/verify-level/${cert.certificateId}`)}
                        className="bg-white rounded-xl p-4 border border-violet-100 hover:border-violet-300 hover:shadow-lg transition-all group cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-12 bg-gradient-to-br from-violet-100 to-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-violet-200">
                            <Award size={24} className="text-violet-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate group-hover:text-violet-600 transition-colors">
                              Chứng chỉ hoàn thành khóa học {cert.level}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[10px] text-gray-500">
                                {new Date(cert.issuedAt).toLocaleDateString('vi-VN')}
                              </p>
                              <span className="text-[10px] text-gray-400">•</span>
                              <p className="text-[10px] text-violet-600 font-mono">
                                ID: {cert.certificateId.slice(-8)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/verify-level/${cert.certificateId}`);
                                toast.success('Đã sao chép link xác nhận!', { id: 'copy-level' });
                              }}
                              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
                              title="Sao chép link xác nhận"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => levelCertificateService.downloadCertificate(cert.level)}
                              className="p-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-all shadow-md"
                              title="Tải PDF"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Award size={32} className="mx-auto text-white/40 mb-2" />
                    <p className="text-xs text-white/80">Chưa có chứng chỉ hoàn thành khóa học</p>
                    <p className="text-[10px] text-white/60 mt-1">Hoàn thành khóa học để nhậ̣n chứng chỉ</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Certificates Section - Course Certificates */}
            <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 shadow-lg shadow-emerald-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Award size={18} className="text-white" />
                    </div>
                    <h3 className="font-black text-white">Chứng chỉ khóa học</h3>
                  </div>
                  <span className="text-xs font-bold text-white bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    {certificates.length}
                  </span>
                </div>

                {certificatesLoading ? (
                  <div className="flex items-center justify-center py-6 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Loader2 size={20} className="text-white animate-spin" />
                  </div>
                ) : certificates.length > 0 ? (
                  <div className="space-y-3">
                    {certificates.slice(0, 3).map((cert) => (
                      <div
                        key={cert.certificateId}
                        className="bg-white rounded-xl p-4 border border-emerald-100 hover:border-emerald-300 hover:shadow-lg transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          {/* Certificate Preview Thumbnail */}
                          <div className="w-16 h-12 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-amber-200">
                            <Award size={24} className="text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0" onClick={() => navigate(`/verify/${cert.certificateId}`)} style={{ cursor: 'pointer' }}>
                            <p className="font-bold text-sm text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                              {cert.courseTitle}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[10px] text-gray-500">
                                {new Date(cert.completedAt).toLocaleDateString('vi-VN')}
                              </p>
                              <span className="text-[10px] text-gray-400">•</span>
                              <p className="text-[10px] text-emerald-600 font-mono">
                                ID: {cert.certificateId.slice(-8)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/verify/${cert.certificateId}`);
                                toast.success('Đã sao chép link xác nhận!', { id: 'copy' });
                              }}
                              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
                              title="Sao chép link xác nhận"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  toast.loading('Đang tải chứng chỉ...', { id: 'cert' });
                                  await progressService.downloadCertificate(cert.courseId);
                                  toast.success('Tải chứng chỉ thành công!', { id: 'cert' });
                                } catch (err: any) {
                                  toast.error(err.message || 'Lỗi tải chứng chỉ', { id: 'cert' });
                                }
                              }}
                              className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-md"
                              title="Tải PDF"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {certificates.length > 3 && (
                      <button
                        onClick={() => navigate('/my-learning')}
                        className="w-full text-xs font-bold text-white hover:text-emerald-100 transition-colors flex items-center justify-center gap-1 py-2 bg-white/10 rounded-xl backdrop-blur-sm"
                      >
                        Xem tất cả ({certificates.length}) <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Award size={32} className="mx-auto text-white/40 mb-2" />
                    <p className="text-xs text-white/80">Chưa có chứng chỉ nào</p>
                    <p className="text-[10px] text-white/60 mt-1">Hoàn thành khóa học để nhận chứng chỉ</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
