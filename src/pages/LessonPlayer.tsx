import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Play, Lock,
    CheckCircle2, MessageSquare, FileText,
    Menu, X, ArrowLeft, Trophy, ExternalLink
} from 'lucide-react';
import { useCourseStore } from '../store/useCourseStore';

const LessonPlayer: React.FC = () => {
    const { id, lessonId } = useParams<{ id: string, lessonId: string }>();
    const navigate = useNavigate();
    const { courses } = useCourseStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const course = useMemo(() => courses.find(c => c.id === id), [courses, id]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Flatten lessons to find current and next/prev
    const allLessons = useMemo(() => {
        return course?.curriculum.flatMap(module =>
            module.lessons.map(lesson => ({ ...lesson, moduleId: module.id, moduleTitle: module.title }))
        ) || [];
    }, [course]);

    const currentLesson = useMemo(() => {
        if (!lessonId) return allLessons[0];
        return allLessons.find(l => l.id === lessonId) || allLessons[0];
    }, [allLessons, lessonId]);

    const currentIdx = allLessons.findIndex(l => l.id === currentLesson?.id);
    const nextLesson = allLessons[currentIdx + 1];
    const prevLesson = allLessons[currentIdx - 1];

    if (!course) return null;

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Top Navigation */}
            <header className="h-16 bg-gray-900 text-white flex items-center justify-between px-4 shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/my-learning')}
                        className="p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="hidden md:block">
                        <h1 className="text-sm font-bold truncate max-w-[300px]">{course.title}</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{currentLesson?.moduleTitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden lg:flex items-center gap-2">
                        <div className="h-2 w-32 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 w-[15%]"></div>
                        </div>
                        <span className="text-xs font-bold text-amber-500">15% Hoàn thành</span>
                    </div>

                    <button className="flex items-center gap-2 bg-amber-500 text-gray-900 px-4 py-1.5 rounded-full text-xs font-black hover:bg-amber-600 transition-all cursor-pointer">
                        <Trophy size={14} />
                        NHẬN CHỨNG CHỈ
                    </button>

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-white/10 rounded-full transition-all lg:hidden"
                    >
                        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 min-h-0 relative">
                {/* Main Content (Video & Info) */}
                <main className={`flex-1 overflow-y-auto bg-gray-50 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:mr-0' : ''}`}>
                    {/* Video Player Placeholder */}
                    <div className="w-full h-auto aspect-video md:h-[600px] bg-black relative group">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/50 group-hover:scale-110 transition-transform">
                                <Play size={40} className="text-amber-500 ml-1" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                            <div className="h-full bg-amber-500 w-[45%] shadow-[0_0_10px_#f59e0b]"></div>
                        </div>
                    </div>

                    {/* Lesson Details */}
                    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">{currentLesson?.title}</h2>
                                <p className="text-gray-500 font-medium">Cập nhật lần cuối: 12/2023 • {currentLesson?.duration}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-600 hover:text-amber-600 hover:shadow-md transition-all cursor-pointer">
                                    <MessageSquare size={20} />
                                </button>
                                <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-600 hover:text-amber-600 hover:shadow-md transition-all cursor-pointer">
                                    <FileText size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Resources Section - Highly Visible */}
                        <div className="bg-amber-50/50 border border-amber-100 rounded-[24px] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-900 text-sm uppercase tracking-tight">Tài liệu học tập</h4>
                                    <p className="text-xs text-gray-500 font-bold">Bao gồm file bài tập, mã nguồn và tài liệu PDF đính kèm</p>
                                </div>
                            </div>
                            <button className="flex items-center gap-2 bg-white border border-amber-200 text-amber-600 px-6 py-3 rounded-xl text-xs font-black hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all shadow-sm active:scale-95 cursor-pointer min-w-fit">
                                <ExternalLink size={16} />
                                TẢI XUỐNG TÀI LIỆU (.ZIP)
                            </button>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                            <button
                                disabled={!prevLesson}
                                onClick={() => navigate(`/course/${id}/lesson/${prevLesson.id}`)}
                                className="flex items-center gap-2 font-bold text-gray-500 hover:text-gray-900 disabled:opacity-20 disabled:hover:text-gray-50 transition-colors cursor-pointer"
                            >
                                <ChevronLeft size={20} />
                                BÀI TRƯỚC
                            </button>
                            <button
                                disabled={!nextLesson}
                                onClick={() => navigate(`/course/${id}/lesson/${nextLesson.id}`)}
                                className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-amber-600 transition-all shadow-lg active:scale-95 disabled:opacity-20 cursor-pointer"
                            >
                                BÀI TIẾP THEO
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </main>

                <aside
                    className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white border-l border-gray-100 flex flex-col shadow-2xl lg:shadow-none transition-transform duration-300 md:z-30 z-40 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:absolute lg:top-0 lg:bottom-0 lg:right-0'}`}
                >
                    <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <h3 className="font-black text-gray-900">NỘI DUNG KHÓA HỌC</h3>
                        <div className="lg:hidden">
                            <X size={20} onClick={() => setSidebarOpen(false)} className="cursor-pointer" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {course.curriculum.map((module, mIdx) => (
                            <div key={module.id} className="space-y-2">
                                <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between group cursor-pointer">
                                    <div>
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Phần {mIdx + 1}</p>
                                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{module.title}</h4>
                                    </div>
                                    <ChevronDown size={16} className="text-gray-400" />
                                </div>

                                <div className="space-y-1 pl-2">
                                    {module.lessons.map((lesson) => {
                                        const isActive = lesson.id === currentLesson?.id;
                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => navigate(`/course/${id}/lesson/${lesson.id}`)}
                                                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all group cursor-pointer ${isActive ? 'bg-amber-50 text-amber-600' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                                                    {lesson.isPreview ? <Play size={14} /> : <Lock size={14} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-bold line-clamp-1 ${isActive ? 'text-amber-600' : 'text-gray-700'}`}>{lesson.title}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">{lesson.duration}</p>
                                                </div>
                                                {isActive && <CheckCircle2 size={16} className="text-amber-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                </aside>
            </div>
        </div>
    );
};

// Helper for Sidebar
const ChevronDown: React.FC<{ size: number, className?: string }> = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);

export default LessonPlayer;
