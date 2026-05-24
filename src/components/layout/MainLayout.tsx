import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import Header from './Header.tsx';
import Footer from './Footer.tsx';
import AIChatModal from '../common/AIChatModal';
import { useAuth } from '../../context/AuthContext';
import { ChevronUp } from 'lucide-react';

const MainLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Scroll to top logic
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const { user } = useAuth();
    const location = useLocation();
    const isAiChatPage = location.pathname === '/ai-chat';
    const isLessonPlayer = location.pathname.includes('/lesson/');
    const isMyLearning = location.pathname === '/my-learning';
    const isCourseDashboard = location.pathname.includes('/course/') && location.pathname.includes('/dashboard');
    const showFooter = !user && !isAiChatPage && !isLessonPlayer && !isMyLearning && !isCourseDashboard;
    const showChatbot = !!user && !isAiChatPage && !isLessonPlayer;

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
                {showFooter && <Footer />}
            </div>
            
            {/* AI Assistant */}
            {showChatbot && (
                <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
            )}

            {showChatbot && (
                <>
                    {/* AI Chat Floating Button */}
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="fixed bottom-20 right-5 z-40 w-14 h-14 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-amber-500/30 border-2 border-white hover:scale-105 active:scale-95 transition-all"
                    >
                        <img src="/idea-bulb.png" alt="AI" className="w-6 h-6 object-contain" />
                    </button>

                    {/* Scroll to top button */}
                    {showScrollTop && (
                        <button
                            onClick={scrollToTop}
                            className="fixed bottom-6 right-6 z-30 group"
                        >
                            <div className="absolute -inset-2 bg-blue-400/20 rounded-full blur-xl group-hover:bg-blue-400/40 transition-all opacity-0 group-hover:opacity-100"></div>
                            <div className="relative w-12 h-12 bg-blue-500/50 backdrop-blur-sm rounded-full flex flex-col items-center justify-center text-white font-bold text-[10px] shadow-xl cursor-pointer border-2 border-white hover:scale-110 active:scale-95 transition-all">
                                <ChevronUp size={20} />
                            </div>
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default MainLayout;
