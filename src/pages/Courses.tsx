import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import CourseCard from '../components/home/CourseCard';
import { type Course } from '../config/mock-data';
import { useCourseStore } from '../store/useCourseStore';

import { categoryService, type BECategory } from '../api/categoryService';
import toast from 'react-hot-toast';

const PAGE_SIZE = 6;

const SORT_OPTIONS = [
    { label: 'Mới nhất', value: 'latest' },
    { label: 'Đánh giá cao nhất', value: 'rating' }
];

const Courses: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState<BECategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [sortBy, setSortBy] = useState('latest');
    const { courses } = useCourseStore();
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isCatLoading, setIsCatLoading] = useState(true);

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await categoryService.getCategories();
                if (response.success && response.data) {
                    setCategories(response.data.categories);
                }
            } catch (error) {
                toast.error('Không thể tải danh mục');
            } finally {
                setIsCatLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Sync state with URL params if any
    useEffect(() => {
        const cat = searchParams.get('category');
        if (cat) {
            setSelectedCategory(cat);
        }
    }, [searchParams, categories]);

    // Filtering & Sorting Logic
    const filteredCourses = useMemo(() => {
        let result = [...courses];

        // Search
        if (searchQuery) {
            result = result.filter(c =>
                c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.teacher.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Category
        if (selectedCategory !== 'Tất cả') {
            result = result.filter(c => c.category === selectedCategory);
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'rating') {
                return b.rating - a.rating;
            }
            // Default latest (by ID)
            return parseInt(b.id) - parseInt(a.id);
        });

        return result;
    }, [courses, searchQuery, selectedCategory, sortBy]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredCourses.length / PAGE_SIZE);
    const paginatedCourses = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredCourses.slice(start, start + PAGE_SIZE);
    }, [filteredCourses, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, sortBy]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header / Hero Section */}
            <div className="bg-gray-900 border-b border-gray-100 pt-16 pb-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex flex-row items-center gap-4">
                                <h1 className="text-4xl font-black text-gray-100 leading-tight">
                                    Khám phá <span className="text-amber-600">tương lai</span><br />
                                    cùng E-Learning
                                </h1>
                                <img src="/logoStill/language.png" alt="" className="w-40 h-40" />
                            </div>

                            <p className="text-white font-bold max-w-md">
                                Hơn 100+ khóa học chất lượng cao từ các chuyên gia hàng đầu giúp bạn nâng tầm kỹ năng mỗi ngày.
                            </p>
                        </div>

                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm khóa học, giáo viên..."
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="w-full lg:w-64 space-y-8">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 sticky top-24">
                            <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
                                <Filter size={18} className="text-amber-600" />
                                <span>Bộ lọc khóa học</span>
                            </div>

                            {/* Categories */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Chủ đề</p>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setSelectedCategory('Tất cả')}
                                        className={`cursor-pointer w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === 'Tất cả'
                                            ? 'bg-amber-50 text-amber-600'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        Tất cả
                                    </button>
                                    {isCatLoading ? (
                                        <div className="space-y-2 p-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-8 bg-gray-50 animate-pulse rounded-lg"></div>
                                            ))}
                                        </div>
                                    ) : (
                                        categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setSelectedCategory(cat.name)}
                                                className={`cursor-pointer w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat.name
                                                    ? 'bg-amber-50 text-amber-600'
                                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-100"></div>

                            {/* Support Banner in Sidebar */}
                            <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white overflow-hidden relative group">
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Trợ giúp</p>
                                <p className="text-sm font-bold mb-3">Bạn gặp khó khăn khi ghi danh?</p>
                                <button className="w-full py-2 bg-white text-blue-600 rounded-lg text-xs font-bold hover:bg-opacity-90 transition-all cursor-pointer">
                                    Liên hệ ngay
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 space-y-8">
                        {/* Control Bar */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <p className="text-sm text-gray-500">
                                Hiển thị <span className="font-bold text-gray-900">{filteredCourses.length}</span> khóa học
                            </p>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <List size={18} />
                                    </button>
                                </div>

                                <select
                                    className="bg-gray-50 cursor-pointer border border-gray-100 text-sm font-medium py-2 px-4 rounded-xl outline-none focus:border-amber-500 transition-all text-gray-700"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    {SORT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Course Grid */}
                        {paginatedCourses.length > 0 ? (
                            <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                {paginatedCourses.map((course: Course) => (
                                    <div key={course.id}>
                                        <CourseCard course={course} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="text-gray-300" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">Không tìm thấy khóa học nào</h3>
                                <p className="text-gray-500 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCategory('Tất cả');
                                    }}
                                    className="mt-6 text-amber-600 font-bold hover:underline cursor-pointer"
                                >
                                    Xóa tất cả bộ lọc
                                </button>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-10">
                                <button
                                    onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white hover:text-amber-600 hover:border-amber-600 transition-all disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-500 cursor-pointer"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === i + 1
                                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-200'
                                                : 'text-gray-500 hover:bg-white hover:text-amber-600 border border-transparent hover:border-amber-200'
                                                } cursor-pointer`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white hover:text-amber-600 hover:border-amber-600 transition-all disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-500 cursor-pointer"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Courses;
