import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HelpCircle, Clock, Plus, MoreVertical, Edit3, AlertCircle, FileText, ChevronRight, X, BarChart3, Calendar, Search, ChevronLeft, Sparkles, LoaderCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
    teacherService,
    type BackendTeacherCourse,
    type BackendTeacherQuiz,
    type TeacherCourseContentResponse,
} from '../../services/teacher.service';

interface QuizTemplate {
    id: string;
    courseId: string;
    title: string;
    questionsCount: number;
    duration: number;
    assignedStudents: number;
    status: 'draft' | 'published';
    createdAt: string;
    originalCreatedAt: number;
}

const QuizManagement: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const courseIdFromUrl = searchParams.get('courseId');
    const chapterIdFromUrl = searchParams.get('chapterId');
    const [selectedCourseId, setSelectedCourseId] = useState<string>(courseIdFromUrl || 'all');

    const [loading, setLoading] = useState(false);
    const [quizzes, setQuizzes] = useState<QuizTemplate[]>([]);

    const [teacherCourses, setTeacherCourses] = useState<BackendTeacherCourse[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'title_asc' | 'duration_desc' | 'questions_desc'>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const [createOpen, setCreateOpen] = useState(false);
    const [createCourseId, setCreateCourseId] = useState<string>('');
    const [createTitle, setCreateTitle] = useState('');
    const [createDescription, setCreateDescription] = useState('');
    const [createTimeLimit, setCreateTimeLimit] = useState<number>(30);
    const [createMaxScore, setCreateMaxScore] = useState<number>(100);
    const [createPassingScore, setCreatePassingScore] = useState<number>(60);
    const [createStartTime, setCreateStartTime] = useState<string>('');
    const [createEndTime, setCreateEndTime] = useState<string>('');
    const [createShowResults, setCreateShowResults] = useState<boolean>(true);
    const [createAntiCheat, setCreateAntiCheat] = useState<boolean>(false);
    const [creating, setCreating] = useState(false);
    const [createChapterId, setCreateChapterId] = useState<string>(chapterIdFromUrl || '');
    const [createChapters, setCreateChapters] = useState<any[]>([]);

    // Auto-suggest end time based on start time and duration
    useEffect(() => {
        if (createStartTime && createTimeLimit) {
            try {
                const startDate = new Date(createStartTime);
                if (!isNaN(startDate.getTime())) {
                    const endDate = new Date(startDate.getTime() + createTimeLimit * 60000);
                    // Format to local ISO (YYYY-MM-DDTHH:mm)
                    const year = endDate.getFullYear();
                    const month = String(endDate.getMonth() + 1).padStart(2, '0');
                    const day = String(endDate.getDate()).padStart(2, '0');
                    const hours = String(endDate.getHours()).padStart(2, '0');
                    const mins = String(endDate.getMinutes()).padStart(2, '0');
                    setCreateEndTime(`${year}-${month}-${day}T${hours}:${mins}`);
                }
            } catch (err) {
                console.error('Error calculating end time', err);
            }
        }
    }, [createStartTime, createTimeLimit]);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [quizToDeleteId, setQuizToDeleteId] = useState<string | null>(null);

    // AI Quiz Generation State
    const [aiGenerateOpen, setAiGenerateOpen] = useState(false);
    const [aiCourseId, setAiCourseId] = useState<string>('');
    const [aiLectureId, setAiLectureId] = useState<string>('');
    const [aiQuizTitle, setAiQuizTitle] = useState('');
    const [aiQuestionCount, setAiQuestionCount] = useState<number>(10);
    const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
    const [aiQuestionTypes, setAiQuestionTypes] = useState<string[]>(['multiple_choice']);
    const [aiTimeLimit, setAiTimeLimit] = useState<number>(30);
    const [aiMaxScore, setAiMaxScore] = useState<number>(100);
    const [aiPassingScore, setAiPassingScore] = useState<number>(60);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [courseContent, setCourseContent] = useState<TeacherCourseContentResponse>({ chapters: [], course: {} as BackendTeacherCourse });
    const [_aiGeneratedQuestions, setAiGeneratedQuestions] = useState<any[] | null>(null);
    // RAG Quiz Generation State
    const [aiScope, setAiScope] = useState<'course' | 'chapter' | 'lecture' | 'multi'>('lecture');
    const [aiSelectedLectures, setAiSelectedLectures] = useState<string[]>([]);
    const [aiChapterId, setAiChapterId] = useState<string>('');

    // Edit State
    const [editingQuiz, setEditingQuiz] = useState<BackendTeacherQuiz | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Auto-suggest end time for editing
    useEffect(() => {
        if (editingQuiz && editingQuiz.startTime && editingQuiz.timeLimit) {
            try {
                const startDate = new Date(editingQuiz.startTime);
                if (!isNaN(startDate.getTime())) {
                    const endDate = new Date(startDate.getTime() + editingQuiz.timeLimit * 60000);
                    const year = endDate.getFullYear();
                    const month = String(endDate.getMonth() + 1).padStart(2, '0');
                    const day = String(endDate.getDate()).padStart(2, '0');
                    const hours = String(endDate.getHours()).padStart(2, '0');
                    const mins = String(endDate.getMinutes()).padStart(2, '0');
                    const newEndTime = `${year}-${month}-${day}T${hours}:${mins}`;

                    if (editingQuiz.endTime !== newEndTime) {
                        setEditingQuiz(prev => prev ? { ...prev, endTime: newEndTime } : null);
                    }
                }
            } catch (err) {
                console.error('Error calculating end time', err);
            }
        }
    }, [editingQuiz?.startTime, editingQuiz?.timeLimit]);



    useEffect(() => {
        const loadCourses = async () => {
            try {
                const list = await teacherService.listMyCourses();
                setTeacherCourses(list || []);
            } catch (err: any) {
                toast.error(err?.message || 'Không thể tải khóa học của giáo viên');
                setTeacherCourses([]);
            }
        };

        if (user) {
            loadCourses();
        }
    }, [user]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCourseId, searchTerm, statusFilter, sortBy]);

    // Update selectedCourseId when URL param changes
    useEffect(() => {
        if (courseIdFromUrl) {
            setSelectedCourseId(courseIdFromUrl);
        }
    }, [courseIdFromUrl]);

    useEffect(() => {
        if (chapterIdFromUrl) {
            setCreateChapterId(chapterIdFromUrl);
        }
    }, [chapterIdFromUrl]);

    const openQuestionManager = (quizId: string) => {
        navigate(`/teacher/quiz-editor/${quizId}`);
    };

    useEffect(() => {
        if (!createCourseId && teacherCourses.length > 0) {
            setCreateCourseId(String(teacherCourses[0].id));
        }
    }, [createCourseId, teacherCourses]);

    const loadQuizzes = useCallback(async () => {
        try {
            setLoading(true);
            if (teacherCourses.length === 0) {
                setQuizzes([]);
                return;
            }

            const courseIds = teacherCourses.map(c => String(c.id));
            const results = await Promise.all(
                courseIds.map(async (courseId) => {
                    const list = await teacherService.getCourseQuizzes(courseId);
                    return list.map((q: BackendTeacherQuiz) => {
                        const created = q.createdAt ? new Date(q.createdAt) : null;
                        return {
                            id: String(q.id),
                            courseId: String(q.courseId),
                            title: String(q.title),
                            questionsCount: Array.isArray(q.questions) ? q.questions.length : 0,
                            duration: Number(q.timeLimit ?? 0),
                            assignedStudents: 0,
                            status: q.status || 'draft', // Use actual status field from backend
                            createdAt: created ? created.toLocaleDateString('vi-VN') : '',
                            originalCreatedAt: created ? created.getTime() : 0,
                        } as QuizTemplate;
                    });
                })
            );

            setQuizzes(results.flat());
        } catch (err: any) {
            toast.error(err?.message || 'Không thể tải danh sách quiz');
        } finally {
            setLoading(false);
        }
    }, [teacherCourses]);

    useEffect(() => {
        loadQuizzes();
    }, [loadQuizzes]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const openCreate = async () => {
        if (teacherCourses.length === 0) {
            toast.error('Bạn chưa có khóa học nào để tạo quiz');
            return;
        }
        // Default course from URL param, fallback to first course
        const defaultCourseId = courseIdFromUrl || String(teacherCourses[0].id);
        setCreateCourseId(defaultCourseId);
        setCreateTitle('');
        setCreateDescription('');
        setCreateTimeLimit(30);
        setCreateMaxScore(100);
        setCreatePassingScore(60);
        setCreateStartTime('');
        setCreateEndTime('');
        setCreateShowResults(true);
        setCreateAntiCheat(false);
        // Load chapters for the selected course
        if (defaultCourseId) {
            try {
                const content = await teacherService.getCourseContent(defaultCourseId);
                setCreateChapters(content.chapters || []);
            } catch {
                setCreateChapters([]);
            }
        }
        setCreateOpen(true);
    };

    const openAIGenerate = async () => {
        if (teacherCourses.length === 0) {
            toast.error('Bạn chưa có khóa học nào để tạo quiz');
            return;
        }
        const firstCourseId = String(teacherCourses[0].id);
        setAiCourseId(firstCourseId);
        setAiLectureId('');
        setAiQuizTitle('');
        setAiQuestionCount(10);
        setAiDifficulty('mixed');
        setAiQuestionTypes(['multiple_choice']);
        setAiTimeLimit(30);
        setAiMaxScore(100);
        setAiPassingScore(60);
        setAiGeneratedQuestions(null);
        // Reset RAG state
        setAiScope('lecture');
        setAiSelectedLectures([]);
        setAiChapterId('');
        setAiGenerateOpen(true);
        // Load course content for lecture selection
        await loadCourseContent(firstCourseId);
    };

    const loadCourseContent = async (courseId: string) => {
        try {
            const content = await teacherService.getCourseContent(courseId);
            setCourseContent(content);
        } catch (err: any) {
            toast.error('Không thể tải nội dung khóa học');
        }
    };

    const handleAICourseChange = async (courseId: string) => {
        setAiCourseId(courseId);
        setAiLectureId('');
        await loadCourseContent(courseId);
    };

    const submitAIGenerate = async () => {
        if (!aiQuizTitle.trim()) {
            toast.error('Vui lòng nhập tiêu đề quiz');
            return;
        }
        if (aiScope === 'lecture' && !aiLectureId) {
            toast.error('Vui lòng chọn bài học để tạo quiz');
            return;
        }
        if (aiScope === 'multi' && aiSelectedLectures.length === 0) {
            toast.error('Vui lòng chọn ít nhất một bài học');
            return;
        }
        try {
            setAiGenerating(true);
            
            // Determine lecture IDs based on scope
            let lectureIds: string[] = [];
            if (aiScope === 'lecture') {
                lectureIds = [aiLectureId];
            } else if (aiScope === 'multi') {
                lectureIds = aiSelectedLectures;
            }
            
            const result = await teacherService.generateAndSaveRAGQuiz(
                aiCourseId,
                {
                    title: aiQuizTitle,
                    timeLimit: aiTimeLimit,
                    maxScore: aiMaxScore,
                    passingScore: aiPassingScore,
                },
                {
                    scope: aiScope,
                    lectureIds,
                    chapterId: aiChapterId,
                    count: aiQuestionCount,
                    difficulty: aiDifficulty,
                    questionTypes: aiQuestionTypes,
                }
            );
            console.log('DEBUG result:', result);
            console.log('DEBUG result keys:', Object.keys(result || {}));
            toast.success(`Đã tạo quiz "${result.quiz.title}" với ${result.questions.length} câu hỏi bằng AI (RAG)`);
            setAiGenerateOpen(false);
            await loadQuizzes();
            navigate(`/teacher/quiz-editor/${result.quiz.id}`);
        } catch (err: any) {
            toast.error(err?.message || 'Không thể tạo quiz bằng AI');
        } finally {
            setAiGenerating(false);
        }
    };

    const openEdit = (quiz: QuizTemplate) => {
        setLoading(true);
        teacherService.getQuiz(quiz.id).then(fullQuiz => {
            setEditingQuiz(fullQuiz);
            setEditOpen(true);
        }).catch(() => {
            toast.error('Không thể tải thông tin chi tiết đề thi');
        }).finally(() => setLoading(false));
    };

    const confirmDeleteQuiz = (id: string) => {
        setQuizToDeleteId(id);
        setShowDeleteModal(true);
    };

    const handleDeleteQuiz = async () => {
        if (!quizToDeleteId) return;
        try {
            setLoading(true);
            await teacherService.deleteQuiz(quizToDeleteId);
            toast.success('Đã xóa đề thi');
            setShowDeleteModal(false);
            setQuizToDeleteId(null);
            await loadQuizzes();
        } catch (err: any) {
            toast.error(err?.message || 'Không thể xóa đề thi');
        } finally {
            setLoading(false);
        }
    };

    const submitCreate = async () => {
        const title = createTitle.trim();
        if (!createCourseId) {
            toast.error('Vui lòng chọn khóa học');
            return;
        }
        if (!title) {
            toast.error('Vui lòng nhập tiêu đề đề thi');
            return;
        }

        try {
            setCreating(true);
            await teacherService.createQuiz(createCourseId, {
                title,
                description: createDescription,
                timeLimit: createTimeLimit,
                maxScore: createMaxScore,
                passingScore: createPassingScore,
                startTime: createStartTime || null,
                endTime: createEndTime || null,
                showResults: createShowResults,
                antiCheat: createAntiCheat,
                chapterId: createChapterId || undefined,
            });
            toast.success('Tạo đề thi thành công');
            setCreateOpen(false);
            await loadQuizzes();
        } catch (err: any) {
            toast.error(err?.message || 'Không thể tạo đề thi');
        } finally {
            setCreating(false);
        }
    };

    const submitUpdate = async () => {
        if (!editingQuiz) return;
        try {
            setIsUpdating(true);
            await teacherService.updateQuiz(String(editingQuiz.id), {
                title: editingQuiz.title,
                description: editingQuiz.description || '',
                timeLimit: editingQuiz.timeLimit,
                maxScore: editingQuiz.maxScore,
                passingScore: editingQuiz.passingScore,
                startTime: editingQuiz.startTime,
                endTime: editingQuiz.endTime,
                showResults: editingQuiz.showResults,
                antiCheat: editingQuiz.antiCheat,
            });
            toast.success('Cập nhật đề thi thành công');
            setEditOpen(false);
            await loadQuizzes();
        } catch (err: any) {
            toast.error(err?.message || 'Không thể cập nhật đề thi');
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredQuizzes = useMemo(() => {
        let result = [...quizzes];

        if (selectedCourseId !== 'all') {
            result = result.filter(q => q.courseId === selectedCourseId);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(q => q.title.toLowerCase().includes(term));
        }

        if (statusFilter !== 'all') {
            result = result.filter(q => q.status === statusFilter);
        }

        result.sort((a, b) => {
            if (sortBy === 'newest') return b.originalCreatedAt - a.originalCreatedAt;
            if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
            if (sortBy === 'duration_desc') return b.duration - a.duration;
            if (sortBy === 'questions_desc') return b.questionsCount - a.questionsCount;
            return 0;
        });

        return result;
    }, [quizzes, selectedCourseId, searchTerm, statusFilter, sortBy]);

    const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
    const paginatedQuizzes = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredQuizzes.slice(start, start + itemsPerPage);
    }, [filteredQuizzes, currentPage]);

    const getCourseTitle = (id: string) => teacherCourses.find(c => String(c.id) === String(id))?.title || 'Khóa học không xác định';

    return (
        <div className="w-full pb-20 px-2 lg:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16 px-4">
                    <div className="max-w-3xl">
                        {courseIdFromUrl && (
                            <button
                                onClick={() => navigate(`/teacher/content-editor/${courseIdFromUrl}`)}
                                className="group flex items-center gap-3 text-gray-400 hover:text-amber-600 font-black uppercase tracking-widest text-[10px] transition-all cursor-pointer mb-4"
                            >
                                <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-amber-50 transition-all">
                                    <ChevronLeft size={14} />
                                </div>
                                Quay lại Content Editor
                            </button>
                        )}

                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            Kiến tạo đề thi.
                        </h1>
                        <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-lg">
                            Thiết kế các bài kiểm tra đa dạng, theo dõi kết quả và đánh giá năng lực học viên một cách chính xác.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={openAIGenerate}
                            className="flex items-center gap-3 bg-purple-600 text-white px-8 py-5 rounded-[28px] font-bold text-sm hover:bg-purple-700 transition-all shadow-2xl shadow-purple-200 active:scale-95 cursor-pointer"
                        >
                            <Sparkles size={20} />
                            Tạo bằng AI
                        </button>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-3 bg-gray-900 text-white px-8 py-5 rounded-[28px] font-bold text-sm hover:bg-amber-600 transition-all shadow-2xl shadow-gray-200 active:scale-95 cursor-pointer"
                        >
                            <Plus size={20} />
                            Tạo đề mới
                        </button>
                    </div>
                </div>

                {/* Top Control Bar */}
                <div className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[40px] border border-gray-100 shadow-sm mb-8 md:mb-12">
                    <div className="space-y-6">
                        {/* Search */}
                        <div className="relative group">
                            <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-600 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm đề thi..."
                                className="w-full bg-gray-50 border border-transparent rounded-[18px] md:rounded-[24px] py-4 pl-12 md:pl-16 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 focus:bg-white transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {/* Course Filter */}
                            <div className="flex flex-col gap-2">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Khóa học</div>
                                <select
                                    className={`w-full bg-gray-50 border border-transparent rounded-xl md:rounded-2xl px-5 py-3 text-xs font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition-all cursor-pointer shadow-xs ${courseIdFromUrl ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                    disabled={!!courseIdFromUrl}
                                >
                                    <option value="all">Tất cả khóa học</option>
                                    {teacherCourses.map(course => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                                {courseIdFromUrl && (
                                    <p className="text-[10px] text-amber-600 font-medium">Đang lọc theo khóa học từ Content Editor</p>
                                )}
                            </div>

                            {/* Status Filter */}
                            <div className="flex flex-col gap-2">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Trạng thái</div>
                                <select
                                    className="w-full bg-gray-50 border border-transparent rounded-xl md:rounded-2xl px-5 py-3 text-xs font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition-all cursor-pointer shadow-xs"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="published">Công khai</option>
                                    <option value="draft">Bản nháp</option>
                                </select>
                            </div>

                            {/* Sort By */}
                            <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Sắp xếp</div>
                                <select
                                    className="w-full bg-gray-50 border border-transparent rounded-xl md:rounded-2xl px-5 py-3 text-xs font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition-all cursor-pointer shadow-xs"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                >
                                    <option value="newest">Mới nhất</option>
                                    <option value="title_asc">Tiêu đề: A-Z</option>
                                    <option value="duration_desc">Thời lượng nhất</option>
                                    <option value="questions_desc">Nhiều câu hỏi nhất</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 px-2 md:px-0">
                    {paginatedQuizzes.length > 0 ? (
                        paginatedQuizzes.map((quiz) => (
                            <div key={quiz.id} className="group bg-white rounded-[32px] md:rounded-[48px] p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-700 relative flex flex-col">
                                <div className="flex items-start justify-between mb-8">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform ${quiz.status === 'published' ? ' text-emerald-500' : 'bg-gray-50 text-gray-400'}`}>
                                        <FileText size={28} />
                                    </div>
                                    <div className="flex items-center gap-1 relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === quiz.id ? null : quiz.id);
                                            }}
                                            className="p-2 cursor-pointer text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                            title="Thao tác"
                                        >
                                            <MoreVertical size={20} />
                                        </button>

                                        {openMenuId === quiz.id && (
                                            <div className="absolute right-0 top-full pt-2 w-48 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 overflow-hidden">
                                                    <button
                                                        onClick={() => {
                                                            navigate(`/teacher/quiz-attempts/${quiz.id}`);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full cursor-pointer text-left px-5 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-amber-600 flex items-center gap-3 transition-all"
                                                    >
                                                        <BarChart3 size={14} /> Xem bài làm
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            openEdit(quiz);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full cursor-pointer text-left px-5 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-amber-600 flex items-center gap-3 transition-all"
                                                    >
                                                        <Edit3 size={14} /> Sửa thông tin
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            confirmDeleteQuiz(quiz.id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full cursor-pointer text-left px-5 py-3 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-all"
                                                    >
                                                        <AlertCircle size={14} /> Xóa đề thi
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-8 flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border ${quiz.status === 'published' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                            {quiz.status === 'published' ? 'Công khai' : 'Bản nháp'}
                                        </span>
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{quiz.createdAt}</span>
                                    </div>
                                    <h3
                                        onClick={() => openEdit(quiz)}
                                        className="text-xl font-black text-gray-900 leading-tight group-hover:text-amber-600 transition-colors uppercase mb-3 cursor-pointer hover:underline decoration-amber-500/30"
                                    >
                                        {quiz.title}
                                    </h3>
                                    <p className="text-sm font-bold text-gray-400 line-clamp-1 truncate max-w-full">
                                        {getCourseTitle(quiz.courseId)}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pb-8 border-b border-gray-50 mb-8">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Thời gian</p>
                                        <div className="flex items-center gap-1.5 text-sm font-black text-gray-900">
                                            <Clock size={14} className="text-gray-300" />
                                            {quiz.duration === 0 ? 'Không giới hạn' : `${quiz.duration} Phút`}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Câu hỏi</p>
                                        <div className="flex items-center gap-1.5 text-sm font-black text-gray-900">
                                            <HelpCircle size={14} className="text-gray-300" />
                                            {quiz.questionsCount} Câu
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div
                                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-2xl transition-all"
                                    >
                                        <div className="flex -space-x-2">
                                            {[...Array(3)].map((_, i) => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400"></div>)}
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Thay đổi câu hỏi</span>
                                    </div>
                                    <button
                                        onClick={() => openQuestionManager(String(quiz.id))}
                                        className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-amber-500 transition-all cursor-pointer"
                                    >
                                        <span className="sr-only">Soạn câu hỏi</span>
                                        <Edit3 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center bg-white rounded-[48px] border-2 border-dashed border-gray-100">
                            <AlertCircle size={48} className="mx-auto text-gray-200 mb-6" />
                            <p className="text-gray-400">Không tìm thấy bài kiểm tra nào phù hợp.</p>
                            <button onClick={openCreate} className="mt-4 text-amber-600 font-bold text-sm  hover:underline cursor-pointer">Tạo đề thi mới ngay</button>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="mt-8 md:mt-12 p-5 md:p-8 bg-white rounded-[24px] md:rounded-[32px] border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                        <p className="text-[11px] md:text-xs font-bold text-gray-400 order-2 sm:order-1">
                            Hiển thị {Math.min(filteredQuizzes.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredQuizzes.length, currentPage * itemsPerPage)} trên {filteredQuizzes.length} đề thi
                        </p>
                        <div className="flex items-center gap-2 order-1 sm:order-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${currentPage === i + 1
                                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                                            : 'text-gray-400 hover:bg-gray-50'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {createOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 md:p-4">
                        <div className="w-full max-w-xl bg-white rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                            <div className="p-5 md:p-6 border-b border-gray-50 shrink-0">
                                <div className="text-lg font-bold text-gray-900">Tạo đề thi mới</div>
                                <div className="text-sm font-medium text-gray-500 mt-1">Chọn khóa học và nhập thông tin quiz</div>
                            </div>

                            <div className="p-5 md:p-6 space-y-4 md:space-y-2 overflow-y-auto custom-scrollbar flex-1">
                                <div>
                                    <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Khóa học</div>
                                    <select
                                        value={createCourseId}
                                        onChange={async (e) => {
                                            const courseId = e.target.value;
                                            setCreateCourseId(courseId);
                                            if (courseId) {
                                                try {
                                                    const content = await teacherService.getCourseContent(courseId);
                                                    setCreateChapters(content.chapters || []);
                                                } catch {
                                                    setCreateChapters([]);
                                                }
                                            } else {
                                                setCreateChapters([]);
                                            }
                                        }}
                                        className="w-full bg-gray-50 rounded-xl md:rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800"
                                    >
                                        <option value="">-- Chọn khóa học --</option>
                                        {teacherCourses.map((c) => (
                                            <option key={String(c.id)} value={String(c.id)}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Chương</div>
                                    <select
                                        value={createChapterId}
                                        onChange={(e) => setCreateChapterId(e.target.value)}
                                        className="w-full bg-gray-50 rounded-xl md:rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none focus:bg-white focus:border-amber-300 transition-all"
                                    >
                                        <option value="">-- Không gắn chương --</option>
                                        {createChapters.map((ch: any) => (
                                            <option key={String(ch.id)} value={String(ch.id)}>{ch.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Tiêu đề</div>
                                    <input
                                        value={createTitle}
                                        onChange={(e) => setCreateTitle(e.target.value)}
                                        className="w-full bg-gray-50 rounded-xl md:rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none focus:bg-white focus:border-amber-300 transition-all"
                                        placeholder="VD: Kiểm tra kiến thức chương 1..."
                                    />
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Mô tả (Không bắt buộc)</div>
                                    <textarea
                                        value={createDescription}
                                        onChange={(e) => setCreateDescription(e.target.value)}
                                        className="w-full bg-gray-50 rounded-xl md:rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none min-h-[80px] focus:bg-white focus:border-amber-300 transition-all text-sm"
                                        placeholder="Nhập hướng dẫn hoặc nội dung tóm tắt..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider px-1">Thời gian</div>
                                        <select
                                            value={createTimeLimit}
                                            onChange={(e) => setCreateTimeLimit(Number(e.target.value))}
                                            className="w-full bg-gray-50 rounded-xl md:rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none cursor-pointer focus:bg-white focus:border-amber-300 transition-all text-xs"
                                        >
                                            {[10, 15, 20, 30, 45, 60, 90, 120, 180].map(m => (
                                                <option key={m} value={m}>{m} phút</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider px-1">Điểm tối đa</div>
                                        <select
                                            value={createMaxScore}
                                            onChange={(e) => setCreateMaxScore(Number(e.target.value))}
                                            className="w-full bg-gray-50 rounded-xl md:rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none cursor-pointer focus:bg-white focus:border-amber-300 transition-all text-xs"
                                        >
                                            {[10, 20, 50, 100].map(s => (
                                                <option key={s} value={s}>{s} điểm</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider px-1">Điểm đạt (%)</div>
                                        <input
                                            type="number"
                                            min={0}
                                            value={createPassingScore}
                                            onChange={(e) => setCreatePassingScore(Number(e.target.value || 0))}
                                            className="w-full bg-gray-50 rounded-xl md:rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-2xl md:rounded-3xl border border-gray-100">
                                        <div className="text-[10px] font-black text-gray-400 mb-2 flex items-center gap-2 uppercase tracking-wider px-1">
                                            <Calendar size={12} className="text-amber-500" />
                                            Mở đề
                                        </div>
                                        <input
                                            type="datetime-local"
                                            value={createStartTime}
                                            onChange={(e) => setCreateStartTime(e.target.value)}
                                            className="w-full bg-transparent font-bold text-gray-800 outline-none cursor-pointer text-xs"
                                        />
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl md:rounded-3xl border border-gray-100">
                                        <div className="text-[10px] font-black text-gray-400 mb-2 flex items-center gap-2 uppercase tracking-wider px-1">
                                            <Calendar size={12} className="text-amber-500" />
                                            Đóng đề
                                        </div>
                                        <input
                                            type="datetime-local"
                                            value={createEndTime}
                                            onChange={(e) => setCreateEndTime(e.target.value)}
                                            className="w-full bg-transparent font-bold text-gray-800 outline-none cursor-pointer text-xs"
                                        />
                                    </div>
                                </div>

                                 <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-amber-600 mb-1">Công bố kết quả</div>
                                        <p className="text-sm font-medium text-amber-500">Cho phép học viên xem đáp án sau khi nộp</p>
                                    </div>
                                    <button
                                        onClick={() => setCreateShowResults(!createShowResults)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${createShowResults ? 'bg-amber-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${createShowResults ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-rose-600 mb-1">Chống gian lận</div>
                                        <p className="text-sm font-medium text-rose-500">Bật chế độ toàn màn hình & khóa phím tắt</p>
                                    </div>
                                    <button
                                        onClick={() => setCreateAntiCheat(!createAntiCheat)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${createAntiCheat ? 'bg-rose-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${createAntiCheat ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-50 flex items-center justify-end gap-3">
                                <button
                                    disabled={creating}
                                    onClick={() => setCreateOpen(false)}
                                    className="px-4 py-2 cursor-pointer rounded-xl font-black text-gray-600 bg-gray-50 disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    disabled={creating}
                                    onClick={submitCreate}
                                    className="px-5 py-2 cursor-pointer rounded-xl font-black text-white bg-gray-900 hover:bg-amber-600 disabled:opacity-50"
                                >
                                    {creating ? 'Đang tạo...' : 'Tạo'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {editOpen && editingQuiz && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 md:p-4">
                        <div className="w-full max-w-xl bg-white rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                            <div className="p-5 md:p-6 border-b border-gray-50 flex justify-between items-center shrink-0">
                                <div className="overflow-hidden">
                                    <div className="text-lg font-bold text-gray-900">Sửa thông tin đề thi</div>
                                    <div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-tight truncate pr-4">{editingQuiz.title}</div>
                                </div>
                                <button onClick={() => setEditOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all shrink-0"><X size={20} className="text-gray-400" /></button>
                            </div>

                            <div className="p-5 md:p-6 space-y-4 md:space-y-4 overflow-y-auto custom-scrollbar flex-1">
                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tiêu đề</div>
                                    <input
                                        value={editingQuiz.title}
                                        onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                                        className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none"
                                    />
                                </div>

                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mô tả</div>
                                    <textarea
                                        value={editingQuiz.description || ''}
                                        onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                                        className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none min-h-[100px]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Thời gian</div>
                                        <select
                                            value={editingQuiz.timeLimit}
                                            onChange={(e) => setEditingQuiz({ ...editingQuiz, timeLimit: Number(e.target.value) })}
                                            className="w-full bg-gray-50 rounded-xl md:rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none cursor-pointer focus:bg-white focus:border-amber-300 transition-all text-xs"
                                        >
                                            {[10, 15, 20, 30, 45, 60, 90, 120, 180].map(m => (
                                                <option key={m} value={m}>{m} phút</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Điểm tối đa</div>
                                        <select
                                            value={editingQuiz.maxScore}
                                            onChange={(e) => setEditingQuiz({ ...editingQuiz, maxScore: Number(e.target.value) })}
                                            className="w-full bg-gray-50 rounded-xl md:rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none cursor-pointer focus:bg-white focus:border-amber-300 transition-all text-xs"
                                        >
                                            {[10, 20, 50, 100].map(s => (
                                                <option key={s} value={s}>{s} điểm</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Điểm đạt</div>
                                        <input
                                            type="number"
                                            value={editingQuiz.passingScore}
                                            onChange={(e) => setEditingQuiz({ ...editingQuiz, passingScore: Number(e.target.value || 0) })}
                                            className="w-full bg-gray-50 rounded-xl md:rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-2xl md:rounded-3xl border border-gray-100">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 px-1">
                                            <Calendar size={12} className="text-amber-500" />
                                            Mở đề
                                        </div>
                                        <input
                                            type="datetime-local"
                                            value={editingQuiz.startTime ? new Date(editingQuiz.startTime).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16) : ''}
                                            onChange={(e) => setEditingQuiz({ ...editingQuiz, startTime: e.target.value })}
                                            className="w-full bg-transparent font-bold text-gray-800 outline-none cursor-pointer text-xs"
                                        />
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl md:rounded-3xl border border-gray-100">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 px-1">
                                            <Calendar size={12} className="text-amber-500" />
                                            Đóng đề
                                        </div>
                                        <input
                                            type="datetime-local"
                                            value={editingQuiz.endTime ? new Date(editingQuiz.endTime).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16) : ''}
                                            onChange={(e) => setEditingQuiz({ ...editingQuiz, endTime: e.target.value })}
                                            className="w-full bg-transparent font-bold text-gray-800 outline-none cursor-pointer text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <div className="flex-1">
                                        <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Công bố kết quả</div>
                                        <p className="text-[10px] font-medium text-amber-500">Cho phép học viên xem đáp án sau khi nộp</p>
                                    </div>
                                    <button
                                        onClick={() => setEditingQuiz({ ...editingQuiz, showResults: !editingQuiz.showResults })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${editingQuiz.showResults ? 'bg-amber-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingQuiz.showResults ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                    <div className="flex-1">
                                        <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Chống gian lận</div>
                                        <p className="text-[10px] font-medium text-rose-500">Bật chế độ toàn màn hình & khóa phím tắt</p>
                                    </div>
                                    <button
                                        onClick={() => setEditingQuiz({ ...editingQuiz, antiCheat: !editingQuiz.antiCheat })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${editingQuiz.antiCheat ? 'bg-rose-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingQuiz.antiCheat ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-50 flex items-center justify-end gap-3">
                                <button
                                    disabled={isUpdating}
                                    onClick={() => setEditOpen(false)}
                                    className="px-4 py-2 rounded-xl font-black text-gray-600 bg-gray-50 disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    disabled={isUpdating}
                                    onClick={submitUpdate}
                                    className="px-5 py-2 rounded-xl font-black text-white bg-gray-900 hover:bg-amber-600 disabled:opacity-50"
                                >
                                    {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* AI Quiz Generation Modal */}
                {aiGenerateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="w-full max-w-2xl bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                            <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-purple-50 to-white shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-gray-900">Tạo Quiz bằng AI</div>
                                        <div className="text-sm text-gray-500">AI sẽ tự động tạo câu hỏi dựa trên nội dung bài học</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                                {/* Course Selection */}
                                <div>
                                    <label className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider block">Khóa học</label>
                                    <select
                                        value={aiCourseId}
                                        onChange={(e) => handleAICourseChange(e.target.value)}
                                        className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none focus:border-purple-300 transition-all"
                                    >
                                        {teacherCourses.map((c) => (
                                            <option key={String(c.id)} value={String(c.id)}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Scope Selection */}
                                <div>
                                    <label className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider block">Phạm vi tạo quiz</label>
                                    <select
                                        value={aiScope}
                                        onChange={(e) => setAiScope(e.target.value as any)}
                                        className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none focus:border-purple-300 transition-all"
                                    >
                                        <option value="lecture">Một bài học cụ thể</option>
                                        <option value="chapter">Toàn bộ chương</option>
                                        <option value="course">Toàn bộ khóa học</option>
                                        <option value="multi">Nhiều bài học</option>
                                    </select>
                                </div>

                                {/* Dynamic Selection based on Scope */}
                                {aiScope === 'lecture' && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider block">Bài học <span className="text-red-500">*</span></label>
                                        <select
                                            value={aiLectureId}
                                            onChange={(e) => setAiLectureId(e.target.value)}
                                            className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none focus:border-purple-300 transition-all cursor-pointer"
                                        >
                                            <option value="">-- Chọn bài học --</option>
                                            {courseContent.chapters?.map((chapter) => (
                                                <optgroup key={chapter.id} label={chapter.title}>
                                                    {(chapter.Lectures || (chapter as any).lectures || [])?.map((lecture: any) => (
                                                        <option key={lecture.id} value={String(lecture.id)}>
                                                            {lecture.title}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        {(!courseContent.chapters || courseContent.chapters.length === 0) && (
                                            <p className="text-xs text-red-500 mt-2">Không có bài học nào trong khóa học này</p>
                                        )}
                                    </div>
                                )}

                                {aiScope === 'chapter' && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider block">Chương <span className="text-red-500">*</span></label>
                                        <select
                                            value={aiChapterId}
                                            onChange={(e) => setAiChapterId(e.target.value)}
                                            className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none focus:border-purple-300 transition-all cursor-pointer"
                                        >
                                            <option value="">-- Chọn chương --</option>
                                            {courseContent.chapters?.map((chapter: any) => (
                                                <option key={chapter.id} value={String(chapter.id)}>
                                                    {chapter.title} ({(chapter.Lectures || (chapter as any).lectures || []).length} bài học)
                                                </option>
                                            ))}
                                        </select>
                                        {(!courseContent.chapters || courseContent.chapters.length === 0) && (
                                            <p className="text-xs text-red-500 mt-2">Không có chương nào trong khóa học này</p>
                                        )}
                                    </div>
                                )}

                                {aiScope === 'course' && (
                                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                        <p className="text-sm font-bold text-blue-700">Quiz sẽ được tạo từ toàn bộ nội dung khóa học</p>
                                        <p className="text-xs text-blue-600 mt-1">AI sẽ lấy thông tin từ tất cả các bài học trong khóa học này.</p>
                                    </div>
                                )}

                                {aiScope === 'multi' && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider block">Chọn nhiều bài học <span className="text-red-500">*</span></label>
                                        <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-2xl border border-gray-100 p-3 space-y-2">
                                            {courseContent.chapters?.map((chapter) => (
                                                <div key={chapter.id}>
                                                    <p className="text-xs font-bold text-gray-500 px-2 py-1">{chapter.title}</p>
                                                    {(chapter.Lectures || (chapter as any).lectures || [])?.map((lecture: any) => (
                                                        <label key={lecture.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded-lg cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={aiSelectedLectures.includes(String(lecture.id))}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setAiSelectedLectures([...aiSelectedLectures, String(lecture.id)]);
                                                                    } else {
                                                                        setAiSelectedLectures(aiSelectedLectures.filter(id => id !== String(lecture.id)));
                                                                    }
                                                                }}
                                                                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                                                            />
                                                            <span className="text-sm font-medium text-gray-700">{lecture.title}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Đã chọn {aiSelectedLectures.length} bài học</p>
                                        {(!courseContent.chapters || courseContent.chapters.length === 0) && (
                                            <p className="text-xs text-red-500 mt-2">Không có bài học nào trong khóa học này</p>
                                        )}
                                    </div>
                                )}

                                {/* Quiz Title */}
                                <div>
                                    <label className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider block">Tiêu đề Quiz <span className="text-red-500">*</span></label>
                                    <input
                                        value={aiQuizTitle}
                                        onChange={(e) => setAiQuizTitle(e.target.value)}
                                        className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none focus:border-purple-300 transition-all"
                                        placeholder="VD: Kiểm tra chương 1 - Ngữ pháp cơ bản..."
                                    />
                                </div>

                                {/* Settings Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider block px-1">Số câu hỏi</label>
                                        <select
                                            value={aiQuestionCount}
                                            onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                                            className="w-full bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none text-xs"
                                        >
                                            {[5, 10, 15, 20, 25, 30].map(n => (
                                                <option key={n} value={n}>{n} câu</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider block px-1">Độ khó</label>
                                        <select
                                            value={aiDifficulty}
                                            onChange={(e) => setAiDifficulty(e.target.value as any)}
                                            className="w-full bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none text-xs"
                                        >
                                            <option value="easy">Dễ</option>
                                            <option value="medium">Trung bình</option>
                                            <option value="hard">Khó</option>
                                            <option value="mixed">Hỗn hợp</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Question Types */}
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider block px-1">Loại câu hỏi</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'multiple_choice', label: 'Trắc nghiệm' },
                                            { id: 'true_false', label: 'Đúng/Sai' },
                                            { id: 'short_answer', label: 'Trả lời ngắn' },
                                        ].map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => {
                                                    if (aiQuestionTypes.includes(type.id)) {
                                                        setAiQuestionTypes(aiQuestionTypes.filter(t => t !== type.id));
                                                    } else {
                                                        setAiQuestionTypes([...aiQuestionTypes, type.id]);
                                                    }
                                                }}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                    aiQuestionTypes.includes(type.id)
                                                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                        : 'bg-gray-50 text-gray-500 border border-gray-100'
                                                }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quiz Settings */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider block px-1">Thời gian (phút)</label>
                                        <input
                                            type="number"
                                            value={aiTimeLimit}
                                            onChange={(e) => setAiTimeLimit(Number(e.target.value))}
                                            className="w-full bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider block px-1">Điểm tối đa</label>
                                        <input
                                            type="number"
                                            value={aiMaxScore}
                                            onChange={(e) => setAiMaxScore(Number(e.target.value))}
                                            className="w-full bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider block px-1">Điểm đạt (%)</label>
                                        <input
                                            type="number"
                                            value={aiPassingScore}
                                            onChange={(e) => setAiPassingScore(Number(e.target.value))}
                                            className="w-full bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                    <div className="flex items-start gap-3">
                                        <Sparkles size={18} className="text-purple-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-purple-700">AI sẽ phân tích nội dung bài học</p>
                                            <p className="text-xs text-purple-600 mt-1">Hệ thống AI sẽ đọc nội dung bài học và tạo các câu hỏi phù hợp với độ khó và loại câu hỏi bạn đã chọn.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-50 flex items-center justify-end gap-3 shrink-0">
                                <button
                                    disabled={aiGenerating}
                                    onClick={() => setAiGenerateOpen(false)}
                                    className="px-5 py-3 rounded-xl font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-all disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    disabled={aiGenerating || 
                                        (aiScope === 'lecture' && !aiLectureId) ||
                                        (aiScope === 'chapter' && !aiChapterId) ||
                                        (aiScope === 'multi' && aiSelectedLectures.length === 0) ||
                                        !aiQuizTitle.trim()
                                    }
                                    onClick={submitAIGenerate}
                                    className="px-5 py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {aiGenerating ? (
                                        <>
                                            <LoaderCircle size={18} className="animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} />
                                            Tạo Quiz bằng AI
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white max-w-md w-full rounded-[40px] p-10 shadow-2xl relative animate-in zoom-in duration-500">
                            <div className="text-center space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-gray-900">Xác nhận xóa đề thi?</h3>
                                    <p className="text-red-500 font-medium">
                                        Toàn bộ câu hỏi và dữ liệu bài làm của học viên liên quan đến đề thi này sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 pt-4">
                                    <button
                                        onClick={handleDeleteQuiz}
                                        disabled={loading}
                                        className="w-full bg-rose-500 text-white py-5 rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-200 active:scale-95 cursor-pointer disabled:opacity-50"
                                    >
                                        {loading ? 'ĐANG XÓA...' : 'ĐỒNG Ý XÓA'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setQuizToDeleteId(null);
                                        }}
                                        className="w-full bg-white text-gray-500 py-5 rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all cursor-pointer"
                                    >
                                        HỦY BỎ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizManagement;
