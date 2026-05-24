import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  teacherChatService, 
  adminChatService, 
  lectureChatService,
  type ChatMessage 
} from '../../services/lecture-chat.service';
import { 
  teacherCourseChatService, 
  adminCourseChatService,
  courseChatService
} from '../../services/course-chat.service';

interface ChatManagementProps {
  type: 'lecture' | 'course';
}

interface UnifiedChatSession {
  id: string;
  title?: string;
  isEnabled: boolean;
  isMuted: boolean;
  mutedUntil?: string | null;
  isActive: boolean;
  pinnedMessageIds?: string[];
  bannedUserIds?: string[];
  messageCount?: number;
  participantCount?: number;
  aiEnabled?: boolean;
}

const ChatManagement: React.FC<ChatManagementProps> = ({ type }) => {
  const { user } = useAuth();
  const { courseId, lessonId } = useParams<{ courseId?: string; lessonId?: string }>();
  const navigate = useNavigate();
  
  const [chatSession, setChatSession] = useState<UnifiedChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'messages' | 'settings' | 'analytics' | 'escalations'>('messages');
  const [muteDuration, setMuteDuration] = useState<number>(60);
  const [replyContent, setReplyContent] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Sort messages by time (oldest first)
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const isAdmin = (user?.role as string) === 'admin';
  const chatId = type === 'lecture' ? lessonId : courseId;
  
  // Load chat data
  useEffect(() => {
    if (!chatId) return;
    
    const loadChat = async () => {
      try {
        setLoading(true);
        
        if (type === 'lecture') {
          const response = await lectureChatService.getLessonChat(chatId, courseId);
          setChatSession(response.chat as UnifiedChatSession);
          setMessages(response.messages);
        } else {
          const response = await courseChatService.getChat(chatId);
          setChatSession(response.chat as UnifiedChatSession);
          setMessages(response.messages as ChatMessage[]);
        }
      } catch (error) {
        console.error('Failed to load chat:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadChat();
  }, [chatId, courseId, type]);
  
  // Load analytics
  const loadAnalytics = async () => {
    if (!chatId) return;
    try {
      if (type === 'lecture') {
        const data = await teacherChatService.getAnalytics(chatId);
        setAnalytics(data);
      } else {
        const data = await teacherCourseChatService.getAnalytics(chatId);
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };
  
  // Load escalations
  const loadEscalations = async () => {
    try {
      const service = isAdmin ? adminCourseChatService : teacherCourseChatService;
      const data = await service.getEscalations();
      setEscalations(data);
    } catch (error) {
      console.error('Failed to load escalations:', error);
    }
  };
  
  // Handle mute chat
  const handleMute = async () => {
    if (!chatId) return;
    try {
      if (type === 'lecture') {
        await teacherChatService.muteChat(chatId, muteDuration);
      } else {
        await teacherCourseChatService.muteChat(chatId, muteDuration);
      }
      // Calculate mutedUntil timestamp
      const mutedUntil = new Date(Date.now() + muteDuration * 60 * 1000).toISOString();
      setChatSession(prev => prev ? { ...prev, isMuted: true, mutedUntil } : null);
      alert(`Đã tạm dừng chat trong ${muteDuration} phút`);
    } catch (error) {
      console.error('Failed to mute chat:', error);
    }
  };
  
  // Handle unmute chat
  const handleUnmute = async () => {
    if (!chatId) return;
    try {
      if (type === 'lecture') {
        await teacherChatService.unmuteChat(chatId);
      } else {
        await teacherCourseChatService.unmuteChat(chatId);
      }
      setChatSession(prev => prev ? { ...prev, isMuted: false, mutedUntil: null } : null);
      alert('Đã bật lại chat');
    } catch (error) {
      console.error('Failed to unmute chat:', error);
    }
  };
  
  // Handle toggle chat (admin only)
  const handleToggleChat = async () => {
    if (!chatId || !isAdmin) return;
    try {
      const result = await adminChatService.toggleChat(chatId);
      setChatSession(prev => prev ? { ...prev, isEnabled: result.isEnabled } : null);
      alert(result.isEnabled ? 'Đã bật chat' : 'Đã tắt chat');
    } catch (error) {
      console.error('Failed to toggle chat:', error);
    }
  };
  
  // Handle clear history (admin only)
  const handleClearHistory = async () => {
    if (!chatId || !isAdmin) return;
    if (!window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat?')) return;
    
    try {
      await adminChatService.clearHistory(chatId);
      setMessages([]);
      alert('Đã xóa lịch sử chat');
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };
  
  // Handle pin message
  const handlePinMessage = async (messageId: string) => {
    if (!chatId) return;
    try {
      if (type === 'lecture') {
        await teacherChatService.pinMessage(chatId, messageId);
      } else {
        await teacherCourseChatService.pinMessage(chatId, messageId);
      }
      alert('Đã ghim tin nhắn');
      // Refresh messages
      await refreshMessages();
    } catch (error) {
      console.error('Failed to pin message:', error);
    }
  };
  
  // Handle unpin message
  const handleUnpinMessage = async (messageId: string) => {
    if (!chatId) return;
    try {
      if (type === 'lecture') {
        await teacherChatService.unpinMessage(chatId, messageId);
      } else {
        await teacherCourseChatService.unpinMessage(chatId, messageId);
      }
      alert('Đã bỏ ghim tin nhắn');
    } catch (error) {
      console.error('Failed to unpin message:', error);
    }
  };
  
  // Handle ban user
  const handleBanUser = async (userId: string) => {
    if (!chatId) return;
    if (!window.confirm('Bạn có chắc muốn chặn người dùng này?')) return;
    
    try {
      if (type === 'lecture') {
        await adminChatService.banUser(chatId, userId);
      } else {
        await teacherCourseChatService.banUser(chatId, userId);
      }
      setChatSession(prev => prev ? {
        ...prev,
        bannedUserIds: [...(prev.bannedUserIds || []), userId]
      } : null);
      alert('Đã chặn người dùng');
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };
  
  // Handle unban user
  const handleUnbanUser = async (userId: string) => {
    if (!chatId) return;
    try {
      if (type === 'lecture') {
        // Lecture chat unban using DELETE to the same endpoint
        await adminChatService.banUser(chatId, userId); // This is actually a toggle, need to check
      } else {
        await teacherCourseChatService.unbanUser(chatId, userId);
      }
      setChatSession(prev => prev ? {
        ...prev,
        bannedUserIds: (prev.bannedUserIds || []).filter(id => id !== userId)
      } : null);
      alert('Đã bỏ chặn người dùng');
    } catch (error) {
      console.error('Failed to unban user:', error);
    }
  };
  
  // Refresh messages
  const refreshMessages = async () => {
    if (!chatId) return;
    try {
      if (type === 'lecture') {
        const response = await lectureChatService.getLessonChat(chatId, courseId);
        setMessages(response.messages);
      } else {
        const response = await courseChatService.getChat(chatId);
        setMessages(response.messages as ChatMessage[]);
      }
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    }
  };
  
  // Handle reply to message (lecture or course)
  const handleReply = async (parentId?: string) => {
    if (!chatId || !replyContent.trim()) return;

    try {
      if (type === 'lecture') {
        await lectureChatService.sendMessage(chatSession?.id || chatId, replyContent, parentId);
      } else {
        await teacherCourseChatService.reply(chatId, replyContent, parentId);
      }
      setReplyContent('');
      setSelectedMessage(null);
      await refreshMessages();
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  };
  
  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa tin nhắn này?')) return;
    
    try {
      if (type === 'lecture') {
        await lectureChatService.deleteMessage(messageId);
      } else {
        await courseChatService.deleteMessage(messageId);
      }
      setMessages(prev => prev.filter(m => m.id !== messageId));
      alert('Đã xóa tin nhắn');
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };
  
  if (loading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }
  
  if (!chatSession) {
    return <div className="p-8 text-center">Không tìm thấy thông tin chat</div>;
  }
  
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Quản lý {type === 'lecture' ? 'Chat Bài học' : 'Chat Khóa học'}
            </h1>
            <p className="text-gray-600 mt-1">
              {chatSession.title || `Chat ID: ${chatSession.id}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Status badges */}
            <span className={`px-3 py-1 rounded-full text-sm ${
              chatSession.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {chatSession.isEnabled ? 'Đang bật' : 'Đã tắt'}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              chatSession.isMuted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {chatSession.isMuted ? 'Đang tạm dừng' : 'Hoạt động'}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              {messages.length} tin nhắn
            </span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Mute/Unmute */}
          {chatSession.isMuted ? (
            <button
              onClick={handleUnmute}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Bật lại chat
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={muteDuration}
                onChange={(e) => setMuteDuration(Number(e.target.value))}
                className="px-3 py-2 border rounded-lg"
              >
                <option value={15}>15 phút</option>
                <option value={30}>30 phút</option>
                <option value={60}>1 giờ</option>
                <option value={1440}>24 giờ</option>
              </select>
              <button
                onClick={handleMute}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Tạm dừng chat
              </button>
            </div>
          )}
          
          {/* Admin only buttons */}
          {isAdmin && (
            <>
              <button
                onClick={handleToggleChat}
                className={`px-4 py-2 rounded-lg text-white ${
                  chatSession.isEnabled 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {chatSession.isEnabled ? 'Tắt chat' : 'Bật chat'}
              </button>
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Xóa lịch sử
              </button>
            </>
          )}
          
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Quay lại
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1">
            {[
              { id: 'messages', label: 'Tin nhắn', icon: '💬' },
              { id: 'settings', label: 'Cài đặt & Người dùng', icon: '⚙️' },
              { id: 'analytics', label: 'Thống kê', icon: '📊' },
              { id: 'escalations', label: 'Cảnh báo', icon: '⚠️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'analytics') loadAnalytics();
                  if (tab.id === 'escalations') loadEscalations();
                }}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Tab content */}
        <div className="p-6">
          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="flex flex-col h-[600px]">
              {/* Pinned Messages */}
              {messages.some(m => m.isPinned) && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700 font-medium mb-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16 12a2 2 0 100-4 2 2 0 000 4zM10 12a2 2 0 100-4 2 2 0 000 4zM4 12a2 2 0 100-4 2 2 0 000 4z"/>
                    </svg>
                    Tin nhắn đã ghim
                  </div>
                  <div className="space-y-2">
                    {messages.filter(m => m.isPinned).map(msg => (
                      <div key={msg.id} className="flex items-start gap-2 text-sm">
                        <span className="font-medium text-gray-900">{msg.sender.name}:</span>
                        <span className="text-gray-700 truncate">{msg.content}</span>
                        <button 
                          onClick={() => handleUnpinMessage(msg.id)}
                          className="ml-auto text-yellow-600 hover:text-yellow-800"
                          title="Bỏ ghim"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages List - Threaded View */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {(() => {
                  // Group messages by thread (parent messages and their replies)
                  const threads = new Map<string, ChatMessage[]>();
                  const rootMessages: ChatMessage[] = [];
                  
                  sortedMessages.filter(m => !m.isPinned).forEach(msg => {
                    if (msg.parentId) {
                      // This is a reply
                      if (!threads.has(msg.parentId)) {
                        threads.set(msg.parentId, []);
                      }
                      threads.get(msg.parentId)?.push(msg);
                    } else {
                      // This is a root message
                      rootMessages.push(msg);
                    }
                  });
                  
                  if (rootMessages.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                        </svg>
                        <p>Chưa có tin nhắn nào</p>
                      </div>
                    );
                  }
                  
                  return rootMessages.map((parentMsg) => {
                    const replies = threads.get(parentMsg.id) || [];
                    const hasReplies = replies.length > 0;
                    
                    return (
                      <div key={parentMsg.id} className="thread-group">
                        {/* Parent Message */}
                        <div className="group">
                          <div className="flex gap-3">
                            <div className="flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                                parentMsg.sender.role === 'teacher' ? 'bg-indigo-500' :
                                parentMsg.sender.role === 'admin' ? 'bg-red-500' :
                                'bg-emerald-500'
                              }`}>
                                {parentMsg.sender.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">{parentMsg.sender.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  parentMsg.sender.role === 'teacher' ? 'bg-indigo-100 text-indigo-700' :
                                  parentMsg.sender.role === 'admin' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {parentMsg.sender.role}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(parentMsg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className={`inline-block max-w-full px-4 py-2 rounded-2xl ${
                                selectedMessage?.id === parentMsg.id 
                                  ? 'bg-blue-100 text-blue-900' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                <div className="prose prose-sm max-w-none prose-p:my-0">
                                  <ReactMarkdown>{parentMsg.content}</ReactMarkdown>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setSelectedMessage(parentMsg)} className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                                  </svg>
                                  Trả lời
                                </button>
                                {parentMsg.isPinned ? (
                                  <button onClick={() => handleUnpinMessage(parentMsg.id)} className="text-xs text-yellow-600 hover:text-yellow-700">Bỏ ghim</button>
                                ) : (
                                  <button onClick={() => handlePinMessage(parentMsg.id)} className="text-xs text-gray-500 hover:text-yellow-600">Ghim</button>
                                )}
                                <button onClick={() => handleDeleteMessage(parentMsg.id)} className="text-xs text-gray-500 hover:text-red-600">Xóa</button>
                                <button onClick={() => handleBanUser(parentMsg.sender.id)} disabled={parentMsg.sender.role === 'admin'} className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50">Chặn</button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Replies - Nested with visual thread line */}
                        {hasReplies && (
                          <div className="mt-2 ml-5 pl-8 border-l-2 border-gray-300 space-y-3">
                            {replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((reply, _index) => (
                              <div key={reply.id} className="group relative">
                                {/* Thread connector line */}
                                <div className="absolute -left-8 top-4 w-4 h-px bg-gray-300"></div>
                                <div className="flex gap-3">
                                  <div className="flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                                      reply.sender.role === 'teacher' ? 'bg-indigo-500' :
                                      reply.sender.role === 'admin' ? 'bg-red-500' :
                                      'bg-emerald-500'
                                    }`}>
                                      {reply.sender.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-gray-900">{reply.sender.name}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        reply.sender.role === 'teacher' ? 'bg-indigo-100 text-indigo-700' :
                                        reply.sender.role === 'admin' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>
                                        {reply.sender.role}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {new Date(reply.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <div className={`inline-block max-w-full px-3 py-1.5 rounded-xl text-sm ${
                                      selectedMessage?.id === reply.id 
                                        ? 'bg-blue-100 text-blue-900' 
                                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                                    }`}>
                                      <div className="prose prose-sm max-w-none prose-p:my-0">
                                        <ReactMarkdown>{reply.content}</ReactMarkdown>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => setSelectedMessage(reply)} className="text-xs text-gray-500 hover:text-blue-600">Trả lời</button>
                                      <button onClick={() => handleDeleteMessage(reply.id)} className="text-xs text-gray-500 hover:text-red-600">Xóa</button>
                                      <button onClick={() => handleBanUser(reply.sender.id)} disabled={reply.sender.role === 'admin'} className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50">Chặn</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />

              {/* Input Area */}
              <div className="mt-4 pt-4 border-t">
                {/* Reply indicator */}
                {selectedMessage && (
                  <div className="flex items-center justify-between mb-2 px-3 py-2 bg-blue-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2 text-blue-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                      </svg>
                      <span>Trả lời <b>{selectedMessage.sender.name}</b>: {selectedMessage.content.substring(0, 50)}...</span>
                    </div>
                    <button 
                      onClick={() => setSelectedMessage(null)}
                      className="text-blue-700 hover:text-blue-900"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                )}
                
                {/* Input */}
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      className="w-full px-4 py-3 pr-12 bg-gray-100 border-0 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      onKeyPress={(e) => e.key === 'Enter' && handleReply(selectedMessage?.id)}
                    />
                  </div>
                  <button
                    onClick={() => handleReply(selectedMessage?.id)}
                    disabled={!replyContent.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <span>Gửi</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Banned users */}
              <div>
                <h3 className="text-lg font-medium mb-3">Người dùng bị chặn</h3>
                {chatSession.bannedUserIds && chatSession.bannedUserIds.length > 0 ? (
                  <div className="space-y-2">
                    {chatSession.bannedUserIds.map((userId) => (
                      <div key={userId} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="font-mono text-sm">{userId}</span>
                        <button
                          onClick={() => handleUnbanUser(userId)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Bỏ chặn
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Chưa có người dùng nào bị chặn</p>
                )}
              </div>
              
              {/* Pinned messages */}
              <div>
                <h3 className="text-lg font-medium mb-3">Tin nhắn đã ghim</h3>
                {chatSession.pinnedMessageIds && chatSession.pinnedMessageIds.length > 0 ? (
                  <div className="space-y-2">
                    {chatSession.pinnedMessageIds.map((msgId) => {
                      const msg = messages.find(m => m.id === msgId);
                      return msg ? (
                        <div key={msgId} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                          <div>
                            <span className="font-medium">{msg.sender.name}:</span>
                            <p className="text-sm text-gray-600 truncate max-w-md">{msg.content}</p>
                          </div>
                          <button
                            onClick={() => handleUnpinMessage(msgId)}
                            className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                          >
                            Bỏ ghim
                          </button>
                        </div>
                      ) : (
                        <div key={msgId} className="p-3 bg-gray-100 rounded-lg text-gray-500">
                          Tin nhắn ID: {msgId} (không tìm thấy)
                          <button
                            onClick={() => handleUnpinMessage(msgId)}
                            className="ml-3 px-3 py-1 text-sm bg-gray-600 text-white rounded"
                          >
                            Xóa ghim
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">Chưa có tin nhắn nào được ghim</p>
                )}
              </div>
            </div>
          )}
          
          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">{analytics.totalMessages}</div>
                  <div className="text-sm text-gray-600">Tổng tin nhắn</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">{analytics.totalParticipants}</div>
                  <div className="text-sm text-gray-600">Người tham gia</div>
                </div>
                {analytics.summary && (
                  <>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold text-purple-600">{analytics.summary.aiResponses}</div>
                      <div className="text-sm text-gray-600">Phản hồi AI</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold text-red-600">{analytics.summary.escalations}</div>
                      <div className="text-sm text-gray-600">Cảnh báo</div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Detailed stats */}
              {analytics.summary && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Chi tiết</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Tin nhắn học sinh:</span>
                      <span className="font-medium">{analytics.summary.studentMessages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tin nhắn giáo viên:</span>
                      <span className="font-medium">{analytics.summary.teacherMessages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tin nhắn admin:</span>
                      <span className="font-medium">{analytics.summary.adminMessages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Câu hỏi đã giải quyết:</span>
                      <span className="font-medium">{analytics.summary.resolvedQuestions}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Top participants */}
              {analytics.topParticipants && analytics.topParticipants.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Người tham gia tích cực nhất</h3>
                  <div className="space-y-2">
                    {analytics.topParticipants.map((participant: { userId: string; name: string; messageCount: number }, index: number) => (
                      <div key={participant.userId} className="flex justify-between items-center p-3 bg-white border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-medium text-blue-600">
                            {index + 1}
                          </span>
                          <span>{participant.name}</span>
                        </div>
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                          {participant.messageCount} tin nhắn
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Escalations Tab */}
          {activeTab === 'escalations' && (
            <div className="space-y-4">
              {escalations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Không có cảnh báo nào</p>
              ) : (
                escalations.map((escalation, index) => (
                  <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium text-red-700">Cảnh báo #{index + 1}</span>
                        <p className="mt-1 text-gray-700">
                          {escalation.reason || (typeof escalation.message === 'string' ? escalation.message : escalation.message?.content || escalation.message?.text || JSON.stringify(escalation.message))}
                        </p>
                        {escalation.user && (
                          <p className="text-sm text-gray-500 mt-1">
                            Người dùng: {escalation.user.name} ({escalation.user.email})
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(escalation.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    {escalation.courseId && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Khóa học:</span>
                        <button
                          onClick={() => navigate(`/courses/${escalation.courseId}/chat`)}
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          Xem chi tiết →
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatManagement;
