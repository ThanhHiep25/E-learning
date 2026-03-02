import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useEnrollmentStore } from '../../store/useEnrollmentStore';
import {
    Search, Menu, ChevronDown, LogOut, User as UserIcon, BookOpen, Layout, GraduationCap
} from 'lucide-react';
import AuthModal from '../auth/AuthModal';
import { navigationConfig } from '../../config/navigation';
import SearchSpotlight from './SearchSpotlight';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { enrolledCourses } = useEnrollmentStore();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

    const openAuth = (mode: 'LOGIN' | 'REGISTER') => {
        setAuthMode(mode);
        setIsAuthOpen(true);
    };

    // Keyboard shortcut to open search (Cmd+K or Ctrl+K)
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                initialMode={authMode}
            />

            <SearchSpotlight
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />

            <div className="sticky top-0 z-40 w-full shadow-sm">

                <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 w-full transition-all duration-300">
                    <div className="max-w-[1440px] h-full mx-auto px-6 md:px-10 flex items-center justify-between gap-8">
                        {/* Logo & Brand */}
                        <div className='flex items-center gap-1 min-w-fit'>
                            <button
                                className="lg:hidden p-2.5 -ml-2 text-gray-700 hover:bg-amber-50 hover:text-amber-600 rounded-2xl transition-all duration-300 active:scale-90"
                                onClick={onMenuClick}
                            >
                                <Menu size={26} />
                            </button>

                            <NavLink to="/" className="md:flex items-center gap-3 group px-1 hidden">

                                <img src='/idea-bulb.png' alt="Logo" className="w-10 h-10 object-contain" />

                                <div className="hidden md:block">
                                    <h1 className="text-xl font-black text-gray-900 leading-none tracking-tight">
                                        E<span className='text-amber-600'>LEARN</span>
                                    </h1>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="h-[2px] w-4 bg-amber-500 rounded-full"></div>
                                        <p className='text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none'>Institute</p>
                                    </div>
                                </div>
                            </NavLink>
                        </div>

                        {/* Desktop Navigation - Ultra Clean */}
                        <nav className="hidden lg:flex items-center gap-2">
                            {navigationConfig.map((item) => (
                                <div key={item.label} className="relative group/nav">
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `relative flex items-center gap-2 px-2 py-2.5 rounded-2xl text-[14px]  font-bold transition-all duration-500 ${isActive && item.path !== '#'
                                                ? 'text-amber-600'
                                                : 'text-gray-500 hover:text-gray-900'
                                            }`
                                        }
                                    >

                                        <span className="relative z-10">{item.label}</span>
                                        {item.hasSubmenu && <ChevronDown size={14} className="group-hover/nav:rotate-180 transition-transform duration-300 relative z-10" />}

                                        {/* Hover/Active Indicator Block */}
                                        <div className="absolute inset-0 bg-amber-50 rounded-2xl opacity-0 scale-90 group-hover/nav:opacity-100 group-hover/nav:scale-100 transition-all duration-300"></div>
                                    </NavLink>

                                    {item.hasSubmenu && item.submenuItems && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-[740px] opacity-0 translate-y-6 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:pointer-events-auto transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) z-50">
                                            <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-100 p-4 grid grid-cols-2 gap-3">
                                                <div className="col-span-2 px-4 py-2 border-b border-gray-50 mb-2">
                                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Explore Our Programs</p>
                                                </div>
                                                {item.submenuItems.map((subItem) => {
                                                    const iconGradients: Record<string, string> = {
                                                        red: 'bg-linear-to-br from-red-500 to-rose-600 shadow-red-200',
                                                        blue: 'bg-linear-to-br from-blue-500 to-indigo-600 shadow-blue-200',
                                                        amber: 'bg-linear-to-br from-amber-500 to-orange-600 shadow-amber-200',
                                                        purple: 'bg-linear-to-br from-purple-500 to-fuchsia-600 shadow-purple-200',
                                                        emerald: 'bg-linear-to-br from-emerald-500 to-teal-600 shadow-emerald-200',
                                                    };

                                                    const SubIcon = subItem.icon || item.icon;

                                                    return (
                                                        <NavLink
                                                            key={subItem.path}
                                                            to={subItem.path}
                                                            className="flex items-center gap-5 px-6 py-5 rounded-[24px] hover:bg-gray-50 transition-all duration-300 group/sub border border-transparent hover:border-gray-100 hover:shadow-sm"
                                                        >
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover/sub:scale-110 group-hover/sub:-rotate-6 transition-all duration-500 shadow-lg ${iconGradients[subItem.color || 'amber']} text-white shrink-0`}>
                                                                <SubIcon size={26} strokeWidth={2.5} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="font-black text-gray-900 text-sm group-hover/sub:text-amber-600 transition-colors uppercase tracking-tight">{subItem.label}</p>
                                                                <p className="text-[11px] text-gray-400 font-bold leading-relaxed max-w-[200px]">Nâng tầm kỹ năng cùng chuyên gia trong ngành</p>
                                                            </div>
                                                        </NavLink>
                                                    );
                                                })}
                                                <div className="col-span-2 mt-2 p-4 bg-amber-50/50 rounded-[20px] flex items-center justify-between">
                                                    <p className="text-xs font-bold text-gray-600 italic">Đã có hơn 50.000 sinh viên tin tưởng đồng hành</p>
                                                    <button className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline">Tất cả chương trình →</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>

                        {/* Right Quick Actions */}
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-1.5 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="p-2.5 text-gray-400 hover:text-amber-600 hover:bg-white hover:shadow-sm rounded-xl transition-all duration-300 group cursor-pointer"
                                    title="Search (Ctrl+K)"
                                >
                                    <Search size={20} />
                                </button>

                            </div>

                            <div
                                onClick={() => navigate('/registrations')}
                                className="relative p-3 bg-white text-gray-700 hover:text-amber-600 hover:bg-amber-50 border border-gray-100 rounded-2xl cursor-pointer transition-all duration-300 shadow-sm group active:scale-95"
                            >
                                <GraduationCap size={24} className="group-hover:scale-110 transition-transform" />
                                {enrolledCourses.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-linear-to-br from-amber-500 to-orange-600 text-white text-[11px] flex items-center justify-center rounded-full border-2 border-white shadow-md font-black">
                                        {enrolledCourses.length}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pl-2 border-l border-gray-100">
                                {user ? (
                                    <div className="relative group/user">
                                        <button className="flex items-center gap-3 p-1 rounded-2xl hover:bg-gray-50 transition-all duration-300 cursor-pointer border border-transparent hover:border-gray-100 px-3 py-1.5">
                                            <div className="relative">
                                                <img src={user.avatar} alt={user.fullName} className="w-10 h-10 rounded-full shadow-sm object-cover" />
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                                            </div>
                                            <div className="hidden flex-col items-start xl:flex">
                                                <p className="text-xs font-black text-gray-900 leading-none">{user.fullName}</p>
                                                <p className="text-[9px] text-amber-600 font-extrabold mt-1 opacity-70">{user.role}</p>
                                            </div>
                                            <ChevronDown size={14} className="text-gray-400 group-hover/user:rotate-180 transition-transform duration-300" />
                                        </button>

                                        {/* Dropdown refined */}
                                        <div className="absolute top-full pt-2 right-0 w-64 opacity-0 translate-y-4 pointer-events-none group-hover/user:opacity-100 group-hover/user:translate-y-0 group-hover/user:pointer-events-auto transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) z-50">
                                            <div className="bg-white rounded-[28px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden">
                                                <div className="p-6 bg-linear-to-br from-gray-900 to-gray-800 text-white">
                                                    <p className="text-[10px] font-bold text-amber-500 mb-1 opacity-50">Tài khoản đang hoạt động</p>
                                                    <p className="text-xs font-bold opacity-90 ">{user.email}</p>
                                                </div>
                                                <div className="p-3 space-y-1">
                                                    <button
                                                        onClick={() => navigate('/profile')}
                                                        className="w-full cursor-pointer group/item flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-all duration-300">
                                                        <div className="p-2 bg-gray-50 group-hover/item:bg-white rounded-lg transition-colors">
                                                            <UserIcon size={18} />
                                                        </div>
                                                        <span className="font-bold">Thông tin cá nhân</span>
                                                    </button>
                                                    {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                                                        <button
                                                            onClick={() => navigate('/teacher/dashboard')}
                                                            className="w-full cursor-pointer group/item flex items-center gap-3 px-4 py-3 text-sm text-amber-600 bg-amber-50/50 hover:bg-amber-50 rounded-xl transition-all duration-300"
                                                        >
                                                            <div className="p-2 bg-white rounded-lg">
                                                                <Layout size={18} />
                                                            </div>
                                                            <span className="font-black ">Trang quản lý</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => navigate('/my-learning')}
                                                        className="w-full cursor-pointer group/item flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-all duration-300">
                                                        <div className="p-2 bg-gray-50 group-hover/item:bg-white rounded-lg transition-colors">
                                                            <BookOpen size={18} />
                                                        </div>
                                                        <span className="font-bold">Khóa học của tôi</span>
                                                    </button>
                                                    <div className="h-px bg-gray-50 my-2 mx-4"></div>
                                                    <button
                                                        onClick={logout}
                                                        className="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300"
                                                    >
                                                        <div className="p-2 bg-red-50 group-hover:bg-white rounded-lg transition-colors">
                                                            <LogOut size={18} />
                                                        </div>
                                                        <span className="font-bold">Đăng xuất</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => openAuth('LOGIN')}
                                            className=" text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-amber-600 transition-colors px-2 py-2 cursor-pointer"
                                        >
                                            Đăng nhập
                                        </button>
                                        <button
                                            onClick={() => openAuth('REGISTER')}
                                            className="bg-gray-900 hover:bg-amber-600 text-white text-[10px] font-black px-3 py-3.5 rounded-2xl transition-all duration-300 shadow-xl shadow-gray-200 active:scale-95 uppercase tracking-widest cursor-pointer"
                                        >
                                            Đăng ký
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>
            </div>
        </>
    );
};

export default Header;
