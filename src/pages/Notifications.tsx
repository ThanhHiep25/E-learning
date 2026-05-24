import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, CheckCheck, Trash2, Search,
    Calendar, BookOpen, CreditCard, Megaphone,
    ShieldAlert, Heart, ChevronRight, X,
    ChevronDown, ArrowRight
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { safeFormat } from '../utils/dateUtils';
import type { NotificationType, Notification } from '../services/notification.service';

const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        isLoading,
        pagination,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications
    } = useNotifications();

    const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    // Navigate based on notification type (same logic as useNotificationDeepLink)
    const handleNavigate = (notification: Notification) => {
        const { type, payload = {} } = notification;
        const { courseId, quizId, topicId } = payload;

        switch (type) {
            case 'enrollment':
            case 'enrollment_success':
            case 'enrollment_renewal':
                if (courseId) {
                    navigate(`/course/${courseId}/lesson`);
                } else {
                    navigate('/my-learning');
                }
                break;
            case 'quiz':
            case 'quiz_reminder':
                if (quizId) {
                    navigate(`/quiz/${quizId}`);
                } else if (courseId) {
                    navigate(`/course/${courseId}`);
                }
                break;
            case 'payment':
                navigate('/payment-history');
                break;
            case 'forum':
            case 'forum_reply':
                if (topicId) {
                    navigate(`/forum/topic/${topicId}`);
                } else {
                    navigate('/forum');
                }
                break;
            case 'certificate':
                if (courseId) {
                    navigate(`/course/${courseId}/lesson`);
                }
                break;
            case 'course_update':
            case 'chapter_complete':
                if (courseId) {
                    navigate(`/course/${courseId}/lesson`);
                }
                break;
            default:
                // Stay on notifications page if no specific route
                break;
        }
        setSelectedNotification(null);
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Re-fetch when filters change
    useEffect(() => {
        const readParam = statusFilter === 'all' ? undefined : (statusFilter === 'read');
        fetchNotifications(1, {
            type: typeFilter === 'all' ? undefined : typeFilter,
            read: readParam
        });
    }, [typeFilter, statusFilter, fetchNotifications]);

    const handleLoadMore = () => {
        const readParam = statusFilter === 'all' ? undefined : (statusFilter === 'read');
        fetchNotifications(pagination.page + 1, {
            type: typeFilter === 'all' ? undefined : typeFilter,
            read: readParam
        });
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'enrollment': return <BookOpen className="text-blue-500" size={20} />;
            case 'quiz': return <Calendar className="text-rose-500" size={20} />;
            case 'payment': return <CreditCard className="text-emerald-500" size={20} />;
            case 'review': return <Heart className="text-pink-500" size={20} />;
            case 'course_update': return <Megaphone className="text-amber-500" size={20} />;
            case 'announcement': return <ShieldAlert className="text-purple-500" size={20} />;
            case 'forum_ban': return <ShieldAlert className="text-red-500" size={20} />;
            case 'report_resolution': return <CheckCheck className="text-teal-500" size={20} />;
            case 'forum_reaction': return <Heart className="text-rose-500" size={20} />;
            default: return <Bell className="text-slate-500" size={20} />;
        }
    };

    // Client-side search filtering on top of server-side fetched data
    const filteredNotifications = notifications
        .filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.message.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleMarkAsRead = (id: string | number) => {
        markAsRead(id);
    };

    return (
        <div className="min-h-screen bg-[#FDF8EE] pt-32 pb-20 px-4 md:px-10">
            <div className="max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/20">
                                <Bell className="text-white" size={24} />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tighter">
                                Thông <span className="text-amber-500">báo</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 font-bold ml-1">
                            {unreadCount > 0
                                ? `Bạn có ${unreadCount} thông báo chưa đọc`
                                : 'Bạn đã đọc hết tất cả thông báo'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={markAllAsRead}
                            className="px-6 py-3 bg-white cursor-pointer border border-slate-200 rounded-[22px] text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                        >
                            <CheckCheck size={16} /> Đọc tất cả
                        </button>
                        <button
                            onClick={deleteAllNotifications}
                            className="px-6 py-3 bg-slate-100 cursor-pointer text-slate-400 rounded-[22px] text-xs font-bold uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Trash2 size={16} /> Dọn sạch
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-[40px] p-6 shadow-xl shadow-slate-900/5 mb-8 border border-gray-100">
                    <div className="space-y-6">
                        {/* Status Filter Tabs */}
                        <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl w-fit">
                            {[
                                { id: 'all', label: 'Tất cả' },
                                { id: 'unread', label: 'Chưa đọc' },
                                { id: 'read', label: 'Đã đọc' }
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setStatusFilter(s.id as any)}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${statusFilter === s.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm thông báo..."
                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl pl-14 pr-6 py-4 text-sm  transition-all outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                                {[
                                    { id: 'all', label: 'Tất cả' },
                                    { id: 'enrollment', label: 'Khóa học' },
                                    { id: 'quiz', label: 'Bài thi' },
                                    { id: 'payment', label: 'Giao dịch' },
                                    { id: 'forum_reaction', label: 'Tương tác' },
                                    { id: 'announcement', label: 'Hệ thống' }
                                ].map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setTypeFilter(cat.id as any)}
                                        className={`px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${typeFilter === cat.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-4 min-h-[400px]">
                    {isLoading && notifications.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải thông báo...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="bg-white rounded-[40px] p-20 text-center border border-gray-100 shadow-sm">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Bell className="text-slate-300" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Trống trơn!</h3>
                            <p className="text-slate-400 font-medium">Bạn không có thông báo nào phù hợp với các tiêu chí hiện tại.</p>
                        </div>
                    ) : (
                        <>
                            {filteredNotifications.map((notification, index) => (
                                <div
                                    key={notification.id}
                                    onClick={() => {
                                        setSelectedNotification(notification);
                                        if (!notification.read) handleMarkAsRead(notification.id);
                                    }}
                                    className={`group relative bg-white hover:bg-slate-50 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm transition-all duration-500 cursor-pointer flex gap-6 md:gap-8 items-start animate-in slide-in-from-bottom-4`}
                                    style={{ animationDelay: `${index % 10 * 50}ms` }}
                                >
                                    {!notification.read && (
                                        <div className="absolute top-8 left-3 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-md shadow-amber-500/50"></div>
                                    )}

                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100 shadow-inner group-hover:shadow-md">
                                        {getIcon(notification.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-[10px] font-bold text-slate-400">
                                                {safeFormat(notification.createdAt || notification.created_at, 'dd MMMM, yyyy')}
                                            </p>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification.id);
                                                    }}
                                                    className="p-2 hover:bg-rose-50 cursor-pointer text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                                                    title="Xóa thông báo"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className={`text-lg md:text-xl font-bold leading-tight mb-2 tracking-tight ${notification.read ? 'text-slate-600' : 'text-slate-900'}`}>
                                            {notification.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium line-clamp-2 md:line-clamp-1 leading-relaxed opacity-80">
                                            {notification.message}
                                        </p>
                                    </div>

                                    <div className="hidden md:flex items-center justify-center w-10 h-10 bg-slate-50 rounded-full text-slate-300 group-hover:text-amber-500 group-hover:bg-amber-50 transition-all shrink-0">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            ))}

                            {/* Load More Button */}
                            {pagination.page < pagination.totalPages && (
                                <div className="pt-10 flex justify-center">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={isLoading}
                                        className="px-10 py-5 cursor-pointer bg-white border-2 border-slate-100 rounded-[30px] text-sm font-bold text-slate-900 hover:border-amber-500 hover:bg-amber-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                                Đang tải...
                                            </div>
                                        ) : (
                                            <p className="flex flex-col items-center justify-center gap-2">
                                                Xem thêm thông báo
                                                <ChevronDown size={16} />
                                            </p>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Notification Detail Modal */}
            {selectedNotification && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden scale-in-center border border-gray-100 relative">
                        <div className="bg-slate-900 p-4 md:p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10 flex items-center justify-between mb-8">
                                <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold border border-white/20">
                                    {selectedNotification.type}
                                </div>
                                <button
                                    onClick={() => setSelectedNotification(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white/50 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black leading-tight italic tracking-tight">{selectedNotification.title}</h3>
                        </div>

                        <div className="p-8 md:p-10 space-y-10">
                            <div className="flex gap-10 items-center">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-bold text-slate-400">Thời điểm nhận</p>
                                    <p className="text-slate-900 font-bold flex items-center gap-2">
                                        {safeFormat(selectedNotification.createdAt || selectedNotification.created_at, 'HH:mm - dd/MM/yyyy')}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-bold text-slate-400">Trạng thái</p>
                                    <p className={`font-bold flex items-center gap-2 ${selectedNotification.read ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        <div className={`w-2 h-2 rounded-full ${selectedNotification.read ? 'bg-emerald-500 shadow-emerald-200' : 'bg-amber-500 shadow-amber-200'} shadow-lg`}></div>
                                        {selectedNotification.read ? 'Đã đọc' : 'Chưa đọc'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="w-10 h-0.5 bg-slate-100"></div>
                                <p className="text-sm text-slate-600 font-medium ">
                                    {selectedNotification.message}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedNotification(null)}
                                    className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[24px] text-sm cursor-pointer font-bold hover:bg-slate-200 transition-all active:scale-[0.98]"
                                >
                                    Đóng
                                </button>
                                {(selectedNotification.type === 'enrollment' ||
                                  selectedNotification.type === 'enrollment_success' ||
                                  selectedNotification.type === 'enrollment_renewal' ||
                                  selectedNotification.type === 'quiz' ||
                                  selectedNotification.type === 'quiz_reminder' ||
                                  selectedNotification.type === 'forum' ||
                                  selectedNotification.type === 'forum_reply' ||
                                  selectedNotification.type === 'course_update' ||
                                  selectedNotification.type === 'chapter_complete' ||
                                  selectedNotification.type === 'certificate' ||
                                  selectedNotification.payload?.courseId) && (
                                    <button
                                        onClick={() => handleNavigate(selectedNotification)}
                                        className="flex-[2] py-5 bg-slate-900 text-white rounded-[24px] text-sm cursor-pointer font-bold hover:bg-amber-600 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        Xem chi tiết
                                        <ArrowRight size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;
