import React, { useEffect, useState, useMemo } from 'react';
import { Search, MessageSquare, Plus, ChevronRight, Filter, Users, Globe, Book, MessageCircle, Clock, Star } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { forumService } from '../services/forum.service';
import type { ForumTopic, ForumType, ForumStats, TopContributor } from '../services/forum.service';
import { safeFormatDistanceToNow } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Forum: React.FC = () => {
    const [topics, setTopics] = useState<ForumTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeType, setActiveType] = useState<ForumType | 'all'>('all');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Stats and contributors
    const [stats, setStats] = useState<ForumStats | null>(null);
    const [contributors, setContributors] = useState<TopContributor[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);

    const courseId = searchParams.get('courseId');

    useEffect(() => {
        fetchTopics();
        fetchStats();
        fetchContributors();
    }, [activeType, courseId]);

    const fetchTopics = async () => {
        try {
            setLoading(true);
            const response = await forumService.getTopics({
                type: activeType === 'all' ? undefined : activeType,
                courseId: courseId || undefined,
                limit: 20
            });
            setTopics(response.topics);
        } catch (error) {
            console.error('Failed to fetch topics:', error);
            toast.error('Không thể tải danh sách chủ đề');
            setTopics([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            const data = await forumService.getForumStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch forum stats:', error);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchContributors = async () => {
        try {
            const data = await forumService.getTopContributors(5);
            setContributors(data);
        } catch (error) {
            console.error('Failed to fetch contributors:', error);
            setContributors([]);
        }
    };

    const filteredTopics = useMemo(() => {
        if (!searchTerm) return topics;
        return topics.filter(t =>
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.author?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [topics, searchTerm]);

    const getTypeIcon = (type: ForumType) => {
        switch (type) {
            case 'global': return <Globe size={14} className="text-blue-500" />;
            case 'course': return <Book size={14} className="text-amber-500" />;
            case 'lecture': return <MessageCircle size={14} className="text-emerald-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-[#FDF8EE] pb-20">
            {/* Header / Hero */}
            <div className="bg-slate-900 pt-32 pb-40 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">

                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight italic">
                        Thảo luận & <span className="text-amber-500">Hỏi đáp.</span>
                    </h1>
                    <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                        Nơi kết nối hàng ngàn học viên và chuyên gia. Đừng ngần ngại đặt câu hỏi, mỗi thắc mắc là một cơ hội để phát triển.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-20">
                {/* Control Bar */}
                <div className="bg-white p-4 md:p-8 rounded-[40px] shadow-2xl shadow-slate-900/5 border border-white mb-10">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Search */}
                        <div className="flex-1 relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm chủ đề, câu hỏi, người dùng..."
                                className="w-full bg-gray-50 border border-transparent rounded-[24px] py-4 pl-16 pr-6 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 focus:bg-white transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            {[
                                { id: 'all', label: 'Tất cả', icon: Filter },
                                { id: 'global', label: 'Cộng đồng', icon: Globe },
                                { id: 'course', label: 'Khóa học', icon: Book },
                                { id: 'lecture', label: 'Bài giảng', icon: MessageCircle },
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setActiveType(type.id as any)}
                                    className={`flex items-center cursor-pointer gap-2 px-5 py-3 rounded-2xl text-xs font-medium transition-all active:scale-95 ${activeType === type.id
                                        ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    <type.icon size={14} />
                                    {type.label}
                                </button>
                            ))}

                            <button
                                onClick={() => {
                                    if (user?.chatBannedUntil && new Date(user.chatBannedUntil) > new Date()) {
                                        toast.error(`Tài khoản bị cấm đăng bài đến ${new Date(user.chatBannedUntil).toLocaleDateString('vi-VN')}. Lý do: ${user.chatBanReason || 'Vi phạm tiêu chuẩn cộng đồng'}`);
                                        return;
                                    }
                                    navigate('/forum/new');
                                }}
                                className="ml-auto cursor-pointer lg:ml-4 flex items-center gap-3 bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-sm font-medium shadow-xl shadow-slate-900/20 hover:bg-amber-600 transition-all active:scale-95 group"
                            >
                                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                                Đăng bài
                            </button>
                        </div>
                    </div>
                </div>

                {/* Topics Container */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main List */}
                    <div className="lg:col-span-2 space-y-4">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="bg-white rounded-[32px] p-6 h-32 animate-pulse border border-gray-100"></div>
                            ))
                        ) : filteredTopics.length > 0 ? (
                            filteredTopics.map((topic) => (
                                <div
                                    key={topic.id}
                                    onClick={() => navigate(`/forum/topic/${topic.id}`)}
                                    className="bg-white rounded-3xl p-4 md:p-4 border border-gray-100/50 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="flex gap-6">
                                        {/* Avatar Column */}
                                        <div className="hidden sm:block shrink-0">
                                            <div className="relative">
                                                <img src={topic.author?.avatar || '/default-avatar.png'} alt={topic.author?.name} className="w-14 h-14 rounded-full object-cover shadow-sm group-hover:scale-110 transition-transform duration-500" />
                                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center border-2 border-white shadow-sm ${topic.author?.role?.toUpperCase() === 'TEACHER' ? 'bg-amber-500' : 'bg-gray-900'}`}>
                                                    {topic.author?.role?.toUpperCase() === 'TEACHER' ? <Star size={10} className="text-white fill-white" /> : <Users size={10} className="text-white" />}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                                                    {getTypeIcon(topic.type)}
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase leading-none pt-0.5">
                                                        {topic.type === 'global' ? 'Chung' : topic.type === 'course' ? 'Khóa học' : 'Bài giảng'}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-300">•</span>
                                                <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {safeFormatDistanceToNow(topic.createdAt)}
                                                </span>
                                            </div>

                                            <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-3 group-hover:text-amber-600 transition-colors leading-tight">
                                                {topic.title}
                                            </h3>

                                            <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2 font-medium">
                                                {topic.content}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600">
                                                            <MessageCircle size={20} />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700">{topic.postCount}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400">
                                                            <Users size={20} />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700">{topic.views}</span>
                                                        <span className="text-[10px] text-gray-400">lượt xem</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-amber-600">
                                                    <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">Thảo luận ngay</span>
                                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-[40px] p-20 text-center border border-gray-100">
                                <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 border border-gray-100">
                                    <MessageSquare size={40} className="text-gray-200" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight mb-2">Chưa có thảo luận nào</h3>
                                <p className="text-gray-400 text-sm font-bold max-w-xs mx-auto mb-8">Hãy là người đầu tiên khơi mào cho những cuộc hội thoại thú vị!</p>
                                <button className="bg-amber-500 text-white px-8 py-4 rounded-2xl text-sm font-black shadow-xl shadow-amber-200 transition-all active:scale-95">
                                    Đặt câu hỏi đầu tiên
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Top Contributors */}
                    <div className="space-y-8">
                        {/* Stats Card */}
                        <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                            <h4 className="text-lg font-bold text-amber-500 mb-6">Thống kê</h4>
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-white/50 font-bold tracking-tight">Tổng số chủ đề</span>
                                    <span className="text-xl font-bold">{statsLoading ? '...' : (stats?.totalTopics || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-white/50 font-bold tracking-tight">Tổng bài viết</span>
                                    <span className="text-xl font-bold">{statsLoading ? '...' : (stats?.totalPosts || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-white/50 font-bold tracking-tight">Thành viên</span>
                                    <span className="text-xl font-bold">{statsLoading ? '...' : (stats?.totalUsers || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-white/50 font-bold tracking-tight">Bài viết hôm nay</span>
                                    <span className="text-xl font-bold text-amber-400">{statsLoading ? '...' : (stats?.todayPosts || 0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Top Contributors */}
                        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
                            <h4 className="text-lg font-bold text-gray-400 mb-8 px-2 flex items-center justify-between">
                                Đóng góp tích cực
                                <div className="h-1 w-8 bg-amber-500 rounded-full"></div>
                            </h4>
                            <div className="space-y-6">
                                {contributors.length > 0 ? (
                                    contributors.map((contributor) => (
                                        <div key={contributor.id} className="flex items-center gap-4 group cursor-pointer">
                                            <img src={contributor.avatar || '/default-avatar.png'} className="w-12 h-12 rounded-full object-cover hover:scale-105 transition-transform" alt="" />
                                            <div className="flex-1">
                                                <h5 className="text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-all">{contributor.name}</h5>
                                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{contributor.points} điểm</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-4">Chưa có dữ liệu</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Forum;
