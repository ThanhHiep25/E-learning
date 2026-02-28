import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home,
    Target,
    Layers,
    BookOpen,
    Calendar,
    Library,
    Trophy,
    BarChart2,
    Info,
    Facebook,
    Youtube,
    Globe,
    X
} from 'lucide-react';
const menuItems = [
    { icon: <Home size={20} />, label: 'Trang chủ', path: '/' },
    { icon: <Target size={20} />, label: 'Bứt phá điểm thi vào 10', path: '/vào-10' },
    { icon: <Layers size={20} />, label: 'Combo luyện thi 2026', path: '/combo-2026' },
    { icon: <Layers size={20} />, label: 'Combo luyện thi 2027', path: '/combo-2027' },
    { icon: <Layers size={20} />, label: 'Combo luyện thi 2028', path: '/combo-2028' },
    { icon: <BookOpen size={20} />, label: 'Luyện thi TOEIC 2 kỹ năng', path: '/toeic-2' },
    { icon: <BookOpen size={20} />, label: 'Luyện thi TOEIC 4 kỹ năng', path: '/toeic-4' },
    { icon: <Library size={20} />, label: 'Tiếng Anh cơ bản', path: '/basic' },
    { icon: <Calendar size={20} />, label: 'Lịch học và live', path: '/schedule' },
    { icon: <Library size={20} />, label: 'Sách', path: '/books' },
    { icon: <Trophy size={20} />, label: 'Vinh danh', path: '/honors' },
    { icon: <BarChart2 size={20} />, label: 'Bảng xếp hạng tháng', path: '/ranking' },
    { icon: <Info size={20} />, label: 'Giới thiệu', path: '/about' },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    return (
        <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col z-50 transform md:translate-x-0 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Logo Section */}
            <div className="p-6 flex items-center justify-between">
                <div className='flex items-center gap-3'>
                    <img src='/school.png' alt="Logo" className="w-10 h-auto object-contain" />
                    <span className='text-xl font-bold text-gray-800 uppercase font-mono'>E-Learning</span>
                </div>
                <button
                    onClick={onClose}
                    className="md:hidden p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                <ul className="space-y-1">
                    {menuItems.map((item, index) => (
                        <li key={index}>
                            <NavLink
                                to={item.path}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                        ? 'bg-red-50 text-red-600 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={isActive ? 'text-red-600' : 'text-gray-400'}>
                                            {item.icon}
                                        </span>
                                        <span className="text-sm">{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Profile Section */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">

                <p className='text-center text-sm text-gray-400'>&copy; 2026 E-Learning. All rights reserved.</p>
                {/* Social Icons */}
                <div className="flex justify-center gap-3 py-2">
                    <Facebook size={18} className="text-blue-600 cursor-pointer hover:scale-110 transition-transform" />
                    <Youtube size={18} className="text-red-600 cursor-pointer hover:scale-110 transition-transform" />
                    <Globe size={18} className="text-blue-400 cursor-pointer hover:scale-110 transition-transform" />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
