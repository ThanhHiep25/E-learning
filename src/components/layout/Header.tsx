import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Search, Sun, ShoppingCart, Menu, ChevronDown,
    Home, Target, Layers, BookOpen, Info, Library
} from 'lucide-react';
import AuthModal from '../auth/AuthModal';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

    const openAuth = (mode: 'LOGIN' | 'REGISTER') => {
        setAuthMode(mode);
        setIsAuthOpen(true);
    };

    const navItems = [
        { label: 'Trang chủ', path: '/', icon: <Home size={16} /> },
        { label: 'Bứt phá vào 10', path: '/vào-10', icon: <Target size={16} /> },
        { label: 'Combo bức phá', path: '#', icon: <Layers size={16} />, hasSubmenu: true },
        { label: 'Luyện thi TOEIC', path: '#', icon: <BookOpen size={16} />, hasSubmenu: true },
        { label: 'Sách', path: '/books', icon: <Library size={16} /> },
        { label: 'Giới thiệu', path: '/about', icon: <Info size={16} /> },
    ];

    return (
        <>
            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                initialMode={authMode}
            />
            <header className="h-16 md:h-20 bg-white border-b border-gray-100 sticky top-0 z-40 transition-all">
                <div className="max-w-[1440px] h-full mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
                    {/* Logo & Brand */}
                    <div className='flex items-center gap-6 min-w-fit'>
                        <button
                            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            onClick={onMenuClick}
                        >
                            <Menu size={24} />
                        </button>

                        <NavLink to="/" className="flex items-center gap-3">
                            <img src='/school.png' alt="Logo" className="w-8 md:w-10 h-auto object-contain" />
                            <span className='text-sm md:text-xl font-bold text-gray-800 uppercase font-mono hidden xs:block'>E-Learning</span>
                        </NavLink>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden xl:flex items-center gap-1 xl:gap-2">
                        {navItems.map((item) => (
                            <div
                                key={item.label}
                                className="relative group"
                            >
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive && item.path !== '#'
                                            ? 'text-red-600 bg-red-50'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-red-500'
                                        }`
                                    }
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                    {item.hasSubmenu && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />}
                                </NavLink>

                                {item.hasSubmenu && (
                                    <div className="absolute top-full left-0 pt-2 w-56 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                                        <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden p-1.5">
                                            <NavLink to="/toeic-2" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded-lg group transition-all">
                                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                                    <BookOpen size={16} />
                                                </div>
                                                <span className="font-medium">Luyện thi TOEIC 2 kỹ năng</span>
                                            </NavLink>
                                            <NavLink to="/toeic-4" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded-lg group transition-all">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                    <BookOpen size={16} />
                                                </div>
                                                <span className="font-medium">Luyện thi TOEIC 4 kỹ năng</span>
                                            </NavLink>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Search - Hidden on mobile, flexible on desktop */}
                    <div className="flex-1 max-w-sm hidden md:block">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm khóa học, giáo viên..."
                                className="w-full bg-gray-50 border border-gray-100 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-red-100 focus:bg-white focus:border-red-200 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 md:gap-4 ml-auto">
                        <div className="hidden sm:flex items-center gap-2">
                            <button className="p-2 text-gray-400 hover:bg-orange-50 hover:text-orange-500 rounded-full transition-colors">
                                <Sun size={20} />
                            </button>
                            <div className="relative p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-full cursor-pointer transition-colors">
                                <ShoppingCart size={20} />
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">0</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 border-l border-gray-100 pl-2 md:pl-4">
                            <button
                                onClick={() => openAuth('LOGIN')}
                                className="text-sm font-bold text-gray-600 px-2 md:px-4 py-2 hover:text-red-600 transition-colors hidden xs:block"
                            >
                                Đăng nhập
                            </button>
                            <button
                                onClick={() => openAuth('REGISTER')}
                                className="bg-[#A32323] hover:bg-[#8B1E1E] text-white text-sm font-bold px-4 md:px-6 py-2 md:py-2.5 rounded-full transition-all shadow-sm active:scale-95"
                            >
                                Đăng ký
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;

