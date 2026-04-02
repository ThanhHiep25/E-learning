import React, { useState, useEffect } from 'react';
import { forumService } from '../services/forum.service';
import type { ForumReport } from '../services/forum.service';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Flag, CheckCircle, XCircle, AlertTriangle, MessageSquare, User, Clock, Check, ExternalLink, Trash2, X, AlertOctagon, ShieldOff, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ForumReports: React.FC = () => {
    const { user } = useAuth();
    const { socket } = useNotifications();
    const [reports, setReports] = useState<ForumReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'resolved' | 'dismissed'>('pending');
    const [deleteModalOpen, setDeleteModalOpen] = useState<{ id: number, type: 'topic' | 'post', reportId: number } | null>(null);
    const [banModalOpen, setBanModalOpen] = useState<{ userId: number, userName: string, reportId: number } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBanning, setIsBanning] = useState(false);
    const [banReason, setBanReason] = useState('Vi phạm tiêu chuẩn cộng đồng');
    const [banUntil, setBanUntil] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Default 7 days

    useEffect(() => {
        if (user && user.role?.toUpperCase() === 'ADMIN') {
            fetchReports();
        }
    }, [user, filter]);

    useEffect(() => {
        if (!socket || user?.role?.toUpperCase() !== 'ADMIN') return;

        socket.on('new_report', () => {
            // If we are showing pending reports, refresh the list
            if (filter === 'pending') {
                fetchReports();
            }
        });

        return () => {
            socket.off('new_report');
        };
    }, [socket, user, filter]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await forumService.getReports({ status: filter });
            // Handle array or object response based on API design
            if (response && Array.isArray(response.reports)) {
                setReports(response.reports);
            } else if (Array.isArray(response)) {
                // @ts-ignore
                setReports(response);
            } else {
                setReports([]);
            }
        } catch (error) {
            toast.error('Không thể tải danh sách báo cáo');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (reportId: number, status: 'pending' | 'resolved' | 'dismissed') => {
        try {
            await forumService.updateReportStatus(reportId, { status });
            toast.success('Cập nhật trạng thái thành công');
            fetchReports();
        } catch (error) {
            toast.error('Cập nhật trạng thái thất bại');
        }
    };

    const confirmDeleteContent = async () => {
        if (!deleteModalOpen) return;

        try {
            setIsDeleting(true);
            if (deleteModalOpen.type === 'topic') {
                await forumService.deleteTopic(deleteModalOpen.id);
                toast.success('Đã xóa chủ đề vi phạm');
            } else {
                await forumService.deletePost(deleteModalOpen.id);
                toast.success('Đã xóa bình luận vi phạm');
            }
            await handleUpdateStatus(deleteModalOpen.reportId, 'resolved');
            setDeleteModalOpen(null);
        } catch (error) {
            toast.error('Xóa nội dung thất bại');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBanUser = async () => {
        if (!banModalOpen) return;

        try {
            setIsBanning(true);
            await forumService.banUserForum(banModalOpen.userId, {
                chatBannedUntil: new Date(banUntil).toISOString(),
                chatBanReason: banReason
            });
            toast.success(`Đã cấm người dùng ${banModalOpen.userName} tham gia diễn đàn`);
            await handleUpdateStatus(banModalOpen.reportId, 'resolved');
            setBanModalOpen(null);
        } catch (error) {
            toast.error('Cấm người dùng thất bại');
        } finally {
            setIsBanning(false);
        }
    };

    if (!user || user.role?.toUpperCase() !== 'ADMIN') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertTriangle size={64} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-black text-slate-800">Không có quyền truy cập</h2>
                    <p className="text-slate-500 mt-2">Chỉ Quản trị viên mới có thể xem trang này.</p>
                </div>
            </div>
        );
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'dismissed': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Chờ xử lý';
            case 'resolved': return 'Đã giải quyết';
            case 'dismissed': return 'Bỏ qua';
            default: return status;
        }
    };

    return (
        <div className="w-full">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl md:text-4xl font-black text-slate-800">Quản lý Báo cáo</h1>
                        </div>
                        <p className="text-slate-500 font-medium">Kiểm duyệt các nội dung vi phạm trên diễn đàn.</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
                        {(['pending', 'resolved', 'dismissed'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${filter === status
                                    ? 'bg-amber-500 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {getStatusText(status)}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-bold">Đang tải dữ liệu...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-12 text-center shadow-sm border border-slate-100 border-dashed">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Không có báo cáo nào</h3>
                        <p className="text-slate-500">
                            Diễn đàn hiện đang sạch sẽ. Không có bình luận nào đang {getStatusText(filter).toLowerCase()}.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {reports.map((report) => (
                            <div key={report.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row gap-6">

                                    {/* Report Info */}
                                    <div className="md:w-1/3 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Flag size={16} className="text-red-500" />
                                                <span className="font-black text-slate-800">Báo cáo #{report.id}</span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(report.status)}`}>
                                                {getStatusText(report.status)}
                                            </span>
                                        </div>

                                        <div className="bg-red-50/50 rounded-xl p-4 border border-red-100/50">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lý do báo cáo:</h4>
                                            <p className="text-sm font-medium text-slate-700">{report.reason}</p>
                                        </div>

                                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <User size={14} />
                                                <span>{report.reporter?.name || `User #${report.reporterId}`}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} />
                                                <span>{format(new Date(report.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 mt-auto pt-4 border-t border-slate-50">
                                            {report.status === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                                                        className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                                                    >
                                                        <XCircle size={14} /> Bỏ qua
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(report.id, 'resolved')}
                                                        className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                                                    >
                                                        <Check size={14} /> Chấp nhận
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleUpdateStatus(report.id, 'pending')}
                                                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-amber-100 hover:text-amber-700 text-slate-500 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                                                >
                                                    <Clock size={14} /> Mở lại
                                                </button>
                                            )}

                                            <button
                                                onClick={() => {
                                                    const targetUser = report.post?.author || report.topic?.author;
                                                    if (targetUser) {
                                                        setBanModalOpen({
                                                            userId: targetUser.id,
                                                            userName: targetUser.name,
                                                            reportId: report.id
                                                        });
                                                    } else {
                                                        toast.error('Không tìm thấy thông tin người dùng vi phạm');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-slate-900 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                                                title="Cấm người dùng"
                                            >
                                                <ShieldOff size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Post Content preview */}
                                    <div className="md:w-2/3 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <MessageSquare size={14} /> Nội dung bị báo cáo
                                        </h4>

                                        {report.post ? (
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Bình luận</span>
                                                </div>
                                                {/* Author */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                                        {report.post.author?.avatar ? (
                                                            <img src={report.post.author.avatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={14} className="text-slate-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-slate-800">{report.post.author?.name || `User #${report.post.userId}`}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium">{format(new Date(report.post.createdAt), 'dd MMMM, yyyy', { locale: vi })}</div>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <p className="text-sm text-slate-700 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                                                    {report.post.content}
                                                </p>

                                                {/* Meta */}
                                                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-medium text-slate-400">
                                                    <div className="flex gap-4">
                                                        <span>Post ID: {report.post.id}</span>
                                                        <span>Topic ID: {report.post.topicId}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Link
                                                            to={`/forum/topic/${report.post.topicId}#post-${report.post.id}`}
                                                            target="_blank"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                        >
                                                            <ExternalLink size={12} /> Xem bài viết
                                                        </Link>
                                                        <button
                                                            onClick={() => setDeleteModalOpen({ id: report.post!.id, type: 'post', reportId: report.id })}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 size={12} /> Xóa bài
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : report.topic ? (
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="bg-amber-100 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Chủ đề</span>
                                                </div>
                                                {/* Author */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                                        {report.topic.author?.avatar ? (
                                                            <img src={report.topic.author.avatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={14} className="text-slate-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-slate-800">{report.topic.author?.name || `User #${report.topic.userId}`}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium">{format(new Date(report.topic.createdAt), 'dd MMMM, yyyy', { locale: vi })}</div>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <h3 className="text-md font-black text-slate-800 mb-2">{report.topic.title}</h3>
                                                <p className="text-sm text-slate-700 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                                                    {report.topic.content}
                                                </p>

                                                {/* Meta */}
                                                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-medium text-slate-400">
                                                    <div className="flex gap-4">
                                                        <span>Topic ID: {report.topic.id}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Link
                                                            to={`/forum/topic/${report.topic.id}`}
                                                            target="_blank"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                        >
                                                            <ExternalLink size={12} /> Xem chủ đề
                                                        </Link>
                                                        <button
                                                            onClick={() => setDeleteModalOpen({ id: report.topic!.id, type: 'topic', reportId: report.id })}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 size={12} /> Xóa chủ đề
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center text-sm font-medium border border-red-100">
                                                Nội dung này đã bị xóa hoặc không thể truy cập.
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border border-red-100">
                        <div className="bg-red-50 p-6 flex items-center gap-4 relative">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                                <AlertOctagon size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Xóa {deleteModalOpen.type === 'topic' ? 'chủ đề' : 'bình luận'}</h3>
                                <p className="text-xs font-bold text-red-500/80">Hành động này không thể hoàn tác</p>
                            </div>
                            <button
                                onClick={() => setDeleteModalOpen(null)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-slate-800 hover:bg-white rounded-full transition-all cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 text-center">
                            <p className="text-sm font-medium text-slate-600 mb-8">
                                Bạn có chắc chắn muốn xóa {deleteModalOpen.type === 'topic' ? 'chủ đề' : 'bình luận'} này không? Nội dung sẽ bị gỡ bỏ hoàn toàn khỏi hệ thống và báo cáo này sẽ được chuyển sang trạng thái <strong>Đã xử lý</strong>.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteModalOpen(null)}
                                    className="px-6 py-3 font-bold text-slate-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    disabled={isDeleting}
                                    onClick={confirmDeleteContent}
                                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Ban User Modal */}
            {banModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <div className="bg-slate-900 p-6 flex items-center gap-4 relative text-white">
                            <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center shrink-0">
                                <Ban size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black">Cấm người dùng</h3>
                                <p className="text-xs font-bold text-white/60">Đình chỉ quyền tham gia diễn đàn</p>
                            </div>
                            <button
                                onClick={() => setBanModalOpen(null)}
                                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                            <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Người dùng: <span className="text-slate-900">{banModalOpen.userName}</span></p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Lý do cấm</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none h-24"
                                        placeholder="Nhập lý do vi phạm..."
                                        value={banReason}
                                        onChange={(e) => setBanReason(e.target.value)}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Cấm đến ngày</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                        value={banUntil}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setBanUntil(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setBanModalOpen(null)}
                                    className="px-6 py-3 font-bold text-slate-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    disabled={isBanning || !banReason.trim()}
                                    onClick={handleBanUser}
                                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isBanning ? 'Đang thực hiện...' : 'Xác nhận cấm'}
                                    <ShieldOff size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ForumReports;
