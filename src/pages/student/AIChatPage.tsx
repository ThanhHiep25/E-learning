import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Loader2, MessageSquare, RotateCcw, Trash2, Search, BookOpen, Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiService, type AiMessage, type AiConversation } from '../../services/ai.service';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

const AIChatPage: React.FC = () => {
  const location = useLocation();
  const [conversation, setConversation] = useState<AiConversation | null>(null);
  const [messages, setMessages] = useState<Partial<AiMessage>[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<AiConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialChat();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const loadInitialChat = async () => {
    const stateConvId = location.state?.conversationId;
    if (stateConvId) {
      loadConversation(stateConvId);
    } else {
      handleNewChat();
    }
  };

  const handleNewChat = async () => {
    setMessages([]);
    setConversation(null);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  const fetchHistory = async () => {
    try {
      const list = await aiService.getConversations();
      setHistory(list);
    } catch (err: any) {
      console.error('Lỗi tải lịch sử');
    }
  };

  const loadConversation = async (id: number) => {
    setIsLoading(true);
    try {
      const { messages, conversation } = await aiService.getConversationDetails(id);
      setConversation(conversation);
      setMessages(messages);
      setIsSidebarOpen(false); // Close sidebar on mobile after selecting
    } catch (err: any) {
      toast.error('Không tìm thấy hội thoại, đang tạo chat mới...');
      handleNewChat();
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHistoryItem = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) return;
    try {
      await aiService.deleteConversation(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      if (conversation?.id === id) {
        handleNewChat();
      }
      toast.success('Đã xóa');
    } catch (err: any) {
      toast.error('Lỗi xóa');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    let currentConv = conversation;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', content: userMsg }]);
    setIsSending(true);

    try {
      if (!currentConv) {
        currentConv = await aiService.createConversation({
          title: userMsg.substring(0, 30) + '...',
          forceCreate: true
        });
        setConversation(currentConv);
        fetchHistory();
      }
      const res = await aiService.sendMessage(currentConv.id, userMsg);
      setMessages(prev => [...prev, { sender: 'ai', content: res.answer }]);
    } catch (err: any) {
      const errMsg = err.message || 'Lỗi kết nối AI';
      setMessages(prev => [...prev, { sender: 'ai', content: errMsg }]);
    } finally {
      setIsSending(false);
    }
  };

  const filteredHistory = history.filter(h =>
    (h.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigate = useNavigate();

  const renderMessageContent = (content: string | undefined | null) => {
    if (!content) return null;
    
    // Clean up common markdown issues from AI response
    const cleanContent = content
      .replace(/\\\*\*/g, '**')  // Fix escaped bold: \** -> **
      .replace(/\\\*/g, '*')     // Fix escaped italic: \* -> *
      .replace(/^\s*\*\s+/gm, '* ');  // Normalize list item spacing
    
    // Pattern: COURSE_CARD(id|title|level)
    const parts = cleanContent.split(/(COURSE_CARD\([^)]+\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('COURSE_CARD(')) {
        const match = part.match(/COURSE_CARD\(([^|]+)\|([^|]+)\|([^)]+)\)/);
        if (match) {
          const [_, courseId, title, level] = match;
          // Map level to colors
          const levelColors: Record<string, { bg: string; text: string; dot: string }> = {
            'BEGINNER': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
            'ELEMENTARY': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
            'INTERMEDIATE': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
            'UPPER-INTERMEDIATE': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
            'ADVANCED': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
            'C2': { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
          };
          const colors = levelColors[level.toUpperCase()] || { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' };
          
          return (
            <div 
              key={i} 
              className="my-5 relative overflow-hidden bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] border border-gray-100/80 group hover:shadow-[0_8px_30px_-4px_rgba(251,191,36,0.25)] hover:border-amber-200/60 transition-all duration-500 animate-in zoom-in-95"
            >
              {/* Gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Left accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-3xl" />
              
              <div className="relative p-5 flex items-center gap-4">
                {/* Course thumbnail with gradient */}
                <div className="relative w-16 h-16 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-white rounded-2xl flex items-center justify-center shadow-inner">
                    <BookOpen className="text-amber-500" size={28} strokeWidth={1.5} />
                  </div>
                  {/* Sparkle decoration */}
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Course info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors">
                    {title}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      {level}
                    </span>
                  </div>
                </div>
                
                {/* CTA Button */}
                <button
                  onClick={() => navigate(`/course/${courseId}`)}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-amber-500 hover:text-slate-900 transition-all duration-300 shadow-lg shadow-slate-900/10 hover:shadow-amber-500/30 active:scale-95 group/btn"
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        }
      }
      return (
        <div key={i} className="prose prose-sm max-w-none prose-slate prose-strong:text-inherit">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              strong: ({children}) => <strong className="font-bold text-inherit">{children}</strong>
            }}
          >
            {part}
          </ReactMarkdown>
        </div>
      );
    });
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 overflow-hidden relative">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar History */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 transition-transform duration-300 lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={handleNewChat}
            className="flex-1 bg-slate-900 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
          >
            <RotateCcw size={18} />
            Tạo đoạn chat mới
          </button>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden ml-4 p-2 text-gray-400 hover:text-slate-900"
          >
            <X size={24} />
          </button>
        </div>
        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm lịch sử..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          <h3 className="px-4 text-sm font-bold text-gray-400 mb-4">Gần đây</h3>
          {filteredHistory.map((h) => (
            <div
              key={h.id}
              onClick={() => loadConversation(h.id)}
              className={`group p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${conversation?.id === h.id ? 'bg-amber-50 border border-amber-100' : 'hover:bg-gray-50 border border-transparent'}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={18} className={conversation?.id === h.id ? 'text-amber-500' : 'text-gray-400'} />
                <div className="overflow-hidden">
                  <p className={`text-sm font-bold truncate ${conversation?.id === h.id ? 'text-amber-900' : 'text-gray-700'}`}>
                    {h.title || 'Hội thoại mới'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold">{new Date(h.createdAt as any).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              <button
                onClick={(e) => deleteHistoryItem(e, h.id)}
                className="p-2 text-gray-300 cursor-pointer hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-amber-400 via-orange-500 to-amber-400 animate-gradient-x"></div>

        {/* Chat Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-900 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Tutor v2.0</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold text-gray-400">AI Chat 24/7 • Cố vấn học tập thông minh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-gray-50/30">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-10">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 md:py-20 animate-pulse">
                <Loader2 size={32} className="text-amber-500 animate-spin mb-4" />
                <p className="text-sm font-black text-gray-400 italic">Đang tải cuộc hội thoại...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-0">
                <img src="/logoStill/elearning.png" alt="AI" className="w-32 h-32 mx-auto mb-8" />
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Bắt đầu hành trình học tập!</h2>
                <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto leading-relaxed px-4">
                  Tôi là trợ lý AI thế hệ mới, được huấn luyện để đồng hành cùng bạn trên con đường chinh phục ngôn ngữ.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-8 md:mt-12 text-left">

                  {[
                    'Tư vấn khóa học & lộ trình học',
                    'Giải đáp bài tập & câu hỏi',
                    'Luyện tập kỹ năng & bài tập',
                    'Kiểm tra trình độ & đánh giá'
                  ].map((hint, i) => (
                    <div
                      key={i}
                      onClick={() => setInput(hint)}
                      className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <p className="text-sm font-bold text-slate-700 mt-1 line-clamp-2">{hint}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-5 duration-500`}>
                  <div className={`flex gap-3 md:gap-6 max-w-[95%] md:max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-amber-500 text-white'}`}>
                      {msg.sender === 'user' ? <User size={18} /> : <img src="/logoStill/elearning.png" alt="AI" className="w-6 h-6 md:w-8 md:h-8" />}
                    </div>
                    <div className={`p-4 md:p-6 rounded-2xl md:rounded-[32px] text-sm md:text-base leading-relaxed shadow-sm border max-w-full break-words ${msg.sender === 'user' ? 'bg-slate-900 text-white rounded-tr-none border-slate-900' : 'bg-white text-gray-700 border-gray-100 rounded-tl-none'}`}>
                      {msg.sender === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        renderMessageContent(msg.content as string)
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isSending && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="flex gap-3 md:gap-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                    <img src="/logoStill/elearning.png" alt="AI" className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="bg-white border border-gray-100 p-4 md:p-6 rounded-2xl md:rounded-[32px] rounded-tl-none flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input */}
        <div className="p-4 md:p-8 bg-white border-t border-gray-100 sticky bottom-0">
          <div className="max-w-4xl mx-auto relative group">
            <form onSubmit={handleSend}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Nhập nội dung..."
                disabled={isSending || isLoading}
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl md:rounded-[32px] px-6 md:px-8 py-4 md:py-6 pr-16 md:pr-20 text-sm md:text-base font-medium focus:bg-white focus:border-amber-500 focus:shadow-2xl focus:shadow-amber-500/10 transition-all outline-none disabled:opacity-50 min-h-[60px] md:min-h-[80px] max-h-[150px] md:max-h-[200px] resize-none overflow-y-auto"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending || isLoading}
                className="absolute right-3 md:right-4 bottom-3 md:bottom-4 w-10 h-10 md:w-12 md:h-12 bg-amber-500 text-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-amber-600 shadow-xl shadow-amber-500/30 transition-all active:scale-90 disabled:opacity-0 disabled:scale-75 cursor-pointer"
              >
                <Send size={20} className="md:w-6 md:h-6" />
              </button>
            </form>
          </div>
          <p className="text-[9px] md:text-[10px] text-center text-gray-400 font-bold mt-4 md:mt-6">Dẫn đầu xu hướng học tập thông minh với AI Tutor v2.0</p>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
