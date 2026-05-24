import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BarChart3,
    BookOpen,
    Users,
    FileText,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    MessageSquare,
    Trophy,
    User,
    ChevronDown,
    Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

const TeacherLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/');
        }
    }, [user, navigate]);

    const menuItems = [
        { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
        { label: 'Thống kê chi tiết', path: '/teacher/statistics', icon: BarChart3 },
        { label: 'Quản lý Khóa học', path: '/teacher/courses', icon: BookOpen },
        { label: 'Quản lý Học viên', path: '/teacher/students', icon: Users },
        { label: 'Đề thi & Kiểm tra', path: '/teacher/quizzes', icon: FileText },
        { label: 'Kiểm tra cuối trình độ', path: '/teacher/final-quizzes', icon: Trophy },
        { label: 'Quản lý Chat', path: '/teacher/chats', icon: MessageSquare },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen bg-[#FDF8EE] overflow-hidden">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-80 bg-slate-900 flex flex-col p-8 shrink-0 
                shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                lg:relative lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Close button for mobile */}
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white lg:hidden transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="mb-12">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-4 block">Teacher Portal</span>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter leading-none">
                        Hệ Thống Quản Lý<span className="text-amber-500">.</span>
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

                <div className="mt-auto pt-10 border-t border-white/5">
                    <NavLink
                        to="/"
                        className="text-[10px] border border-gray-600 p-2 rounded-md font-black text-slate-500 uppercase tracking-widest hover:text-white text-center flex items-center justify-center gap-2 transition-colors"
                    >
                        <ChevronLeft size={12} /> Quay lại trang chủ
                    </NavLink>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 h-full overflow-y-auto relative z-10 scroll-smooth bg-gray-50/50">
                {/* Top bar (for both desktop and mobile) */}
                <div className="sticky top-0 right-0 left-0 h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-8 lg:px-12 z-40">
                    <div className="flex items-center gap-3 lg:hidden">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs italic">
                            L<span className="text-amber-500">M</span>
                        </div>
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Teacher Portal</h2>
                    </div>
                    
                    <div className="hidden lg:block">
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{menuItems.find(i => window.location.pathname.startsWith(i.path))?.label || 'Tổng quan'}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationBell />

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all"
                            >
                                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white">
                                    <User size={16} />
                                </div>
                                <span className="hidden md:block text-sm font-medium text-gray-700">{user?.fullName || 'Giảng viên'}</span>
                                <ChevronDown size={16} className={`text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 py-3 z-50">
                                    {/* User Info Header */}
                                    <div className="px-4 pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white">
                                                <User size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{user?.fullName || 'Giảng viên'}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                                <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                                    <Shield size={10} className="mr-1" />
                                                    GIẢNG VIÊN
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="px-2 py-2 space-y-1">
                                        <button
                                            onClick={() => {
                                                navigate('/profile');
                                                setIsProfileOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg flex items-center gap-3 transition-colors"
                                        >
                                            <User size={16} className="text-gray-400" />
                                            Trang cá nhân
                                        </button>
                                    </div>

                                    {/* Logout */}
                                    <div className="px-2 pt-2 border-t border-gray-100 mt-1">
                                        <button
                                            onClick={() => {
                                                logout();
                                                navigate('/');
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 transition-colors"
                                        >
                                            <LogOut size={16} />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={toggleSidebar}
                            className="p-2.5 text-gray-900 hover:bg-gray-100 rounded-2xl transition-all active:scale-95 lg:hidden"
                        >
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                <div className="p-4 md:p-8 lg:p-12">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default TeacherLayout;
