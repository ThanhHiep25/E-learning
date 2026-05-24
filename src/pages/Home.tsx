import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Banner from '../components/home/Banner';
import CourseCard from '../components/home/CourseCard';
import { useCourseStore } from '../store/useCourseStore';
import { useEnrollmentStore } from '../store/useEnrollmentStore';
import { useAuth } from '../context/AuthContext';
import {
    GraduationCap, Flame, ArrowRight, Users, PlayCircle, Trophy, Lock, Compass,
    Target, Zap, BookOpen, ChevronRight, Star, Award, CheckCircle2
} from 'lucide-react';
import slideShowLogo from '../config/slide-show';
import PersonalizedSection from '../components/home/PersonalizedSection';
import { learningPathService, type MyLearningPathProgress, type LevelProgress, type LearningPathCourse } from '../services/learningPath.service';
import { levelCertificateService } from '../services/levelCertificate.service';

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    A1: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', gradient: 'from-emerald-400 to-teal-500' },
    A2: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', gradient: 'from-cyan-400 to-blue-500' },
    B1: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', gradient: 'from-amber-400 to-orange-500' },
    B2: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', gradient: 'from-orange-400 to-red-500' },
    C1: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', gradient: 'from-violet-400 to-purple-500' },
    C2: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', gradient: 'from-rose-400 to-pink-500' },
};

function ProgressRing({ percent, size = 48, stroke = 4, color = '#3b82f6' }: { percent: number; size?: number; stroke?: number; color?: string }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (percent / 100) * c;
    return (
        <svg width={size} height={size} className="shrink-0 -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
                className="transition-all duration-700 ease-out" />
        </svg>
    );
}

