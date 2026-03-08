import React, { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, type BackendAdminReview } from '../../services/admin.service';

const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<BackendAdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.listReviews();
      setReviews(data);
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi tải reviews');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return reviews;
    return reviews.filter((r) => {
      const hay = `${r.User?.email || ''} ${r.User?.name || ''} ${r.Course?.title || ''} ${r.comment || ''}`.toLowerCase();
      return hay.includes(s);
    });
  }, [reviews, q]);

  const onDelete = async (r: BackendAdminReview) => {
    const ok = window.confirm('Xóa review này?');
    if (!ok) return;
    try {
      await adminService.deleteReview(String(r.id));
      toast.success('Đã xóa review');
      setReviews((prev) => prev.filter((x) => String(x.id) !== String(r.id)));
    } catch (e: any) {
      toast.error(e?.message || 'Xóa review thất bại');
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900">Quản lý đánh giá</h1>
            <p className="text-gray-500 font-medium mt-1">Xem/xóa reviews vi phạm</p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
              <Search size={18} />
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo email, khóa học, nội dung..."
              className="w-full outline-none font-bold text-gray-700"
            />
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900">Reviews</h2>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{filtered.length} items</span>
          </div>

          {loading ? (
            <div className="p-10 text-center flex items-center justify-center font-bold text-gray-400">
              <Loader2 className="animate-spin text-amber-500" size={40} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Comment</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((r) => (
                    <tr key={String(r.id)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="text-sm font-black text-gray-900">{r.User?.email || '-'}</div>
                        <div className="text-[11px] font-bold text-gray-400">{r.User?.name || ''}</div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-gray-700">{r.Course?.title || '-'}</td>
                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-2 text-sm font-black text-amber-600">
                          <Star size={16} /> {Number(r.rating || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-gray-600 max-w-[520px]">
                        <div className="line-clamp-2">{r.comment || ''}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end">
                          <button
                            onClick={() => onDelete(r)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Xóa review"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-gray-500 font-bold">Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;
