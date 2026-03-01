import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import {
    Search, Sun, ShoppingCart, Menu, ChevronDown, Sparkles, X, Gift, LogOut, User as UserIcon, BookOpen, Settings
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
    const { items } = useCartStore();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showPromo, setShowPromo] = useState(true);
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
                {showPromo && (
                    <div className="w-full hidden md:block bg-linear-to-r from-[#A32323] via-[#D97706] to-[#A32323] py-2 md:py-3 overflow-hidden group relative">
                        {/* Animated background element */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-center gap-2 md:gap-6 relative z-10">
                            <div className="hidden sm:flex items-center gap-2 text-white/90 animate-pulse">
                                <Sparkles size={18} />
                            </div>

                            <p className='text-white text-center text-sm md:text-base font-medium flex items-center gap-2'>
                                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider hidden xs:inline-block">Limited Offer</span>
                                Chào mừng bạn mới! Nhận ngay <span className='font-bold text-amber-200 underline decoration-2 underline-offset-4'>Ưu đãi 20%</span> cho lần đăng ký đầu tiên
                            </p>

                            <button className="hidden md:flex items-center gap-1.5 bg-white text-[#A32323] px-4 py-1 rounded-full text-xs font-bold hover:bg-amber-100 transition-all shadow-lg active:scale-95 cursor-pointer">
                                <Gift size={14} />
                                Nhận mã ngay
                            </button>

                            <button
                                onClick={() => setShowPromo(false)}
                                className="absolute right-4 md:right-8 p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                <header className="h-16 md:h-20 bg-white/95 backdrop-blur-md border-b border-gray-100 w-full transition-all">
                    <div className="max-w-[1440px] h-full mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
                        {/* Logo & Brand */}
                        <div className='flex items-center gap-6 min-w-fit'>
                            <button
                                className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                onClick={onMenuClick}
                            >
                                <Menu size={24} />
                            </button>

                            <NavLink to="/" className="flex flex-col items-center justify-center gap-1 cursor-pointer">
                                <img src='/idea-bulb.png' alt="Logo" className="w-8 md:w-10 h-auto object-contain" />
                                <p className='text-sm md:text-sm font-bold text-gray-800 font-dancing-script-700 hidden md:block'>
                                    <span className='text-amber-600 bg-amber-100 p-1 px-2 rounded-full'>E</span>-Learning</p>
                            </NavLink>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden xl:flex items-center gap-1 xl:gap-2">
                            {navigationConfig.map((item) => (
                                <div
                                    key={item.label}
                                    className="relative group"
                                >
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive && item.path !== '#'
                                                ? 'text-amber-600 bg-amber-50'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-amber-500'
                                            }`
                                        }
                                    >
                                        <item.icon size={16} />
                                        <span>{item.label}</span>
                                        {item.hasSubmenu && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />}
                                    </NavLink>

                                    {item.hasSubmenu && item.submenuItems && (
                                        <div className="absolute top-full left-0 pt-2 w-[600px] opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                                            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden p-1.5 grid grid-cols-2 grid-rows-3 gap-1">
                                                {item.submenuItems.map((subItem) => {
                                                    const colors: Record<string, string> = {
                                                        red: 'bg-red-50 text-red-500 group-hover:bg-red-500',
                                                        blue: 'bg-blue-50 text-blue-500 group-hover:bg-blue-500',
                                                        amber: 'bg-amber-50 text-amber-500 group-hover:bg-amber-500',
                                                        purple: 'bg-purple-50 text-purple-500 group-hover:bg-purple-500',
                                                        emerald: 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500',
                                                    };
                                                    const hoverText: Record<string, string> = {
                                                        red: 'hover:text-red-600',
                                                        blue: 'hover:text-blue-600',
                                                        amber: 'hover:text-amber-600',
                                                        purple: 'hover:text-purple-600',
                                                        emerald: 'hover:text-emerald-600',
                                                    };

                                                    const SubIcon = subItem.icon || item.icon;

                                                    return (
                                                        <NavLink
                                                            key={subItem.path}
                                                            to={subItem.path}
                                                            className={`flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 ${hoverText[subItem.color || 'red']} rounded-lg group transition-all`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:text-white transition-colors ${colors[subItem.color || 'red']}`}>
                                                                <SubIcon size={16} />
                                                            </div>
                                                            <span className="font-medium">{subItem.label}</span>
                                                        </NavLink>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2 md:gap-4 ml-auto">
                            <div className="">
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="w-full flex items-center justify-between cursor-pointer gap-3 bg-gray-50 border border-gray-100 hover:border-amber-200 hover:bg-white text-gray-400 px-2.5 py-2.5 rounded-full transition-all group"
                                >
                                    <Search size={18} className="group-hover:text-amber-500 transition-colors" />
                                </button>
                            </div>

                            <div className="hidden sm:flex items-center gap-2 ">
                                <button className="p-2.5 cursor-pointer text-gray-400 hover:bg-orange-50 hover:text-orange-500 rounded-full transition-colors">
                                    <Sun size={20} />
                                </button>
                                <div
                                    onClick={() => navigate('/cart')}
                                    className="relative p-2.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-full cursor-pointer transition-colors"
                                >
                                    <ShoppingCart size={20} />
                                    {items.length > 0 && (
                                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                                            {items.length}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                                {user ? (
                                    <div className="relative group/user">
                                        <button className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-gray-50 transition-all cursor-pointer border border-transparent hover:border-gray-100">
                                            <img src={user.avatar} alt={user.fullName} className="w-8 h-8 rounded-full border border-amber-200" />
                                            <div className="hidden lg:block text-left">
                                                <p className="text-xs font-bold text-gray-800 leading-tight">{user.fullName}</p>
                                                <p className="text-[10px] text-amber-600 font-bold uppercase">{user.role}</p>
                                            </div>
                                            <ChevronDown size={14} className="text-gray-400 group-hover/user:rotate-180 transition-transform" />
                                        </button>

                                        {/* User Dropdown */}
                                        <div className="absolute top-full right-0 pt-2 w-56 opacity-0 translate-y-2 pointer-events-none group-hover/user:opacity-100 group-hover/user:translate-y-0 group-hover/user:pointer-events-auto transition-all duration-200 z-50">
                                            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                                                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                                    <p className="text-sm font-bold text-gray-800">{user.email}</p>
                                                </div>
                                                <div className="p-2">
                                                    <button className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-all">
                                                        <UserIcon size={18} />
                                                        <span>Hồ sơ cá nhân</span>
                                                    </button>
                                                    <button className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-all">
                                                        <BookOpen size={18} />
                                                        <span>Khóa học của tôi</span>
                                                    </button>
                                                    <button className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-all">
                                                        <Settings size={18} />
                                                        <span>Cài đặt</span>
                                                    </button>
                                                    <div className="h-px bg-gray-100 my-2 mx-2"></div>
                                                    <button
                                                        onClick={logout}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    >
                                                        <LogOut size={18} />
                                                        <span className="font-bold">Đăng xuất</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => openAuth('LOGIN')}
                                            className="text-sm cursor-pointer font-bold text-gray-600 px-2 md:px-4 py-2 hover:text-red-600 transition-colors "
                                        >
                                            Đăng nhập
                                        </button>
                                        <button
                                            onClick={() => openAuth('REGISTER')}
                                            className="bg-[#e88a34] cursor-pointer hover:bg-[#e8731e] text-white text-sm font-bold px-4 md:px-6 py-2 md:py-2.5 rounded-full transition-all shadow-sm active:scale-95"
                                        >
                                            Đăng ký
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </header>
            </div >
        </>
    );
};

export default Header;

