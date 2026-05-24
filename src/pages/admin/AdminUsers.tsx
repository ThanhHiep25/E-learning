import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, Plus, Search, Trash2, UserRoundKey, X, ShieldOff, CheckCircle, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { forumService } from '../../services/forum.service';
import toast from 'react-hot-toast';
import { adminService, type BackendAdminUser } from '../../services/admin.service';

interface AdminUsersProps {
  defaultRoleFilter?: 'all' | 'student' | 'teacher' | 'admin';
  hideRoleFilter?: boolean;
  pageTitle?: string;
  pageSubtitle?: string;
  icon?: React.ReactNode;
  onRowClick?: (user: BackendAdminUser) => void;
  showViewButton?: boolean;
  /** Show promote/demote buttons for role management */
  enableRoleActions?: boolean;
}

const AdminUsers: React.FC<AdminUsersProps> = ({
  defaultRoleFilter = 'all',
  hideRoleFilter = false,
  pageTitle = 'Quản lý người dùng',
  pageSubtitle = 'Tạo / phân quyền / xóa user',
  icon = null,
  onRowClick,
  showViewButton = false,
}) => {
  const [users, setUsers] = useState<BackendAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>(defaultRoleFilter);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createUsername, setCreateUsername] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'student' | 'teacher'>('student');
  const [showPassword, setShowPassword] = useState(false);

  // Reset Password State
  const [resetUser, setResetUser] = useState<BackendAdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Delete User State
  const [deleteUserTarget, setDeleteUserTarget] = useState<BackendAdminUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Export CSV State
  const [exporting, setExporting] = useState(false);

  // Ban User State
  const [banUserTarget, setBanUserTarget] = useState<BackendAdminUser | null>(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [banReason, setBanReason] = useState('Vi phạm tiêu chuẩn cộng đồng');
  const [banUntil, setBanUntil] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const load = async () => {
    setLoading(true);
    try {
      // Nếu có roleFilter cụ thể, dùng API filter; nếu 'all' thì lấy tất cả
      let data: BackendAdminUser[];
      if (roleFilter !== 'all') {
        data = await adminService.listUsersByRole(roleFilter);
      } else {
        data = await adminService.listUsers();
      }
      setUsers(data);
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi tải danh sách user');
    } finally {
      // 🛡️ P2-4 FIX: Remove artificial delay, set loading false immediately
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [roleFilter]); // Reload khi roleFilter thay đổi

  // Export CSV Handler
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      // 🛡️ P1-1 FIX: Removed console.log that exposes token
      const blob = await adminService.exportUsersCSV(
        roleFilter !== 'all' ? roleFilter : undefined
      );
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-${roleFilter !== 'all' ? roleFilter : 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Đã tải xuống file CSV');
    } catch (e: any) {
      console.error('[ExportCSV] Error:', e);
      toast.error(e?.message || 'Lỗi xuất CSV');
    } finally {
      setExporting(false);
    }
  };

  const filtered = useMemo(() => {
    let result = [...users];
    
    // Filter by role
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }
    
    // Search filter
    const s = q.trim().toLowerCase();
    if (s) {
      result = result.filter((u) => {
        const hay = `${u.name} ${u.username || ''} ${u.email} ${u.role}`.toLowerCase();
        return hay.includes(s);
      });
    }
    
    return result;
  }, [users, q, roleFilter]);

  // Stats calculation
  const stats = useMemo(() => ({
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    teachers: users.filter(u => u.role === 'teacher').length,
    admins: users.filter(u => u.role === 'admin').length,
  }), [users]);

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage]);

  // Reset to page 1 when search or role filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [q, roleFilter]);

  const onCreate = async () => {
    try {
      if (!createUsername.trim() || !createEmail.trim() || !createPassword.trim()) {
        toast.error('Vui lòng nhập username, email, password');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(createEmail)) {
        toast.error('Email không hợp lệ');
        return;
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(createPassword)) {
        toast.error('Password không hợp lệ');
        return;
      }

      await adminService.createUser({
        username: createUsername.trim(),
        email: createEmail.trim(),
        password: createPassword,
        role: createRole,
      });

      toast.success('Tạo user thành công');
      setIsCreateOpen(false);
      setCreateUsername('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateRole('student');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Tạo user thất bại');
    }
  };

  const onDelete = async (u: BackendAdminUser) => {
    setDeleteUserTarget(u);
    setIsDeleteModalOpen(true);
  };

  const onResetPassword = (u: BackendAdminUser) => {
    setResetUser(u);
    setNewPassword('');
    setIsResetModalOpen(true);
    setIsConfirmOpen(false);
  };

  const handleResetPassword = async () => {
    if (!resetUser || !newPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    setIsResetting(true);
    try {
      await adminService.updateUser(String(resetUser.id), { newPassword: newPassword.trim() });
      toast.success('Reset mật khẩu thành công');
      setIsResetModalOpen(false);
      setIsConfirmOpen(false);
      setResetUser(null);
      setNewPassword('');
    } catch (e: any) {
      toast.error(e?.message || 'Reset mật khẩu thất bại');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;
    setIsDeleting(true);
    try {
      await adminService.deleteUser(String(deleteUserTarget.id));
      toast.success('Xóa user thành công');
      setUsers((prev) => prev.filter((x) => String(x.id) !== String(deleteUserTarget.id)));
      setIsDeleteModalOpen(false);
      setDeleteUserTarget(null);
    } catch (e: any) {
      toast.error(e?.message || 'Xóa user thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  const onBanClick = (u: BackendAdminUser) => {
    setBanUserTarget(u);
    setIsBanModalOpen(true);
    setBanReason('Vi phạm tiêu chuẩn cộng đồng');
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setBanUntil(defaultDate.toISOString().split('T')[0]);
  };

  const handleBanUser = async () => {
    if (!banUserTarget) return;
    setIsBanning(true);
    try {
      await forumService.banUserForum(String(banUserTarget.id), {
        chatBannedUntil: new Date(banUntil).toISOString(),
        chatBanReason: banReason,
      });
      toast.success(`Đã cấm user ${banUserTarget.name}`);
      setIsBanModalOpen(false);
      setBanUserTarget(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Cấm user thất bại');
    } finally {
      setIsBanning(false);
    }
  };

  const handleUnbanUser = async (u: BackendAdminUser) => {
    try {
      await forumService.banUserForum(String(u.id), {
        chatBannedUntil: null,
      });
      toast.success(`Đã gỡ cấm user ${u.name}`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Gỡ cấm thất bại');
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              {icon && <div className="text-amber-500">{icon}</div>}
              <h1 className="text-4xl font-black text-gray-900">{pageTitle}</h1>
            </div>
            <p className="text-gray-500 font-medium mt-1">{pageSubtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-5 py-3 rounded-2xl font-bold hover:border-amber-500 hover:text-amber-600 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
              EXPORT CSV
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer"
            >
              <Plus size={18} />
              TẠO USER
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Tổng users</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-wider">Học viên</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{stats.students}</p>
          </div>
          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">Giảng viên</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{stats.teachers}</p>
          </div>
          <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100">
            <p className="text-[11px] font-black text-purple-600 uppercase tracking-wider">Quản trị</p>
            <p className="text-2xl font-black text-purple-700 mt-1">{stats.admins}</p>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 mb-6 space-y-4">
          {/* Role Filter Buttons - ẩn khi hideRoleFilter=true */}
          {!hideRoleFilter && (
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Tất cả', color: 'bg-gray-900 text-white' },
                { key: 'student', label: 'Học viên', color: 'bg-blue-500 text-white' },
                { key: 'teacher', label: 'Giảng viên', color: 'bg-emerald-500 text-white' },
                { key: 'admin', label: 'Quản trị', color: 'bg-purple-500 text-white' },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setRoleFilter(btn.key as any)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    roleFilter === btn.key
                      ? btn.color
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          {/* Search Input */}
          <div className={`flex items-center gap-3 ${!hideRoleFilter ? 'pt-4 border-t border-gray-50' : ''}`}>
            <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
              <Search size={18} />
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, email, role..."
              className="w-full outline-none font-bold text-gray-700"
            />
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Danh sách user</h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{filtered.length} users</span>
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
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Verified</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedUsers.map((u) => (
                    <tr 
                      key={String(u.id)} 
                      className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-amber-50/60' : 'hover:bg-gray-50/50'}`}
                      onClick={() => onRowClick && onRowClick(u)}
                    >
                      <td className="px-6 py-5">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{u.name}</div>
                          <div className="text-[11px] font-bold text-gray-400">{u.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {/* Role Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                            u.role === 'student'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : u.role === 'teacher'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-purple-100 text-purple-700 border border-purple-200'
                          }`}>
                            {u.role === 'student' ? '👤 Học viên' : u.role === 'teacher' ? '👨‍🏫 Giảng viên' : '🔒 Quản trị'}
                          </span>

                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${u.isEmailVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>
                          {u.isEmailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {u.chatBannedUntil && new Date(u.chatBannedUntil) > new Date() ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest bg-red-50 text-red-600 w-fit">Banned</span>
                            <span className="text-[9px] font-bold text-red-400 mt-1">Đến: {new Date(u.chatBannedUntil).toLocaleDateString('vi-VN')}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest bg-emerald-50 text-emerald-600">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {showViewButton && onRowClick && (
                            <button
                              onClick={() => onRowClick(u)}
                              className="cursor-pointer p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Xem chi tiết"
                            >
                              <Eye size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => onResetPassword(u)}
                            className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Reset password"
                          >
                            <UserRoundKey size={18} />
                          </button>
                          {u.chatBannedUntil && new Date(u.chatBannedUntil) > new Date() ? (
                            <button
                              onClick={() => handleUnbanUser(u)}
                              className="cursor-pointer p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Gỡ cấm"
                            >
                              <CheckCircle size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => onBanClick(u)}
                              className="cursor-pointer p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                              title="Cấm user"
                            >
                              <ShieldOff size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(u)}
                            className="cursor-pointer p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Xóa user"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold">
                        Không tìm thấy user nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="text-sm text-gray-500">
                Hiển thị <span className="font-semibold">{Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}</span> - <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> trong <span className="font-semibold">{filtered.length}</span> user
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} /> Trước
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 text-sm font-medium rounded-xl transition-all ${
                          currentPage === pageNum
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-amber-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Sau <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden scale-in-center transition-all duration-300">
              <div className="p-6 border-b border-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Tạo user mới</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Username</label>
                    <input
                      value={createUsername}
                      onChange={(e) => setCreateUsername(e.target.value)}
                      className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Role</label>
                    <select
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value as any)}
                      className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 font-bold uppercase tracking-widest outline-none"
                    >
                      <option value="student">STUDENT</option>
                      <option value="teacher">TEACHER</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email</label>
                  <input
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className='text-gray-400' size={18} /> : <Eye className='text-gray-400' size={18} />}
                    </button>
                  </div>

                </div>
              </div>

              <div className="p-6 border-t border-gray-50 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="cursor-pointer px-5 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={onCreate}
                  className="cursor-pointer px-5 py-3 rounded-2xl font-bold bg-gray-900 text-white hover:bg-amber-600"
                >
                  Tạo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {isResetModalOpen && resetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden scale-in-center transition-all duration-300">
              <div className="p-8 pb-4 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserRoundKey size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-600 leading-tight">Reset Mật Khẩu</h3>
                <p className="text-gray-500 font-medium text-sm mt-2">Đang thiết lập lại truy cập cho <br /><span className="text-blue-600 font-bold">{resetUser.email}</span></p>
              </div>

              <div className="p-8 pt-4 space-y-4">
                {!isConfirmOpen ? (
                  <>
                    <div>
                      <label className="text-sm font-bold text-gray-400 ml-2 mb-2 block">Mật khẩu mới</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="***"
                          className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none font-bold text-gray-700 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (newPassword.length < 8) {
                          toast.error('Mật khẩu quá ngắn');
                          return;
                        }
                        setIsConfirmOpen(true);
                      }}
                      className="cursor-pointer w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg active:scale-95"
                    >
                      Tiếp tục
                    </button>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className=" p-4 rounded-2xl">
                      <p className="text-red-600 text-sm text-center font-bold leading-relaxed">
                        Bạn có chắc chắn muốn thay đổi mật khẩu cho người dùng này? Thao tác này không thể hoàn tác.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        disabled={isResetting}
                        onClick={handleResetPassword}
                        className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-md hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                      >
                        {isResetting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Đang xử lý...
                          </>
                        ) : 'Xác nhận thay đổi'}
                      </button>

                      <button
                        disabled={isResetting}
                        onClick={() => setIsConfirmOpen(false)}
                        className="w-full bg-white text-gray-500 py-3 rounded-2xl font-bold text-md hover:bg-gray-50 transition-all"
                      >
                        Quay lại
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (!isResetting) {
                    setIsResetModalOpen(false);
                    setResetUser(null);
                  }
                }}
                className="absolute cursor-pointer top-6 right-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Delete User Confirmation Modal */}
        {isDeleteModalOpen && deleteUserTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden scale-in-center transition-all duration-300 relative">
              <div className="p-8 text-center mt-10">

                <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-2 uppercase ">
                  Xác nhận xóa
                </h3>

                <p className="text-gray-500 font-medium text-sm px-4">
                  Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <br />
                  <span className="text-amber-600 font-bold break-all">{deleteUserTarget.email}</span>?
                </p>

                <div className="mt-8 p-4 rounded-2xl flex items-start gap-3 text-left">
                  <p className="text-[11px] font-bold text-red-700 leading-relaxed tracking-tight">
                    * Cảnh báo: Hành động này không thể hoàn tác. Mọi dữ liệu liên quan đến người dùng này sẽ bị gỡ bỏ khỏi hệ thống.
                  </p>
                </div>
              </div>

              <div className="p-8 pt-0 flex flex-col gap-3">
                <button
                  disabled={isDeleting}
                  onClick={handleDeleteUser}
                  className="cursor-pointer w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-md hover:bg-red-600 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Đang thực hiện...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Xác nhận xóa ngay
                    </>
                  )}
                </button>

                <button
                  disabled={isDeleting}
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteUserTarget(null);
                  }}
                  className="cursor-pointer w-full bg-white text-gray-500 py-4 rounded-2xl font-bold text-md border border-gray-100 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  Hủy thao tác
                </button>
              </div>

              <button
                onClick={() => {
                  if (!isDeleting) {
                    setIsDeleteModalOpen(false);
                    setDeleteUserTarget(null);
                  }
                }}
                className="absolute cursor-pointer top-6 right-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Ban User Modal */}
        {isBanModalOpen && banUserTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden scale-in-center transition-all duration-300 relative">
              <div className="bg-gray-900 p-6 flex items-center gap-4 relative text-white">
                <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldOff size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black">Cấm người dùng</h3>
                  <p className="text-xs font-bold text-white/60">Đình chỉ quyền tham gia diễn đàn</p>
                </div>
                <button
                  onClick={() => setIsBanModalOpen(false)}
                  className="absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8">
                <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Người dùng: <span className="text-slate-900">{banUserTarget.name}</span></p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Lý do cấm</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none h-24"
                      placeholder="Nhập lý do vi phạm..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Cấm đến ngày</label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      value={banUntil}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBanUntil(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setIsBanModalOpen(false)}
                    className="px-6 py-3 font-bold text-slate-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    disabled={isBanning || !banReason.trim()}
                    onClick={handleBanUser}
                    className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isBanning ? 'Đang thực hiện...' : 'Xác nhận cấm'}
                    <ShieldOff size={16} />
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

export default AdminUsers;
