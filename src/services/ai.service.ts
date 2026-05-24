import { apiRequest } from './api';

// Support Chat Interfaces
export interface SupportMessage {
  id: number;
  conversationId: number;
  sender: 'user' | 'ai' | 'support';
  content: string;
  createdAt: string;
}

export interface SupportConversation {
  id: number;
  userId: number;
  title?: string;
  status: 'active' | 'closed' | 'pending';
  messages?: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface QuickSuggestion {
  id: string;
  text: string;
  action?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  handler: () => void;
}

// AI Settings Interfaces (legacy)

export interface AiSetting {
  id?: number;
  provider: string;
  model: string;
  apiKey?: string;
  enabled: boolean;
  priority: number;
  isAvailable: boolean;
}

export interface AiMessage {
  id: number;
  conversationId: number;
  sender: 'user' | 'ai';
  content: string;
  tokenUsage?: any;
  createdAt: string;
}

export interface AiConversation {
  id: number;
  userId: number;
  courseId?: number;
  lectureId?: number;
  title?: string;
  messages?: AiMessage[];
  createdAt?: string;
  updatedAt?: string;
}

// Support Chat API Service
export const supportService = {
  // Create or get existing support chat
  createOrGetChat: async (forceCreate?: boolean): Promise<SupportConversation> => {
    const res = await apiRequest<{ 
      chat?: SupportConversation; 
      conversation?: SupportConversation;
      success?: boolean; 
      message?: string;
      id?: number;
      title?: string;
      userId?: number;
      createdAt?: string;
      updatedAt?: string;
      status?: string;
    }>('support/chat', {
      method: 'POST',
      body: JSON.stringify({ forceCreate }),
    });
    
    // Handle different response formats - backend may return 'chat' or 'conversation'
    let chat: SupportConversation | undefined;
    
    if (res?.chat) {
      chat = res.chat;
    } else if (res?.conversation) {
      chat = res.conversation;
    } else if (res?.id) {
      // Response might be the chat object directly
      chat = res as unknown as SupportConversation;
    }
    
    if (!chat || !chat.id) {
      throw new Error(res?.message || 'Failed to create or get chat - invalid response');
    }
    return chat;
  },

  // Get chat history by conversation ID
  getChatHistory: async (chatId: number): Promise<SupportMessage[]> => {
    const res = await apiRequest<{ messages: SupportMessage[] }>(`support/chat/${chatId}/history`);
    return res.messages;
  },

  // Send message to support chat
  sendMessage: async (chatId: number, message: string): Promise<{ reply: string; message: SupportMessage }> => {
    const res = await apiRequest<{ reply?: string; content?: string; message: SupportMessage }>('support/chat/message', {
      method: 'POST',
      body: JSON.stringify({ conversationId: chatId, content: message }),
    });
    // Handle both reply and content (backend might return either)
    const reply = res.reply || res.content || '';
    return { reply, message: res.message };
  },

  // Get all conversations
  getConversations: async (): Promise<SupportConversation[]> => {
    const res = await apiRequest<{ data?: { conversations: SupportConversation[] }; conversations?: SupportConversation[] }>('support/conversations');
    // Handle both wrapped and unwrapped response
    return res.data?.conversations || res.conversations || [];
  },

  // Clear chat history
  clearChat: async (chatId: number): Promise<void> => {
    return apiRequest<void>(`support/chat/${chatId}/clear`, {
      method: 'POST',
    });
  },

  // Delete conversation
  deleteConversation: async (chatId: number): Promise<void> => {
    return apiRequest<void>(`support/chat/${chatId}`, {
      method: 'DELETE',
    });
  },

  // Get quick suggestions
  getSuggestions: async (): Promise<QuickSuggestion[]> => {
    const res = await apiRequest<{ suggestions: QuickSuggestion[] }>('support/suggestions');
    return res.suggestions;
  },

  // Execute quick action
  executeAction: async (actionId: string, data?: any): Promise<{ result: any }> => {
    return apiRequest<{ result: any }>('support/action', {
      method: 'POST',
      body: JSON.stringify({ actionId, data }),
    });
  },
};

// Legacy AI Service (now using support APIs)
export const aiService = {
  // Admin methods
  // Backend returns: { setting: {...} } (direct response, not wrapped in data)
  // Single setting only - convert to array for UI compatibility
  getAllSettings: async (): Promise<AiSetting[]> => {
    const res = await apiRequest<{ setting: AiSetting }>('admin/ai/settings');
    // Wrap single setting in array for UI compatibility
    const result = res?.setting ? [res.setting] : [];
    return result;
  },
  
  upsertSetting: async (data: Partial<AiSetting>): Promise<AiSetting> => {
    return apiRequest<AiSetting>('admin/ai/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteSetting: async (provider: string): Promise<void> => {
    return apiRequest<void>(`admin/ai/settings/${provider}`, {
      method: 'DELETE',
    });
  },

  // Student methods - now redirect to support service
  createConversation: async (data?: { courseId?: number; lectureId?: number; title?: string; forceCreate?: boolean }): Promise<AiConversation> => {
    const chat = await supportService.createOrGetChat(data?.forceCreate);
    return {
      id: chat.id,
      userId: chat.userId,
      title: chat.title || 'AI Support Chat',
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      ...data,
    };
  },

  sendMessage: async (convId: number, message: string): Promise<{ answer: string }> => {
    const res = await supportService.sendMessage(convId, message);
    // Handle case where reply might be empty
    const answer = res.reply || res.message?.content || 'AI không có phản hồi';
    return { answer };
  },
  
  getConversations: async (): Promise<AiConversation[]> => {
    const conversations = await supportService.getConversations();
    return conversations.map(c => ({
      id: c.id,
      userId: c.userId,
      title: c.title || 'Support Chat',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  },

  getConversationDetails: async (id: number): Promise<{ messages: AiMessage[]; conversation: AiConversation }> => {
    const [messages, conversations] = await Promise.all([
      supportService.getChatHistory(id),
      supportService.getConversations(),
    ]);
    const conversation = conversations.find(c => c.id === id);
    
    // Create fallback conversation if not found
    const aiConversation: AiConversation = conversation ? {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title || 'Support Chat',
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    } : {
      id,
      userId: 0,
      title: 'Support Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return {
      messages: messages.map(m => ({
        id: m.id,
        conversationId: m.conversationId,
        sender: m.sender === 'user' ? 'user' : 'ai',
        content: m.content,
        createdAt: m.createdAt,
      })),
      conversation: aiConversation,
    };
  },

  deleteConversation: async (id: number): Promise<void> => {
    return supportService.deleteConversation(id);
  },
  
  // New support-specific methods
  getSuggestions: supportService.getSuggestions,
  executeAction: supportService.executeAction,
  clearChat: supportService.clearChat,
};
