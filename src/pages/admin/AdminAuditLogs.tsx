import React, { useEffect, useState } from 'react';
import { History, RefreshCw, User, Calendar, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service';

interface AuditLog {
  id: number;
  adminId: number;
  action: string;
  targetType: string;
  targetId: number;
  reason: string | null;
  metadata: string;
  createdAt: string;
  admin: {
    id: number;
    name: string;
    email: string;
  };
}

const actionLabels: Record<string, string> = {
  delete: 'Xóa',
  create: 'Tạo mới',
  update: 'Cập nhật',
  ban: 'Cấm',
  unban: 'Bỏ cấm',
  approve: 'Phê duyệt',
  reject: 'Từ chối',
};

const targetLabels: Record<string, string> = {
  user: 'Người dùng',
  course: 'Khóa học',
  review: 'Đánh giá',
  category: 'Danh mục',
  payment: 'Thanh toán',
};

const actionColors: Record<string, string> = {
  delete: 'bg-red-100 text-red-700',
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  ban: 'bg-orange-100 text-orange-700',
  unban: 'bg-emerald-100 text-emerald-700',
  approve: 'bg-teal-100 text-teal-700',
  reject: 'bg-rose-100 text-rose-700',
};

const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      console.log('[Frontend] Loading audit logs...');
      // apiRequest auto-unwraps response.data when success: true
      const logsData = await adminService.getAuditLogs({
        page,
        limit: 20,
        action: actionFilter || undefined,
        targetType: targetFilter || undefined,
      });
      console.log('[Frontend] API logsData:', logsData);
      // Since apiRequest returns the data array directly, we need to handle this differently
      // The service should return { data, pagination } but apiRequest unwraps it
      // Let's check if it's an array
      if (Array.isArray(logsData)) {
        setLogs(logsData);
        setTotalPages(1); // Default since we don't have pagination info
      } else {
        setLogs(logsData.data || []);
        setTotalPages(logsData.pagination?.totalPages || 1);
      }
    } catch (e: any) {
      console.error('[Frontend] Error loading logs:', e);
      toast.error(e?.message || 'Lỗi tải audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter, targetFilter]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseMetadata = (metadata: string) => {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8EE] to-[#f5f0e6] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Lịch sử hoạt động</h1>
              <p className="text-gray-500 font-medium">Theo dõi mọi thao tác của Admin trong hệ thống</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="font-bold text-gray-700">Lọc:</span>
            </div>
            
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">Tất cả hành động</option>
              <option value="delete">Xóa</option>
              <option value="create">Tạo mới</option>
              <option value="update">Cập nhật</option>
              <option value="ban">Cấm</option>
              <option value="approve">Phê duyệt</option>
            </select>

            <select
              value={targetFilter}
              onChange={(e) => { setTargetFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">Tất cả đối tượng</option>
              <option value="user">Người dùng</option>
              <option value="course">Khóa học</option>
              <option value="review">Đánh giá</option>
              <option value="category">Danh mục</option>
            </select>

            <button
              onClick={() => { setActionFilter(''); setTargetFilter(''); setPage(1); }}
              className="ml-auto flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Chưa có hoạt động nào được ghi lại</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Thời gian</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Hành động</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Đối tượng</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => {
                      const metadata = parseMetadata(log.metadata);
                      return (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatDate(log.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{log.admin?.name || `Admin #${log.adminId}`}</p>
                                <p className="text-xs text-gray-500">{log.admin?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                              {actionLabels[log.action] || log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <span className="font-bold text-gray-700">{targetLabels[log.targetType] || log.targetType}</span>
                              <span className="text-gray-400 mx-1">#{log.targetId}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {metadata.user && (
                              <div className="text-sm text-gray-600">
                                <p className="font-medium text-gray-900">{metadata.user.name}</p>
                                <p className="text-xs">{metadata.user.email}</p>
                              </div>
                            )}
                            {log.reason && (
                              <p className="text-sm text-gray-500 italic mt-1">Lý do: {log.reason}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Trang {page} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-200 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogs;
