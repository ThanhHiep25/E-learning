import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import Header from './Header.tsx';
import Footer from './Footer.tsx';
import VirtualBot from '../common/VirtualBot';
import { ChevronUp, Phone } from 'lucide-react';

const MainLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Scroll to top logic
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="flex min-h-screen bg-[#FDF8EE]">
            {/* Backdrop for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Fixed on desktop, hidden on mobile */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-x-hidden">
                    <Outlet />
                </main>
                <Footer />
            </div>

            {/* Student Helper Tools (Only shown in MainLayout) */}
            <VirtualBot />

            {/* Floating Contact Buttons */}
            <div className="fixed bottom-30 right-6 z-30 group">
                <div className="absolute -inset-2 bg-blue-400/20 rounded-full blur-xl group-hover:bg-blue-400/40 transition-all opacity-0 group-hover:opacity-100"></div>
                <div className="relative w-14 h-14 bg-blue-500 rounded-full flex flex-col items-center justify-center text-white font-bold text-[10px] shadow-xl cursor-pointer border-2 border-white hover:scale-110 active:scale-95 transition-all">
                    <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Zalo-Arc.png" alt="Zalo" className="w-8 h-8 object-contain mb-0.5" />
                </div>
            </div>

            <div className="fixed bottom-50 right-6 z-30 group">
                <div className="absolute -inset-2 bg-green-400/20 rounded-full blur-xl group-hover:bg-green-400/40 transition-all opacity-0 group-hover:opacity-100"></div>
                <div className="relative w-14 h-14 bg-green-500 rounded-full flex flex-col items-center justify-center text-white font-bold text-[10px] shadow-xl cursor-pointer border-2 border-white hover:scale-110 active:scale-95 transition-all">
                    <Phone size={24} />
                </div>
            </div>

            {/* Scroll to top button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 z-30 group"
                >
                    <div className="absolute -inset-2 bg-blue-400/20 rounded-full blur-xl group-hover:bg-blue-400/40 transition-all opacity-0 group-hover:opacity-100"></div>
                    <div className="relative w-14 h-14 bg-blue-500/50 backdrop-blur-sm rounded-full flex flex-col items-center justify-center text-white font-bold text-[10px] shadow-xl cursor-pointer border-2 border-white hover:scale-110 active:scale-95 transition-all">
                        <ChevronUp size={24} />
                    </div>
                </button>
            )}
        </div>
    );
};

export default MainLayout;
