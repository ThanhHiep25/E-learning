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
  lectureChatService,
  teacherChatService,
  adminChatService,
  type ChatMessage,
  type ChatSession,
  type ChatAnalytics,
} from '../../services/lecture-chat.service';
// 🛡️ P0-6 FIX: Import XSS protection
import { sanitizeMarkdown } from '../../utils/sanitize';

interface LectureChatProps {
  lessonId: string;
  courseId?: string;
  userRole: 'student' | 'teacher' | 'admin';
}

const LectureChat: React.FC<LectureChatProps> = ({ lessonId, courseId, userRole }) => {
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

  // Load chat data once on mount - use default session immediately for socket
  const loadChat = async () => {
    // Set default session immediately so socket can join room
    const defaultSession = {
      id: lessonId, // Use lessonId as chatId for socket room
      lessonId,
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
      const data = await lectureChatService.getLessonChat(lessonId, courseId);
      console.log('[Chat] API response data:', data);
      
      // If API returns chat, update session
      if (data?.chat) {
        setSession(data.chat);
        setMessages(data.messages || []);
      }
      setError(null);
    } catch (err) {
      console.error('[Chat] Failed to load chat:', err);
      setError('Không thể tải lịch sử chat, nhưng bạn vẫn có thể gửi tin nhắn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
  }, [lessonId]);

  // Socket real-time updates - setup once and keep listeners
  useEffect(() => {
    if (!socket || !session) {
      return;
    }

    const roomName = `lesson_${session.id}`;
    
    // Always try to join room immediately
    joinRoom(roomName);

    // Listen for new messages
    const handleNewMessage = (message: ChatMessage) => {
      // Merge with current user info if this is user's own message (backend may send incomplete sender)
      const enrichedMessage = message.sender?.id === user?.id
        ? {
            ...message,
            sender: {
              ...message.sender,
              name: (user as any)?.fullName || (user as any)?.name || message.sender?.name,
              avatar: (user as any)?.avatar || message.sender?.avatar,
            },
          }
        : message;
      
      setMessages((prev) => {
        // Deduplicate: skip if message with same id already exists
        if (prev.find((m) => String(m.id) === String(enrichedMessage.id))) return prev;
        return [enrichedMessage, ...prev];
      });
    };

    socket.on('new_message', handleNewMessage);

    // If not connected yet, also listen for connect event
    const handleConnect = () => {
      joinRoom(roomName);
    };

    if (!socket.connected) {
      socket.on('connect', handleConnect);
    }

    return () => {
      leaveRoom(roomName);
      socket.off('new_message', handleNewMessage);
      socket.off('connect', handleConnect);
    };
  }, [socket, session, joinRoom, leaveRoom, user]);

  // Scroll to top when messages change (newest messages at top)
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

  // Send message - Optimistic UI: show immediately, send API in background
  const handleSend = async () => {
    if (!newMessage.trim() || !session) {
      return;
    }

    const content = newMessage.trim();
    const parentId = replyingTo?.id;
    const tempId = `temp_${Date.now()}`;
    
    // Optimistic update: add message to UI immediately with full required fields
    const optimisticMessage: ChatMessage = {
      id: tempId,
      content: content,
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
    
    setMessages((prev) => [optimisticMessage, ...prev]); // Add to beginning since UI renders newest first
    setNewMessage('');
    setReplyingTo(null);

    // Send to API in background
    try {
      const response = await lectureChatService.sendMessage(
        session.id,
        content,
        parentId
      );
      
      // Backend returns { data: { message, aiResponse } }
      const responseData = (response as any).data || response;
      const serverMsg = responseData?.message || responseData;
      
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
        // Also add AI response directly from HTTP response if available (fallback when socket not working)
        const aiMsg = responseData?.aiResponse;
        if (aiMsg && !newMessages.find((m) => String(m.id) === String(aiMsg.id))) {
          return [
            {
              ...aiMsg,
              sender: aiMsg.sender || { id: '0', name: 'AI Trợ Giảng', avatar: null, role: 'ai' },
            },
            ...newMessages,
          ];
        }
        return newMessages;
      });
    } catch (err) {
      // Mark message as failed but keep it visible
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
      const updated = await lectureChatService.editMessage(messageId, editContent.trim());
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m))
      );
      setEditingMessageId(null);
      setEditContent('');
    } catch (err) {
      setError('Không thể sửa tin nhắn');
    }
  };

  // Delete message
  const handleDelete = async (messageId: string) => {
    try {
      await lectureChatService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      setMenuOpen(null);
    } catch (err) {
      setError('Không thể xóa tin nhắn');
    }
  };

  // Pin/Unpin message (Teacher only)
  const handlePin = async (messageId: string) => {
    if (!session || userRole !== 'teacher') return;

    try {
      if (session.pinnedMessageIds?.includes(messageId)) {
        await teacherChatService.unpinMessage(session.id, messageId);
      } else {
        await teacherChatService.pinMessage(session.id, messageId);
      }
      await loadChat();
      setMenuOpen(null);
    } catch (err) {
      setError('Không thể ghim tin nhắn');
    }
  };

  // Mute/Unmute chat (Teacher only)
  const handleMuteToggle = async () => {
    if (!session || userRole !== 'teacher') return;

    try {
      if (session.isMuted) {
        await teacherChatService.unmuteChat(session.id);
      } else {
        await teacherChatService.muteChat(session.id);
      }
      await loadChat();
    } catch (err) {
      setError('Không thể thay đổi trạng thái chat');
    }
  };

  // Ban user (Admin only)
  const handleBanUser = async (userId: string) => {
    if (!session || userRole !== 'admin') return;

    try {
      await adminChatService.banUser(session.id, userId);
      await loadChat();
      setMenuOpen(null);
    } catch (err) {
      setError('Không thể ban user');
    }
  };

  // Toggle chat (Admin only)
  const handleToggleChat = async () => {
    if (!session || userRole !== 'admin') return;

    try {
      await adminChatService.toggleChat(session.id);
      await loadChat();
    } catch (err) {
      setError('Không thể bật/tắt chat');
    }
  };

  // Clear history (Admin only)
  const handleClearHistory = async () => {
    if (!session || userRole !== 'admin') return;

    if (!confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat?')) return;

    try {
      await adminChatService.clearHistory(session.id);
      setMessages([]);
      await loadChat();
    } catch (err) {
      setError('Không thể xóa lịch sử');
    }
  };

  // Load analytics (Teacher only)
  const loadAnalytics = async () => {
    if (!session || userRole !== 'teacher') return;

    try {
      const data = await teacherChatService.getAnalytics(session.id);
      setAnalytics(data);
      setShowAnalytics(true);
    } catch (err) {
      setError('Không thể tải analytics');
    }
  };

  // Format timestamp with fallback
  const formatTime = (date: string | undefined) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Format date with fallback
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

  // Check if user can edit/delete message
  const canEdit = (msg: ChatMessage) => {
    return msg.sender?.id === user?.id && !msg.isDeleted;
  };

  // Check if user can pin (teacher only)
  const canPin = () => userRole === 'teacher';

  // Check if user can ban (admin only)
  const canBan = () => userRole === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Chat is always active by default, only blocked if explicitly disabled by teacher/admin
  const isChatDisabled = session?.isActive === false;

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200 shadow-lg">
      {/* Header with role-based controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900">Chat bài học</h3>
          {isChatDisabled && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              Đã đóng
            </span>
          )}
          {session?.isMuted && !isChatDisabled && (
            <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">
              Tạm dừng
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'teacher' && (
            <>
              <button
                onClick={handleMuteToggle}
                className={`p-2 rounded-lg transition-colors ${
                  session?.isMuted
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={session?.isMuted ? 'Bật chat' : 'Tạm dừng chat'}
              >
                <MessageCircleOff size={16} />
              </button>
              <button
                onClick={loadAnalytics}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                title="Analytics"
              >
                <BarChart3 size={16} />
              </button>
            </>
          )}
          {userRole === 'admin' && (
            <>
              <button
                onClick={handleToggleChat}
                className={`p-2 rounded-lg transition-colors ${
                  isChatDisabled
                    ? 'bg-red-100 text-red-600'
                    : 'bg-green-100 text-green-600'
                }`}
                title={isChatDisabled ? 'Mở chat' : 'Đóng chat'}
              >
                {isChatDisabled ? <MessageCircleOff size={16} /> : <Check size={16} />}
              </button>
              <button
                onClick={handleClearHistory}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                title="Xóa lịch sử"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
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
            Trả lời <strong>{replyingTo.sender?.name}</strong>: {replyingTo.content?.slice(0, 40)}{replyingTo.content?.length > 40 && '...'}
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-200 rounded">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input - at top below header */}
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
              className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px] custom-scrollbar">
        {/* Pinned messages */}
        {messages
          .filter((m) => session?.pinnedMessageIds?.includes(m.id))
          .map((msg) => (
            <div
              key={`pinned-${msg.id}`}
              className="bg-amber-50 border border-amber-200 rounded-lg p-3"
            >
              <div className="flex items-center gap-1 text-amber-600 text-xs mb-1">
                <Pin size={12} />
                <span>Tin nhắn được ghim</span>
              </div>
              <p className="text-sm text-gray-800">{msg.content}</p>
            </div>
          ))}

        {/* Regular messages - threaded comments style */}
        {(() => {
          const messageElements: React.ReactElement[] = [];
          const processedIds = new Set<string>();
          
          // Build message map for quick lookup
          const messageMap = new Map<string, ChatMessage>();
          messages.forEach(m => messageMap.set(m.id, m));
          
          // Find root messages (no parent)
          const rootMessages = messages.filter(m => !m.parentId && !m.isDeleted && m.sender);
          
          const renderMessage = (msg: ChatMessage, depth: number = 0, _isLastReply: boolean = false) => {
            if (processedIds.has(msg.id)) return null;
            processedIds.add(msg.id);
            
            const replyCount = messages.filter(m => m.parentId === msg.id).length;
            const hasReplies = replyCount > 0;
            
            // Find replies to this message
            const replies = messages.filter(m => m.parentId === msg.id && !m.isDeleted && m.sender);
            
            return (
              <div key={msg.id} className="relative">
                {/* Main message row */}
                <div className="flex gap-3" style={{ marginLeft: `${depth * 48}px` }}>
                  {/* Avatar column with thread connectors */}
                  <div className="relative flex flex-col items-center shrink-0 w-10 self-stretch">
                    {/* Vertical line from parent's avatar center down to this reply */}
                    {depth > 0 && (
                      <div className="absolute w-[2px] bg-gray-300" 
                        style={{ 
                          left: '-24px',
                          top: '-20px',
                          height: 'calc(50% + 20px)',
                          borderRadius: '1px'
                        }} 
                      />
                    )}
                    
                    {/* Horizontal line connecting vertical line to avatar center - Facebook style */}
                    {depth > 0 && (
                      <>
                        {/* Curved corner - chính xác hơn */}
                        <div 
                          className="absolute w-5 h-5 border-l-[2px] border-b-[2px] border-gray-300"
                          style={{ 
                            left: '-24px',
                            top: '19px',
                            borderBottomLeftRadius: '12px'
                          }}
                        />
                      </>
                    )}
                    
                    <img
                      src={msg.sender?.avatar || '/default-avatar.png'}
                      alt={msg.sender?.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover relative z-10 bg-white"
                    />
                    
                    {/* Vertical line down from this avatar - chỉ kéo đến reply đầu, không kéo dài theo nội dung */}
                    {hasReplies && (
                      <div className="absolute w-[2px] bg-gray-300" 
                        style={{ 
                          left: '19px',
                          top: '40px',
                          height: '28px',
                          borderRadius: '1px'
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Message content */}
                  <div className="flex-1 min-w-0 pb-4">
                    {/* Name */}
                    <div className="font-bold text-sm text-gray-900 mb-1">
                      {msg.sender?.name || 'Unknown'}
                      {msg.sender?.role === 'teacher' && (
                        <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Trợ giảng</span>
                      )}
                      {msg.sender?.role === 'admin' && (
                        <span className="ml-1 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Admin</span>
                      )}
                    </div>
                    
                    {/* Content - AI messages with markdown formatting */}
                    {editingMessageId === msg.id ? (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEdit(msg.id);
                            if (e.key === 'Escape') { setEditingMessageId(null); setEditContent(''); }
                          }}
                          autoFocus
                        />
                        <button onClick={() => handleEdit(msg.id)} className="p-2 bg-amber-500 text-white rounded"><Check size={14} /></button>
                        <button onClick={() => { setEditingMessageId(null); setEditContent(''); }} className="p-2 bg-gray-200 rounded"><X size={14} /></button>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                    
                    {/* Actions row */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {/* Like button */}
                      <button className="flex items-center gap-1 hover:text-amber-500 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                      </button>
                      
                      {/* Reply with count */}
                      <button 
                        onClick={() => setReplyingTo(msg)}
                        className="flex items-center gap-1 hover:text-amber-500 transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {replyCount > 0 && <span>{replyCount}</span>}
                      </button>
                      
                      {/* Timestamp */}
                      {(() => {
                        const time = formatTime(msg.createdAt);
                        const date = formatDate(msg.createdAt);
                        if (!time && !date) return null;
                        if (time && !date) return <span>{time}</span>;
                        if (!time && date) return <span>{date}</span>;
                        return (
                          <>
                            <span>{time}</span>
                            <span>-</span>
                            <span>{date}</span>
                          </>
                        );
                      })()}
                      
                      {/* More actions */}
                      <div className="relative ml-auto">
                        <button
                          onClick={() => setMenuOpen(menuOpen === msg.id ? null : msg.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical size={14} />
                        </button>
                        {menuOpen === msg.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                            {canPin() && (
                              <button onClick={() => { handlePin(msg.id); setMenuOpen(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                <Pin size={14} />{session?.pinnedMessageIds?.includes(msg.id) ? 'Bỏ ghim' : 'Ghim'}
                              </button>
                            )}
                            {canEdit(msg) && (
                              <button onClick={() => { setEditingMessageId(msg.id); setEditContent(msg.content); setMenuOpen(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                <Edit2 size={14} />Sửa
                              </button>
                            )}
                            {canEdit(msg) && (
                              <button onClick={() => { handleDelete(msg.id); setMenuOpen(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2">
                                <Trash2 size={14} />Xóa
                              </button>
                            )}
                            {canBan() && msg.sender?.id !== user?.id && (
                              <button onClick={() => { handleBanUser(msg.sender?.id || ''); setMenuOpen(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2">
                                <Ban size={14} />Chặn
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Render replies recursively with container for thread lines - sort DESC */}
                {hasReplies && (
                  <div className="relative pl-12">
                    {/* Vertical line kéo dài theo toàn bộ replies container */}
                    <div 
                      className="absolute w-[2px] bg-gray-300 left-[19px] top-[-16px] bottom-0"
                      style={{ borderRadius: '1px' }}
                    />
                    {replies
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((reply, index) => renderMessage(reply, depth + 1, index === replies.length - 1))}
                  </div>
                )}
              </div>
            );
          };
          
          // Render only root messages, replies will be rendered recursively
          // Sort DESC (newest first) - tin mới nhất nằm trên cùng
          rootMessages
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .forEach(msg => {
              const element = renderMessage(msg, 0);
              if (element) messageElements.push(element);
            });
          
          // Render orphaned replies (parent not in list or deleted)
          // Sort DESC (newest first)
          messages
            .filter((m) => !m.isDeleted && m.sender && m.parentId && !messageMap.get(m.parentId))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .forEach(msg => {
              const element = renderMessage(msg, 0);
              if (element) messageElements.push(element);
            });
          
          return <div className="space-y-4">{messageElements}</div>;
        })()}
        <div ref={messagesEndRef} />
      </div>


      {/* Chat disabled message */}
      {(!session || isChatDisabled) && (
        <div className="p-4 text-center text-gray-400 text-sm">
          {!session ? 'Đang tải chat...' : 'Chat đã bị đóng bởi quản trị viên'}
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && analytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Analytics</h3>
              <button
                onClick={() => setShowAnalytics(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-500">
                    {analytics.totalMessages}
                  </p>
                  <p className="text-xs text-gray-500">Tin nhắn</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-500">
                    {analytics.totalParticipants}
                  </p>
                  <p className="text-xs text-gray-500">Người tham gia</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Tỷ lệ tương tác</p>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${analytics.engagementRate}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {(analytics.engagementRate ?? 0).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LectureChat;
