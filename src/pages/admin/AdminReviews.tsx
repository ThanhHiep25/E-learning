import React, { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, Star, MessageSquare, User, BookOpen, Calendar, Filter, ArrowUpDown, RefreshCw, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, type BackendAdminReview } from '../../services/admin.service';
import { safeFormat } from '../../utils/dateUtils';

type SortOption = 'newest' | 'oldest' | 'rating-desc' | 'rating-asc';

const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<BackendAdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<BackendAdminReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.listReviews();
      setReviews(data);
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi tải đánh giá');
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const uniqueCourses = useMemo(() => {
    const set = new Set<string>();
    reviews.forEach(r => {
      const course = r.Course || r.course;
      if (course?.title) set.add(course.title);
    });
    return Array.from(set).sort();
  }, [reviews]);

  const filteredAndSorted = useMemo(() => {
    let result = [...reviews];

    // Search Filter
    const s = q.trim().toLowerCase();
    if (s) {
      result = result.filter(r => {
        const user = r.User || r.user;
        const course = r.Course || r.course;
        return (
          user?.name?.toLowerCase().includes(s) ||
          user?.email?.toLowerCase().includes(s) ||
          course?.title?.toLowerCase().includes(s) ||
          r.comment?.toLowerCase().includes(s)
        );
      });
    }

    // Course Filter
    if (courseFilter !== 'all') {
      result = result.filter(r => {
        const course = r.Course || r.course;
        return course?.title === courseFilter;
      });
    }

    // Rating Filter
    if (ratingFilter !== 'all') {
      result = result.filter(r => Math.floor(r.rating) === ratingFilter);
    }

    // Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();

      switch (sortBy) {
        case 'newest': return dateB - dateA;
        case 'oldest': return dateA - dateB;
        case 'rating-desc': return (b.rating || 0) - (a.rating || 0);
        case 'rating-asc': return (a.rating || 0) - (b.rating || 0);
        default: return 0;
      }
    });

    return result;
  }, [reviews, q, courseFilter, ratingFilter, sortBy]);

  const confirmDelete = (r: BackendAdminReview) => {
    setReviewToDelete(r);
    setShowDeleteModal(true);
  };

  const handleExecuteDelete = async () => {
    if (!reviewToDelete) return;
    setIsDeleting(true);
    try {
      await adminService.deleteReview(String(reviewToDelete.id));
      toast.success('Đã xóa đánh giá thành công');
      setReviews(prev => prev.filter(x => String(x.id) !== String(reviewToDelete.id)));
      setShowDeleteModal(false);
      setReviewToDelete(null);
    } catch (e: any) {
      toast.error(e?.message || 'Xóa đánh giá thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setQ('');
    setCourseFilter('all');
    setRatingFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/30 p-4 md:p-10">
      <div className="max-w-[1440px] mx-auto space-y-10">

        {/* Header Header Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl md:text-4xl font-bold text-slate-900 tracking-tightest">
                Quản lý đánh giá
              </h1>
            </div>
            <p className="text-slate-500 max-w-lg leading-relaxed text-sm md:text-base opacity-80">
              Kiểm duyệt và tối ưu hóa phản hồi của học viên để nâng cao chất lượng khóa học toàn hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={load}
              className="p-4 bg-white cursor-pointer hover:bg-slate-50 text-slate-600 rounded-2xl shadow-sm border border-slate-100 transition-all active:scale-95 group"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={20} className={`group-active:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* FILTER BAR - PREMIUM DESIGN */}
        <div className="bg-white rounded-[32px] p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-slate-100/50 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 ml-1 pointer-events-none">Từ khóa tìm kiếm</label>
              <div className="relative flex items-center bg-slate-50 cursor-pointer border-2 border-transparent focus-within:border-amber-500 focus-within:bg-white rounded-2xl px-5 py-3.5 transition-all duration-300">
                <Search className="text-slate-300 group-focus-within:text-amber-500" size={18} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tên, Email, Nội dung..."
                  className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-300 ml-3 text-sm"
                />
                {q && (
                  <button onClick={() => setQ('')} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Course Select */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 ml-1 pointer-events-none">Lọc theo khóa học</label>
              <div className="relative">
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-slate-700 text-sm outline-none cursor-pointer transition-all duration-300"
                >
                  <option value="all">Tất cả bài học</option>
                  {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                  <BookOpen size={16} />
                </div>
              </div>
            </div>

            {/* Rating Select */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 ml-1 pointer-events-none">Số sao đánh giá</label>
              <div className="relative">
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full appearance-none bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-slate-700 text-sm outline-none cursor-pointer transition-all duration-300"
                >
                  <option value="all">Tất cả mức độ</option>
                  {[5, 4, 3, 2, 1].map(s => <option key={s} value={s}>{s} Sao {s >= 4 ? '⭐' : ''}</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400">
                  <Star size={18} className="fill-amber-400/20" />
                </div>
              </div>
            </div>

            {/* Sort Select */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 ml-1 pointer-events-none">Sắp xếp hiển thị</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full appearance-none bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-slate-700 text-sm outline-none cursor-pointer transition-all duration-300"
                >
                  <option value="newest">Ngày tạo: Mới nhất</option>
                  <option value="oldest">Ngày tạo: Cũ nhất</option>
                  <option value="rating-desc">Đánh giá: Cao xuống thấp</option>
                  <option value="rating-asc">Đánh giá: Thấp lên cao</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                  <ArrowUpDown size={16} />
                </div>
              </div>
            </div>
          </div>

          {(q || courseFilter !== 'all' || ratingFilter !== 'all') && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-slate-400">Đang hiển thị kết quả lọc bộ lọc...</span>
              </div>
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 text-[10px] font-bold text-rose-500 hover:bg-rose-50 px-4 py-2 rounded-xl transition-all active:scale-95"
              >
                <X size={14} />
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.03)] overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-linear-to-r from-slate-50/50 to-transparent">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">Danh sách hiển thị</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-5 py-2.5 rounded-2xl  flex items-center gap-2">
                <span className="text-[10px] font-bold opacity-60">Tổng cộng:</span>
                <span className="text-sm font-bold text-amber-400">{filteredAndSorted.length}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-32 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-amber-500/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
                <MessageSquare className="absolute inset-0 m-auto text-amber-500/50 animate-pulse" size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Hệ thống đang trích xuất dữ liệu...</p>
                <p className="text-slate-300 text-xs italic">Vui lòng đợi trong giây lát</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-6 text-[12px] font-bold text-slate-400">Thông tin người dùng</th>
                    <th className="px-8 py-6 text-[12px] font-bold text-slate-400">Khóa học & Bài học</th>
                    <th className="px-8 py-6 text-[12px] font-bold text-slate-400">Mức xếp hạng</th>
                    <th className="px-8 py-6 text-[12px] font-bold text-slate-400">Nội dung phản hồi</th>
                    <th className="px-8 py-6 text-[12px] font-bold text-slate-400">Thời gian</th>
                    <th className="px-8 py-6 text-[12px] font-bold text-slate-400 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAndSorted.map((r) => {
                    const userData = r.User || r.user;
                    const courseData = r.Course || r.course;
                    const createdAt = r.createdAt || r.created_at;

                    return (
                      <tr key={String(r.id)} className="group hover:bg-slate-50/60 transition-all duration-500">
                        <td className="px-8 py-7">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-blue-600 rounded-[18px] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                              <User size={20} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-900 truncate tracking-tight group-hover:text-blue-600 transition-colors">
                                {userData?.name || 'Vô danh'}
                              </div>
                              <div className="text-[11px] text-slate-400 italic truncate opacity-70 flex items-center gap-1 mt-0.5">
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                {userData?.email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                              <BookOpen size={16} />
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-xs  text-slate-400 ">Bài học:</div>
                              <div className="text-sm font-bold text-slate-700 line-clamp-1 max-w-[200px]">
                                {courseData?.title || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-amber-600 rounded-2xl font-black text-sm border border-slate-100 shadow-xs group-hover:shadow-md group-hover:border-amber-100 transition-all duration-300">
                            <span className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={`${i < Math.floor(r.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} transition-colors duration-500`}
                                />
                              ))}
                            </span>
                            <span className="ml-1">{Number(r.rating || 0).toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="max-w-[340px] bg-slate-50/50 p-4 rounded-[24px] border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all duration-500">
                            <p className="text-xs font-semibold text-slate-600 leading-relaxed italic line-clamp-3">
                              "{r.comment || 'Không để lại nhận xét thêm...'}"
                            </p>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex items-center gap-2.5 text-slate-400 font-bold text-[11px] uppercase tracking-tighter bg-white/50 w-fit px-3 py-1.5 rounded-full border border-slate-50">
                            <Calendar size={13} className="text-slate-300" />
                            {safeFormat(createdAt, 'dd MMM, yyyy')}
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 duration-500">
                            <button
                              onClick={() => confirmDelete(r)}
                              className="w-11 h-11 text-slate-400 cursor-pointer hover:text-white hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-500/30 rounded-[15px] transition-all active:scale-95 bg-white border border-slate-100 flex items-center justify-center group/btn"
                              title="Xóa đánh giá khỏi hệ thống"
                            >
                              <Trash2 size={20} className="transition-transform" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAndSorted.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-32 text-center">
                        <div className="max-w-md mx-auto space-y-6">
                          <div className="relative w-32 h-32 mx-auto">
                            <div className="absolute inset-0 bg-slate-50 rounded-[40px] rotate-12 transition-transform duration-700 hover:rotate-0"></div>
                            <Search size={54} className="absolute inset-0 m-auto text-slate-200" />

                          </div>
                          <div className="space-y-2">
                            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">Không tìm thấy!</h3>
                            <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-[300px] mx-auto">
                              Chúng tôi không tìm thấy bất kỳ đánh giá nào khớp với yêu cầu trích lọc của bạn. Thử thay đổi từ khóa hoặc bộ lọc nhé.
                            </p>
                          </div>
                          <button
                            onClick={resetFilters}
                            className="px-8 py-4 cursor-pointer bg-slate-900 text-white font-bold text-sm rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-105 transition-all active:scale-95"
                          >
                            Đặt lại dữ liệu gốc
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Xác nhận xóa đánh giá?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Bạn có chắc chắn muốn xóa đánh giá của
                  <span className="font-bold text-slate-700 ml-1">
                    {reviewToDelete?.User?.name || reviewToDelete?.user?.name || 'người dùng này'}
                  </span>?
                  Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Xác nhận xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