function LevelBadge({ level }: { level: string }) {
    const style = LEVEL_COLORS[level] || LEVEL_COLORS.A1;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${style.bg} ${style.text} border ${style.border}`}>
            <Star size={12} />
            {level}
        </span>
    );
}

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { courses, loadCourses } = useCourseStore();
    const { enrolledCourses, syncEnrollments, courseProgress } = useEnrollmentStore();
    const [pathData, setPathData] = useState<MyLearningPathProgress | null | undefined>(undefined);
    const [levelCerts, setLevelCerts] = useState<Record<string, string>>({});

    useEffect(() => {
        loadCourses();
        if (user) {
            syncEnrollments();
            learningPathService.getMyProgress().then((data) => {
                console.log('[DEBUG] LearningPath data:', data);
                console.log('[DEBUG] B1 courses:', data?.levels?.find((l: any) => l.level === 'B1')?.courses);
                setPathData(data);
            }).catch(() => setPathData(null));
            levelCertificateService.getMyCertificates().then(certs => {
                const map: Record<string, string> = {};
                certs.forEach(c => { map[c.level] = c.certificateId; });
                setLevelCerts(map);
            }).catch(() => {});
        } else {
            setPathData(null);
            setLevelCerts({});
        }
    }, [user]);

    const totalLearners = useMemo(() => {
        const total = courses.reduce((sum, c) => sum + Number((c as any)?.students ?? 0), 0);
        return Number.isFinite(total) ? Math.max(0, total) : 0;
    }, [courses]);

    const totalLearnersText = totalLearners > 0
        ? `${totalLearners.toLocaleString()} học viên`
        : 'nhiều học viên';

    const popularCourses = useMemo(() => {
        return [...courses]
            .sort((a, b) => {
                const studentsDiff = (Number(b.students) || 0) - (Number(a.students) || 0);
                if (studentsDiff !== 0) return studentsDiff;
                return (Number(b.rating) || 0) - (Number(a.rating) || 0);
            })
            .slice(0, 4);
    }, [courses]);

    const currentLevelData = useMemo(() => {
        if (!pathData?.levels) return null;
        return pathData.levels.find((l: LevelProgress) => l.level === pathData.currentLevel);
    }, [pathData]);

    // Build set of actually enrolled course IDs from enrollment store (handles stale pathData)
    const enrolledCourseIds = useMemo(() => new Set(enrolledCourses.map(ec => ec.id)), [enrolledCourses]);

    const nextCourse = useMemo(() => {
        if (!currentLevelData) return null;
        // 1. Course in progress (enrolled + started but not complete) — "Continue"
        return currentLevelData.courses.find((c: LearningPathCourse) => enrolledCourseIds.has(String(c.courseId)) && c.progress > 0 && c.progress < 100)
            // 2. First unenrolled course — "Enroll now" (cross-check with enrollment store)
            || currentLevelData.courses.find((c: LearningPathCourse) => !enrolledCourseIds.has(String(c.courseId)))
            // 3. Fallback: nothing to suggest
            || null;
    }, [currentLevelData, enrolledCourseIds]);

    const completedCourses = useMemo(() => {
        if (!pathData?.levels) return 0;
        return pathData.levels.reduce((sum: number, l: LevelProgress) => sum + (l.completedCourses || 0), 0);
    }, [pathData]);


    return (
        <div className="space-y-16 pb-24 bg-slate-50/80">
            {/* Banner — guest only; logged-in gets hero below */}
            {!user && (
                <section>
                    <Banner />
                </section>
            )}

            {/* HERO — Personalized Welcome + Stats */}
            {user && (
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-7xl mx-auto px-4 md:px-8 pt-8"
                >
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden">
                        {/* Decorative blobs */}
                        <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                            {/* Left: greeting + level */}
                            <div className="space-y-4">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex items-center gap-3 flex-wrap"
                                >
                                    {pathData ? (
                                        <LevelBadge level={pathData.currentLevel || 'A1'} />
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 text-white/80 border border-white/20">
                                            <Zap size={12} /> Chưa xác định
                                        </span>
                                    )}
                                    <span className="text-white/40 text-sm font-medium">
                                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </span>
                                </motion.div>

                                <motion.h1
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-3xl md:text-5xl font-black leading-tight"
                                >
                                    {pathData && enrolledCourses.length > 0
                                        ? <>Chào mừng trở lại, <span className="text-amber-400">{user.fullName?.split(' ').pop() || 'bạn'}</span>!</>
                                        : pathData
                                        ? <>Sẵn sàng bắt đầu, <span className="text-amber-400">{user.fullName?.split(' ').pop() || 'bạn'}</span>?</>
                                        : <>Xin chào <span className="text-amber-400">{user.fullName?.split(' ').pop() || 'bạn'}</span>!</>
                                    }
                                </motion.h1>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-white/60 font-medium max-w-lg"
                                >
                                    {pathData && enrolledCourses.length > 0
                                        ? `Bạn đang ở cấp độ ${pathData.currentLevel}. Hãy tiếp tục chinh phục lộ trình học tập của mình nhé!`
                                        : pathData
                                        ? `Hệ thống đánh giá bạn ở cấp độ ${pathData.currentLevel}. Đăng ký khóa học đầu tiên để bắt đầu hành trình nhé!`
                                        : 'Làm bài kiểm tra đầu vào để nhận lộ trình học tập cá nhân hóa và bắt đầu hành trình của bạn.'}
                                </motion.p>
                            </div>

                            {/* Right: 3 stat cards */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex gap-3"
                            >
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 min-w-[100px] text-center">
                                    <div className="flex justify-center mb-2">
                                        <ProgressRing percent={pathData?.overallProgress || 0} size={44} stroke={3} color="#fbbf24" />
                                    </div>
                                    <div className="text-lg font-black text-amber-400">{pathData?.overallProgress || 0}%</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Tổng tiến độ</div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 min-w-[100px] text-center">
                                    <div className="w-11 h-11 mx-auto mb-2 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <Award size={20} />
                                    </div>
                                    <div className="text-lg font-black text-emerald-400">{completedCourses}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Khóa xong</div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 min-w-[100px] text-center">
                                    <div className="w-11 h-11 mx-auto mb-2 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                                        <Flame size={20} />
                                    </div>
                                    <div className="text-lg font-black text-rose-400">{enrolledCourses.length}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Đang học</div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>
            )}

            {/* START LEARNING CTA — for users with path but no enrollments */}
            {user && pathData && enrolledCourses.length === 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="max-w-7xl mx-auto px-4 md:px-8"
                >
                    <div
                        onClick={() => navigate('/my-path')}
                        className="group bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 hover:shadow-2xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0 group-hover:scale-105 transition-transform">
                                <Compass size={32} />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                                    <LevelBadge level={pathData.currentLevel || 'A1'} />
                                    <span className="text-xs font-bold uppercase text-slate-400">Lộ trình cá nhân</span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-1">Bắt đầu lộ trình {pathData.currentLevel}</h3>
                                <p className="text-slate-500 font-medium text-sm">
                                    Bạn đã sẵn sàng — {currentLevelData?.totalCourses || 0} khóa học đang chờ bạn
                                    {(() => {
                                      const requiredCount = currentLevelData?.courses?.filter((c) => c.isRequired).length || 0;
                                      return requiredCount > 0 ? ` (${requiredCount} khóa bắt buộc)` : '';
                                    })()}
                                    . Nhấn để xem chi tiết!
                                </p>
                            </div>
                            <div className="shrink-0 flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold group-hover:bg-indigo-600 transition-colors">
                                Xem lộ trình
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    </div>
                </motion.section>
            )}

            {/* Continue Learning — enrolled courses grid */}
            {user && enrolledCourses.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="max-w-7xl mx-auto px-4 md:px-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <PlayCircle size={12} />
                                Tiếp tục học
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900">Khóa học của bạn</h2>
                        </div>
                        <button onClick={() => navigate('/my-learning')} className="text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors flex items-center gap-1">
                            Xem tất cả <ArrowRight size={14} />
                        </button>
                    </div>
                    <div className="bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {enrolledCourses.slice(0, 4).map((course) => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    progress={courseProgress[course.id]}
                                    isEnrolled
                                />
                            ))}
                        </div>
                    </div>
                </motion.section>
            )}

            {/* Learning Path / Placement Test Section */}
            <section className="max-w-7xl mx-auto px-4 md:px-8">
                    {pathData ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px flex-1 bg-slate-200"></div>
                                <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                    <Compass size={12} />
                                    Lộ trình của bạn
                                </div>
                                <div className="h-px flex-1 bg-slate-200"></div>
                            </div>

                            {/* Mini Roadmap */}
                            <div className="bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 mb-1">
                                            Cấp độ <span className="text-amber-600">{pathData.currentLevel}</span>
                                        </h3>
                                        <p className="text-slate-500 text-sm font-medium">
                                            {currentLevelData?.completedCourses || 0}/{currentLevelData?.totalCourses || 0} khóa hoàn thành · {pathData.overallProgress}% tổng thể
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/my-path')}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all"
                                    >
                                        Xem lộ trình
                                        <ArrowRight size={14} />
                                    </button>
                                </div>

                                {/* Level pills */}
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {(() => {
                                        const LEVEL_ORDER = ['A1','A2','B1','B2','C1','C2'];
                                        const currentIdx = LEVEL_ORDER.indexOf(pathData.currentLevel ?? '');
                                        return LEVEL_ORDER.map((lvl) => {
                                            const lvlIdx = LEVEL_ORDER.indexOf(lvl);
                                            const isCurrent = lvl === pathData.currentLevel;
                                            const lvlData = pathData.levels?.find((l: LevelProgress) => l.level === lvl);
                                            const isDone = !!lvlData && lvlData.totalCourses > 0 && lvlData.completedCourses >= lvlData.totalCourses;
                                            const isPassedByPlacement = !isDone && !isCurrent && lvlIdx < currentIdx;
                                            const isLocked = !isCurrent && !isDone && !isPassedByPlacement && lvlIdx > currentIdx;
                                            const colors = LEVEL_COLORS[lvl];
                                            return (
                                                <div
                                                    key={lvl}
                                                    title={isPassedByPlacement ? 'Đã vượt qua qua bài kiểm tra đầu vào' : undefined}
                                                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold shrink-0 transition-all ${
                                                        isCurrent
                                                            ? `${colors.bg} ${colors.text} ${colors.border} shadow-md`
                                                            : isDone
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                                : isPassedByPlacement
                                                                    ? 'bg-blue-50 text-blue-500 border-blue-200'
                                                                    : isLocked
                                                                        ? 'bg-slate-50 text-slate-300 border-slate-100'
                                                                        : 'bg-white text-slate-500 border-slate-200'
                                                    }`}
                                                >
                                                    {isDone && <Trophy size={14} className="text-emerald-500" />}
                                                    {isPassedByPlacement && <CheckCircle2 size={14} className="text-blue-400" />}
                                                    {isLocked && <Lock size={12} />}
                                                    {lvl}
                                                    {isCurrent && (
                                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Current level courses */}
                            {currentLevelData && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                    {currentLevelData.courses.map((c: LearningPathCourse, idx: number) => (
                                        <motion.div
                                            key={c.courseId}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => navigate(enrolledCourseIds.has(String(c.courseId)) ? `/course/${c.courseId}/dashboard` : `/course/${c.courseId}`)}
                                            className="group bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
                                        >
                                            {/* Top color bar */}
                                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${LEVEL_COLORS[pathData.currentLevel || 'A1']?.gradient || 'from-blue-400 to-indigo-500'} rounded-t-2xl`} />

                                            <div className="flex items-center justify-between mb-4 mt-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{c.skill}</span>
                                                    {c.isRequired && (
                                                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-black uppercase tracking-wider">
                                                            Bắt buộc
                                                        </span>
                                                    )}
                                                </div>
                                                {c.progress >= 100 ? (
                                                    <div className="flex items-center gap-1 text-amber-500">
                                                        <Trophy size={14} />
                                                        <span className="text-[10px] font-black">XONG</span>
                                                    </div>
                                                ) : enrolledCourseIds.has(String(c.courseId)) ? (
                                                    <span className="text-xs font-black text-indigo-600">{c.progress}%</span>
                                                ) : (
                                                    <Lock size={13} className="text-slate-300" />
                                                )}
                                            </div>

                                            <h3 className="font-bold text-slate-900 text-sm mb-3 leading-snug">{c.title}</h3>

                                            {/* Progress bar or enroll CTA */}
                                            {enrolledCourseIds.has(String(c.courseId)) ? (
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${c.progress}%` }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 0.8, delay: 0.2 }}
                                                        className={`h-full rounded-full ${c.progress >= 100 ? 'bg-amber-400' : 'bg-indigo-500'}`}
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Đăng ký để bắt đầu</span>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <PersonalizedSection />
                    )}
                </section>

            {/* NEXT UP — Prominent card for the next course (only if enrolled or has progress) */}
            {user && pathData && nextCourse && enrolledCourses.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="max-w-7xl mx-auto px-4 md:px-8"
                >
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-px flex-1 bg-slate-200"></div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tiếp theo</span>
                        <div className="h-px flex-1 bg-slate-200"></div>
                    </div>

                    <div
                        onClick={() => navigate(enrolledCourseIds.has(String(nextCourse.courseId)) ? `/course/${nextCourse.courseId}/dashboard` : `/course/${nextCourse.courseId}`)}
                        className="group bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 hover:shadow-2xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                                <BookOpen size={32} />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                                    <LevelBadge level={pathData.currentLevel || 'A1'} />
                                    <span className="text-xs font-bold uppercase text-slate-400">{nextCourse.skill}</span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-1">{nextCourse.title}</h3>
                                <p className="text-slate-500 font-medium text-sm">
                                    {nextCourse.progress > 0 && nextCourse.progress < 100
                                        ? `Đang học — ${nextCourse.progress}% hoàn thành`
                                        : !enrolledCourseIds.has(String(nextCourse.courseId))
                                        ? 'Khóa học tiếp theo — Đăng ký để bắt đầu học'
                                        : 'Chưa bắt đầu — Nhấn để bắt đầu học ngay'}
                                </p>
                            </div>
                            <div className="shrink-0">
                                {nextCourse.progress > 0 && nextCourse.progress < 100 ? (
                                    <div className="flex items-center gap-3">
                                        <ProgressRing percent={nextCourse.progress} size={56} stroke={5} color="#6366f1" />
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-indigo-600">{nextCourse.progress}%</div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiến độ</div>
                                        </div>
                                    </div>
                                ) : !enrolledCourseIds.has(String(nextCourse.courseId)) ? (
                                    <div className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl font-bold group-hover:bg-amber-600 transition-colors">
                                        Đăng ký
                                        <ChevronRight size={18} />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold group-hover:bg-indigo-600 transition-colors">
                                        Bắt đầu
                                        <ChevronRight size={18} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.section>
            )}

            {/* LEVEL COMPLETE — Single consolidated banner for all completed levels with certificates */}
            {user && pathData && (() => {
                const completedCerts = Object.entries(levelCerts).filter(([certLevel, _certId]) => {
                    const levelData = pathData.levels?.find((l: LevelProgress) => l.level === certLevel);
                    if (!levelData) return false;
                    return (levelData.completedCourses || 0) >= (levelData.totalCourses || 0);
                });
                if (completedCerts.length === 0) return null;
                return (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="max-w-7xl mx-auto px-4 md:px-8 mb-6"
                >
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[32px] p-8 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                        <div className="relative z-10">
                            <Trophy size={48} className="mx-auto mb-4 text-yellow-300" />
                            <h2 className="text-2xl md:text-3xl font-black mb-2">
                                Chúc mừng bạn!
                            </h2>
                            <p className="text-white/80 font-medium mb-6 max-w-md mx-auto">
                                Bạn đã hoàn thành {completedCerts.length} trình độ và đạt chứng chỉ.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 mb-8">
                                {completedCerts.map(([certLevel, certId]) => (
                                    <button
                                        key={certLevel}
                                        onClick={() => certId && navigate(`/verify-level/${certId}`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-sm font-bold hover:bg-white/30 transition-colors"
                                    >
                                        <Award size={16} />
                                        {certLevel}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => navigate('/my-path')}
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-2xl font-black hover:bg-yellow-50 transition-colors shadow-lg mx-auto"
                            >
                                Về lộ trình học <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </motion.section>
                );
            })()}

            {/* Featured Courses — guest only preview */}
            {!user && courses.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="max-w-7xl mx-auto px-4 md:px-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <Star size={12} />
                                Nổi bật
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900">Khóa học phổ biến</h2>
                        </div>
                        <button onClick={() => navigate('/courses')} className="text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors flex items-center gap-1">
                            Xem tất cả <ArrowRight size={14} />
                        </button>
                    </div>
                    <div className="bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {popularCourses.map((course) => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                />
                            ))}
                        </div>
                    </div>
                </motion.section>
            )}

            {/* Quick explore CTA */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-7xl mx-auto px-4 md:px-8"
            >
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-[32px] border border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-100/50 rounded-full blur-[60px] pointer-events-none" />
                    <div className="space-y-2 relative z-10">
                        <h3 className="text-xl font-black text-slate-900">Khám phá toàn bộ khóa học</h3>
                        <p className="text-slate-500 font-medium">Lọc theo cấp độ A1–C2 và kỹ năng Listening, Speaking, Reading, Writing.</p>
                    </div>
                    <button
                        onClick={() => navigate('/courses')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all shrink-0 relative z-10"
                    >
                        Xem catalog
                        <ArrowRight size={18} />
                    </button>
                </div>
            </motion.section>

            {/* Info Section — guest only */}
            {!user && (
                <section className="relative bg-white py-20 overflow-hidden border-y border-slate-100">
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-50/30 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-50/30 rounded-full blur-[100px] pointer-events-none" />
                    <div className="relative max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: GraduationCap, title: 'Giảng viên chuyên gia', desc: 'Đội ngũ thầy cô giàu kinh nghiệm, tâm huyết từ các trường chuyên danh tiếng.', iconClass: 'bg-red-50 text-red-600' },
                            { icon: Target, title: 'Lộ trình bứt phá', desc: 'Giáo trình được thiết kế cá nhân hóa, bám sát cấu trúc đề thi mới nhất.', iconClass: 'bg-amber-50 text-amber-600' },
                            { icon: Users, title: 'Cộng đồng học tập', desc: `Hỗ trợ 24/7, cùng trao đổi và học hỏi với ${totalLearnersText}.`, iconClass: 'bg-blue-50 text-blue-600' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="group bg-white/80 backdrop-blur border border-slate-100 p-8 rounded-[28px] flex flex-col items-center text-center hover:shadow-2xl hover:border-slate-200 transition-all duration-500 hover:-translate-y-1 cursor-default"
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 ${item.iconClass}`}>
                                    <item.icon size={28} />
                                </div>
                                <h3 className="font-black text-lg text-slate-900 mb-2">{item.title}</h3>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Slide Show Logo Section */}
            <section className="py-16 bg-slate-50 border-y border-slate-200 overflow-hidden relative">
                <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none hidden md:block" />
                <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none hidden md:block" />
                <div className="relative max-w-7xl mx-auto px-4 mb-10">
                    <h2 className="text-center text-slate-800 font-black uppercase tracking-[0.2em] text-sm mb-2 opacity-80">Đối tác đồng hành</h2>
                    <p className="text-center text-slate-500 font-medium max-w-xl mx-auto text-sm">
                        Hơn <span className="font-bold text-slate-800">{totalLearnersText}</span> đã tin tưởng và chọn chúng tôi
                    </p>
                </div>
                <div className="marquee-container relative z-0">
                    <div className="marquee-content py-4">
                        {[...slideShowLogo, ...slideShowLogo, ...slideShowLogo].map((logo, index) => (
                            <div
                                key={`${logo.id}-${index}`}
                                className="group cursor-pointer w-40 h-28 md:w-52 md:h-32 flex flex-col items-center justify-center p-5 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-lg hover:-translate-y-1 hover:border-amber-200 mx-3"
                            >
                                <img src={logo.image} alt={`Partner ${logo.id}`} className='max-w-full max-h-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500' style={{ transform: 'scale(0.95)' }} />
                                <p className="text-center text-slate-400 group-hover:text-slate-800 font-extrabold text-[10px] uppercase tracking-[0.2em] mt-3 transition-colors">{logo.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
