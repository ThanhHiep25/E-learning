import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  MoreVertical,
  Pin,
  Trash2,
  Edit2,
  Ban,
  MessageCircleOff,
  BarChart3,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  courseChatService,
  teacherCourseChatService,
  adminCourseChatService,
  type ChatMessage,
  type ChatSession,
  type ChatAnalytics,
} from '../../services/course-chat.service';
// 🛡️ P0-6 FIX: Import XSS protection
import { sanitizeMarkdown } from '../../utils/sanitize';

interface CourseChatProps {
  courseId: string;
  userRole: 'student' | 'teacher' | 'admin';
}

const CourseChat: React.FC<CourseChatProps> = ({ courseId, userRole }) => {
  const { user } = useAuth();
  const { socket, joinRoom, leaveRoom } = useNotifications();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load chat data
  const loadChat = async () => {
    const defaultSession = {
      id: courseId,
      courseId,
      isEnabled: true,
      isActive: true,
      isMuted: false,
      pinnedMessageIds: [],
      bannedUserIds: [],
      messageCount: 0,
      participantCount: 0,
    };
    setSession(defaultSession);

    try {
      setLoading(true);
      let data;
      if (userRole === 'admin') {
        data = await adminCourseChatService.getChat(courseId);
      } else if (userRole === 'teacher') {
        data = await teacherCourseChatService.getChat(courseId);
      } else {
        data = await courseChatService.getChat(courseId);
      }
      
      if (data?.chat) {
        setSession(data.chat);
        // Sort messages by createdAt descending (newest first)
        const sortedMessages = (data.messages || []).sort(
          (a: ChatMessage, b: ChatMessage) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setMessages(sortedMessages);
      }
      setError(null);
    } catch (err) {
      console.error('[CourseChat] Failed to load chat:', err);
      setError('Không thể tải lịch sử chat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
  }, [courseId]);

  // Socket real-time updates
  useEffect(() => {
    if (!socket || !session) return;

    const roomName = `course_${session.id}`;
    joinRoom(roomName);

    const handleNewMessage = (message: ChatMessage) => {
      setMessages((prev) => [message, ...prev]);
    };

    socket.on('new_message', handleNewMessage);

    const handleConnect = () => joinRoom(roomName);
    if (!socket.connected) {
      socket.on('connect', handleConnect);
    }

    return () => {
      leaveRoom(roomName);
      socket.off('new_message', handleNewMessage);
      socket.off('connect', handleConnect);
    };
  }, [socket, session, joinRoom, leaveRoom]);

  // Scroll to top when messages change
  useEffect(() => {
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      messagesContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Send message with optimistic UI
  const handleSend = async () => {
    if (!newMessage.trim() || !session) return;

    const content = newMessage.trim();
    const parentId = replyingTo?.id;
    const tempId = `temp_${Date.now()}`;

    const optimisticMessage: ChatMessage = {
      id: tempId,
      content,
      sender: {
        id: String(user?.id) || 'temp',
        name: (user as any)?.name || (user as any)?.fullName || 'Bạn',
        avatar: (user as any)?.avatar || undefined,
        role: (user as any)?.role || 'student',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: parentId || undefined,
      isDeleted: false,
    };

    setMessages((prev) => [optimisticMessage, ...prev]);
    setNewMessage('');
    setReplyingTo(null);

    try {
      let response;
      if (userRole === 'admin' && parentId) {
        response = await adminCourseChatService.reply(courseId, content, parentId);
      } else if (userRole === 'teacher' && parentId) {
        response = await teacherCourseChatService.reply(courseId, content, parentId);
      } else {
        response = await courseChatService.sendMessage(courseId, content, parentId);
      }

      // Backend returns { data: { message, aiResponse } }
      const responseData = (response as any).data || response;
      console.log('[CourseChat] Response data:', responseData);
      const serverMsg = responseData?.message || responseData;
      const aiResponse = responseData?.aiResponse;
      console.log('[CourseChat] AI response:', aiResponse);
      
      // Replace optimistic message with server message
      setMessages((prev) => {
        const newMessages = prev.map((m) => {
          if (m.id === tempId) {
            return {
              ...m,
              ...serverMsg,
              id: serverMsg?.id || tempId,
              sender: serverMsg?.sender || m.sender,
              createdAt: serverMsg?.createdAt || m.createdAt,
            };
          }
          return m;
        });
        return newMessages;
      });
      
      // Add AI response if exists
      if (aiResponse) {
        setMessages((prev) => [aiResponse, ...prev]);
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, isFailed: true, content: m.content + ' (gửi thất bại)' } : m))
      );
      setError('Không thể gửi tin nhắn');
    }
  };

  // Edit message
  const handleEdit = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      const updated = await courseChatService.editMessage(messageId, editContent.trim());
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m)));
      setEditingMessageId(null);
      setEditContent('');
    } catch (err) {
      setError('Không thể sửa tin nhắn');
    }
  };

  // Delete message
  const handleDelete = async (messageId: string) => {
    try {
      await courseChatService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      setMenuOpen(null);
    } catch (err) {
      setError('Không thể xóa tin nhắn');
    }
  };

  // Pin/Unpin message
  const handlePin = async (messageId: string) => {
    if (!session || userRole !== 'teacher') return;

    try {
      if (session.pinnedMessageIds?.includes(messageId)) {
        await teacherCourseChatService.unpinMessage(courseId, messageId);
      } else {
        await teacherCourseChatService.pinMessage(courseId, messageId);
      }
      await loadChat();
      setMenuOpen(null);
    } catch (err) {
      setError('Không thể ghim tin nhắn');
    }
  };

  // Mute/Unmute chat
  const handleMuteToggle = async () => {
    if (!session || userRole !== 'teacher') return;

    try {
      if (session.isMuted) {
        await teacherCourseChatService.unmuteChat(courseId);
      } else {
        await teacherCourseChatService.muteChat(courseId);
      }
      await loadChat();
    } catch (err) {
      setError('Không thể thay đổi trạng thái chat');
    }
  };

  // Ban user
  const handleBanUser = async (userId: string) => {
    if (!session || userRole !== 'admin') return;

    try {
      await adminCourseChatService.banUser(courseId, userId);
      await loadChat();
      setMenuOpen(null);
    } catch (err) {
      setError('Không thể ban user');
    }
  };

  // Toggle chat
  const handleToggleChat = async () => {
    if (!session || userRole !== 'admin') return;

    try {
      await adminCourseChatService.toggleChat(courseId);
      await loadChat();
    } catch (err) {
      setError('Không thể bật/tắt chat');
    }
  };

  // Clear history
  const handleClearHistory = async () => {
    if (!session || userRole !== 'admin') return;
    if (!confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat?')) return;

    try {
      await adminCourseChatService.clearHistory(courseId);
      setMessages([]);
      await loadChat();
    } catch (err) {
      setError('Không thể xóa lịch sử');
    }
  };

  // Load analytics
  const loadAnalytics = async () => {
    if (!session || userRole !== 'teacher') return;

    try {
      const data = await teacherCourseChatService.getAnalytics(courseId);
      setAnalytics(data);
      setShowAnalytics(true);
    } catch (err) {
      setError('Không thể tải analytics');
    }
  };

  // Format timestamp
  const formatTime = (date: string | undefined) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Format date
  const formatDate = (date: string | undefined) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  // 🛡️ P0-6 FIX: Format markdown với XSS protection
  const formatMarkdown = (content: string): string => {
    return sanitizeMarkdown(content);
  };

  // Check permissions
  const canEdit = (msg: ChatMessage) => msg.sender?.id === user?.id && !msg.isDeleted;
  const canPin = () => userRole === 'teacher';
  const canBan = () => userRole === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const isChatDisabled = session?.isActive === false;

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900">Chat khóa học</h3>
          {isChatDisabled && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Đã đóng</span>
          )}
          {session?.isMuted && !isChatDisabled && (
            <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">Tạm dừng</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'teacher' && (
            <>
              <button
                onClick={handleMuteToggle}
                className={`p-2 rounded-lg transition-colors ${
                  session?.isMuted ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <MessageCircleOff size={16} />
              </button>
              <button onClick={loadAnalytics} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                <BarChart3 size={16} />
              </button>
            </>
          )}
          {userRole === 'admin' && (
            <>
              <button
                onClick={handleToggleChat}
                className={`p-2 rounded-lg transition-colors ${
                  isChatDisabled ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}
              >
                {isChatDisabled ? <MessageCircleOff size={16} /> : <Check size={16} />}
              </button>
              <button onClick={handleClearHistory} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-2 p-2 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Reply indicator */}
      {replyingTo?.sender && (
        <div className="mx-4 mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-sm">
          <div className="text-gray-600">
            Trả lời <strong>{replyingTo.sender?.name}</strong>: {replyingTo.content?.slice(0, 40)}...
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-200 rounded">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input */}
      {session && !isChatDisabled && !session.isMuted && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px]">
        {/* Pinned messages */}
        {messages
          .filter((m) => session?.pinnedMessageIds?.includes(m.id))
          .map((msg) => (
            <div key={`pinned-${msg.id}`} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-1 text-amber-600 text-xs mb-1">
                <Pin size={12} />
                <span>Tin nhắn được ghim</span>
              </div>
              <p className="text-sm text-gray-800">{msg.content}</p>
            </div>
          ))}

        {/* Regular messages */}
        {(() => {
          const messageElements: React.ReactElement[] = [];
          const processedIds = new Set<string>();
          const messageMap = new Map<string, ChatMessage>();
          messages.forEach((m) => messageMap.set(m.id, m));

          const rootMessages = messages.filter((m) => !m.parentId && !m.isDeleted && m.sender);

          const renderMessage = (msg: ChatMessage, depth: number = 0) => {
            if (processedIds.has(msg.id)) return null;
            processedIds.add(msg.id);

            const replyCount = messages.filter((m) => m.parentId === msg.id).length;
            const hasReplies = replyCount > 0;
            const replies = messages.filter((m) => m.parentId === msg.id && !m.isDeleted && m.sender);

            return (
              <div key={msg.id} className="relative">
                <div className="flex gap-3" style={{ marginLeft: `${depth * 48}px` }}>
                  <div className="relative flex flex-col items-center shrink-0 w-10 self-stretch">
                    {depth > 0 && (
                      <>
                        <div
                          className="absolute w-[2px] bg-gray-300"
                          style={{ left: '-24px', top: '-20px', height: 'calc(50% + 20px)' }}
                        />
                        <div
                          className="absolute w-5 h-5 border-l-[2px] border-b-[2px] border-gray-300"
                          style={{ left: '-24px', top: '19px', borderBottomLeftRadius: '12px' }}
                        />
                      </>
                    )}
                    <img
                      src={msg.sender?.avatar || '/default-avatar.png'}
                      alt={msg.sender?.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover relative z-10 bg-white"
                    />
                    {hasReplies && (
                      <div
                        className="absolute w-[2px] bg-gray-300"
                        style={{ left: '19px', top: '40px', height: '28px' }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pb-4">
                    <div className="font-bold text-sm text-gray-900 mb-1">
                      {msg.sender?.name || 'Unknown'}
                      {msg.sender?.role === 'teacher' && (
                        <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Giảng viên</span>
                      )}
                      {msg.sender?.role === 'admin' && (
                        <span className="ml-1 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Admin</span>
                      )}
                    </div>

                    {editingMessageId === msg.id ? (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEdit(msg.id);
                            if (e.key === 'Escape') {
                              setEditingMessageId(null);
                              setEditContent('');
                            }
                          }}
                          autoFocus
                        />
                        <button onClick={() => handleEdit(msg.id)} className="p-2 bg-amber-500 text-white rounded">
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditContent('');
                          }}
                          className="p-2 bg-gray-200 rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`inline-block px-4 py-2.5 rounded-2xl text-sm mb-2 max-w-full ${
                          (msg.sender?.role === 'ai' || msg.senderType === 'ai' || msg.sender?.id === '0') 
                            ? 'bg-amber-50 border border-amber-100 text-gray-800' 
                            : msg.sender?.id === user?.id 
                              ? 'bg-amber-500 text-white' 
                              : 'bg-gray-100 border border-gray-200 text-gray-800 whitespace-pre-wrap'
                        }`}
                        // 🛡️ P0-6 FIX: Sử dụng formatMarkdown đã có XSS protection
                        dangerouslySetInnerHTML={(msg.sender?.role === 'ai' || msg.senderType === 'ai' || msg.sender?.id === '0') ? { __html: formatMarkdown(msg.content) } : undefined}
                      >
                        {/* 🛡️ Non-AI messages: render as plain text (auto-escaped by React) */}
                        {(msg.sender?.role !== 'ai' && msg.senderType !== 'ai' && msg.sender?.id !== '0') ? msg.content : null}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="flex items-center gap-1 hover:text-amber-500 transition-colors"
                      >
                        Trả lời
                        {replyCount > 0 && <span>({replyCount})</span>}
                      </button>

                      {(() => {
                        const time = formatTime(msg.createdAt);
                        const date = formatDate(msg.createdAt);
                        if (!time && !date) return null;
                        return (
                          <>
                            <span>{time}</span>
                            {date && <span>- {date}</span>}
                          </>
                        );
                      })()}

                      <div className="relative ml-auto" ref={menuRef}>
                        <button
                          onClick={() => setMenuOpen(menuOpen === msg.id ? null : msg.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical size={14} />
                        </button>
                        {menuOpen === msg.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                            {canPin() && (
                              <button
                                onClick={() => {
                                  handlePin(msg.id);
                                  setMenuOpen(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Pin size={14} />
                                {session?.pinnedMessageIds?.includes(msg.id) ? 'Bỏ ghim' : 'Ghim'}
                              </button>
                            )}
                            {canEdit(msg) && (
                              <button
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditContent(msg.content);
                                  setMenuOpen(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit2 size={14} /> Sửa
                              </button>
                            )}
                            {canEdit(msg) && (
                              <button
                                onClick={() => {
                                  handleDelete(msg.id);
                                  setMenuOpen(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                              >
                                <Trash2 size={14} /> Xóa
                              </button>
                            )}
                            {canBan() && msg.sender?.id !== user?.id && (
                              <button
                                onClick={() => {
                                  handleBanUser(msg.sender?.id || '');
                                  setMenuOpen(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                              >
                                <Ban size={14} /> Chặn
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {hasReplies && (
                  <div className="relative pl-12">
                    <div className="absolute w-[2px] bg-gray-300 left-[19px] top-[-16px] bottom-0" />
                    {replies.map((reply) => renderMessage(reply, depth + 1))}
                  </div>
                )}
              </div>
            );
          };

          rootMessages.forEach((msg) => {
            const element = renderMessage(msg, 0);
            if (element) messageElements.push(element);
          });

          return <div className="space-y-4">{messageElements}</div>;
        })()}
        <div ref={messagesEndRef} />
      </div>

      {/* Analytics Modal */}
      {showAnalytics && analytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Analytics</h3>
              <button onClick={() => setShowAnalytics(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-500">{analytics.totalMessages}</p>
                  <p className="text-xs text-gray-500">Tin nhắn</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-500">{analytics.totalParticipants}</p>
                  <p className="text-xs text-gray-500">Người tham gia</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Tỷ lệ tương tác</p>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${analytics.engagementRate}%` }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{(analytics.engagementRate ?? 0).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseChat;
