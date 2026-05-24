import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Loader2, MessageSquare, Plus, Trash2, BookOpen, X, Maximize2, History as HistoryIcon, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiService, type AiMessage, type AiConversation } from '../../services/ai.service';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: number;
  lectureId?: number;
}

const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, courseId, lectureId }) => {
  const navigate = useNavigate();

  const renderMessageContent = (content: string | undefined | null) => {
    if (!content) return null;
    // Pattern: COURSE_CARD(slug|title|level)
    const parts = content.split(/(COURSE_CARD\([^\)]+\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('COURSE_CARD(')) {
        const match = part.match(/COURSE_CARD\(([^|]+)\|([^|]+)\|([^)]+)\)/);
        if (match) {
          const [_, courseId, title, level] = match;
          return (
            <div key={i} className="my-4 p-4 bg-white border-2 border-amber-500/10 rounded-2xl shadow-sm flex flex-col gap-3 animate-in zoom-in-95 duration-500 ring-1 ring-amber-500/5 group hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-3 overflow-hidden text-left">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                  <BookOpen className="text-amber-600" size={20} />
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                    <p className="text-[9px] font-bold text-amber-600">{level}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/course/${courseId}`)}
                className="w-full py-2 bg-slate-900 text-white text-[9px] font-bold rounded-xl hover:bg-amber-500 hover:text-slate-900 transition-all shadow-lg shadow-slate-900/5 active:scale-95 cursor-pointer"
              >
                Xem chi tiết
              </button>
            </div>
          );
        }
      }
      return (
        <div className="prose prose-xs max-w-none prose-slate" key={i}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {part}
          </ReactMarkdown>
        </div>
      );
    });
  };
  const [conversation, setConversation] = useState<AiConversation | null>(null);
  const [messages, setMessages] = useState<Partial<AiMessage>[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AiConversation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   if (isOpen) {
  //     initChat();
  //   }
  // }, [isOpen, courseId, lectureId]);

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


  // const initChat = async () => {
  //   setIsLoading(true);
  //   try {
  //     const chat = await aiService.createConversation({
  //       courseId,
  //       lectureId,
  //       title: 'AI Support Chat',
  //     });
  //     setConversation(chat);
  //   } catch (err: any) {
  //     console.error('Failed to init chat:', err);
  //     toast.error('Lỗi khởi tạo chat: ' + (err.message || 'Unknown error'));
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };


  const startNewChat = async () => {
    setMessages([]);
    setConversation(null);
    setIsLoading(true);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    try {
      // Create new conversation with forceCreate = true
      const chat = await aiService.createConversation({
        courseId,
        lectureId,
        title: 'AI Support Chat',
        forceCreate: true, // Force create new chat
      });
      setConversation(chat);
      toast.success('Đã tạo đoạn chat mới');
    } catch (err: any) {
      console.error('Failed to create new chat:', err);
      toast.error('Lỗi tạo chat mới: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const list = await aiService.getConversations();
      setHistory(list);
      setShowHistory(true);
    } catch (err: any) {
      toast.error('Lỗi tải lịch sử');
    }
  };

  const loadConversation = async (id: number) => {
    setIsLoading(true);
    setShowHistory(false);
    try {
      const { messages, conversation } = await aiService.getConversationDetails(id);
      setConversation(conversation);
      setMessages(messages);
    } catch (err: any) {
      toast.error('Không tìm thấy hội thoại, đang tạo chat mới...');
      startNewChat(); // Fallback to new chat
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHistoryItem = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await aiService.deleteConversation(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      if (conversation?.id === id) {
        setConversation(null);
        setMessages([]);
      }
      toast.success('Đã xóa hội thoại');
    } catch (err: any) {
      toast.error('Lỗi xóa hội thoại');
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
      // Create conversation on the fly with forceCreate when first message sent
      if (!currentConv) {
        currentConv = await aiService.createConversation({
          courseId,
          lectureId,
          title: userMsg.substring(0, 30) + '...',
          forceCreate: true
        });
        console.log('Created conversation:', currentConv);
        setConversation(currentConv);
      }

      if (!currentConv?.id) {
        throw new Error('No conversation ID available');
      }

      console.log('Sending message with convId:', currentConv.id, typeof currentConv.id);
      const res = await aiService.sendMessage(currentConv.id, userMsg);
      console.log('Send message response:', res);
      
      if (!res?.answer) {
        console.error('AI response missing answer:', res);
        setMessages(prev => [...prev, { sender: 'ai', content: 'Lỗi: AI không trả lời' }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', content: res.answer }]);
      }
    } catch (err: any) {
      console.error('Send message error:', err);
      const errMsg = err.message || 'Lỗi kết nối AI';
      setMessages(prev => [...prev, { sender: 'ai', content: errMsg }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleExpand = () => {
    onClose();
    navigate('/ai-chat', { state: { conversationId: conversation?.id } });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-end p-6 pointer-events-none">
      <div className="w-full max-w-[450px] h-[600px] max-h-[85vh] bg-white rounded-[40px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-right-10 slide-in-from-bottom-10 duration-500">
        {/* Header */}
        <div className="bg-slate-800 p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {showHistory && (
              <button
                onClick={() => setShowHistory(false)}
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h3 className="text-white font-black text-sm">
                {showHistory ? 'Lịch sử trò chuyện' : 'AI Learning Tutor'}
              </h3>
              {!showHistory && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-[10px] text-slate-400">Sẵn sàng hỗ trợ</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!showHistory && (
              <>
                <button
                  onClick={handleExpand}
                  title="Mở rộng"
                  className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Maximize2 size={18} />
                </button>
                <button
                  onClick={startNewChat}
                  title="Tạo đoạn chat mới"
                  className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={fetchHistory}
                  title="Lịch sử"
                  className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <HistoryIcon size={18} />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div ref={containerRef} className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 relative">
          {showHistory ? (
            <div className="p-4 space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs font-bold">Không có lịch sử</div>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => loadConversation(h.id)}
                    className="group p-4 bg-white border border-gray-100 rounded-2xl cursor-pointer hover:border-amber-500 hover:shadow-md transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageSquare size={16} className="text-amber-500 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-gray-700 truncate">{h.title || 'Hội thoại không tiêu đề'}</p>
                        <p className="text-[10px] text-gray-400">{new Date(h.createdAt as any).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteHistoryItem(e, h.id)}
                      className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
              <Loader2 size={32} className="animate-spin text-amber-500" />
              <p className="text-[10px] font-bold text-gray-400">Đang khởi tạo cố vấn...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full text-center space-y-4 px-6 py-6">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-gray-200">
                <img src="/logoStill/elearning.png" alt="AI" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Chào bạn!</h4>
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed mt-1">
                  Tôi là trợ lý AI. Bạn có thể bắt đầu bằng các câu hỏi gợi ý bên dưới:
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full mt-2">
                {[
                  'Tư vấn khóa học',
                  'Lộ trình học cho người mới bắt đầu',
                  'Lộ trình học cho người mất gốc',
                  'Cách làm bài kiểm tra hiệu quả'
                ].map((hint, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(hint)}
                    className="p-3 bg-white border border-gray-100 rounded-xl hover:border-amber-500 text-[11px] font-bold text-gray-600 text-left transition-all active:scale-95"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-amber-500 text-white'}`}>
                      {msg.sender === 'user' ? <User size={14} /> : <img src="/logoStill/elearning.png" alt="AI" className="w-5 h-5" />}
                    </div>
                    <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm border max-w-full break-words ${msg.sender === 'user' ? 'bg-slate-900 text-white rounded-tr-none border-slate-900' : 'bg-white text-gray-700 border-gray-100 rounded-tl-none'}`}>
                      {msg.sender === 'user' ? (
                        msg.content
                      ) : (
                        renderMessageContent(msg.content as string)
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <img src="/logoStill/elearning.png" alt="AI" className="w-5 h-5" />
                    </div>
                    <div className="bg-white border border-gray-100 p-4 rounded-3xl rounded-tl-none flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-150"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        {!showHistory && (
          <div className="p-6 bg-white border-t border-gray-100 shrink-0">
            <form onSubmit={handleSend} className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                disabled={isSending || isLoading}
                className="w-full bg-gray-50 border-2 border-transparent rounded-[24px] px-6 py-4 pr-16 text-sm font-medium focus:bg-white focus:border-amber-500 focus:shadow-xl focus:shadow-amber-500/10 transition-all outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-amber-500 text-gray-900 rounded-2xl flex items-center justify-center hover:bg-amber-600 shadow-lg shadow-amber-500/30 transition-all active:scale-90 disabled:opacity-0 disabled:scale-75 cursor-pointer"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-[9px] text-center text-gray-400 font-bold mt-4">Powered by AI Tutor</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatModal;
