import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Plus, Edit3, Trash2, Clock, Loader2,
  AlertCircle, X, ChevronRight, BookOpen
} from 'lucide-react';
import { finalQuizService, type FinalQuiz } from '../../services/finalQuiz.service';
import toast from 'react-hot-toast';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const FinalQuizManager: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<FinalQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('A1');
  const [maxScore, setMaxScore] = useState(100);
  const [timeLimit, setTimeLimit] = useState(60);
  const [passingScore, setPassingScore] = useState(60);

  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await finalQuizService.listFinalQuizzes();
      console.log('[DEBUG FinalQuizManager] listFinalQuizzes result:', data, 'length:', data?.length);
      setQuizzes(data);
    } catch (err: any) {
      console.error('[DEBUG FinalQuizManager] Error:', err);
      toast.error(err?.message || 'Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    try {
      setCreating(true);
      await finalQuizService.createFinalQuiz({
        title: title.trim(),
        description: description.trim() || undefined,
        level,
        maxScore,
        timeLimit,
        passingScore,
      });
      toast.success('Tạo bài kiểm tra thành công');
      setCreateOpen(false);
      resetForm();
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Tạo thất bại');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLevel('A1');
    setMaxScore(100);
    setTimeLimit(60);
    setPassingScore(60);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      // Use teacherService deleteQuiz since final quiz uses same model
      const { teacherService } = await import('../../services/teacher.service');
      await teacherService.deleteQuiz(deleteId);
      toast.success('Đã xóa');
      setDeleteId(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            Bài kiểm tra cuối trình độ
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Quản lý bài kiểm tra cuối cho từng cấp độ CEFR
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all cursor-pointer"
        >
          <Plus size={16} />
          Tạo bài kiểm tra
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {LEVELS.map((lvl) => {
          const q = quizzes.find((qz) => String(qz.level) === lvl);
          return (
            <div
              key={lvl}
              className={`rounded-2xl p-4 border text-center transition-all ${
                q ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="text-xl font-black text-slate-900 mb-1">{lvl}</div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {q ? `${q.questions?.length || 0} câu hỏi` : 'Chưa có'}
              </div>
              {q && (
                <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                  <Clock size={10} />
                  {q.timeLimit} phút
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* List */}
      {quizzes.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-100 p-12 text-center">
          <Trophy size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-lg font-black text-slate-900 mb-2">Chưa có bài kiểm tra nào</h3>
          <p className="text-sm text-slate-500 font-medium mb-6">
            Tạo bài kiểm tra cuối trình độ để học sinh có thể thi lên cấp
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all cursor-pointer"
          >
            Tạo bài kiểm tra đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((q) => (
            <div
              key={String(q.id)}
              className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-xl hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-wider mb-2">
                    Trình độ {q.level}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{q.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(`/teacher/quiz-editor/${q.id}`)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                    title="Sửa câu hỏi"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(q.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <div className="text-xs font-black text-slate-900">{q.maxScore || 100}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Điểm tối đa</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <div className="text-xs font-black text-slate-900">{q.passingScore || 60}%</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Điểm đạt</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <div className="text-xs font-black text-slate-900">{q.timeLimit || 60}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Phút</div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/teacher/quiz-editor/${q.id}`)}
                className="w-full flex items-center justify-center gap-1 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
              >
                <BookOpen size={14} />
                {q.questions && q.questions.length > 0 ? 'Quản lý câu hỏi' : 'Thêm câu hỏi'}
                <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">Tạo bài kiểm tra cuối trình độ</h2>
              <button
                onClick={() => { setCreateOpen(false); resetForm(); }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tiêu đề</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Bài kiểm tra cuối trình độ A1"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Mô tả ngắn về bài kiểm tra"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cấp độ</label>
                <div className="flex gap-2 flex-wrap">
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLevel(lvl)}
                      className={`px-4 py-2 rounded-xl text-sm font-black transition-all cursor-pointer ${
                        level === lvl
                          ? 'bg-slate-900 text-white shadow-lg'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Điểm tối đa</label>
                  <input
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Thời gian (phút)</label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Điểm đạt (%)</label>
                  <input
                    type="number"
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => { setCreateOpen(false); resetForm(); }}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all disabled:opacity-50 cursor-pointer"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Tạo bài kiểm tra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center">
            <AlertCircle size={48} className="mx-auto text-rose-500 mb-4" />
            <h3 className="text-lg font-black text-slate-900 mb-2">Xác nhận xóa?</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Hành động này không thể hoàn tác. Tất cả câu hỏi và kết quả làm bài cũng sẽ bị xóa.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalQuizManager;
