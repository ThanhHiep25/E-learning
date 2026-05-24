import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { forumService } from '../services/forum.service';
import type { ForumType } from '../services/forum.service';
import {
    ChevronLeft, Send, Book, Globe,
    MessageCircle, AlertCircle, HelpCircle,
    ShieldOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NewTopic: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Initial state from URL
    const initialCourseId = searchParams.get('courseId');
    const initialLectureId = searchParams.get('lectureId');
    const initialType = (searchParams.get('type') as ForumType) || (initialCourseId ? 'course' : 'global');

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: initialType,
        courseId: initialCourseId || '',
        lectureId: initialLectureId || ''
    });
    const [banError, setBanError] = useState<{ message: string; bannedUntil: string; banReason: string } | null>(null);

    useEffect(() => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để đặt câu hỏi');
            navigate('/login');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            setLoading(true);
            
            // Build request body - chỉ thêm courseId/lectureId khi cần thiết
            // Backend validation: optional() chỉ bỏ qua undefined, không phải null
            const requestBody: any = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                type: formData.type,
            };
            
            // Chỉ thêm courseId khi type là 'course' hoặc 'lecture' và có giá trị
            if (formData.type !== 'global' && formData.courseId) {
                const parsedCourseId = parseInt(formData.courseId, 10);
                if (parsedCourseId > 0) {
                    requestBody.courseId = parsedCourseId;
                }
            }
            
            // Chỉ thêm lectureId khi type là 'lecture' và có giá trị
            if (formData.type === 'lecture' && formData.lectureId) {
                const parsedLectureId = parseInt(formData.lectureId, 10);
                if (parsedLectureId > 0) {
                    requestBody.lectureId = parsedLectureId;
                }
            }
            
            const topic = await forumService.createTopic(requestBody);
            toast.success('Chủ đề đã được tạo thành công!');
            navigate(`/forum/topic/${topic.id}`);
        } catch (error: any) {
            console.error('Failed to create topic:', error);
            if (error.payload?.bannedUntil) {
                setBanError({
                    message: error.message || 'Bạn đã bị cấm tham gia diễn đàn.',
                    bannedUntil: error.payload.bannedUntil,
                    banReason: error.payload.banReason || 'Vi phạm tiêu chuẩn cộng đồng'
                });
            } else {
                toast.error(error.message || 'Có lỗi xảy ra khi tạo chủ đề');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDF8EE] pb-20 pt-20">
            <div className="max-w-7xl mx-auto px-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center cursor-pointer gap-2 text-slate-400 hover:text-amber-600 font-black uppercase tracking-[0.2em] text-[10px] mb-8 transition-colors group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Quay lại
                </button>

                <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-900/5 border border-gray-100 overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-slate-900 p-8 md:p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">

                                <h1 className="text-2xl md:text-3xl font-bold">Tạo Thảo Luận Của Bạn<span className="text-amber-500">.</span></h1>
                            </div>
                            <p className="text-white/50 text-sm font-medium max-w-md">
                                Hãy chia sẻ thắc mắc hoặc kiến thức của bạn với cộng đồng. Một tiêu đề rõ ràng sẽ giúp bạn nhận được phản hồi nhanh hơn.
                            </p>
                        </div>
                    </div>

                    {user?.chatBannedUntil && new Date(user.chatBannedUntil) > new Date() ? (
                        <div className="p-12 text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-100">
                                <ShieldOff size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Tài khoản bị hạn chế</h3>
                            <p className="text-gray-500 font-bold max-w-md mx-auto mb-8">
                                Bạn hiện đang bị cấm tạo chủ đề mới trên thảo luận đến ngày <span className="text-red-500">{new Date(user.chatBannedUntil).toLocaleDateString('vi-VN')}</span>.
                                <br />Lý do: <span className="text-slate-900">{user.chatBanReason || 'Vi phạm tiêu chuẩn cộng đồng'}</span>
                            </p>
                            <button
                                onClick={() => navigate('/forum')}
                                className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-gray-200 transition-all cursor-pointer"
                            >
                                Quay về trang thảo luận
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
                            {/* Title Input */}
                            <div className="space-y-3">
                                <label className="text-md font-bold text-gray-500 ml-2">Tiêu đề chủ đề</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: 'Cách giải quyết lỗi 404 khi gọi API trong React'..."
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-[24px] px-8 py-5 text-base font-medium transition-all outline-none"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            {/* Type Selection */}
                            <div className="space-y-3">
                                <label className="text-md font-bold text-gray-500 ml-2">Phạm vi thảo luận</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                    {[
                                        { id: 'global', label: 'Cộng đồng chung', icon: Globe, desc: 'Mọi người đều thấy' },
                                        { id: 'course', label: 'Trong khóa học', icon: Book, desc: 'Giới hạn trong khóa học', disabled: !initialCourseId && formData.type !== 'course' },
                                        { id: 'lecture', label: 'Trong bài giảng', icon: MessageCircle, desc: 'Chi tiết từng bài học', disabled: !initialLectureId && formData.type !== 'lecture' }
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            disabled={type.disabled}
                                            onClick={() => setFormData({ ...formData, type: type.id as ForumType })}
                                            className={`flex flex-col items-center justify-center p-6 rounded-[32px] border-2 transition-all gap-3 ${formData.type === type.id
                                                ? 'bg-amber-50 border-amber-500 shadow-xl shadow-amber-500/10'
                                                : type.disabled
                                                    ? 'opacity-30 cursor-not-allowed border-gray-50'
                                                    : 'bg-white border-gray-100 hover:border-amber-200'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-2xl ${formData.type === type.id ? 'bg-amber-500 text-white' : 'bg-gray-50 text-gray-400'}`}>
                                                <type.icon size={20} />
                                            </div>
                                            <div className="text-center">
                                                <span className={`block text-sm font-bold ${formData.type === type.id ? 'text-amber-600' : 'text-slate-600'}`}>{type.label}</span>
                                                <span className="text-[9px] font-bold text-gray-400 mt-1 block">{type.desc}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Input */}
                            <div className="space-y-3">
                                <label className="text-md font-bold text-gray-500 ml-2">Nội dung chi tiết</label>
                                <textarea
                                    rows={8}
                                    placeholder="Mô tả kỹ vấn đề của bạn, kèm theo code ví dụ (nếu có) để mọi người dễ dàng hỗ trợ nhé..."
                                    className="w-full mt-3 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-[32px] px-8 py-6 text-base font-medium transition-all outline-none resize-none custom-scrollbar"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>

                            {/* Advice Card */}
                            <div className="bg-blue-50/50 rounded-[32px] p-6 flex gap-5 border border-blue-100">
                                <div className="w-12 h-12  rounded-2xl flex items-center justify-center text-blue-500">
                                    <HelpCircle size={20} />
                                </div>
                                <div>
                                    <h5 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1">Mẹo nhỏ</h5>
                                    <p className="text-xs text-blue-500/80 font-bold leading-relaxed">
                                        Thêm các từ khóa chuyên môn hoặc tên bài tập để bài viết của bạn dễ được tìm thấy hơn bởi những người có cùng sự quan tâm.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6">
                                <div className="flex items-center gap-2 text-red-400">
                                    <AlertCircle size={14} />
                                    <span className="text-sm font-bold leading-none">Vui lòng tuân thủ nội quy cộng đồng</span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-10 cursor-pointer py-5 bg-slate-900 text-white rounded-[24px] font-bold text-md shadow-2xl shadow-slate-900/20 hover:bg-amber-500 transition-all active:scale-95 flex items-center gap-3 group disabled:opacity-50"
                                >
                                    {loading ? 'Đang gửi bài...' : 'Đăng bài'}
                                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Ban Notification Modal */}
            {banError && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden scale-in-center border border-red-100 relative">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                        <div className="p-8 text-center relative z-10">
                            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-xl shadow-red-500/10">
                                <ShieldOff size={44} />
                            </div>

                            <h3 className="text-2xl font-bold text-slate-800 mb-2 uppercase">Quyền truy cập bị chặn</h3>

                            <div className="bg-red-50/50 rounded-3xl p-6 mb-8 border border-red-100/50">
                                <p className="text-red-600 font-bold text-sm leading-relaxed mb-4">
                                    {banError.message}
                                </p>

                                <div className="space-y-4 text-left">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                            <AlertCircle size={16} className="text-red-400" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-slate-400">Thời hạn cấm đến</span>
                                            <span className="text-sm font-black text-slate-700">{new Date(banError.bannedUntil).toLocaleDateString('vi-VN', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                            <ShieldOff size={16} className="text-red-400" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-slate-400">Lý do kỷ luật</span>
                                            <span className="text-sm font-bold text-slate-600">{banError.banReason}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setBanError(null);
                                    navigate('/forum');
                                }}
                                className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-bold text-lg shadow-2xl shadow-slate-900/20 hover:bg-amber-500 transition-all active:scale-95 cursor-pointer"
                            >
                                Đã hiểu
                            </button>
                        </div>


                    </div>
                </div>
            )}
        </div>
    );
};

export default NewTopic;
