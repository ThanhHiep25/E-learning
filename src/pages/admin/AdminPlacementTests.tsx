import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Clock, Plus, MoreVertical, Edit3, AlertCircle, FileText, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    teacherService,
    type BackendTeacherQuiz,
} from '../../services/teacher.service';
import { apiRequest } from '../../services/api';

interface Category {
    id: number | string;
    name: string;
}

interface QuizTemplate {
    id: string;
    categoryId: string;
    categoryName: string;
    title: string;
    questionsCount: number;
    duration: number;
    timeLimit: number;
    maxScore: number;
    passingScore: number;
    antiCheat: boolean;
    status: 'published' | 'draft';
    createdAt: string;
    originalCreatedAt: number;
}

const AdminPlacementTests: React.FC = () => {
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [quizzes, setQuizzes] = useState<QuizTemplate[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const [createOpen, setCreateOpen] = useState(false);
    const [createCategoryId, setCreateCategoryId] = useState<string>('');
    const [createTitle, setCreateTitle] = useState('');
    const [createDescription, setCreateDescription] = useState('');
    const [createTimeLimit, setCreateTimeLimit] = useState<number>(0); // 0 means no limit
    const [createMaxScore, setCreateMaxScore] = useState<number>(100);
    const [createAntiCheat, setCreateAntiCheat] = useState<boolean>(false);
    const [creating, setCreating] = useState(false);

    const [editingQuiz, setEditingQuiz] = useState<BackendTeacherQuiz | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [quizToDeleteId, setQuizToDeleteId] = useState<string | null>(null);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await apiRequest<{ categories: Category[] }>('categories');
                setCategories(res.categories || []);
                if (res.categories.length > 0) {
                    setCreateCategoryId(String(res.categories[0].id));
                }
            } catch (err) {
                console.error('Failed to load categories', err);
            }
        };
        loadCategories();
    }, []);

    const loadQuizzes = useCallback(async () => {
        try {
            setLoading(true);
            const list = await teacherService.getPlacementQuizzes();
            const mapped = list.map((q: any) => {
                const created = q.createdAt ? new Date(q.createdAt) : null;
                return {
                    id: String(q.id),
                    categoryId: String(q.categoryId),
                    categoryName: q.category?.name || 'Chưa phân loại',
                    title: String(q.title),
                    questionsCount: Array.isArray(q.questions) ? q.questions.length : 0,
                    duration: Number(q.timeLimit ?? 0),
                    timeLimit: Number(q.timeLimit ?? 0),
                    maxScore: Number(q.maxScore ?? 100),
                    passingScore: Number(q.passingScore ?? 60),
                    antiCheat: !!q.antiCheat,
                    status: 'published',
                    createdAt: created ? created.toLocaleDateString('vi-VN') : '',
                    originalCreatedAt: created ? created.getTime() : 0,
                } as QuizTemplate;
            });
            setQuizzes(mapped);
        } catch (err: any) {
            toast.error(err?.message || 'Không thể tải danh sách bài test đầu vào');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadQuizzes();
    }, [loadQuizzes]);

    const submitCreate = async () => {
        if (!createCategoryId) return toast.error('Vui lòng chọn danh mục');
        if (!createTitle.trim()) return toast.error('Vui lòng nhập tiêu đề');

        try {
            setCreating(true);
            await teacherService.createQuiz(null, {
                title: createTitle,
                description: createDescription,
                timeLimit: createTimeLimit,
                maxScore: createMaxScore,
                passingScore: 0,
                antiCheat: createAntiCheat,
                type: 'placement',
                categoryId: createCategoryId,
                showResults: true
            });
            toast.success('Tạo bài test đầu vào thành công');
            setCreateOpen(false);
            loadQuizzes();
        } catch (err: any) {
            toast.error(err?.message || 'Lỗi khi tạo bài test');
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
                antiCheat: editingQuiz.antiCheat,
            });
            toast.success('Cập nhật thành công');
            setEditOpen(false);
            loadQuizzes();
        } catch (err: any) {
            toast.error(err?.message || 'Không thể cập nhật');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteQuiz = async () => {
        if (!quizToDeleteId) return;
        try {
            await teacherService.deleteQuiz(quizToDeleteId);
            toast.success('Đã xóa bài test');
            setShowDeleteModal(false);
            loadQuizzes();
        } catch (err: any) {
            toast.error(err?.message || 'Không thể xóa');
        }
    };

    const filteredQuizzes = useMemo(() => {
        let result = [...quizzes];
        if (selectedCategoryId !== 'all') {
            result = result.filter(q => q.categoryId === selectedCategoryId);
        }
        if (searchTerm) {
            result = result.filter(q => q.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return result.sort((a, b) => b.originalCreatedAt - a.originalCreatedAt);
    }, [quizzes, selectedCategoryId, searchTerm]);

    const paginatedQuizzes = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredQuizzes.slice(start, start + itemsPerPage);
    }, [filteredQuizzes, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage);

    return (
        <div className="w-full pb-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Bài Test Đầu Vào (Placement Tests)</h1>
                    <p className="text-gray-500 font-medium mt-2">Quản lý các bài kiểm tra đánh giá năng lực theo từng danh mục khoa học.</p>
                </div>
                <button
                    onClick={() => setCreateOpen(true)}
                    className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-xl active:scale-95"
                >
                    <Plus size={20} /> Tạo test mới
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài test..."
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-amber-500/20"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                    <option value="all">Tất cả danh mục</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedQuizzes.map((quiz) => (
                    <div key={quiz.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all relative">
                         <div className="flex items-start justify-between mb-6">
                             <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                 <FileText size={24} />
                             </div>
                             <div className="relative">
                                 <button onClick={() => setOpenMenuId(openMenuId === quiz.id ? null : quiz.id)} className="p-2 text-gray-400 hover:text-amber-600 rounded-lg">
                                     <MoreVertical size={20} />
                                 </button>
                                 {openMenuId === quiz.id && (
                                     <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-2xl border border-gray-50 py-2 z-20">
                                         <button onClick={() => { setEditingQuiz(quiz as any); setEditOpen(true); setOpenMenuId(null); }} className="w-full text-left px-5 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3">
                                             <Edit3 size={14} /> Sửa thông tin
                                         </button>
                                         <button onClick={() => { navigate(`/admin/quiz-editor/${quiz.id}`); setOpenMenuId(null); }} className="w-full text-left px-5 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3">
                                             <HelpCircle size={14} /> Soạn câu hỏi
                                         </button>
                                         <button onClick={() => { setQuizToDeleteId(quiz.id); setShowDeleteModal(true); setOpenMenuId(null); }} className="w-full text-left px-5 py-3 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-3">
                                             <AlertCircle size={14} /> Xóa bài test
                                         </button>
                                     </div>
                                 )}
                             </div>
                         </div>

                         <div className="mb-6">
                             <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{quiz.categoryName}</span>
                             <h3 className="text-xl font-black text-gray-900 mt-1 uppercase decoration-amber-500/30 line-clamp-2">{quiz.title}</h3>
                         </div>

                         <div className="grid grid-cols-3 gap-2 pt-6 border-t border-gray-50">
                             <div>
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Thời gian</p>
                                 <p className="text-sm font-black text-gray-900 flex items-center gap-1.5 line-clamp-1"><Clock size={12} className="text-gray-300" /> {quiz.duration === 0 ? 'KGH' : `${quiz.duration}m`}</p>
                             </div>
                             <div>
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Điểm</p>
                                 <p className="text-sm font-black text-gray-900 flex items-center gap-1.5">{quiz.maxScore}đ</p>
                             </div>
                             <div>
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Câu hỏi</p>
                                 <p className="text-sm font-black text-gray-900 flex items-center gap-1.5"><HelpCircle size={12} className="text-gray-300" /> {quiz.questionsCount}</p>
                             </div>
                         </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="p-3 rounded-xl bg-white border border-gray-100 disabled:opacity-30"
                    >
                        Trước
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-12 h-12 rounded-xl font-bold transition-all ${currentPage === i + 1 ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white border border-gray-100 text-gray-400'}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="p-3 rounded-xl bg-white border border-gray-100 disabled:opacity-30"
                    >
                        Sau
                    </button>
                </div>
            )}

            {/* Modals (Create/Edit/Delete) */}
            {createOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg bg-white rounded-[32px] p-8 shadow-2xl space-y-6">
                        <h2 className="text-2xl font-black text-gray-900">Tạo Bài Test Đầu Vào</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Danh mục</label>
                                <select value={createCategoryId} onChange={(e) => setCreateCategoryId(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold">
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Tiêu đề</label>
                                <input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="VD: Kiểm tra trình độ Tiếng Anh" className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Thời gian (Phút)</label>
                                    <input type="number" value={createTimeLimit} onChange={(e) => setCreateTimeLimit(Number(e.target.value))} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold" />
                                    <p className="text-[9px] text-gray-400 mt-1 italic">* 0 là không giới hạn</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Đạt tối đa</label>
                                    <input type="number" value={createMaxScore} onChange={(e) => setCreateMaxScore(Number(e.target.value))} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold" />
                                </div>
                                 <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Chống gian lận</label>
                                    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-5 py-4">
                                        <input type="checkbox" checked={createAntiCheat} onChange={(e) => setCreateAntiCheat(e.target.checked)} className="w-5 h-5 accent-amber-500" />
                                        <span className="text-sm font-bold text-gray-600">Bật chế độ khóa màn hình</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setCreateOpen(false)} className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 text-gray-600 transition-all">Hủy</button>
                            <button onClick={submitCreate} disabled={creating} className="flex-1 py-4 rounded-2xl font-bold bg-slate-900 text-white hover:bg-amber-600 transition-all disabled:opacity-50">
                                {creating ? 'Đang tạo...' : 'Tạo ngay'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Minimal Edit Modal */}
            {editOpen && editingQuiz && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg bg-white rounded-[32px] p-8 shadow-2xl space-y-6">
                        <h2 className="text-2xl font-black text-gray-900">Sửa Bài Test</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Tiêu đề</label>
                                <input value={editingQuiz.title} onChange={(e) => setEditingQuiz({...editingQuiz, title: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Thời gian (Phút)</label>
                                    <input type="number" value={editingQuiz.timeLimit} onChange={(e) => setEditingQuiz({...editingQuiz, timeLimit: Number(e.target.value)})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Đạt tối đa</label>
                                    <input type="number" value={editingQuiz.maxScore} onChange={(e) => setEditingQuiz({...editingQuiz, maxScore: Number(e.target.value)})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Chống gian lận</label>
                                    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-5 py-4">
                                        <input type="checkbox" checked={editingQuiz.antiCheat} onChange={(e) => setEditingQuiz({...editingQuiz, antiCheat: e.target.checked})} className="w-5 h-5 accent-amber-500" />
                                        <span className="text-sm font-bold text-gray-600">Bật chế độ khóa màn hình</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setEditOpen(false)} className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 text-gray-600 transition-all">Hủy</button>
                            <button onClick={submitUpdate} disabled={isUpdating} className="flex-1 py-4 rounded-2xl font-bold bg-slate-900 text-white hover:bg-amber-600 transition-all">
                                {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm bg-white rounded-[32px] p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle size={40} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Xóa bài test này?</h3>
                            <p className="text-gray-500 mt-2">Dữ liệu xóa sẽ không thể khôi phục lại.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-gray-100 text-gray-600">Thôi</button>
                            <button onClick={handleDeleteQuiz} className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 text-white">Xóa luôn</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPlacementTests;
