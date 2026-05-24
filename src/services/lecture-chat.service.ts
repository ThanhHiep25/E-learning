import { apiRequest } from './api';

export interface ChatMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role: 'student' | 'teacher' | 'admin' | 'ai';
  };
  createdAt: string;
  updatedAt?: string;
  isPinned?: boolean;
  isDeleted?: boolean;
  parentId?: string;
  parent?: {
    id: string;
    content: string;
    sender: {
      name: string;
    };
  };
  senderType?: 'student' | 'teacher' | 'admin' | 'ai';
}

// Match Backend LessonChat model
export interface ChatSession {
  id: string;
  lessonId: string;
  courseId?: string;
  title?: string;
  isEnabled: boolean; // Backend uses isEnabled, not isActive
  mutedUntil?: string | null; // Backend uses mutedUntil (date), not isMuted (boolean)
  isActive: boolean; // Derived from isEnabled
  isMuted: boolean; // Derived from mutedUntil
  pinnedMessageIds?: string[];
  bannedUserIds?: string[];
  messageCount?: number;
  participantCount?: number;
  aiEnabled?: boolean;
}

export interface ChatAnalytics {
  totalMessages: number;
  totalParticipants: number;
  messagesPerHour?: { hour: string; count: number }[];
  topParticipants?: { userId: string; name: string; messageCount: number }[];
  engagementRate?: number;
  // Backend returns summary and daily
  summary?: {
    totalMessages: number;
    studentMessages: number;
    teacherMessages: number;
    adminMessages: number;
    aiResponses: number;
    escalations: number;
    resolvedQuestions: number;
  };
  daily?: any[];
}

// Student APIs
export const lectureChatService = {
  // Get chat session and messages for a lesson
  // Backend returns: { success: true, data: { chat, messages } }
  getLessonChat: async (lessonId: string, courseId?: string): Promise<{ chat: ChatSession; messages: ChatMessage[] }> => {
    const query = courseId ? `?courseId=${courseId}` : '';
    const response = await apiRequest<any>(`/lessons/${lessonId}/chat${query}`);
    
    // Backend may return { chat, messages } directly or nested in data
    const data = response.data || response;
    
    // Normalize backend response to match frontend interface
    const chat = data.chat || data.session;
    let messages = data.messages || [];
    
    // Backend returns nested structure with replies inside each message
    // Flatten: extract all replies and add them to main messages array
    const flattenedMessages: any[] = [];
    messages.forEach((msg: any) => {
      // Add parent message
      flattenedMessages.push(msg);
      // Add all replies if any
      if (msg.replies && Array.isArray(msg.replies)) {
        msg.replies.forEach((reply: any) => {
          flattenedMessages.push(reply);
        });
      }
    });
    messages = flattenedMessages;
    
    // Normalize message date fields from snake_case to camelCase
    messages = messages.map((msg: any) => ({
      ...msg,
      createdAt: msg.createdAt || msg.created_at,
      updatedAt: msg.updatedAt || msg.updated_at,
      parentId: msg.parentId || msg.parent_id,
    }));
    
    // Add derived fields for convenience
    if (chat) {
      chat.isActive = chat.isEnabled !== false;
      chat.isMuted = chat.mutedUntil ? new Date(chat.mutedUntil) > new Date() : false;
    }
    
    return { chat, messages };
  },

  // Send message - Backend expects { content, parentId }
  sendMessage: async (chatId: string, content: string, parentId?: string): Promise<ChatMessage> => {
    return apiRequest(`/chat/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  },

  // Edit own message
  editMessage: async (messageId: string, content: string): Promise<ChatMessage> => {
    return apiRequest(`/chat/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  // Delete own message
  deleteMessage: async (messageId: string): Promise<void> => {
    return apiRequest(`/chat/messages/${messageId}`, {
      method: 'DELETE',
    });
  },
};

// Teacher APIs
export const teacherChatService = {
  // Pin message
  pinMessage: async (chatId: string, messageId: string): Promise<void> => {
    return apiRequest(`/teacher/chat/${chatId}/pin/${messageId}`, {
      method: 'POST',
    });
  },

  // Unpin message
  unpinMessage: async (chatId: string, messageId: string): Promise<void> => {
    return apiRequest(`/teacher/chat/${chatId}/pin/${messageId}`, {
      method: 'DELETE',
    });
  },

  // Mute chat - Backend uses mutedUntil
  muteChat: async (chatId: string, durationMinutes?: number): Promise<void> => {
    return apiRequest(`/teacher/chat/${chatId}/mute`, {
      method: 'POST',
      body: durationMinutes ? JSON.stringify({ durationMinutes }) : undefined,
    });
  },

  // Unmute chat
  unmuteChat: async (chatId: string): Promise<void> => {
    return apiRequest(`/teacher/chat/${chatId}/mute`, {
      method: 'DELETE',
    });
  },

  // Get analytics - Backend returns { summary, daily }
  getAnalytics: async (chatId: string): Promise<ChatAnalytics> => {
    return apiRequest(`/teacher/chat/${chatId}/analytics`);
  },
};

// Admin APIs
export const adminChatService = {
  // Ban user
  banUser: async (chatId: string, userId: string): Promise<void> => {
    return apiRequest(`/admin/chat/${chatId}/ban/${userId}`, {
      method: 'POST',
    });
  },

  // Toggle chat on/off - Backend uses isEnabled
  toggleChat: async (chatId: string): Promise<{ isEnabled: boolean }> => {
    return apiRequest(`/admin/chat/${chatId}/toggle`, {
      method: 'POST',
    });
  },

  // Clear chat history
  clearHistory: async (chatId: string): Promise<void> => {
    return apiRequest(`/admin/chat/${chatId}/history`, {
      method: 'DELETE',
    });
  },
};
