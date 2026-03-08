import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, Plus, Search, Trash2, UserRoundKey, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, type BackendAdminUser } from '../../services/admin.service';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<BackendAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

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

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.listUsers();
      setUsers(data);
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi tải danh sách user');
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
    if (!s) return users;
    return users.filter((u) => {
      const hay = `${u.name} ${u.username || ''} ${u.email} ${u.role}`.toLowerCase();
      return hay.includes(s);
    });
  }, [users, q]);

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

  const onChangeRole = async (u: BackendAdminUser, role: 'student' | 'teacher') => {
    try {
      await adminService.updateUser(String(u.id), { role });
      toast.success('Cập nhật role thành công');
      setUsers((prev) => prev.map((x) => (String(x.id) === String(u.id) ? { ...x, role } : x)));
    } catch (e: any) {
      toast.error(e?.message || 'Cập nhật role thất bại');
    }
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

  const onDelete = (u: BackendAdminUser) => {
    setDeleteUserTarget(u);
    setIsDeleteModalOpen(true);
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

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900">Quản lý người dùng</h1>
            <p className="text-gray-500 font-medium mt-1">Tạo / phân quyền / xóa user</p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            TẠO USER
          </button>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
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
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((u) => (
                    <tr key={String(u.id)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{u.name}</div>
                          <div className="text-[11px] font-bold text-gray-400">{u.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={u.role}
                          disabled={u.role === 'admin'}
                          onChange={(e) => onChangeRole(u, e.target.value as any)}
                          className="text-xs font-bold uppercase tracking-widest bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-gray-700"
                        >
                          <option value="student">STUDENT</option>
                          <option value="teacher">TEACHER</option>
                          <option value="admin">ADMIN</option>
                        </select>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${u.isEmailVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>
                          {u.isEmailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onResetPassword(u)}
                            className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Reset password"
                          >
                            <UserRoundKey size={18} />
                          </button>
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

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-gray-500 font-bold">Không có dữ liệu người dùng "{q}"</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-xl bg-white rounded-[28px] border border-gray-100 shadow-2xl overflow-hidden">
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
      </div>
    </div>
  );
};

export default AdminUsers;
