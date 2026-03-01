import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Star, Users, ArrowRight, Laptop, BookOpen, Target, Sparkles } from 'lucide-react';
import { mockCourses, type Course } from '../../config/mock-data';

interface SearchSpotlightProps {
    isOpen: boolean;
    onClose: () => void;
}

const SearchSpotlight: React.FC<SearchSpotlightProps> = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Course[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setSearchQuery('');
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        if (searchQuery.trim().length > 1) {
            const filtered = mockCourses.filter(course =>
                course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setResults(filtered);
        } else {
            setResults([]);
        }
    }, [searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-start justify-center pt-24 px-4 sm:px-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Search Input Area */}
                <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div className="relative flex items-center">
                        <Search className="absolute left-0 text-gray-400" size={24} />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Tìm kiếm khóa học, giáo viên hoặc chủ đề..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 text-xl font-medium text-gray-800 placeholder-gray-400 outline-none border-none bg-transparent"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-0 p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-all"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-gray-50/50">
                    {searchQuery.length === 0 ? (
                        <div className="p-8">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
                                <Sparkles size={16} />
                                <span>Gợi ý tìm kiếm</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all group group text-left">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                                        <Target size={20} />
                                    </div>
                                    <span className="font-medium text-gray-700">Lộ trình vào 10</span>
                                </button>
                                <button className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group text-left">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                        <BookOpen size={20} />
                                    </div>
                                    <span className="font-medium text-gray-700">Luyện thi TOEIC</span>
                                </button>
                                <button className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group text-left">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                                        <Laptop size={20} />
                                    </div>
                                    <span className="font-medium text-gray-700">Khóa Lập trình</span>
                                </button>
                            </div>
                        </div>
                    ) : searchQuery.length > 0 && results.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                                <Search size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Không tìm thấy kết quả</h3>
                            <p className="text-gray-500 max-w-xs mx-auto">Chúng tôi không tìm thấy kết quả nào cho "{searchQuery}". Hãy thử từ khóa khác.</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-2">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-400 bg-gray-50 rounded-lg flex justify-between items-center">
                                <span>TÌM THẤY {results.length} KẾT QUẢ</span>
                                <span>NHẤN <kbd className="font-sans px-1.5 py-0.5 rounded border bg-white">ESC</kbd> ĐỂ ĐÓNG</span>
                            </div>
                            {results.map((course) => (
                                <div
                                    key={course.id}
                                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-50 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/40 transition-all cursor-pointer group"
                                >
                                    <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                        <div className="w-full h-full bg-amber-50 flex items-center justify-center text-amber-500">
                                            <BookOpen size={30} />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-600 uppercase">
                                                {course.category}
                                            </span>
                                            <div className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                                                <Star size={12} fill="currentColor" />
                                                <span>{course.rating}</span>
                                            </div>
                                        </div>
                                        <h4 className="text-base font-bold text-gray-800 line-clamp-1 mb-0.5 group-hover:text-amber-600 transition-colors">
                                            {course.title}
                                        </h4>
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            <span>Giảng viên: {course.teacher}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span className="flex items-center gap-1"><Users size={12} /> {course.students}</span>
                                        </p>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2 pr-2">
                                        <span className="text-lg font-bold text-amber-600">{course.price}</span>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                                            <ArrowRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-white border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">Bạn cần hỗ trợ? <span className="text-amber-600 font-medium cursor-pointer hover:underline">Liên hệ tư vấn viên</span></p>
                </div>
            </div>
        </div>
    );
};

export default SearchSpotlight;
