import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Users, BookOpen, Heart, ArrowRight, PlayCircle } from 'lucide-react';
import { type FrontendCourse } from '../../services/course.service';
import { useEnrollmentStore } from '../../store/useEnrollmentStore';

interface CourseCardProps {
    course: FrontendCourse;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
    const navigate = useNavigate();
    const { enrolledCourses } = useEnrollmentStore();
    const isEnrolled = enrolledCourses.some(item => item.id === course.id);

    const teacherInitials = (name: string) => {
        const parts = String(name || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        const first = parts[0]?.[0] || '';
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
        return `${first}${last}`.toUpperCase() || 'GV';
    };

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isEnrolled) {
            navigate(`/course/${course.id}/lesson`);
        } else {
            navigate(`/course/${course.id}`);
        }
    };

    return (
        <div
            onClick={() => navigate(`/course/${course.id}`)}
            className="group bg-white cursor-pointer rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-amber-100/50 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full relative"
        >
            {/* Image & Badges */}
            <div className="relative aspect-16/10 overflow-hidden">
                <img
                    src={course.image || '/elearning-1.jpg'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Category Badge */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-amber-600 uppercase tracking-wider shadow-sm">
                    {course.category}
                </div>


                {/* Level Badge */}
                <div className="absolute bottom-4 left-4 flex gap-2">
                    <span className="bg-amber-500/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {course.level}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-1 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500">
                            <Star size={14} fill="currentColor" />
                            <span className="text-sm font-bold text-gray-700">{course.rating}</span>
                            <span className="text-xs text-gray-400">({course.reviewCount})</span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // Heart logic
                            }}
                            className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                        >
                            <Heart size={18} />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 line-clamp-2 min-h-14 group-hover:text-amber-600 transition-colors">
                        {course.title}
                    </h3>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-50">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Users size={14} className="text-blue-500" />
                        <span className="text-xs font-medium">{course.students.toLocaleString()} bạn</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <BookOpen size={14} className="text-emerald-500" />
                        <span className="text-xs font-medium">{course.totalLessons} bài học</span>
                    </div>
                </div>

                {/* Teacher & Price */}
                <div className="mt-auto pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {course.teacherAvatar ? (
                            <img src={course.teacherAvatar} alt={course.teacher} className="w-8 h-8 rounded-full border border-amber-100" />
                        ) : (
                            <div className="w-8 h-8 rounded-full border border-amber-100 bg-amber-50 text-amber-700 flex items-center justify-center text-[10px] font-black">
                                {teacherInitials(course.teacher)}
                            </div>
                        )}
                        <span className="text-xs font-semibold text-gray-600">{course.teacher}</span>
                    </div>
                    {/* <div className="text-right">
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded tracking-widest border border-amber-100">
                            {course.price}đ
                        </span>
                    </div> */}
                </div>
            </div>

            {/* Hover Action */}
            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-linear-to-t from-white via-white to-transparent pt-10">
                <button
                    onClick={handleAction}
                    className={`w-full ${isEnrolled ? 'bg-emerald-600' : 'bg-gray-900'} text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-600 transition-all cursor-pointer shadow-xl`}
                >
                    {isEnrolled ? (
                        <>
                            Học tiếp ngay
                            <PlayCircle size={16} />
                        </>
                    ) : (
                        <>
                            Xem chi tiết
                            <ArrowRight size={16} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CourseCard;
