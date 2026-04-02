import { apiRequest } from './api';

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

export const aiService = {
  // Admin methods
  getAllSettings: async (): Promise<AiSetting[]> => {
    const res = await apiRequest<{ settings: AiSetting[] }>('admin/ai/settings');
    return res.settings;
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

  // Student methods
  createConversation: async (data: { courseId?: number; lectureId?: number; title?: string }): Promise<AiConversation> => {
    const res = await apiRequest<{ conversation: AiConversation }>('student/ai/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.conversation;
  },

  sendMessage: async (convId: number, message: string): Promise<{ answer: string }> => {
    return apiRequest<{ answer: string }>(`student/ai/conversations/${convId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
  
  getConversations: async (): Promise<AiConversation[]> => {
    const res = await apiRequest<{ conversations: AiConversation[] }>('student/ai/conversations');
    return res.conversations;
  },

  getConversationDetails: async (id: number): Promise<{ messages: AiMessage[]; conversation: AiConversation }> => {
    const res = await apiRequest<{ messages: AiMessage[]; conversation: AiConversation }>(`student/ai/conversations/${id}`);
    return res;
  },

  deleteConversation: async (id: number): Promise<void> => {
    return apiRequest<void>(`student/ai/conversations/${id}`, {
      method: 'DELETE',
    });
  },
};
