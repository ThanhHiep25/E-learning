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

export interface ChatSession {
  id: string;
  courseId: string;
  title?: string;
  isEnabled: boolean;
  mutedUntil?: string | null;
  isActive: boolean;
  isMuted: boolean;
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

// Course Chat APIs
export const courseChatService = {
  // Get course chat (student)
  getChat: async (courseId: string): Promise<{ chat: ChatSession; messages: ChatMessage[] }> => {
    const response = await apiRequest<any>(`/student/courses/${courseId}/chat`);
    const data = response.data || response;
    
    const chat = data.chat;
    let messages: any[] = [];
    
    // Handle backend returning [{0: {...}, 1: {...}}] or [{...}, {...}] format
    if (Array.isArray(data.messages)) {
      data.messages.forEach((msgGroup: any) => {
        if (typeof msgGroup === 'object' && msgGroup !== null) {
          const keys = Object.keys(msgGroup);
          // Check if keys are numeric (like "0", "1", "2")
          const hasNumericKeys = keys.some(k => !isNaN(Number(k)));
          if (hasNumericKeys) {
            // Flatten object values into messages array
            const values = Object.values(msgGroup);
            values.forEach((v: any) => {
              if (Array.isArray(v)) {
                messages.push(...v);
              } else {
                messages.push(v);
              }
            });
          } else {
            // It's a single message object
            messages.push(msgGroup);
          }
        }
      });
    } else if (typeof data.messages === 'object') {
      messages = Object.values(data.messages || {});
    }
    
    // Flatten any nested arrays
    messages = messages.flat(Infinity);
    
    // Normalize date fields
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

  // Send message to course chat (student)
  sendMessage: async (courseId: string, content: string, parentId?: string): Promise<{ message: ChatMessage; aiResponse?: ChatMessage }> => {
    const response = await apiRequest<any>(`/student/courses/${courseId}/chat/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
    return response;
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

// Teacher Course Chat APIs
export const teacherCourseChatService = {
  // Get course chat (teacher)
  getChat: async (courseId: string): Promise<{ chat: ChatSession; messages: ChatMessage[] }> => {
    const response = await apiRequest<any>(`/teacher/courses/${courseId}/chat`);
    const data = response.data || response;
    
    const chat = data.chat;
    let messages: any[] = [];
    
    // Handle backend returning [{0: {...}, 1: {...}}] format
    if (Array.isArray(data.messages) && data.messages.length === 1 && data.messages[0]) {
      const first = data.messages[0];
      const keys = Object.keys(first);
      if (keys.some(k => !isNaN(Number(k)))) {
        messages = Object.values(first);
      } else {
        messages = data.messages;
      }
    } else if (Array.isArray(data.messages)) {
      messages = data.messages;
    } else if (typeof data.messages === 'object') {
      messages = Object.values(data.messages || {});
    }
    
    const flattenedMessages: any[] = [];
    messages.forEach((msg: any) => {
      flattenedMessages.push(msg);
      if (msg.replies && Array.isArray(msg.replies)) {
        msg.replies.forEach((reply: any) => flattenedMessages.push(reply));
      }
    });
    messages = flattenedMessages;
    
    messages = messages.map((msg: any) => ({
      ...msg,
      createdAt: msg.createdAt || msg.created_at,
      updatedAt: msg.updatedAt || msg.updated_at,
      parentId: msg.parentId || msg.parent_id,
    }));
    
    if (chat) {
      chat.isActive = chat.isEnabled !== false;
      chat.isMuted = chat.mutedUntil ? new Date(chat.mutedUntil) > new Date() : false;
    }
    
    return { chat, messages };
  },

  // Reply to message
  reply: async (courseId: string, content: string, parentId?: string): Promise<ChatMessage> => {
    const response = await apiRequest<any>(`/teacher/courses/${courseId}/chat/reply`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
    return response.data?.message || response.message;
  },

  // Pin message
  pinMessage: async (courseId: string, messageId: string): Promise<void> => {
    return apiRequest(`/teacher/courses/${courseId}/chat/pin/${messageId}`, {
      method: 'POST',
    });
  },

  // Unpin message
  unpinMessage: async (courseId: string, messageId: string): Promise<void> => {
    return apiRequest(`/teacher/courses/${courseId}/chat/pin/${messageId}`, {
      method: 'DELETE',
    });
  },

  // Mute chat
  muteChat: async (courseId: string, durationMinutes?: number): Promise<void> => {
    return apiRequest(`/teacher/courses/${courseId}/chat/mute`, {
      method: 'POST',
      body: durationMinutes ? JSON.stringify({ durationMinutes }) : undefined,
    });
  },

  // Unmute chat
  unmuteChat: async (courseId: string): Promise<void> => {
    return apiRequest(`/teacher/courses/${courseId}/chat/mute`, {
      method: 'DELETE',
    });
  },

  // Ban user
  banUser: async (courseId: string, userId: string): Promise<void> => {
    return apiRequest(`/teacher/courses/${courseId}/chat/ban/${userId}`, {
      method: 'POST',
    });
  },

  // Unban user
  unbanUser: async (courseId: string, userId: string): Promise<void> => {
    return apiRequest(`/teacher/courses/${courseId}/chat/ban/${userId}`, {
      method: 'DELETE',
    });
  },

  // Get analytics
  getAnalytics: async (courseId: string): Promise<ChatAnalytics> => {
    return apiRequest(`/teacher/courses/${courseId}/chat/analytics`);
  },

  // Get escalations
  getEscalations: async (): Promise<any[]> => {
    const response = await apiRequest<any>(`/teacher/course-chat/escalations`);
    return response.data || response;
  },
};

// Admin Course Chat APIs
export const adminCourseChatService = {
  // Get course chat (admin)
  getChat: teacherCourseChatService.getChat,

  // Toggle chat on/off
  toggleChat: async (courseId: string): Promise<{ isEnabled: boolean }> => {
    return apiRequest(`/admin/courses/${courseId}/chat/toggle`, {
      method: 'POST',
    });
  },

  // Clear chat history
  clearHistory: async (courseId: string): Promise<void> => {
    return apiRequest(`/admin/courses/${courseId}/chat/history`, {
      method: 'DELETE',
    });
  },

  // Ban/unban user (admin)
  banUser: teacherCourseChatService.banUser,
  unbanUser: teacherCourseChatService.unbanUser,

  // Pin/unpin (admin)
  pinMessage: teacherCourseChatService.pinMessage,
  unpinMessage: teacherCourseChatService.unpinMessage,

  // Mute/unmute (admin)
  muteChat: teacherCourseChatService.muteChat,
  unmuteChat: teacherCourseChatService.unmuteChat,

  // Reply (admin)
  reply: teacherCourseChatService.reply,

  // Get analytics (admin)
  getAnalytics: async (courseId: string): Promise<ChatAnalytics> => {
    return apiRequest(`/admin/courses/${courseId}/chat/analytics`);
  },

  // Get escalations (admin)
  getEscalations: async (): Promise<any[]> => {
    const response = await apiRequest<any>(`/admin/course-chat/escalations`);
    return response.data || response;
  },
};
