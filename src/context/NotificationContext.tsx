import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notification.service';
import type { Notification } from '../services/notification.service';
import { Flag } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    pagination: {
        total: number;
        page: number;
        totalPages: number;
    };
    fetchNotifications: (page?: number, params?: { type?: any; read?: boolean }) => Promise<void>;
    markAsRead: (id: string | number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string | number) => Promise<void>;
    deleteAllNotifications: () => Promise<void>;
    socket: Socket | null;
    joinRoom: (roomName: string) => void;
    leaveRoom: (roomName: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
    const socketRef = useRef<Socket | null>(null);

    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000";

    const fetchNotifications = useCallback(async (page = 1, params = {}) => {
        if (!user) return;
        try {
            setIsLoading(true);
            const role = user.role.toLowerCase() as 'student' | 'teacher' | 'admin';
            const response = await notificationService.getNotifications(role, { page, limit: 10, ...params });
            
            const normalizedNotifications = response.notifications.map(n => ({
                ...n,
                createdAt: n.createdAt || (n as any).created_at
            }));

            if (page === 1) {
                setNotifications(normalizedNotifications);
            } else {
                setNotifications(prev => [...prev, ...normalizedNotifications]);
            }
            setUnreadCount(response.unreadCount);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const markAsRead = async (id: string | number) => {
        if (!user) return;
        try {
            const role = user.role.toLowerCase() as 'student' | 'teacher' | 'admin';
            await notificationService.markAsRead(role, id);
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            const role = user.role.toLowerCase() as 'student' | 'teacher' | 'admin';
            await notificationService.markAllAsRead(role);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            toast.success('Đã đánh dấu đọc tất cả');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (id: string | number) => {
        if (!user) return;
        try {
            const role = user.role.toLowerCase() as 'student' | 'teacher' | 'admin';
            const notificationToDelete = notifications.find(n => n.id === id);
            await notificationService.deleteNotification(role, id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notificationToDelete && !notificationToDelete.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            toast.success('Đã xóa thông báo');
        } catch (error) {
            console.error('Failed to delete notification:', error);
            toast.error('Không thể xóa thông báo');
        }
    };

    const deleteAllNotifications = async () => {
        if (!user) return;
        if (!confirm('Bạn có chắc chắn muốn xóa tất cả thông báo không?')) return;
        try {
            const role = user.role.toLowerCase() as 'student' | 'teacher' | 'admin';
            await notificationService.deleteAllNotifications(role);
            setNotifications([]);
            setUnreadCount(0);
            toast.success('Đã dọn sạch thông báo');
        } catch (error) {
            console.error('Failed to delete all notifications:', error);
            toast.error('Không thể dọn sạch thông báo');
        }
    };

    const joinRoom = useCallback((roomName: string) => {
        if (socketRef.current) {
            socketRef.current.emit('join', roomName);
        }
    }, []);

    const leaveRoom = useCallback((roomName: string) => {
        if (socketRef.current) {
            socketRef.current.emit('leave', roomName);
        }
    }, []);

    // Socket implementation
    useEffect(() => {
        if (!user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        // Initialize socket
        const socket = io(baseUrl, {
            withCredentials: true,
            transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to socket server');
            // Join specific room for user ID and also general role room if needed
            socket.emit('join', user.id);
            
            // If user is Admin, join admin room for reports
            if (user.role.toUpperCase() === 'ADMIN') {
                socket.emit('join', { userId: user.id, role: 'admin' });
            }
        });

        socket.on('new_notification', (notification: Notification) => {
            console.log('New notification received:', notification);
            // Normalize created_at to createdAt if needed
            const normalizedNotification = {
                ...notification,
                createdAt: notification.createdAt || (notification as any).created_at
            };
            setNotifications(prev => [normalizedNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show toast using global style
            toast.success(`${notification.title}\n${notification.message}`, {
                duration: 5000,
            });
        });

        socket.on('new_report', (data: any) => {
            console.log('New report received:', data);
            
            // Show special toast for new report (Admin only)
            if (user.role.toUpperCase() === 'ADMIN') {
                toast.custom((t) => (
                    <div
                        className={`${
                            t.visible ? 'animate-enter' : 'animate-leave'
                        } max-w-md w-full p-4 border-l-4 border-red-500 bg-white shadow-[0_20px_25px_-5px_rgb(0,0,0/0.1)] rounded-[24px] pointer-events-auto flex relative overflow-hidden`}
                    >
                        <div className="flex-1 w-64 p-2">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                                    <Flag size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                        Báo cáo vi phạm mới
                                    </p>
                                    <p className="mt-1 text-xs font-bold text-gray-500 leading-relaxed">
                                        {data.type === 'topic' ? 'Một chủ đề' : 'Một bình luận'} vừa bị báo cáo: "{data.reason}"
                                    </p>
                                    <div className="mt-4 flex gap-2">
                                        <button 
                                            onClick={() => {
                                                toast.dismiss(t.id);
                                                window.location.href = '/forum/reports';
                                            }}
                                            className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg hover:bg-amber-500 transition-colors"
                                        >
                                            Xử lý ngay
                                        </button>
                                        <button 
                                            onClick={() => toast.dismiss(t.id)}
                                            className="px-4 py-2 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-lg hover:bg-slate-200"
                                        >
                                            Để sau
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ), { duration: 8000 });
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });

        // Fetch initial notifications
        fetchNotifications();

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user, baseUrl, fetchNotifications]);

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount, 
            isLoading, 
            pagination,
            fetchNotifications, 
            markAsRead, 
            markAllAsRead,
            deleteNotification,
            deleteAllNotifications,
            socket: socketRef.current,
            joinRoom,
            leaveRoom
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
