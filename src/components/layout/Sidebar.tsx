import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home,
    Target,
    Layers,
    BookOpen,
    Library,
    Info,
    Facebook,
    Youtube,
    Globe,
    X,
    ChevronDown
} from 'lucide-react';

const menuItems = [
    { icon: <Home size={20} />, label: 'Trang chủ', path: '/' },
    { icon: <Target size={20} />, label: 'Bứt phá vào 10', path: '/vào-10' },
    { icon: <Layers size={20} />, label: 'Combo bức phá', path: '/combo-2026' },
    {
        icon: <BookOpen size={20} />,
        label: 'Luyện thi TOEIC',
        path: '#',
        hasSubmenu: true,
        submenuItems: [
            { label: 'TOEIC 3 kỹ năng', path: '/toeic-2' },
            { label: 'TOEIC 4 kỹ năng', path: '/toeic-4' },
        ]
    },
    { icon: <Library size={20} />, label: 'Sách', path: '/books' },
    { icon: <Info size={20} />, label: 'Giới thiệu', path: '/about' },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

    return (
        <aside className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-100 flex flex-col z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:-translate-x-full`}>
            {/* Logo Section */}
            <div className="p-6 flex items-center justify-between border-b border-gray-50">
                <div className='flex items-center gap-3'>
                    <img src='/school.png' alt="Logo" className="w-10 h-auto object-contain" />
                    <span className='text-xl font-bold text-gray-800 uppercase font-mono'>E-Learning</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
                <ul className="space-y-1">
                    {menuItems.map((item, index) => (
                        <li key={index}>
                            {item.hasSubmenu ? (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setOpenSubmenu(openSubmenu === item.label ? null : item.label)}
                                        className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-400 group-hover:text-red-500">{item.icon}</span>
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </div>
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${openSubmenu === item.label ? 'rotate-180' : ''}`} />
                                    </button>

                                    {openSubmenu === item.label && (
                                        <div className="ml-10 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                            {item.submenuItems?.map((sub) => (
                                                <NavLink
                                                    key={sub.path}
                                                    to={sub.path}
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `block px-3 py-2.5 rounded-lg text-sm transition-all ${isActive
                                                            ? 'text-red-600 font-bold bg-red-50/50'
                                                            : 'text-gray-500 hover:text-red-600 hover:bg-gray-50'
                                                        }`
                                                    }
                                                >
                                                    {sub.label}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <NavLink
                                    to={item.path}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-red-50 text-red-600 font-bold'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-red-500'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className={isActive ? 'text-red-600' : 'text-gray-400 transition-colors'}>
                                                {item.icon}
                                            </span>
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </>
                                    )}
                                </NavLink>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Profile Section */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                <p className='text-center text-xs text-gray-400 mb-4'>&copy; 2026 E-Learning. All rights reserved.</p>
                {/* Social Icons */}
                <div className="flex justify-center gap-4">
                    <Facebook size={18} className="text-blue-600 cursor-pointer hover:scale-110 transition-transform" />
                    <Youtube size={18} className="text-red-600 cursor-pointer hover:scale-110 transition-transform" />
                    <Globe size={18} className="text-blue-400 cursor-pointer hover:scale-110 transition-transform" />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
