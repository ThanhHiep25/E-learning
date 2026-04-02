import React, { useState, useRef, useEffect } from 'react';
import {
    Bell, Check, BookOpen, Clock,
    CreditCard, Info, Megaphone, AlertCircle, MessageSquare,
    ChevronRight
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { safeFormatDistanceToNow } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'enrollment': return <BookOpen size={16} className="text-blue-500" />;
            case 'quiz': return <Clock size={16} className="text-emerald-500" />;
            case 'payment': return <CreditCard size={16} className="text-amber-500" />;
            case 'course_update': return <Info size={16} className="text-indigo-500" />;
            case 'announcement': return <Megaphone size={16} className="text-rose-500" />;
            case 'forum': return <MessageSquare size={16} className="text-orange-500" />;
            default: return <AlertCircle size={16} className="text-gray-500" />;
        }
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        setIsOpen(false);

        // Navigation logic based on payload
        if (notification.payload) {
            const { courseId, quizId, lectureId, updateType, topicId } = notification.payload;

            if (quizId) {
                // If it's a quiz notification, go to quiz or my-learning/tests
                navigate(`/quiz/${quizId}`);
            } else if (notification.type === 'forum' && topicId) { // Added forum handling
                navigate(`/forum/topic/${topicId}`);
            } else if (courseId) {
                // If it's an update for a course
                if (updateType === 'new_lecture' && lectureId) {
                    navigate(`/course/${courseId}/lesson/${lectureId}`);
                } else {
                    navigate(`/course/${courseId}`);
                }
            }
        }
    };


    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-3 bg-white border border-gray-100 rounded-2xl cursor-pointer transition-all duration-300 shadow-sm group active:scale-95 ${isOpen ? 'ring-2 ring-amber-500 border-transparent' : 'hover:bg-amber-50 hover:text-amber-600'}`}
            >
                <Bell size={24} className={`${isOpen ? 'text-amber-600' : 'text-gray-700'} group-hover:scale-110 transition-transform`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-linear-to-br from-red-500 to-rose-600 text-white text-[11px] flex items-center justify-center rounded-full border-2 border-white shadow-md font-black animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop for mobile to close dropdown */}
                    <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setIsOpen(false)}></div>

                    <div className="absolute top-full right-[-200px]  sm:right-0 mt-4 w-[calc(100vw-32px)] sm:w-96 bg-white rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Header */}
                        <div className="p-6 bg-linear-to-br from-gray-900 to-gray-800 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">Thông báo</h3>
                                <p className="text-[10px] font-bold text-amber-500 opacity-70">Bạn có {unreadCount} thông báo mới</p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl transition-all flex items-center gap-2"
                                >
                                    <Check size={12} /> Đọc tất cả
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`p-5 hover:bg-amber-50/50 transition-all cursor-pointer group relative flex gap-4 ${!n.read ? 'bg-blue-50/30' : ''}`}
                                        >
                                            {!n.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-lg shadow-blue-200"></div>}

                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform ${!n.read ? 'bg-white' : 'bg-gray-50'}`}>
                                                {getIcon(n.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4 className={`text-sm tracking-tight leading-tight line-clamp-1 ${!n.read ? 'font-black text-gray-900' : 'font-bold text-gray-600'}`}>
                                                        {n.title}
                                                    </h4>
                                                    <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap pt-0.5">
                                                        {safeFormatDistanceToNow(n.createdAt || (n as any).created_at)}
                                                    </span>
                                                </div>
                                                <p className={`text-xs leading-relaxed line-clamp-2 ${!n.read ? 'font-bold text-gray-600' : 'text-gray-400 font-medium'}`}>
                                                    {n.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center px-6">
                                    <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                                        <Bell size={32} className="text-gray-200" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-400">Không có thông báo</h4>
                                    <p className="text-xs text-gray-300 font-bold mt-2 leading-relaxed">Khi có thông báo mới mẻ, chúng sẽ xuất hiện tại đây.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-4 bg-gray-50/50 border-t border-gray-50 text-center">
                                <button
                                    onClick={() => {
                                        navigate('/notifications');
                                        setIsOpen(false);
                                    }}
                                    className="text-[10px] flex items-center justify-center w-full gap-2 font-bold text-gray-400 hover:text-amber-600 transition-colors cursor-pointer"
                                >
                                    Xem tất cả lịch sử thông báo <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
