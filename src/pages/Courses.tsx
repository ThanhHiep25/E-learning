import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, LayoutGrid, List, Brain, Compass, BookOpenCheck } from 'lucide-react';
import CourseCard from '../components/home/CourseCard';
import { useCourseStore } from '../store/useCourseStore';
import { useEnrollmentStore } from '../store/useEnrollmentStore';
import { useAuth } from '../context/AuthContext';
import { categoryService } from '../services/category.service';
import LearningPathAssistant from '../components/learning-path/LearningPathAssistant';
import { type FrontendCourse } from '../services/course.service';
import { Breadcrumb } from '../components/common/Breadcrumb';

const PAGE_SIZE = 6;

const SORT_OPTIONS = [
    { label: 'Mới nhất', value: 'latest' },
    { label: 'Đánh giá cao nhất', value: 'rating' }
];

// CEFR to course level mapping
const CEFR_TO_COURSE_LEVEL: Record<string, string> = {
    'A1': 'beginner',
    'A2': 'elementary',
    'B1': 'intermediate',
    'B2': 'upper-intermediate',
    'C1': 'advanced',
    'C2': 'proficiency',
};

const Courses: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { category: categoryParam } = useParams<{ category?: string }>();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState('latest');
    const { courses, loadCourses } = useCourseStore();
    const { enrolledCourses, syncEnrollments, courseProgress } = useEnrollmentStore();
    const { user } = useAuth();
    const [categories, setCategories] = useState<string[]>(['Tất cả']);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'explore' | 'enrolled'>('explore');

    useEffect(() => {
        loadCourses();
        if (user) {
            syncEnrollments();
        }
    }, [user]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await categoryService.listCategories();
                const names = res
                    .map(c => c.name)
                    .filter(Boolean);
                const unique = Array.from(new Set(names));
                if (mounted) {
                    setCategories(['Tất cả', ...unique]);
                }
            } catch {
                if (mounted) {
                    setCategories(['Tất cả']);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    // Sync state with URL params (path param or query param)
    useEffect(() => {
        // Priority: path param > query param
        const catFromPath = categoryParam ? decodeURIComponent(categoryParam) : null;
        const catFromQuery = searchParams.get('category');
        const cat = catFromPath || catFromQuery;

        if (cat && categories.includes(cat)) {
            setSelectedCategory(cat);
        } else if (!cat) {
            setSelectedCategory('Tất cả');
        }

        // Sync level from query param
        const levelFromQuery = searchParams.get('level');
        setSelectedLevel(levelFromQuery);
    }, [searchParams, categoryParam, categories]);

    // Get enrolled course IDs for filtering
    const enrolledCourseIds = useMemo(() => {
        return new Set(enrolledCourses.map(c => c.id));
    }, [enrolledCourses]);

    // Filtering & Sorting Logic based on active tab
    const filteredCourses = useMemo(() => {
        let result = [...courses];

        // Filter by tab: explore (not enrolled) vs enrolled
        if (activeTab === 'explore') {
            result = result.filter(c => !enrolledCourseIds.has(c.id));
        } else if (activeTab === 'enrolled') {
            // For enrolled tab, use enrolled courses list
            return enrolledCourses;
        }

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

        // Level filter removed - show all courses, use level only for sorting priority
        // This allows users to see all options including higher level courses for leveling up

        // Sort - if level filter is active, prioritize same level first then ascending
        result.sort((a, b) => {
            if (sortBy === 'rating') {
                return b.rating - a.rating;
            }
            // If level filter is set, sort: same level → next levels up in order → lower levels last
            if (selectedLevel && CEFR_TO_COURSE_LEVEL[selectedLevel]) {
                const LEVELS = ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced', 'proficiency'];
                const userLevelIdx = LEVELS.indexOf(CEFR_TO_COURSE_LEVEL[selectedLevel]);
                const aLevelIdx = LEVELS.indexOf(a.level);
                const bLevelIdx = LEVELS.indexOf(b.level);
                // distance: 0 = same, positive = above user, negative = below user
                const aDist = aLevelIdx - userLevelIdx;
                const bDist = bLevelIdx - userLevelIdx;
                // Sort key: same (0) → 1 above → 2 above → ... → below (large number)
                const sortKey = (dist: number) => dist >= 0 ? dist : 1000 + Math.abs(dist);
                if (sortKey(aDist) !== sortKey(bDist)) return sortKey(aDist) - sortKey(bDist);
            }
            // Default latest (by ID)
            return parseInt(b.id) - parseInt(a.id);
        });

        return result;
    }, [courses, searchQuery, selectedCategory, selectedLevel, sortBy, activeTab, enrolledCourses, enrolledCourseIds]);

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
                    {/* Breadcrumb */}
                    <div className="mb-4">
                        <Breadcrumb 
                            items={[
                                { label: 'Danh mục khóa học' }
                            ]}
                            className="text-white"
                        />
                    </div>
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

            {/* Tabs - Only show for logged-in users */}
            {user && (
                <div className="max-w-7xl mx-auto px-4 mt-6">
                    <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm inline-flex">
                        <button
                            onClick={() => {
                                setActiveTab('explore');
                                setCurrentPage(1);
                            }}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                activeTab === 'explore'
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Compass size={18} />
                            Khám phá
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                                activeTab === 'explore' ? 'bg-white/20' : 'bg-gray-100'
                            }`}>
                                {courses.length - enrolledCourses.length}
                            </span>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('enrolled');
                                setCurrentPage(1);
                            }}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                activeTab === 'enrolled'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <BookOpenCheck size={18} />
                            Đã đăng ký
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                                activeTab === 'enrolled' ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                                {enrolledCourses.length}
                            </span>
                        </button>
                    </div>
                </div>
            )}

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
                                    {categories.map((cat: string) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`cursor-pointer w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat
                                                ? 'bg-amber-50 text-amber-600'
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
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
                            {/* Learning Path Advisor */}
                            <div className="bg-linear-to-br from-indigo-50 to-blue-50 border border-blue-100 p-4 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full -mr-8 -mt-8 opacity-50" />
                                <div className="relative z-10 flex flex-col gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg border border-white/20">
                                        <Brain size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-blue-800 uppercase tracking-tighter decoration-amber-400 underline decoration-2">Lộ trình học tập</p>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5 tracking-widest italic font-mono">Personalized AI Path</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsAssistantOpen(true)}
                                        className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition-all shadow-md group-hover:scale-[1.02] cursor-pointer"
                                    >
                                        Khám phá ngay →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 space-y-8">
                        {/* Control Bar */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <p className="text-sm text-gray-500">
                                    Hiển thị <span className="font-bold text-gray-900">{filteredCourses.length}</span> khóa học
                                </p>
                                {activeTab === 'enrolled' && (
                                    <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
                                        Tiến độ trung bình: {Math.round(
                                            enrolledCourses.reduce((sum, c) => sum + (courseProgress[c.id] || 0), 0) / 
                                            (enrolledCourses.length || 1)
                                        )}%
                                    </span>
                                )}
                            </div>

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
                            <div className={`grid gap-2 md:gap-8 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                                {paginatedCourses.map((course: FrontendCourse) => (
                                    <div key={course.id}>
                                        <CourseCard
                                            course={course}
                                            progress={activeTab === 'enrolled' ? courseProgress[course.id] : undefined}
                                            isEnrolled={activeTab === 'enrolled'}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="text-gray-300" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    {activeTab === 'enrolled' ? 'Bạn chưa đăng ký khóa học nào' : 'Không tìm thấy khóa học nào'}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {activeTab === 'enrolled' 
                                        ? 'Hãy khám phá và đăng ký các khóa học thú vị bên dưới.' 
                                        : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.'}
                                </p>
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
            {/* Adaptive Learning Assistant Modal */}
            <LearningPathAssistant 
                isOpen={isAssistantOpen} 
                onClose={() => setIsAssistantOpen(false)}
                initialCategory={selectedCategory !== 'Tất cả' ? selectedCategory : undefined}
            />
        </div>
    );
};

export default Courses;
