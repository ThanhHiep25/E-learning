import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Clock, Plus, MoreVertical, Edit3, AlertCircle, FileText, ChevronRight, X, BarChart3, Calendar, Search, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
    teacherService,
    type BackendTeacherCourse,
    type BackendTeacherQuiz,
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
    const [selectedCourseId, setSelectedCourseId] = useState<string>('all');

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
                            status: q.startTime ? 'published' : 'draft', // Using startTime as a proxy for published if no field exists
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

    const openCreate = () => {
        if (teacherCourses.length === 0) {
            toast.error('Bạn chưa có khóa học nào để tạo quiz');
            return;
        }
        setCreateTitle('');
        setCreateDescription('');
        setCreateTimeLimit(30);
        setCreateMaxScore(100);
        setCreatePassingScore(60);
        setCreateStartTime('');
        setCreateEndTime('');
        setCreateShowResults(true);
        setCreateAntiCheat(false);
        setCreateOpen(true);
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

                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            Kiến tạo đề thi.
                        </h1>
                        <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-lg">
                            Thiết kế các bài kiểm tra đa dạng, theo dõi kết quả và đánh giá năng lực học viên một cách chính xác.
                        </p>
                    </div>

                    <div className="flex gap-4">
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
                                    className="w-full bg-gray-50 border border-transparent rounded-xl md:rounded-2xl px-5 py-3 text-xs font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition-all cursor-pointer shadow-xs"
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                >
                                    <option value="all">Tất cả khóa học</option>
                                    {teacherCourses.map(course => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
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
                                        onChange={(e) => setCreateCourseId(e.target.value)}
                                        className="w-full bg-gray-50 rounded-xl md:rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800"
                                    >
                                        {teacherCourses.map((c) => (
                                            <option key={String(c.id)} value={String(c.id)}>{c.title}</option>
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
