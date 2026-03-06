import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { X, ChevronDown, Facebook, Youtube, Globe, Layout } from 'lucide-react';
import { navigationConfig } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

    return (
        <aside className={`fixed inset-y-0 left-0 w-80 bg-white shadow-2xl flex flex-col z-60 transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} lg:hidden`}>
            {/* Ultra Premium Header */}
            <div className="relative p-8 bg-linear-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 p-8 bg-blue-500/5 rounded-full blur-2xl -ml-12 -mb-12"></div>

                <div className="relative z-10 flex items-center justify-between">
                    <div className='flex items-center gap-4 group'>

                        <img src='/idea-bulb.png' alt="Logo" className="w-10 h-10 object-contain" />

                        <div>
                            <p className='text-xl font-black leading-none tracking-tighter'>
                                E<span className='text-amber-500'>LEARN</span>
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <p className='text-[10px] font-black text-gray-400 leading-none'>Mobile Hub</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all active:scale-90"
                    >
                        <X size={22} />
                    </button>
                </div>
            </div>

            {/* Premium Navigation Area */}
            <nav className="flex-1 overflow-y-auto px-6 py-10 custom-scrollbar bg-white">

                <ul className="space-y-3">
                    {navigationConfig.map((item, index) => (
                        <li key={index}>
                            {item.hasSubmenu ? (
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setOpenSubmenu(openSubmenu === item.label ? null : item.label)}
                                        className={`w-full flex items-center justify-between gap-4 px-5 py-4 rounded-[22px] transition-all duration-500 group ${openSubmenu === item.label
                                            ? 'bg-amber-50 text-amber-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-amber-500'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-xl transition-all duration-500 ${openSubmenu === item.label
                                                ? 'bg-white shadow-sm text-amber-500 scale-110'
                                                : 'text-gray-400 group-hover:text-amber-500'
                                                }`}>
                                                <item.icon size={22} strokeWidth={2.5} />
                                            </div>
                                            <span className="">{item.label}</span>
                                        </div>
                                        <ChevronDown size={18} className={`transition-transform duration-500 ${openSubmenu === item.label ? 'rotate-180 text-amber-500' : 'text-gray-300'}`} />
                                    </button>

                                    {openSubmenu === item.label && (
                                        <div className="ml-8 pl-6 border-l-2 border-amber-100 space-y-2 mt-2 animate-in slide-in-from-left-4 fade-in duration-500">
                                            {item.submenuItems?.map((sub) => (
                                                <NavLink
                                                    key={sub.path}
                                                    to={sub.path}
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `relative block px-5 py-3.5 rounded-2xl text-[13px] transition-all duration-300 font-bold ${isActive
                                                            ? 'text-amber-600 bg-amber-50/50 shadow-xs'
                                                            : 'text-gray-400 hover:text-amber-600 hover:translate-x-2'
                                                        }`
                                                    }
                                                >
                                                    {({ isActive }) => (
                                                        <>
                                                            <span>{sub.label}</span>
                                                            {isActive && (
                                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-[25px] w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                                                            )}
                                                        </>
                                                    )}
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
                                        `flex items-center gap-4 px-5 py-4 rounded-[22px] transition-all duration-500 group ${isActive
                                            ? 'bg-linear-to-r from-amber-50 to-orange-50/30 text-amber-600 shadow-sm border border-amber-100/50'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-amber-500'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className={`p-2 rounded-xl transition-all duration-500 ${isActive
                                                ? 'bg-white shadow-sm text-amber-500 scale-110'
                                                : 'text-gray-400 group-hover:text-amber-500'
                                                }`}>
                                                <item.icon size={22} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-[14px] font-bold">{item.label}</span>
                                            {isActive && (
                                                <div className="ml-auto w-1.5 h-6 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]"></div>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            )}
                        </li>
                    ))}

                    {/* Management Link for Teacher/Admin */}
                    {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                        <li className="mt-8 pt-6 border-t border-gray-100/50">
                            <p className="text-[12px] font-bold text-amber-500 mb-4 px-4">Admin Tools</p>
                            <NavLink
                                to="/teacher/dashboard"
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-5 py-4 rounded-[22px] transition-all duration-500 group ${isActive
                                        ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/20'
                                        : 'text-amber-600 bg-amber-50 hover:bg-amber-100/50'
                                    }`
                                }
                            >
                                <div className="p-2 bg-white shadow-sm rounded-xl text-amber-600">
                                    <Layout size={20} strokeWidth={2.5} />
                                </div>
                                <span className="text-sm font-bold uppercase ">Trang Quản Lý</span>
                            </NavLink>
                        </li>
                    )}
                </ul>

                {/* Promo Card in Sidebar */}
                {/* <div className="mt-12 p-6 bg-gray-900 rounded-[32px] text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 bg-amber-500/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Special Offer</p>
                        <p className="text-sm font-bold leading-tight mb-4">Mở khóa toàn bộ khóa học Premium ngay hôm nay!</p>
                        <button className="w-full py-3 bg-white text-gray-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all duration-300 active:scale-95">
                            Nâng cấp ngay
                        </button>
                    </div>
                </div> */}
            </nav>

            {/* Refined Footer */}
            <div className="p-8 border-t border-gray-50 bg-gray-50/30">
                <div className="flex justify-center gap-6 mb-6">
                    <Facebook size={20} className="text-gray-400 cursor-pointer hover:text-blue-600 hover:scale-125 transition-all duration-300" />
                    <Youtube size={20} className="text-gray-400 cursor-pointer hover:text-red-600 hover:scale-125 transition-all duration-300" />
                    <Globe size={20} className="text-gray-400 cursor-pointer hover:text-amber-600 hover:scale-125 transition-all duration-300" />
                </div>
                <p className='text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest'>&copy; 2026 E-LEARN ACADEMY</p>
            </div>
        </aside>
    );
};

export default Sidebar;
