import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Star, Users, ArrowRight } from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { type FrontendCourse } from '../../services/course.service';

interface SearchSpotlightProps {
    isOpen: boolean;
    onClose: () => void;
}

const SearchSpotlight: React.FC<SearchSpotlightProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<FrontendCourse[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const { courses, loadCourses } = useCourseStore();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
            loadCourses();
        } else {
            document.body.style.overflow = 'unset';
            setSearchQuery('');
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        if (searchQuery.trim().length > 1) {
            const filtered = courses.filter(course =>
                course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setResults(filtered);
        } else {
            setResults([]);
        }
    }, [searchQuery, courses]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-start justify-center pt-24 px-4 sm:px-6">
            {/* Backdrop refined */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Modal Premium Container */}
            <div className="relative w-full max-w-2xl  max-h-[600px] bg-white/95 backdrop-blur-2xl rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Search Input Area Refined */}
                <div className="p-8 border-b border-gray-100 bg-white/50 sticky top-0 z-10">
                    <div className="relative flex items-center">
                        <Search className="absolute left-0 text-amber-500" size={20} strokeWidth={2.5} />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="What do you want to learn today?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-10 py-2 text-[16px]  text-gray-900 placeholder-gray-300 outline-none border-none bg-transparent tracking-tight"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute cursor-pointer right-0 p-2 hover:bg-amber-50 rounded-2xl text-amber-600 transition-all active:scale-90"
                            >
                                <X size={24} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Results Area Refined */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-gray-50/30">
                    {searchQuery.length === 0 ? (
                        <div className="p-8">
                            <div className="flex items-center gap-3 text-[14px] font-black text-gray-400  mb-8 px-2">
                                <span>Gợi ý tìm kiếm </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {courses.slice(0, 4).map((course) => (
                                    <button
                                        key={course.id}
                                        className="flex items-center gap-5 p-5 bg-white rounded-3xl border border-gray-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/30 transition-all duration-300 group text-left"
                                        onClick={() => {
                                            navigate(`/course/${course.id}`);
                                            onClose();
                                        }}
                                    >
                                        <div className="flex-1 cursor-pointer">
                                            <h4 className="font-bold text-gray-600 text-[14px] group-hover:text-amber-600">{course.title}</h4>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Star size={12} fill="currentColor" className="text-amber-500" />
                                                <span className="text-[10px] font-bold text-gray-600">{course.rating}</span>
                                                <span className="text-[10px] text-gray-400">({course.reviewCount})</span>
                                            </div>
                                        </div>
                                        <ArrowRight size={16} className="text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : searchQuery.length > 0 && results.length === 0 ? (
                        <div className="p-16 text-center flex flex-col items-center gap-6">
                            <div className="w-24 h-24 rounded-[32px] bg-gray-100 flex items-center justify-center text-gray-300 group shadow-inner">
                                <Search size={48} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Không tìm thấy kết quả</h3>
                                <p className="text-gray-400 font-bold max-w-xs mx-auto text-sm">Không tìm thấy khóa học nào khớp với "{searchQuery}". Hãy thử một từ khóa khác.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 space-y-3">
                            <div className="px-4 py-2 text-[14px] font-bold text-gray-400 bg-gray-100/50 rounded-2xl flex justify-between items-center ">
                                <span>Tìm thấy {results.length} kết quả</span>
                                <span className="opacity-50">ESC để đóng</span>
                            </div>
                            {results.map((course) => (
                                <div
                                    key={course.id}
                                    className="flex items-center gap-5 p-5 bg-white rounded-[28px] border border-gray-50 hover:border-amber-200 hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.15)] transition-all duration-500 cursor-pointer group"
                                    onClick={() => {
                                        navigate(`/course/${course.id}`);
                                        onClose();
                                    }}
                                >
                                    <div className="flex-1 min-w-0">

                                        <h4 className="text-md font-black text-gray-500 line-clamp-1 mb-1 transition-colors ">
                                            {course.title}
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                                                <Users size={14} strokeWidth={2.5} className="text-gray-300" />
                                                <span>{course.students}</span>
                                            </p>
                                            <div className="w-1 h-1 rounded-full bg-gray-200"></div>
                                            <p className="text-[11px] font-black text-amber-600/60 ">
                                                {course.teacher}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400  transition-all duration-500 transform ">
                                            <ArrowRight size={28} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Refined Premium Footer */}
                <div className="p-6 bg-white border-t border-gray-50 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400">
                        Need help? <span className="text-amber-600 hover:underline cursor-pointer">Support Center</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">LMS Academy Live</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchSpotlight;
