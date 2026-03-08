import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, CreditCard, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, type BackendAdminPayment } from '../../services/admin.service';

const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<BackendAdminPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');
  const [q, setQ] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.listPayments({ page, limit, status: status || undefined, provider: provider || undefined });
      setPayments(res.payments);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi tải payments');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  useEffect(() => {
    load();
  }, [page, status, provider]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return payments;
    return payments.filter((p) => {
      const hay = `${p.user?.email || ''} ${p.user?.name || ''} ${p.course?.title || ''} ${p.status} ${p.provider} ${p.providerTxn}`.toLowerCase();
      return hay.includes(s);
    });
  }, [payments, q]);

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900">Quản lý thanh toán</h1>
            <p className="text-gray-500 font-medium mt-1">Danh sách giao dịch toàn hệ thống</p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
              <Search size={18} className="text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo email, khóa học, txn..."
                className="w-full outline-none font-bold text-gray-700 bg-transparent"
              />
            </div>

            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold uppercase text-xs"
            >
              <option value="">TẤT CẢ TRẠNG THÁI</option>
              <option value="pending">PENDING</option>
              <option value="completed">COMPLETED</option>
              <option value="failed">FAILED</option>
              <option value="cancelled">CANCELLED</option>
            </select>

            <select
              value={provider}
              onChange={(e) => {
                setPage(1);
                setProvider(e.target.value);
              }}
              className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold uppercase text-xs"
            >
              <option value="">TẤT CẢ CỔNG</option>
              <option value="stripe">STRIPE</option>
              <option value="paypal">PAYPAL</option>
              <option value="bank_transfer">BANK_TRANSFER</option>
              <option value="mock">MOCK</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Danh sách thanh toán</h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trang {page}/{totalPages}</span>
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
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Khóa học</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Số tiền</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Provider</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Txn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((p) => (
                    <tr key={String(p.id)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="text-sm font-black text-gray-900">{p.user?.email || String(p.userId)}</div>
                        <div className="text-[11px] font-bold text-gray-400">{p.user?.name || ''}</div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-gray-700">{p.course?.title || String(p.courseId)}</td>
                      <td className="px-6 py-5 text-sm font-black text-amber-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(p.amount || 0))}
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest bg-gray-50 text-gray-600">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        <CreditCard size={14} className="text-gray-300" />
                        {p.provider}
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-400">{p.providerTxn}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-20 text-center">
                        <AlertCircle className="mx-auto text-gray-200 mb-4" size={48} />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Không tìm thấy thanh toán nào</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-6 border-t border-gray-50 flex items-center justify-end gap-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="cursor-pointer px-4 py-2 rounded-xl font-black text-gray-600 bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="cursor-pointer px-4 py-2 rounded-xl font-black text-gray-600 bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
