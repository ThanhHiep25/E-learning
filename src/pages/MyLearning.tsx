import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Clock, ChevronRight,
    PlayCircle, CheckCircle2, Trophy,
    Search
} from 'lucide-react';
import { useEnrollmentStore } from '../store/useEnrollmentStore';
import { type FrontendCourse } from '../services/course.service';
import { useCourseStore } from '../store/useCourseStore';
import { getFirstLessonId, getLessonIdByProgressPercent } from '../store/curriculumIndex';

const MyLearning: React.FC = () => {
    const navigate = useNavigate();
    const { enrolledCourses, syncEnrollments, isLoading, courseProgress } = useEnrollmentStore();
    const { loadCourseDetail, getCurriculumIndex } = useCourseStore();

    useEffect(() => {
        syncEnrollments();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [syncEnrollments]);

    return (
        <div className="min-h-screen bg-gray-50/50 pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header Section */}
                <div className="bg-gray-900 rounded-[40px] p-8 md:p-12 mb-10 overflow-hidden relative">
                    {/* Abstract Decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

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
                                Tiếp tục hành trình chinh phục kiến thức. Bạn đã hoàn thành 0% mục tiêu tuần này!
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center min-w-[140px]">
                                <h4 className="text-3xl font-black text-white">{enrolledCourses.length}</h4>
                                <p className="text-gray-400 text-xs font-bold uppercase mt-1">Đang học</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center min-w-[140px]">
                                <h4 className="text-3xl font-black text-white">0</h4>
                                <p className="text-gray-400 text-xs font-bold uppercase mt-1">Hoàn thành</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Tìm khóa học trong thư viện..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-sm font-medium"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <button className="whitespace-nowrap px-6 py-3 bg-white text-gray-900 border border-gray-100 rounded-xl font-bold hover:border-amber-500 transition-all shadow-sm cursor-pointer">
                            Tất cả
                        </button>
                        <button className="whitespace-nowrap px-6 py-3 text-gray-500 font-bold hover:text-amber-600 transition-all cursor-pointer">
                            Đang học
                        </button>
                        <button className="whitespace-nowrap px-6 py-3 text-gray-500 font-bold hover:text-amber-600 transition-all cursor-pointer flex items-center gap-2">
                            Hoàn thành
                            <CheckCircle2 size={18} className="text-emerald-500" />
                        </button>
                    </div>
                </div>

                {isLoading && enrolledCourses.length === 0 ? (
                    <div className="text-center py-32">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Đang đồng bộ hóa khóa học...</p>
                        </div>
                    </div>
                ) : enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {enrolledCourses.map((course: FrontendCourse) => (
                            <div
                                key={course.id}
                                className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="aspect-video relative overflow-hidden">
                                    <img
                                        src={course.image}
                                        alt={course.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => navigate(`/course/${course.id}`)}
                                            className="w-16 h-16 bg-amber-500 text-gray-900 rounded-full flex items-center justify-center shadow-2xl hover:bg-white transition-colors animate-bounce cursor-pointer"
                                        >
                                            <PlayCircle size={32} />
                                        </button>
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                            {course.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                        <Clock size={12} />
                                        {course.duration}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 min-h-[56px] group-hover:text-amber-600 transition-colors mb-4">
                                        {course.title}
                                    </h3>

                                    {/* Progress Bar */}
                                    <div className="space-y-2 mb-6">
                                        {(() => {
                                            const progress = Math.min(100, Math.max(0, Number(courseProgress[String(course.id)] ?? 0)));
                                            return (
                                                <>
                                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-gray-400">Tiến độ</span>
                                                        <span className="text-amber-600">{progress}%</span>
                                                    </div>

                                                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    <button
                                        onClick={async () => {
                                            try {
                                                const progress = Math.min(100, Math.max(0, Number(courseProgress[String(course.id)] ?? 0)));
                                                const idx = getCurriculumIndex(String(course.id));
                                                if (idx) {
                                                    const lessonId = getLessonIdByProgressPercent(idx, progress) || getFirstLessonId(idx);
                                                    if (lessonId) {
                                                        navigate(`/course/${course.id}/lesson/${lessonId}`);
                                                        return;
                                                    }
                                                }

                                                const detail = await loadCourseDetail(String(course.id));
                                                const idx2 = detail ? getCurriculumIndex(String(course.id)) : undefined;
                                                if (idx2) {
                                                    const lessonId = getLessonIdByProgressPercent(idx2, progress) || getFirstLessonId(idx2);
                                                    if (lessonId) {
                                                        navigate(`/course/${course.id}/lesson/${lessonId}`);
                                                        return;
                                                    }
                                                }
                                            } catch {
                                            }

                                            navigate(`/course/${course.id}`);
                                        }}
                                        className="w-full py-4 bg-gray-50 text-gray-900 rounded-2xl font-black text-xs hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2 group/btn cursor-pointer"
                                    >
                                        HỌC TIẾP
                                        <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-[40px] border border-gray-100 shadow-sm">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                            <BookOpen size={48} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Chưa có khóa học nào</h2>
                        <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">
                            Bạn chưa ghi danh vào bất kỳ khóa học nào. Hãy khám phá và chọn cho mình những bài giảng thú vị nhất nhé!
                        </p>
                        <button
                            onClick={() => navigate('/courses')}
                            className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-gray-200 hover:bg-amber-600 transition-all active:scale-95 cursor-pointer"
                        >
                            KHÁM PHÁ KHÓA HỌC
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyLearning;
