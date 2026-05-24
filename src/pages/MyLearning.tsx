import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, ChevronRight,
    CheckCircle2, Trophy,
    Search, Award, Flame,
    PlaySquare, Clock, ArrowRight
} from 'lucide-react';
import { useEnrollmentStore } from '../store/useEnrollmentStore';
import { type FrontendCourse } from '../services/course.service';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { progressService, type StudentDashboardResponse, type ContinueLearningResponse } from '../services/progress.service';
import { ExpiringCoursesAlert } from '../components/student/ExpiringCoursesAlert';

const MyLearning: React.FC = () => {
    const navigate = useNavigate();
    const { enrolledCourses, syncEnrollments, isLoading, courseProgress } = useEnrollmentStore();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [activeTab, setActiveTab] = React.useState<'all' | 'learning' | 'completed'>('all');
    const [dashboard, setDashboard] = useState<StudentDashboardResponse | null>(null);
    const [continueData, setContinueData] = useState<Record<string, ContinueLearningResponse>>({});
    const [certificates, setCertificates] = useState<any[]>([]);

    useEffect(() => {
        syncEnrollments();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Load dashboard stats
        progressService.getStudentDashboard()
            .then(setDashboard)
            .catch(err => console.error('Dashboard error:', err));

        // Load certificates
        progressService.getMyCertificates()
            .then(setCertificates)
            .catch(err => console.error('Certificates error:', err));
    }, [syncEnrollments]);

    const filteredCourses = React.useMemo(() => {
        return enrolledCourses.filter(course => {
            const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.category.toLowerCase().includes(searchQuery.toLowerCase());

            const rawProgress = courseProgress[String(course.id)];
            const progressNum = Number(rawProgress ?? 0);
            const progress = isNaN(progressNum) ? 0 : Math.round(progressNum);

            if (activeTab === 'learning') return matchesSearch && progress < 100 && progress > 0;
            if (activeTab === 'completed') return matchesSearch && progress >= 100;
            return matchesSearch;
        });
    }, [enrolledCourses, searchQuery, activeTab, courseProgress]);

    const handleContinue = async (courseId: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        const cId = String(courseId);

        if (continueData[cId]) {
            const next = continueData[cId].nextLecture || continueData[cId].lastAccessed;
            if (next) {
                navigate(`/course/${cId}/lesson/${'lectureId' in next ? next.lectureId : ''}`);
                return;
            }
        }

        try {
            const data = await progressService.getContinueLearning(cId);
            setContinueData(prev => ({ ...prev, [cId]: data }));
            const target = data.nextLecture || data.lastAccessed;
            if (target) {
                navigate(`/course/${cId}/lesson/${'lectureId' in target ? target.lectureId : ''}`);
            } else {
                navigate(`/course/${cId}/dashboard`);
            }
        } catch {
            navigate(`/course/${cId}/dashboard`);
        }
    };

    const stats = dashboard?.enrollments;
    const totalEnrolled = stats?.total ?? enrolledCourses.length;
    const completedCount = stats?.completed ?? 0;
    const streak = dashboard?.streak;

    return (
        <div className="min-h-screen bg-gray-50/50 pt-8 pb-20">
            <div className="max-w-7xl mx-auto px-4">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Breadcrumb items={[{ label: 'Khóa học của tôi' }]} />
                </div>

                {/* Expiring Courses Alert */}
                <ExpiringCoursesAlert onViewAll={() => navigate('/my-learning')} />

                {/* Hero Banner */}
                <div className="bg-gray-900 rounded-[32px] p-6 md:p-8 mb-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-4 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-500 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                <Trophy size={16} />
                                Student Achievement
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                                Khóa học <span className="text-amber-500">của tôi</span>
                            </h1>
                            <p className="text-gray-400 font-medium max-w-md">
                                {streak?.current && streak.current > 1
                                    ? `🔥 ${streak.current} ngày học liên tiếp! Tuyệt vời, hãy duy trì nhé!`
                                    : 'Tiếp tục hành trình chinh phục kiến thức của bạn!'}
                            </p>
                        </div>

                        <div className="flex gap-4 flex-wrap justify-center">
                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center min-w-[130px]">
                                <h4 className="text-3xl font-black text-white">{totalEnrolled}</h4>
                                <p className="text-gray-400 text-xs font-bold uppercase mt-1">Đang học</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center min-w-[130px]">
                                <h4 className="text-3xl font-black text-amber-400">{completedCount}</h4>
                                <p className="text-gray-400 text-xs font-bold uppercase mt-1">Hoàn thành</p>
                            </div>
                            {streak && (
                                <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-amber-500/30 text-center min-w-[130px]">
                                    <div className="flex items-center justify-center gap-1">
                                        <Flame size={20} className="text-orange-400" />
                                        <h4 className="text-3xl font-black text-orange-400">{streak.current}</h4>
                                    </div>
                                    <p className="text-gray-400 text-xs font-bold uppercase mt-1">Ngày streak</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Stats from dashboard */}
                {dashboard && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <PlaySquare size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Đang học</p>
                                <p className="text-2xl font-black text-gray-900">{dashboard.enrollments.inProgress}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <CheckCircle2 size={18} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Hoàn thành</p>
                                <p className="text-2xl font-black text-gray-900">{dashboard.enrollments.completed}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                <Clock size={18} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Quiz cần làm</p>
                                <p className="text-2xl font-black text-gray-900">{dashboard.quizzes.pending}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                <Award size={18} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Chứng chỉ</p>
                                <p className="text-2xl font-black text-gray-900">{dashboard.enrollments.completed}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter & Search */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Tìm khóa học trong thư viện..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-sm font-medium"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {(['all', 'learning', 'completed'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold transition-all shadow-sm cursor-pointer border ${activeTab === tab ? 'bg-amber-500 text-gray-900 border-amber-500' : 'bg-white text-gray-500 border-gray-100 hover:border-amber-500'}`}
                            >
                                {tab === 'all' ? 'Tất cả' : tab === 'learning' ? 'Đang học' : (
                                    <span className="flex items-center gap-1.5">
                                        Hoàn thành <CheckCircle2 size={16} className={activeTab === 'completed' ? 'text-gray-900' : 'text-emerald-500'} />
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Course Grid */}
                {isLoading && enrolledCourses.length === 0 ? (
                    <div className="text-center py-32">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Đang đồng bộ hóa khóa học...</p>
                        </div>
                    </div>
                ) : filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCourses.map((course: FrontendCourse, index: number) => {
                            const rawProgress = courseProgress[String(course.id)];
                            const progressNum = Number(rawProgress ?? 0);
                            const progress = isNaN(progressNum) ? 0 : Math.min(100, Math.max(0, progressNum));
                            const isCompleted = progress >= 100;

                            return (
                                <div
                                    key={`${course.id}-${index}`}
                                    className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div 
                                        className="aspect-[16/10] relative overflow-hidden cursor-pointer"
                                        onClick={() => navigate(`/course/${course.id}/dashboard`)}
                                    >
                                        <img
                                            src={course.image}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        {/* Subtle overlay gradient at the bottom to secure the Badge contrast */}
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                        <div className="absolute top-3 left-3">
                                            {isCompleted ? (
                                                <span className="bg-emerald-500 flex items-center gap-1.5 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg">
                                                    <Award size={12} /> Hoàn thành
                                                </span>
                                            ) : (
                                                // Show course duration (6 months) not expiration status
                                                course.durationType === 'lifetime' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                                        Vĩnh viễn
                                                    </span>
                                                ) : course.durationType === 'fixed' && course.durationValue ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                                        {course.durationValue} {course.durationUnit === 'months' ? 'tháng' : course.durationUnit === 'years' ? 'năm' : 'ngày'}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                                        Vĩnh viễn
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <div className="flex items-start gap-2 mb-2">
                                            <h3 
                                                onClick={() => navigate(`/course/${course.id}/dashboard`)}
                                                className="text-sm font-bold text-gray-900 line-clamp-2 min-h-[40px] hover:text-amber-600 transition-colors cursor-pointer flex-1"
                                            >
                                                {course.title}
                                            </h3>
                                            {course.isRequired && (
                                                <span className="shrink-0 px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-black uppercase tracking-wider">
                                                    Bắt buộc
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mb-4 bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                                            <div className="relative">
                                                <img
                                                    src={course.teacherAvatar || '/default-avatar.png'}
                                                    alt={course.teacher}
                                                    className="w-8 h-8 rounded-full object-cover shadow-sm"
                                                />
                                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">GV</span>
                                                <span className="text-[10px] font-bold text-gray-700 truncate max-w-[100px]">{course.teacher}</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-1.5 mb-4">
                                            <div className="flex items-center justify-between text-[9px] font-black uppercase">
                                                <span className="text-gray-400">Tiến độ</span>
                                                <span className={progress >= 100 ? 'text-emerald-600' : 'text-amber-600'}>{progress}%</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {isCompleted ? (
                                            <button
                                                onClick={() => {
                                                    const courseIdStr = String(course.id);
                                                    const cert = certificates.find((c: any) => String(c.courseId) === courseIdStr);
                                                    console.log('[MyLearning] Click certificate, courseId:', courseIdStr, 'found cert:', cert);
                                                    if (cert?.certificateId) {
                                                        navigate(`/verify/${cert.certificateId}`);
                                                    } else {
                                                        navigate(`/course/${course.id}/dashboard`);
                                                    }
                                                }}
                                                className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-1.5 group/btn cursor-pointer"
                                            >
                                                <Award size={14} /> XEM CHỨNG CHỈ
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => handleContinue(course.id, e)}
                                                className="w-full py-3 bg-gray-50 text-gray-900 rounded-xl font-black text-[10px] hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-1.5 group/btn cursor-pointer"
                                            >
                                                {progress > 0 ? 'TIẾP TỤC HỌC' : 'BẮT ĐẦU HỌC'}
                                                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-[40px] border border-gray-100 shadow-sm">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                            <BookOpen size={48} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">
                            {activeTab === 'all' ? 'Chưa có khóa học nào' : activeTab === 'learning' ? 'Chưa có khóa học đang học' : 'Chưa hoàn thành khóa học nào'}
                        </h2>
                        <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">
                            {activeTab === 'all'
                                ? 'Hãy khám phá và chọn cho mình những bài giảng thú vị nhất nhé!'
                                : 'Hãy dành thêm thời gian cho việc học nhé!'}
                        </p>
                        {activeTab === 'all' && (
                            <button
                                onClick={() => navigate('/courses')}
                                className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-gray-200 hover:bg-amber-600 transition-all active:scale-95 cursor-pointer"
                            >
                                KHÁM PHÁ KHÓA HỌC
                            </button>
                        )}
                    </div>
                )}

                {/* View Dashboard CTA */}
                <div className="mt-10 text-center">
                    <button
                        onClick={() => navigate('/student-dashboard')}
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-amber-600 transition-colors"
                    >
                        Xem dashboard đầy đủ <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyLearning;
