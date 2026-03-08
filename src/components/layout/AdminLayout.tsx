import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, LogOut, Menu, X, ChevronLeft, CreditCard, Star, Tags } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Người dùng', path: '/admin/users', icon: Users },
    { label: 'Khóa học', path: '/admin/courses', icon: BookOpen },
    { label: 'Thanh toán', path: '/admin/payments', icon: CreditCard },
    { label: 'Đánh giá', path: '/admin/reviews', icon: Star },
    { label: 'Danh mục', path: '/admin/categories', icon: Tags },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-[#FDF8EE] overflow-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
                fixed inset-y-0 left-0 z-50 w-80 bg-slate-900 flex flex-col p-8 shrink-0 
                shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                lg:relative lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
      >
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white lg:hidden transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mb-12">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-4 block">Admin Portal</span>
          <h2 className="text-3xl font-black text-white italic tracking-tighter leading-none">
            LMS Control<span className="text-amber-500">.</span>
          </h2>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `
                                flex items-center gap-4 px-6 py-4 rounded-2xl text-md font-bold transition-all
                                ${isActive
                  ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20 translate-x-2'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
                            `}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-6 pt-10 border-t border-white/5">
          <div className="flex items-center gap-4 px-4">
            <div className="flex-1 min-w-0">
              <h4 className="text-md font-bold text-white">{user?.fullName || 'Admin'}</h4>
              <p className="text-[12px] font-bold text-slate-500 uppercase">Quản trị hệ thống</p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full cursor-pointer flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>

          <NavLink
            to="/"
            className="text-[10px] border border-gray-600 p-2 rounded-md font-black text-slate-500 uppercase tracking-widest hover:text-white text-center flex items-center justify-center gap-2 transition-colors"
          >
            <ChevronLeft size={12} /> Quay lại trang chủ
          </NavLink>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto relative z-10 scroll-smooth bg-gray-50/50">
        <div className="sticky top-0 right-0 left-0 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-6 lg:hidden z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs italic">
              L<span className="text-amber-500">M</span>
            </div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest italic">Admin</h2>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-900 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="p-4 md:p-8 lg:p-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
