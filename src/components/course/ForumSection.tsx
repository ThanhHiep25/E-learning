import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { forumService } from '../../services/forum.service';
import type { ForumTopic, ForumType } from '../../services/forum.service';
import {
    MessageSquare, Plus, ChevronRight,
    MessageCircle, LoaderCircle, ArrowRight
} from 'lucide-react';
import { safeFormatDistanceToNow } from '../../utils/dateUtils';

interface ForumSectionProps {
    courseId: number | string;
    lectureId?: number | string;
    type: ForumType;
}

const ForumSection: React.FC<ForumSectionProps> = ({ courseId, lectureId, type }) => {
    const [topics, setTopics] = useState<ForumTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const { socket, joinRoom, leaveRoom } = useNotifications();
    const navigate = useNavigate();

    useEffect(() => {
        fetchTopics();

        // Join course room for real-time topics
        if (courseId && type === 'course') {
            const roomName = `course_${courseId}`;
            joinRoom(roomName);

            if (socket) {
                socket.on('new_topic', (newTopic: any) => {
                    if (String(newTopic.courseId) === String(courseId)) {
                        setTopics(prev => [newTopic, ...prev]);
                    }
                });
            }

            return () => {
                leaveRoom(roomName);
                if (socket) socket.off('new_topic');
            };
        }
    }, [courseId, lectureId, type, socket]);

    const fetchTopics = async () => {
        try {
            setLoading(true);
            const response = await forumService.getTopics({
                courseId,
                lectureId,
                type,
                limit: 5
            });
            setTopics(response.topics);
        } catch (error) {
            console.error('Failed to fetch forum topics:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center text-amber-500 border border-amber-100">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 ">Thảo luận bài học</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{topics.length} câu hỏi đang mở</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate(`/forum/new?courseId=${courseId}&lectureId=${lectureId}&type=${type}`)}
                    className="p-2.5 bg-slate-900 cursor-pointer text-white rounded-xl shadow-lg shadow-slate-900/10 hover:bg-amber-500 transition-all active:scale-95"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <LoaderCircle className="animate-spin text-amber-500" size={32} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Đang tải thảo luận...</span>
                    </div>
                ) : topics.length > 0 ? (
                    topics.map(topic => (
                        <div
                            key={topic.id}
                            onClick={() => navigate(`/forum/topic/${topic.id}`)}
                            className="p-5 rounded-[28px] border border-gray-50 hover:border-amber-100 hover:bg-amber-50/30 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <img src={topic.author?.avatar || '/default-avatar.png'} className="w-6 h-6 rounded-lg object-cover" alt="" />
                                <span className="text-[10px] font-bold text-slate-700">{topic.author?.name || 'Vô danh'}</span>
                                <span className="text-gray-300 ml-auto">•</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase">{safeFormatDistanceToNow(topic.createdAt)}</span>
                            </div>
                            <h4 className="text-[13px] font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors tracking-tight leading-snug">
                                {topic.title}
                            </h4>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-1.5">
                                    <MessageCircle size={14} className="text-gray-300" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{topic.postCount}</span>
                                </div>
                                <div className="flex items-center gap-1.5 ml-auto opacity-0 group-hover:opacity-100 transition-all">
                                    <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Xem ngay</span>
                                    <ChevronRight size={14} className="text-amber-600" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center px-10">
                        <div className="w-16 h-16 bg-gray-50 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                            <MessageCircle size={30} className="text-gray-200" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-400 mb-2">Chưa có thắc mắc</h4>
                        <p className="text-[10px] text-gray-300 font-bold leading-relaxed mb-6">Đừng ngần ngại trở thành người đầu tiên đặt câu hỏi cho bài giảng này!</p>
                        <button
                            onClick={() => navigate(`/forum/new?courseId=${courseId}&lectureId=${lectureId}&type=${type}`)}
                            className="bg-gray-50 text-gray-500 cursor-pointer px-6 py-3 rounded-xl text-sm font-bold hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                        >
                            Hãy là người đầu tiên bình luận
                        </button>
                    </div>
                )}
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-gray-50">
                <button
                    onClick={() => navigate(`/forum?courseId=${courseId}`)}
                    className="w-full flex items-center justify-center gap-3 text-sm font-bold text-gray-500 cursor-pointer hover:text-amber-600 transition-all group"
                >
                    Tất cả thảo luận khóa học
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default ForumSection;
