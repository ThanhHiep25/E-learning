import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Facebook,
    Youtube,
    Globe,
    Mail,
    Phone,
    MapPin,
    ArrowRight,
    MessageCircle,
    Instagram
} from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-100 relative overflow-hidden">
            {/* Newsletter Section */}
            

            <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <NavLink to="/" className="flex flex-col items-start gap-2">
                            <div className="flex items-center gap-3">
                                <img src='/idea-bulb.png' alt="Logo" className="w-10 h-auto object-contain" />
                                <span className='text-2xl font-bold text-gray-800 font-dancing-script-700'>E-Learning</span>
                            </div>
                            <p className="text-gray-500 leading-relaxed text-sm mt-4">
                                Nâng tầm tri thức Việt với hệ thống đào tạo trực tuyến hàng đầu. Cung cấp các giải pháp học tập linh hoạt và hiệu quả nhất cho thế hệ 2k10, 2k11.
                            </p>
                        </NavLink>

                        <div className="flex items-center gap-3 pt-2">
                            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-sm">
                                <Facebook size={18} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow-sm">
                                <Youtube size={18} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-pink-600 hover:bg-pink-600 hover:text-white transition-all cursor-pointer shadow-sm">
                                <Instagram size={18} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-blue-400 hover:bg-blue-400 hover:text-white transition-all cursor-pointer shadow-sm">
                                <Globe size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-gray-800 font-bold mb-6 text-lg">Khám phá</h4>
                        <ul className="space-y-4">
                            <li>
                                <NavLink to="/vào-10" className="text-gray-500 hover:text-red-500 hover:translate-x-1 transition-all flex items-center gap-2 group">
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                                    Level A1
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/toeic" className="text-gray-500 hover:text-red-500 hover:translate-x-1 transition-all flex items-center gap-2 group">
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                                    Level A2
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/combo-lap-trinh" className="text-gray-500 hover:text-red-500 hover:translate-x-1 transition-all flex items-center gap-2 group">
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                                    Level B1
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/books" className="text-gray-500 hover:text-red-500 hover:translate-x-1 transition-all flex items-center gap-2 group">
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                                    Level B2
                                </NavLink>
                            </li>
                        </ul>
                    </div>

                    {/* Company Support */}
                    <div>
                        <h4 className="text-gray-800 font-bold mb-6 text-lg">Hỗ trợ</h4>
                        <ul className="space-y-4">
                            <li>
                                <NavLink to="/about" className="text-gray-500 hover:text-red-500 hover:translate-x-1 transition-all flex items-center gap-2 group">
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                                    Giới thiệu
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/policy" className="text-gray-500 hover:text-red-500 hover:translate-x-1 transition-all flex items-center gap-2 group">
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                                    Chính sách bảo mật
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/terms" className="text-gray-500 hover:text-red-500 hover:translate-x-1 transition-all flex items-center gap-2 group">
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                                    Điều khoản sử dụng
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/faq" className="text-gray-500 hover:text-red-500 hover:translate-x-1 transition-all flex items-center gap-2 group">
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                                    Câu hỏi thường gặp
                                </NavLink>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <h4 className="text-gray-800 font-bold mb-6 text-lg">Liên hệ</h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-red-50 text-red-500 rounded-lg shrink-0">
                                    <MapPin size={18} />
                                </div>
                                <p className="text-gray-500 text-sm">12 Nguyễn Văn Bảo, Hạnh Thông, Hồ Chí Minh</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg shrink-0">
                                    <Phone size={18} />
                                </div>
                                <p className="text-gray-500 text-sm">Hotline: 0981975303</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-50 text-amber-500 rounded-lg shrink-0">
                                    <Mail size={18} />
                                </div>
                                <p className="text-gray-500 text-sm">Email: Thaitrinh1306@gmail.com</p>
                            </div>
                        </div>

                        {/* Zalo/Messenger floating-like buttons in footer */}
                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between gap-4 border border-gray-100">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white border-2 border-white ring-2 ring-blue-50">
                                    <MessageCircle size={14} />
                                </div>
                                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white border-2 border-white ring-2 ring-red-50">
                                    <Mail size={14} />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Tư vấn trực tuyến</p>
                            <button className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-800 hover:text-white transition-all cursor-pointer shadow-sm">
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-100 bg-gray-50/50">
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                        &copy; 2026 E-Learning. Developed with
                        <span className="text-red-500 animate-pulse">❤️</span>
                        for better education.
                    </p>
                    <div className="flex items-center gap-8">
                        <NavLink to="/privacy" className="text-xs text-gray-400 hover:text-gray-800 transition-colors">Privacy</NavLink>
                        <NavLink to="/terms" className="text-xs text-gray-400 hover:text-gray-800 transition-colors">Terms of Service</NavLink>
                        <NavLink to="/sitemap" className="text-xs text-gray-400 hover:text-gray-800 transition-colors">Sitemap</NavLink>
                    </div>
                </div>
            </div>

            {/* Background design elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
        </footer>
    );
};

export default Footer;
