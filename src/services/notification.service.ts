import { apiRequest } from "./api";

export type NotificationType =
  | 'enrollment'
  | 'enrollment_success'
  | 'enrollment_renewal'
  | 'quiz'
  | 'review'
  | 'payment'
  | 'course_update'
  | 'certificate'
  | 'announcement'
  | 'system'
  | 'quiz_reminder'
  | 'study_reminder'
  | 'chapter_complete'
  | 'forum'
  | 'forum_ban'
  | 'report_resolution'
  | 'forum_reaction'
  | 'review_reply'
  | 'forum_reply'
  | 'message_mention'
  | 'course_approved'
  | 'course_rejected';

export interface Notification {
  id: string | number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  payload?: any;
  createdAt: string;
  created_at?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export const notificationService = {
  async getNotifications(role: 'student' | 'teacher' | 'admin', params: {
    page?: number;
    limit?: number;
    type?: NotificationType;
    read?: boolean;
  } = {}): Promise<NotificationListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.type) query.append('type', params.type);
    if (params.read !== undefined) query.append('read', String(params.read));

    const endpoint = role === 'admin' ? `admin/my-notifications` : `${role}/notifications`;
    return apiRequest<NotificationListResponse>(`${endpoint}?${query.toString()}`);
  },

  async markAsRead(role: 'student' | 'teacher' | 'admin', notificationId: string | number): Promise<void> {
    const endpoint = role === 'admin' ? `admin/my-notifications` : `${role}/notifications`;
    await apiRequest(`${endpoint}/${notificationId}/read`, {
      method: 'PUT'
    });
  },

  async markAllAsRead(role: 'student' | 'teacher' | 'admin'): Promise<void> {
    const endpoint = role === 'admin' ? `admin/my-notifications` : `${role}/notifications`;
    await apiRequest(`${endpoint}/read-all`, {
      method: 'PUT'
    });
  },

  async getById(role: 'student' | 'teacher' | 'admin', notificationId: string | number): Promise<Notification | null> {
    try {
      const endpoint = role === 'admin' ? `admin/my-notifications` : `${role}/notifications`;
      const response = await apiRequest<{ notification: Notification }>(`${endpoint}/${notificationId}`);
      return response.notification || null;
    } catch (error) {
      return null;
    }
  },

  async deleteNotification(role: 'student' | 'teacher' | 'admin', notificationId: string | number): Promise<void> {
    const endpoint = role === 'admin' ? `admin/my-notifications` : `${role}/notifications`;
    await apiRequest(`${endpoint}/${notificationId}`, {
      method: 'DELETE'
    });
  },

  async deleteAllNotifications(role: 'student' | 'teacher' | 'admin'): Promise<void> {
    const endpoint = role === 'admin' ? `admin/my-notifications` : role === 'teacher' ? `teacher/notifications/delete-all` : `student/notifications/delete-all`;
    await apiRequest(`${endpoint}${role === 'admin' ? '/delete-all' : ''}`, {
      method: 'DELETE'
    });
  }
};
