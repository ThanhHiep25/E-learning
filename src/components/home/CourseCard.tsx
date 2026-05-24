import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Users, Clock, PlayCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { type FrontendCourse } from '../../services/course.service';
import { useEnrollmentStore } from '../../store/useEnrollmentStore';

interface CourseCardProps {
    course: FrontendCourse;
    progress?: number;
    isEnrolled?: boolean;
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    beginner:          { label: 'A1 Beginner',         color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    elementary:        { label: 'A2 Elementary',       color: 'text-sky-700',     bg: 'bg-sky-50 border-sky-200' },
    intermediate:      { label: 'B1 Intermediate',     color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
    'upper-intermediate': { label: 'B2 Upper-Int.',    color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200' },
    advanced:          { label: 'C1 Advanced',         color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200' },
    proficiency:       { label: 'C2 Proficiency',      color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200' },
};

const CourseCard: React.FC<CourseCardProps> = ({ course, progress, isEnrolled: isEnrolledProp }) => {
    const navigate = useNavigate();
    const { enrolledCourses } = useEnrollmentStore();
    const isEnrolled = isEnrolledProp ?? enrolledCourses.some(item => String(item.id) === String(course.id));

    const teacherInitials = (name: string) => {
        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] || '';
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
        return `${first}${last}`.toUpperCase() || 'GV';
    };

    const levelCfg = LEVEL_CONFIG[course.level?.toLowerCase()] || { label: course.level, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' };
    const isCompleted = typeof progress === 'number' && progress >= 100;

    return (
        <div
            onClick={() => navigate(`/course/${course.id}`)}
            className="group bg-white cursor-pointer rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
        >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-gray-100">
                <img
                    src={course.image || '/elearning-1.jpg'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                {/* Top row: category + required badge */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2">
                    <div className="flex items-start gap-2 flex-wrap">
                        <span className="bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            {course.category}
                        </span>
                        {course.isRequired && (
                            <span className="bg-rose-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                Bắt buộc
                            </span>
                        )}
                    </div>
                    {isEnrolled && isCompleted && (
                        <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <CheckCircle size={10} /> Hoàn thành
                        </span>
                    )}
                </div>

                {/* Bottom row: level + duration */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-sm bg-white/90 ${levelCfg.color} ${levelCfg.bg}`}>
                        {levelCfg.label}
                    </span>
                    {course.duration && (
                        <span className="flex items-center gap-1 text-white text-[10px] font-medium drop-shadow">
                            <Clock size={10} /> {course.duration}
                        </span>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col flex-1 gap-3">
                {/* Rating */}
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(i => (
                            <Star key={i} size={11} className={i <= Math.round(course.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                        ))}
                    </div>
                    <span className="text-xs font-bold text-gray-700">{Number(course.rating).toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({course.reviewCount?.toLocaleString()})</span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
                    {course.title}
                </h3>

                {/* Teacher */}
                <div className="flex items-center gap-2">
                    {course.teacherAvatar ? (
                        <img src={course.teacherAvatar} alt={course.teacher} className="w-6 h-6 rounded-full object-cover ring-1 ring-gray-200" />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                            {teacherInitials(course.teacher)}
                        </div>
                    )}
                    <span className="text-xs text-gray-500 truncate">{course.teacher}</span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                        <Users size={11} className="text-blue-400" />
                        {course.students?.toLocaleString()}
                    </span>
                    <span className="w-px h-3 bg-gray-200" />
                    <span className="flex items-center gap-1">
                        <PlayCircle size={11} className="text-violet-400" />
                        {course.totalLessons} bài học
                    </span>
                </div>

                {/* Progress bar */}
                {isEnrolled && typeof progress === 'number' && progress > 0 && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-medium">
                            <span className="text-gray-400">Tiến độ</span>
                            <span className={isCompleted ? 'text-emerald-600' : 'text-amber-600'}>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Footer: price + CTA */}
                <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between gap-3">
                    {!isEnrolled && (
                        <span className={`text-base font-black leading-none ${course.price === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {course.price === 0
                                ? 'Miễn phí'
                                : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price || 0)
                            }
                        </span>
                    )}
                    {isEnrolled ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/course/${course.id}/dashboard`); }}
                            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                            {isCompleted ? 'Xem lại' : 'Tiếp tục'}
                            <ArrowRight size={13} />
                        </button>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/course/${course.id}`); }}
                            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-amber-200 hover:shadow-amber-300"
                        >
                            Xem khóa học
                            <ArrowRight size={13} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
