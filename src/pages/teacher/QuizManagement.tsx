import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Clock, Zap, Plus, MoreVertical, Edit3, AlertCircle, FileText, ChevronRight, Layout } from 'lucide-react';
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
}

const QuizManagement: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedCourseId, setSelectedCourseId] = useState<string>('all');

    const [loading, setLoading] = useState(false);
    const [quizzes, setQuizzes] = useState<QuizTemplate[]>([]);

    const [teacherCourses, setTeacherCourses] = useState<BackendTeacherCourse[]>([]);

    const [createOpen, setCreateOpen] = useState(false);
    const [createCourseId, setCreateCourseId] = useState<string>('');
    const [createTitle, setCreateTitle] = useState('');
    const [createTimeLimit, setCreateTimeLimit] = useState<number>(30);
    const [createMaxScore, setCreateMaxScore] = useState<number>(100);
    const [createPassingScore, setCreatePassingScore] = useState<number>(60);
    const [creating, setCreating] = useState(false);

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
                            status: 'published',
                            createdAt: created ? created.toLocaleDateString('vi-VN') : '',
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

    const openCreate = () => {
        if (teacherCourses.length === 0) {
            toast.error('Bạn chưa có khóa học nào để tạo quiz');
            return;
        }
        setCreateTitle('');
        setCreateTimeLimit(30);
        setCreateMaxScore(100);
        setCreatePassingScore(60);
        setCreateOpen(true);
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
                timeLimit: createTimeLimit,
                maxScore: createMaxScore,
                passingScore: createPassingScore,
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

    const filteredQuizzes = useMemo(() => {
        return selectedCourseId === 'all'
            ? quizzes
            : quizzes.filter(q => q.courseId === selectedCourseId);
    }, [quizzes, selectedCourseId]);

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
                        <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-lg">
                            Thiết kế các bài kiểm tra đa dạng, theo dõi kết quả và đánh giá năng lực học viên một cách chính xác.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-3 bg-gray-900 text-white px-8 py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-600 transition-all shadow-2xl shadow-gray-200 active:scale-95 cursor-pointer"
                        >
                            <Plus size={20} />
                            Tạo Đề Mới
                        </button>
                    </div>
                </div>

                {/* Top Control Bar */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
                    <div className="lg:col-span-1 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng đề thi</p>
                            <h3 className="text-3xl font-black text-gray-900">{loading ? '...' : filteredQuizzes.length}</h3>
                        </div>
                        <div className="mt-4 flex gap-1">
                            {[...Array(5)].map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i < 3 ? 'bg-amber-500' : 'bg-gray-100'}`}></div>)}
                        </div>
                    </div>

                    <div className="lg:col-span-3 bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm flex items-center">
                        <div className="flex items-center gap-4 w-full px-4">
                            <Layout size={20} className="text-gray-300" />
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lọc theo khóa học</p>
                                <select
                                    className="w-full text-base font-bold bg-transparent focus:outline-none appearance-none cursor-pointer"
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                >
                                    <option value="all">Tất cả khóa học ({teacherCourses.length})</option>
                                    {teacherCourses.map(course => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>
                            <ChevronRight size={20} className="text-gray-200" />
                        </div>
                    </div>
                </div>

                {/* Quiz Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredQuizzes.length > 0 ? (
                        filteredQuizzes.map((quiz) => (
                            <div key={quiz.id} className="group bg-white rounded-[48px] p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-700 relative overflow-hidden flex flex-col">
                                <div className="flex items-start justify-between mb-8">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform ${quiz.status === 'published' ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-400'}`}>
                                        <FileText size={28} />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button className="p-2 text-gray-300 hover:text-gray-600 rounded-xl transition-all"><MoreVertical size={18} /></button>
                                    </div>
                                </div>

                                <div className="mb-8 flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border ${quiz.status === 'published' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                            {quiz.status === 'published' ? 'Công khai' : 'Bản nháp'}
                                        </span>
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{quiz.createdAt}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-amber-600 transition-colors uppercase italic mb-3">
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
                                            {quiz.duration} Phút
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
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            {[...Array(3)].map((_, i) => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">?</div>)}
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">+{quiz.assignedStudents} Học viên</span>
                                    </div>
                                    <button
                                        onClick={() => openQuestionManager(String(quiz.id))}
                                        className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-amber-500 transition-all cursor-pointer"
                                    >
                                        <span className="sr-only">Soạn câu hỏi</span>
                                        <Edit3 size={20} />
                                    </button>
                                </div>

                                {/* Hover Reveal Background Icon */}
                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 group-hover:scale-150 transition-all duration-1000 rotate-12">
                                    <Zap size={100} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center bg-white rounded-[48px] border-2 border-dashed border-gray-100">
                            <AlertCircle size={48} className="mx-auto text-gray-200 mb-6" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Không tìm thấy bài kiểm tra nào phù hợp.</p>
                            <button onClick={openCreate} className="mt-4 text-amber-600 font-black text-sm uppercase tracking-widest hover:underline cursor-pointer">Tạo đề thi mới ngay</button>
                        </div>
                    )}
                </div>

                {createOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="w-full max-w-xl bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-gray-50">
                                <div className="text-lg font-black text-gray-900">Tạo đề thi mới</div>
                                <div className="text-sm font-bold text-gray-500 mt-1">Chọn khóa học và nhập thông tin quiz</div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Khóa học</div>
                                    <select
                                        value={createCourseId}
                                        onChange={(e) => setCreateCourseId(e.target.value)}
                                        className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800"
                                    >
                                        {teacherCourses.map((c) => (
                                            <option key={String(c.id)} value={String(c.id)}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tiêu đề</div>
                                    <input
                                        value={createTitle}
                                        onChange={(e) => setCreateTitle(e.target.value)}
                                        className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none"
                                        placeholder="VD: Quiz chương 1..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Thời gian (phút)</div>
                                        <input
                                            type="number"
                                            min={1}
                                            value={createTimeLimit}
                                            onChange={(e) => setCreateTimeLimit(Number(e.target.value || 0))}
                                            className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Điểm tối đa</div>
                                        <input
                                            type="number"
                                            min={1}
                                            value={createMaxScore}
                                            onChange={(e) => setCreateMaxScore(Number(e.target.value || 0))}
                                            className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Điểm đạt</div>
                                        <input
                                            type="number"
                                            min={0}
                                            value={createPassingScore}
                                            onChange={(e) => setCreatePassingScore(Number(e.target.value || 0))}
                                            className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-50 flex items-center justify-end gap-3">
                                <button
                                    disabled={creating}
                                    onClick={() => setCreateOpen(false)}
                                    className="px-4 py-2 rounded-xl font-black text-gray-600 bg-gray-50 disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    disabled={creating}
                                    onClick={submitCreate}
                                    className="px-5 py-2 rounded-xl font-black text-white bg-gray-900 hover:bg-amber-600 disabled:opacity-50"
                                >
                                    {creating ? 'Đang tạo...' : 'Tạo'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
};

export default QuizManagement;
