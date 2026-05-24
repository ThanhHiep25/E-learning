import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { forumService } from '../services/forum.service';
import type { ForumTopic, ForumPost } from '../services/forum.service';
import { AtSign, Award, CheckCircle2, ChevronLeft, Clock, Flag, Ghost, Send, Smile, ThumbsUp, Trash2, X, AlertOctagon, ShieldOff, CornerDownRight, Reply, User, Loader2 } from 'lucide-react';
import { safeFormatDistanceToNow } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import toast from 'react-hot-toast';

const TopicDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { socket } = useNotifications();
    const navigate = useNavigate();
    const location = useLocation();
    const [topic, setTopic] = useState<ForumTopic | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [reportingPostId, setReportingPostId] = useState<number | null>(null);
    const [isReportingTopic, setIsReportingTopic] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState<number | 'main' | null>(null);
    const [banError, setBanError] = useState<{ message: string; bannedUntil: string; banReason: string } | null>(null);
    // 🛡️ P2-2 FIX: Track posts being liked to prevent double submit
    const [likingPosts, setLikingPosts] = useState<Set<number>>(new Set());

    const EMOJIS = ['😀', '😂', '😅', '😍', '🥳', '😎', '🤔', '😢',
        '😡', '👍', '👎', '❤️', '🔥', '👏', '🎓', '💡', '🎉', '🚀',
        '⭐', '💯', '📚', '📝', '🎯', '🏆', '🏅', '🎖️', '🌻', '🌞'];

    const handleEmojiClick = (emoji: string) => {
        setReplyContent(prev => prev + emoji);
    };

    useEffect(() => {
        if (id) fetchTopicDetails();
    }, [id]);

    useEffect(() => {
        if (!loading && topic && location.hash) {
            setTimeout(() => {
                const elm = document.getElementById(location.hash.substring(1));
                if (elm) {
                    elm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    elm.classList.add('ring-4', 'ring-red-400', 'shadow-2xl', 'shadow-red-500/20');
                    setTimeout(() => {
                        elm.classList.remove('ring-4', 'ring-red-400', 'shadow-2xl', 'shadow-red-500/20');
                    }, 3000);
                }
            }, 500); // Give it a bit of time to render the DOM
        }
    }, [loading, topic, location.hash]);

    useEffect(() => {
        if (!socket || !id) return;

        socket.on('new_post', (newPost: any) => {
            if (String(newPost.topicId) === String(id)) {
                setTopic(prev => {
                    if (!prev) return prev;
                    // Avoid duplicate if we just posted it
                    if (prev.posts?.some(p => p.id === newPost.id)) return prev;

                    return {
                        ...prev,
                        posts: [...(prev.posts || []), newPost]
                    };
                });
            }
        });

        return () => {
            socket.off('new_post');
        };
    }, [socket, id]);

    const fetchTopicDetails = async () => {
        try {
            setLoading(true);
            const data = await forumService.getTopicDetails(id!);

            if (!data || !data.topic) {
                throw new Error('Topic data is incomplete');
            }

            // Map the response to our local topic state
            // We combine topic and posts into one object to match the ForumTopic interface usage
            const mappedTopic: ForumTopic = {
                ...data.topic,
                posts: data.posts
            };

            setTopic(mappedTopic);
        } catch (error) {
            console.error('Failed to fetch topic:', error);
            // Fallback for development/demo purposes
            if (id === '1') {
                setTopic({
                    id: 1,
                    title: "Làm sao để học Javascript hiệu quả cho người mới?",
                    content: "Mình mới bắt đầu học JS, thấy nhiều khái niệm quá như Closure, Hoisting, Promises... Mọi người có lộ trình nào hay cho người mới bắt đầu không?",
                    type: 'global',
                    courseId: null,
                    lectureId: null,
                    userId: 1,
                    author: {
                        id: 1,
                        name: "Hoàng Nguyễn",
                        avatar: "/default-avatar.png",
                        role: "STUDENT"
                    },
                    views: 240,
                    postCount: 15,
                    lastPostAt: new Date().toISOString(),
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    updatedAt: new Date(Date.now() - 3600000).toISOString(),
                    isPinned: false,
                    isLocked: false,
                    posts: [
                        {
                            id: 101,
                            topicId: 1,
                            content: "Bạn nên học chắc cơ bản trước khi nhảy vào framework nhé. Hãy luyện tập nhiều với DOM.",
                            userId: 2,
                            author: {
                                id: 2,
                                name: "Minh Thu",
                                avatar: "/default-avatar.png",
                                role: "TEACHER"
                            },
                            parentId: null,
                            isSolution: true,
                            createdAt: new Date(Date.now() - 1800000).toISOString(),
                            replies: []
                        }
                    ]
                });
            } else {
                toast.error('Không tìm thấy nội dung thảo luận');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePostReply = async (parentId: number | null = null) => {
        if (!replyContent.trim()) return;
        if (!user) {
            toast.error('Bạn cần đăng nhập để thảo luận');
            return;
        }

        try {
            setSubmitting(true);
            await forumService.createPost(id!, {
                content: replyContent,
                parentId
            });

            toast.success('Đã gửi phản hồi');
            setReplyContent('');
            setReplyingTo(null);
            fetchTopicDetails(); // Refresh to show new post
        } catch (error: any) {
            console.error('Failed to create post:', error);
            if (error.payload?.bannedUntil) {
                setBanError({
                    message: error.message || 'Bạn đã bị cấm tham gia diễn đàn.',
                    bannedUntil: error.payload.bannedUntil,
                    banReason: error.payload.banReason || 'Vi phạm tiêu chuẩn cộng đồng'
                });
            } else {
                toast.error('Gửi bài thất bại');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkSolution = async (postId: number) => {
        try {
            await forumService.markAsSolution(postId);
            toast.success('Đã đánh dấu là giải pháp');
            fetchTopicDetails();
        } catch (error) {
            toast.error('Thao tác thất bại');
        }
    };

    // 🛡️ P2-2 FIX: Handle like với protection chống double submit
    const handleLike = async (postId: number) => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để thích bản tin');
            return;
        }
        
        // Prevent if already liking this post
        if (likingPosts.has(postId)) return;
        
        // Mark as liking
        setLikingPosts(prev => new Set(prev).add(postId));
        
        try {
            const res = await forumService.toggleLike(postId);

            const updateLike = (posts: ForumPost[] | undefined, id: number, likes: number): ForumPost[] | undefined => {
                if (!posts) return posts;
                return posts.map(p => {
                    if (p.id === id) return { ...p, likes };
                    if (p.replies) return { ...p, replies: updateLike(p.replies, id, likes) };
                    return p;
                });
            };

            // Updating local state optimization
            setTopic(prev => {
                if (!prev || !prev.posts) return prev;
                return {
                    ...prev,
                    posts: updateLike(prev.posts, postId, res.likes)
                };
            });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Thao tác thất bại');
        } finally {
            // Remove from liking set
            setLikingPosts(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
            });
        }
    };

    const handleDeleteTopic = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa chủ đề này?')) return;
        try {
            await forumService.deleteTopic(id!);
            toast.success('Đã xóa chủ đề');
            navigate('/forum');
        } catch (error) {
            toast.error('Xóa thất bại');
        }
    };

    const handleDeletePost = async (postId: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
        try {
            await forumService.deletePost(postId);
            toast.success('Đã xóa bình luận');
            fetchTopicDetails();
        } catch (error) {
            toast.error('Xóa thất bại');
        }
    };

    const handleReportSubmit = async () => {
        if (!isReportingTopic && !reportingPostId) return;
        if (!reportReason.trim()) {
            toast.error('Vui lòng nhập lý do báo cáo');
            return;
        }

        try {
            setSubmittingReport(true);
            if (isReportingTopic) {
                await forumService.reportTopic(id!, { reason: reportReason });
            } else {
                await forumService.reportPost(reportingPostId!, { reason: reportReason });
            }
            toast.success('Đã gửi báo cáo. Cảm ơn phản hồi của bạn!');
            setReportingPostId(null);
            setIsReportingTopic(false);
            setReportReason('');
        } catch (error) {
            toast.error('Gửi báo cáo thất bại');
        } finally {
            setSubmittingReport(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDF8EE]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Đang tải thảo luận...</p>
            </div>
        </div>
    );

    if (!topic || !topic.title) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FDF8EE]">
            <Ghost size={64} className="text-gray-300 mb-6" />
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Không tìm thấy chủ đề</h2>
            <button onClick={() => navigate('/forum')} className="mt-6 flex items-center gap-2 text-amber-600 font-bold">
                <ChevronLeft size={20} /> Quay lại diễn đàn
            </button>
        </div>
    );

    const renderReplies = (replies: ForumPost[] | undefined, depth = 0): React.ReactNode => {
        if (!replies || replies.length === 0) return null;

        return replies.map((reply) => (
            <React.Fragment key={reply.id}>
                <div className={`flex gap-4 mt-4`}>
                    <div className="shrink-0 flex items-start justify-center w-6 md:w-10">
                        <CornerDownRight size={depth === 0 ? 24 : 18} className="text-gray-200 mt-2" />
                    </div>
                    <div id={`post-${reply.id}`} className="bg-gray-50/80 rounded-[24px] p-4 md:p-6 border border-gray-100 flex-1 relative group hover:bg-white transition-all duration-300 shadow-sm">
                        <div className="flex gap-3 md:gap-4">
                            <img src={reply.author?.avatar || '/default-avatar.png'} className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs md:text-[13px] font-black text-slate-900">{reply.author?.name || 'Vô danh'}</h5>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-bold text-gray-400">{safeFormatDistanceToNow(reply.createdAt)}</span>
                                        {String(user?.id) === String(reply.userId) && (
                                            <button
                                                onClick={() => handleDeletePost(reply.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                                                title="Xóa phản hồi"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-2">
                                    {reply.content}
                                </p>
                                <div className="flex items-center mt-2">
                                    {/* 🛡️ P2-2 FIX: Disable khi đang like */}
                                    <button
                                        onClick={() => handleLike(reply.id)}
                                        disabled={likingPosts.has(reply.id)}
                                        className="flex items-center gap-1.5 group/btn py-1 px-3 hover:bg-gray-100 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {likingPosts.has(reply.id) ? (
                                            <Loader2 size={12} className="animate-spin text-blue-500" />
                                        ) : (
                                            <ThumbsUp size={12} className={`transition-colors ${reply.likes ? 'text-blue-500' : 'text-gray-400 group-hover/btn:text-blue-500'}`} />
                                        )}
                                        <span className={`text-[10px] font-black transition-colors ${reply.likes ? 'text-blue-600' : 'text-gray-400 group-hover/btn:text-slate-900'}`}>{reply.likes || 0}</span>
                                    </button>

                                    <button
                                        onClick={() => setReplyingTo(reply.id)}
                                        className="flex items-center gap-1.5 group/btn py-1 px-3 ml-2 hover:bg-amber-100 rounded-lg transition-all cursor-pointer"
                                    >
                                        <Reply size={12} className="text-gray-400 group-hover/btn:text-amber-600 transition-colors" />
                                        <span className="text-[10px] font-black text-gray-400 group-hover/btn:text-amber-600">Phản hồi</span>
                                    </button>

                                    {user && String(user.id) !== String(reply.userId) && (
                                        <button
                                            onClick={() => setReportingPostId(reply.id)}
                                            className="flex items-center gap-1.5 group/btn py-1 px-3 ml-2 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                        >
                                            <Flag size={12} className="text-gray-400 group-hover/btn:text-red-500 transition-colors" />
                                            <span className="text-[10px] font-black text-gray-400 group-hover/btn:text-red-500">Báo cáo</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inline Reply Input for Nested Comment */}
                {replyingTo === reply.id && (
                    <div className={`mt-2 mb-4 bg-white rounded-[24px] p-3 md:p-4 border-2 border-amber-200 shadow-xl shadow-amber-500/5 animate-in slide-in-from-top-4 duration-300 ml-8 md:ml-12`}>
                        {user?.chatBannedUntil && new Date(user.chatBannedUntil) > new Date() ? (
                            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600">
                                <AlertOctagon size={20} />
                                <div className="text-sm font-bold">
                                    Tài khoản của bạn đã bị cấm đăng bài đến {new Date(user.chatBannedUntil).toLocaleDateString('vi-VN')}. Lý do: {user.chatBanReason || 'Vi phạm tiêu chuẩn cộng đồng'}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-2 px-2">
                                    <AtSign size={10} className="text-amber-500" />
                                    <span className="text-xs font-bold text-amber-500">Đang trả lời {reply.author?.name || 'Vô danh'}</span>
                                </div>
                                <div className="flex gap-2 md:gap-3">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Viết phản hồi của bạn..."
                                        className="flex-1 bg-gray-50 border-none focus:outline-none rounded-xl px-3 md:px-4 text-xs md:text-sm focus:ring-0"
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handlePostReply(reply.id)}
                                    />
                                    <div className="flex gap-1 shrink-0 relative">
                                        <button
                                            onClick={() => setShowEmojiPicker(showEmojiPicker === reply.id ? null : reply.id)}
                                            className="p-2 md:p-3 text-gray-400 cursor-pointer hover:text-amber-500 transition-colors"
                                        >
                                            <Smile size={16} />
                                        </button>
                                        {showEmojiPicker === reply.id && (
                                            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 p-2 grid grid-cols-4 gap-1 z-50 animate-in fade-in slide-in-from-bottom-2 w-max">
                                                {EMOJIS.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleEmojiClick(emoji)}
                                                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-lg text-lg transition-colors cursor-pointer"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => { setReplyingTo(null); setReplyContent(''); setShowEmojiPicker(null); }}
                                            className="p-2 md:p-3 text-gray-400 cursor-pointer hover:text-red-500 transition-colors"
                                        >
                                            <Ghost size={16} />
                                        </button>
                                        <button
                                            disabled={submitting}
                                            onClick={() => handlePostReply(reply.id)}
                                            className="p-2 md:p-3 cursor-pointer bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-200 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {reply.replies && reply.replies.length > 0 && (
                    <div className={`ml-8 md:ml-12 border-l-2 border-gray-100 pl-2`}>
                        {renderReplies(reply.replies, depth + 1)}
                    </div>
                )}
            </React.Fragment>
        ));
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 pt-20">
            <div className="max-w-7xl mx-auto px-6">
                {/* Navigation & Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-amber-600 font-black uppercase tracking-[0.2em] text-[10px] transition-colors group cursor-pointer"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Quay lại
                    </button>

                    {(user?.role?.toUpperCase() === 'TEACHER' || user?.role?.toUpperCase() === 'ADMIN' || String(user?.id) === String(topic.userId)) && (
                        <button
                            onClick={handleDeleteTopic}
                            className="flex items-center gap-2 text-red-400 hover:text-red-500 font-bold text-md transition-colors cursor-pointer"
                        >
                            <Trash2 size={16} />
                            Xóa chủ đề
                        </button>
                    )}
                </div>

                {/* Main Topic Card - Light theme for better readability */}
                <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-lg border border-slate-100 relative overflow-hidden mb-8">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>

                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center gap-4 mb-8">
                            <div className="px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-full flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${topic.type === 'global' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}></span>
                                <span className="text-sm font-bold text-slate-600">
                                    {topic.type === 'global' ? 'Thảo luận chung' : (topic.courseId ? `Khóa học #${topic.courseId}` : 'Khóa học')}
                                </span>
                            </div>
                            <span className="text-slate-300">•</span>
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <Clock size={12} />
                                {safeFormatDistanceToNow(topic.createdAt)}
                            </div>
                        </div>

                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-8 text-slate-800">
                            {topic.title}
                        </h1>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10 pb-10 border-b border-slate-100">
                            <div className="flex items-center gap-4 flex-1">
                                <img src={topic.author?.avatar || '/default-avatar.png'} className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white" alt="" />
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800">{topic.author?.name || 'Vô danh'}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{topic.author?.role || 'Học viên'}</span>
                                        {topic.author?.role?.toUpperCase() === 'TEACHER' && <Award size={14} className="text-amber-500" />}
                                    </div>
                                </div>
                            </div>

                            {user && String(user.id) !== String(topic.userId) && (
                                <button
                                    onClick={() => setIsReportingTopic(true)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-xl transition-all border border-slate-200 flex items-center gap-2 cursor-pointer group"
                                >
                                    <Flag size={14} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold">Báo cáo chủ đề</span>
                                </button>
                            )}
                        </div>

                        <div className="text-base md:text-lg leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
                            {topic.content}
                        </div>
                    </div>
                </div>

                {/* Discussion List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-8 px-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center border border-gray-100 text-slate-900 font-bold">
                                {topic.postCount || 0}
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">
                                Bình luận
                            </h2>
                        </div>
                    </div>

                    <div className="space-y-6 bg-white rounded-3xl md:p-0 p-4">
                        {topic.posts?.filter(p => !p.parentId).map((post) => (
                            <div key={post.id} className="space-y-4 ">
                                {/* Top Level Comment */}
                                <div id={`post-${post.id}`} className={`p-2 md:p-4 border-b border-gray-100 transition-all duration-500 relative group rounded-3xl ${post.isSolution ? 'ring-2 ring-amber-500/50 shadow-xl shadow-amber-500/10' : ''}`}>
                                    {post.isSolution && (
                                        <div className="absolute top-0 right-12 -translate-y-1/2 bg-amber-500 text-white px-2 py-1 rounded-2xl shadow-xl flex items-center gap-2 z-10">
                                            <CheckCircle2 size={16} />
                                            <span className="text-[10px] font-medium">Giải đáp hay</span>
                                        </div>
                                    )}

                                    <div className="flex gap-6">
                                        <div className="shrink-0 hidden sm:block">
                                            <div className="relative">
                                                <img src={post.author?.avatar || '/default-avatar.png'} className="w-12 h-12 rounded-full object-cover shadow-sm" alt="" />
                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border-2 border-white flex items-center justify-center ${post.author?.role?.toUpperCase() === 'TEACHER' ? 'bg-amber-500' : 'bg-slate-900'}`}>
                                                    {post.author?.role?.toUpperCase() === 'TEACHER' ? <Award size={10} className="text-white" /> : <User size={10} className="text-white" />}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className='flex items-center justify-between w-full'>
                                                    <h5 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                                        {post.author?.name || 'Vô danh'}
                                                        {post.author?.role?.toUpperCase() === 'TEACHER' && <span className="text-[9px] font-black text-amber-500">(Giảng viên)</span>}
                                                    </h5>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-[10px] font-bold text-gray-400">{safeFormatDistanceToNow(post.createdAt)}</p>
                                                        {String(user?.id) === String(post.userId) && (
                                                            <button
                                                                onClick={() => handleDeletePost(post.id)}
                                                                className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                                                                title="Xóa bình luận"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-sm md:text-base text-slate-600 font-medium leading-relaxed whitespace-pre-wrap mb-1">
                                                {post.content}
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    {/* 🛡️ P2-2 FIX: Disable khi đang like */}
                                                    <button
                                                        onClick={() => handleLike(post.id)}
                                                        disabled={likingPosts.has(post.id)}
                                                        className="flex items-center gap-2 group/btn px-4 py-2 hover:bg-gray-50 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {likingPosts.has(post.id) ? (
                                                            <Loader2 size={14} className="animate-spin text-blue-500" />
                                                        ) : (
                                                            <ThumbsUp size={14} className="text-gray-400 group-hover/btn:text-blue-500 transition-colors" />
                                                        )}
                                                        <span className="text-xs font-black text-gray-400 group-hover/btn:text-slate-900">{post.likes || 0}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setReplyingTo(post.id)}
                                                        className="flex items-center gap-2 group/btn px-4 py-2 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                                                    >
                                                        <Reply size={14} className="text-gray-400 group-hover/btn:text-amber-600 transition-colors" />
                                                        <span className="text-xs font-black text-gray-400 group-hover/btn:text-amber-600">Phản hồi</span>
                                                    </button>

                                                    {user && String(user.id) !== String(post.userId) && (
                                                        <button
                                                            onClick={() => setReportingPostId(post.id)}
                                                            className="flex items-center gap-2 group/btn px-4 py-2 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                                        >
                                                            <Flag size={14} className="text-gray-400 group-hover/btn:text-red-500 transition-colors" />
                                                            <span className="text-xs font-black text-gray-400 group-hover/btn:text-red-500">Báo cáo</span>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Teacher/Author can mark as solution */}
                                                {((user?.role === 'TEACHER' && topic.courseId) || String(user?.id) === String(topic.userId)) && !topic.posts?.some(p => p.isSolution) && (
                                                    <button
                                                        onClick={() => handleMarkSolution(post.id)}
                                                        className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-bold text-[10px] px-4 py-2 bg-amber-50 rounded-xl transition-all"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        Câu trả lời hay
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                { /* Nested Replies Recursive Implementation */}
                                {post.replies && post.replies.length > 0 && (
                                    <div className="ml-8 md:ml-20 mt-4 border-l-2 border-gray-100 pl-2">
                                        {renderReplies(post.replies, 0)}
                                    </div>
                                )}

                                {/* Inline Reply Input */}
                                {replyingTo === post.id && (
                                    <div className="ml-8 md:ml-20 bg-white rounded-[28px] p-4 border-2 border-amber-200 shadow-xl shadow-amber-500/5 animate-in slide-in-from-top-4 duration-300">
                                        {user?.chatBannedUntil && new Date(user.chatBannedUntil) > new Date() ? (
                                            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600">
                                                <AlertOctagon size={20} />
                                                <div className="text-sm font-bold">
                                                    Tài khoản bị cấm phản hồi đến {new Date(user.chatBannedUntil).toLocaleDateString('vi-VN')}. Lý do: {user.chatBanReason || 'Vi phạm tiêu chuẩn cộng đồng'}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2 mb-2 px-2">
                                                    <AtSign size={10} className="text-amber-500" />
                                                    <span className="text-sm font-bold text-amber-500">Đang trả lời {post.author?.name || 'Vô danh'}</span>
                                                </div>
                                                <div className="flex gap-3">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Viết phản hồi của bạn..."
                                                        className="flex-1 bg-gray-50 border-none focus:outline-none rounded-xl px-4 text-sm focus:ring-0"
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handlePostReply(post.id)}
                                                    />
                                                    <div className="flex gap-1 relative">
                                                        <button
                                                            onClick={() => setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id)}
                                                            className="p-3 text-gray-400 cursor-pointer hover:text-amber-500 transition-colors"
                                                        >
                                                            <Smile size={18} />
                                                        </button>
                                                        {showEmojiPicker === post.id && (
                                                            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 p-2 grid grid-cols-4 gap-1 z-50 animate-in fade-in slide-in-from-bottom-2 w-max">
                                                                {EMOJIS.map(emoji => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={() => handleEmojiClick(emoji)}
                                                                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-lg text-lg transition-colors cursor-pointer"
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => { setReplyingTo(null); setReplyContent(''); setShowEmojiPicker(null); }}
                                                            className="p-3 text-gray-400 cursor-pointer hover:text-red-500 transition-colors"
                                                        >
                                                            <Ghost size={18} />
                                                        </button>
                                                        <button
                                                            disabled={submitting}
                                                            onClick={() => handlePostReply(post.id)}
                                                            className="p-3 cursor-pointer bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-200 active:scale-95 transition-all disabled:opacity-50"
                                                        >
                                                            <Send size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Reply Box (Float at bottom) */}
                {!replyingTo && (
                    <div className="sticky bottom-8 left-0 right-0 mt-16 z-30">
                        <div className="bg-white rounded-3xl p-2 md:p-4 border border-white/5 backdrop-blur-xl bg-opacity-95 shadow-2xl shadow-slate-900/5">
                            {user?.chatBannedUntil && new Date(user.chatBannedUntil) > new Date() ? (
                                <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600">
                                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                                        <ShieldOff size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-black uppercase tracking-wider">Tài khoản bị tạm khóa quyền thảo luận</h4>
                                        <p className="text-xs font-bold opacity-80 mt-0.5">
                                            Thời hạn đến: {new Date(user.chatBannedUntil).toLocaleDateString('vi-VN')} • Lý do: {user.chatBanReason || 'Vi phạm tiêu chuẩn cộng đồng'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="hidden sm:block shrink-0">
                                        <img src={user?.avatar || '/default-avatar.png'} className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shadow-sm" alt="" />
                                    </div>
                                    <div className="flex-1 relative">
                                        <textarea
                                            rows={1}
                                            placeholder="Nhập phản hồi của bạn để bắt đầu thảo luận..."
                                            className="w-full bg-slate-50/80 border-none focus:outline-none rounded-2xl py-4 px-6 text-sm placeholder-gray-400 focus:ring-2 focus:ring-amber-500/30 resize-none custom-scrollbar shadow-inner"
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2 relative">
                                        <button
                                            onClick={() => setShowEmojiPicker(showEmojiPicker === 'main' ? null : 'main')}
                                            className="p-4 bg-slate-50 text-slate-400 hover:text-amber-500 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer flex items-center justify-center border border-slate-100"
                                        >
                                            <Smile size={20} />
                                        </button>

                                        {showEmojiPicker === 'main' && (
                                            <div className="absolute bottom-full right-0 mb-4 bg-white rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-100 p-3 grid grid-cols-4 sm:grid-cols-8 gap-1 z-50 animate-in fade-in slide-in-from-bottom-2 w-max">
                                                {EMOJIS.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleEmojiClick(emoji)}
                                                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-xl transition-colors cursor-pointer hover:scale-110"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            disabled={submitting || !replyContent.trim()}
                                            onClick={() => handlePostReply(null)}
                                            className="px-8 py-4 bg-amber-500 text-white cursor-pointer rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none group flex items-center gap-3"
                                        >
                                            <span className="hidden md:block text-sm font-bold">Gửi</span>
                                            <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Report Modal */}
            {(reportingPostId || isReportingTopic) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden shadow-red-500/10 border border-red-100">
                        <div className="bg-red-50 p-6 flex items-center gap-4 relative">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                                <Flag size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">
                                    {isReportingTopic ? 'Báo cáo chủ đề' : 'Báo cáo bình luận'}
                                </h3>
                                <p className="text-xs font-bold text-red-500/80">Cho chúng tôi biết vấn đề gặp phải</p>
                            </div>
                            <button
                                onClick={() => { setReportingPostId(null); setIsReportingTopic(false); setReportReason(''); }}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-slate-800 hover:bg-white rounded-full transition-all cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <textarea
                                autoFocus
                                rows={4}
                                placeholder="Viết lý do báo cáo của bạn (ví dụ: ngôn từ thô tục, spam, tấn công cá nhân...)"
                                className="w-full bg-gray-50 border border-gray-100 focus:border-red-300 focus:outline-none rounded-2xl p-4 text-sm focus:ring-4 focus:ring-red-500/10 resize-none custom-scrollbar mb-6"
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => { setReportingPostId(null); setIsReportingTopic(false); setReportReason(''); }}
                                    className="px-6 py-3 font-bold text-slate-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    disabled={submittingReport || !reportReason.trim()}
                                    onClick={handleReportSubmit}
                                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submittingReport ? 'Đang gửi...' : 'Gửi báo cáo'}
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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

                            <h3 className="text-2xl font-bold text-slate-800 mb-3 uppercase">Quyền truy cập bị chặn</h3>

                            <div className="bg-red-50/50 rounded-3xl p-6 mb-8 border border-red-100/50">
                                <p className="text-red-600 font-bold text-sm leading-relaxed mb-4">
                                    {banError.message}
                                </p>

                                <div className="space-y-4 text-left">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                            <Clock size={16} className="text-red-400" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-slate-400">Thời hạn cấm đến</span>
                                            <span className="text-sm font-bold text-slate-700">{new Date(banError.bannedUntil).toLocaleDateString('vi-VN', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                            <AlertOctagon size={16} className="text-red-400" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-slate-400">Lý do kỷ luật</span>
                                            <span className="text-sm font-bold text-slate-600">{banError.banReason}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setBanError(null)}
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

export default TopicDetails;
