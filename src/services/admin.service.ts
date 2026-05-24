import { apiRequest } from './api';
import type { BackendTeacherCourse } from './teacher.service';

export type AdminDashboardStats = {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalCategories?: number;
  totalReviews?: number;
  publishedCourses?: number;
  totalPayments?: number;
  completedPayments?: number;
  failedPayments?: number;
  totalRevenue?: number;
  avgRating?: number;
  learning?: {
    totalAttempts: number;
    avgPercentageOverall: number;
    last7Days: Array<{
      date: string;
      attempts: number;
      avgPercentage: number;
    }>;
  };
};

export type BackendAdminUser = {
  id: string | number;
  name: string;
  username?: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  isEmailVerified?: boolean;
  chatBannedUntil?: string | null;
  createdAt?: string;
};

export type CreateAdminUserInput = {
  username: string;
  email: string;
  password: string;
  role?: 'student' | 'teacher';
};

export type UpdateAdminUserInput = {
  role?: 'student' | 'teacher';
  isActive?: boolean;
  newPassword?: string;
};

export type BackendAdminCategory = {
  id: string | number;
  name: string;
  menuSection?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BackendAdminReview = {
  id: string | number;
  rating: number;
  comment?: string;
  createdAt?: string;
  created_at?: string;
  Course?: {
    id: string | number;
    title: string;
  };
  course?: {
    id: string | number;
    title: string;
  };
  User?: {
    id: string | number;
    name?: string;
    email?: string;
  };
  user?: {
    id: string | number;
    name?: string;
    email?: string;
  };
};

export type BackendAdminPayment = {
  id: string | number;
  userId: string | number;
  courseId: string | number;
  amount: string | number;
  currency: string;
  provider: 'stripe' | 'paypal' | 'bank_transfer' | 'mock';
  providerTxn: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
  course?: {
    id: string | number;
    title: string;
    price?: string | number;
    published?: boolean;
    createdBy?: string | number;
  };
  user?: {
    id: string | number;
    name?: string;
    username?: string;
    email?: string;
    role?: string;
  };
};

export type TrackingAnalytics = {
  stats: {
    totalViews: number;
    uniqueUsers: number;
  };
  pageStats: Array<{
    page: string;
    count: number;
  }>;
  activities: {
    items: Array<{
      id: number;
      userId: number | null;
      action: string;
      page: string | null;
      userAgent: string | null;
      ipAddress: string | null;
      duration: number | null;
      referrer: string | null;
      deviceType: string | null;
      createdAt: string;
      user?: {
        name: string;
        email: string;
      };
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AdminPaymentsQuery = {
  page?: number;
  limit?: number;
  status?: string;
  provider?: string;
  courseId?: string | number;
  userId?: string | number;
};

export interface RevenueByDay {
  date: string;
  dayOfWeek: string;
  revenue: number;
  count: number;
}

export interface TopCourse {
  id: number;
  title: string;
  thumbnail: string | null;
  enrollmentCount: number;
}

export interface PaymentStatusCounts {
  statusCounts: {
    completed: number;
    pending: number;
    failed: number;
    cancelled: number;
  };
}

export const adminService = {
  async listAllCourses(): Promise<BackendTeacherCourse[]> {
    // Backend currently exposes canonical admin-visible course listing via teacher/courses with admin role.
    const res = await apiRequest<{ courses: BackendTeacherCourse[] }>('teacher/courses', {
      method: 'GET',
    });
    return res.courses || [];
  },

  async deleteCourse(courseId: string | number): Promise<void> {
    await apiRequest<unknown>(`teacher/courses/${courseId}`, {
      method: 'DELETE',
    });
  },

  async getDashboard(): Promise<AdminDashboardStats> {
    const res = await apiRequest<{ stats: AdminDashboardStats }>('admin/dashboard', {
      method: 'GET',
    });

    return res.stats;
  },

  async getRevenueByDay(): Promise<{ revenueByDay: RevenueByDay[] }> {
    return await apiRequest<{ revenueByDay: RevenueByDay[] }>('admin/revenue-by-day', {
      method: 'GET',
    });
  },

  async getTopCourses(limit = 5): Promise<{ topCourses: TopCourse[] }> {
    return await apiRequest<{ topCourses: TopCourse[] }>(`admin/top-courses?limit=${limit}`, {
      method: 'GET',
    });
  },

  async getPaymentStatusCounts(): Promise<PaymentStatusCounts> {
    return await apiRequest<PaymentStatusCounts>('admin/payment-status-counts', {
      method: 'GET',
    });
  },

  async listUsers(): Promise<BackendAdminUser[]> {
    const res = await apiRequest<{ users: BackendAdminUser[] }>('admin/users', {
      method: 'GET',
    });
    return res.users || [];
  },

  async listUsersByRole(role: 'student' | 'teacher' | 'admin'): Promise<BackendAdminUser[]> {
    const res = await apiRequest<{ users: BackendAdminUser[] }>(`admin/users?role=${role}`, {
      method: 'GET',
    });
    return res.users || [];
  },

  async exportUsersCSV(role?: 'student' | 'teacher' | 'admin'): Promise<Blob> {
    const url = role ? `admin/users/export-csv?role=${role}` : 'admin/users/export-csv';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('elearning_token');

    const response = await fetch(`${baseUrl}/${url}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Export failed');
    }
    return response.blob();
  },

  async createUser(input: CreateAdminUserInput): Promise<BackendAdminUser> {
    const res = await apiRequest<{ user: BackendAdminUser }>('admin/users', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.user;
  },

  async updateUser(userId: string, input: UpdateAdminUserInput): Promise<BackendAdminUser> {
    const res = await apiRequest<{ user: BackendAdminUser }>(`admin/users/${userId}`.replace(/\/+/g, '/'), {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return res.user;
  },

  async deleteUser(userId: string): Promise<void> {
    await apiRequest<unknown>(`admin/users/${userId}`.replace(/\/+/g, '/'), {
      method: 'DELETE',
    });
  },

  async listCategories(): Promise<BackendAdminCategory[]> {
    const res = await apiRequest<{ categories: BackendAdminCategory[] }>('admin/categories', {
      method: 'GET',
    });
    return res.categories || [];
  },

  async createCategory(input: { name: string; menuSection?: string | null }): Promise<BackendAdminCategory> {
    const res = await apiRequest<{ category: BackendAdminCategory }>('admin/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.category;
  },

  async updateCategory(categoryId: string, input: { name?: string; menuSection?: string | null }): Promise<BackendAdminCategory> {
    const res = await apiRequest<{ category: BackendAdminCategory }>(`admin/categories/${categoryId}`.replace(/\/+/g, '/'), {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return res.category;
  },

  async deleteCategory(categoryId: string): Promise<void> {
    await apiRequest<unknown>(`admin/categories/${categoryId}`.replace(/\/+/g, '/'), {
      method: 'DELETE',
    });
  },

  async listReviews(params?: { courseId?: string | number }): Promise<BackendAdminReview[]> {
    const q = params?.courseId != null ? `?courseId=${encodeURIComponent(String(params.courseId))}` : '';
    const res = await apiRequest<{ reviews: BackendAdminReview[] }>(`admin/reviews${q}`, {
      method: 'GET',
    });
    return res.reviews || [];
  },

  async deleteReview(reviewId: string): Promise<void> {
    await apiRequest<unknown>(`admin/reviews/${reviewId}`.replace(/\/+/g, '/'), {
      method: 'DELETE',
    });
  },

  async listPayments(query: AdminPaymentsQuery = {}): Promise<{ payments: BackendAdminPayment[]; pagination: Pagination }> {
    const qs = new URLSearchParams();
    if (query.page != null) qs.set('page', String(query.page));
    if (query.limit != null) qs.set('limit', String(query.limit));
    if (query.status) qs.set('status', query.status);
    if (query.provider) qs.set('provider', query.provider);
    if (query.courseId != null) qs.set('courseId', String(query.courseId));
    if (query.userId != null) qs.set('userId', String(query.userId));

    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const res = await apiRequest<{ payments: BackendAdminPayment[]; pagination: Pagination }>(`admin/payments${suffix}`, {
      method: 'GET',
    });

    return {
      payments: res.payments || [],
      pagination: res.pagination,
    };
  },

  async getTrackingAnalytics(params?: { page?: number; limit?: number; search?: string }): Promise<TrackingAnalytics> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return await apiRequest<TrackingAnalytics>(`tracking/analytics${suffix}`, {
      method: 'GET',
    });
  },

  // ==========================================
  // AI ADMIN APIs
  // ==========================================

  async getAISettings(): Promise<any> {
    return await apiRequest<any>('admin/ai/settings', {
      method: 'GET',
    });
  },

  async updateAISettings(settings: any): Promise<any> {
    return await apiRequest<any>('admin/ai/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async getAIPolicies(): Promise<any> {
    return await apiRequest<any>('admin/ai/policies', {
      method: 'GET',
    });
  },

  async createAIPolicy(policy: { role: string; enabled?: boolean; dailyLimit?: number; maxOutputTokens?: number; ragTopK?: number }): Promise<any> {
    return await apiRequest<any>('admin/ai/policies', {
      method: 'POST',
      body: JSON.stringify(policy),
    });
  },

  async getPromptTemplates(): Promise<any> {
    return await apiRequest<any>('admin/ai/prompt-templates', {
      method: 'GET',
    });
  },

  async createPromptTemplate(template: { name: string; content: string; type?: string }): Promise<any> {
    return await apiRequest<any>('admin/ai/prompt-templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  },

  async getAIAuditLogs(params?: { page?: number; limit?: number }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return await apiRequest<any>(`admin/ai/audit-logs${suffix}`, {
      method: 'GET',
    });
  },

  async getPlatformAnalytics(params?: { startDate?: string; endDate?: string }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return await apiRequest<any>(`admin/ai/platform-analytics${suffix}`, {
      method: 'GET',
    });
  },

  async getContentQualityReport(): Promise<any> {
    return await apiRequest<any>('admin/ai/content-quality-report', {
      method: 'GET',
    });
  },

  // ==========================================
  // NOTIFICATION ADMIN APIs
  // ==========================================

  async sendNotification(notification: { userId?: string | number; title: string; message: string; type?: string; courseId?: string | number }): Promise<any> {
    return await apiRequest<any>('admin/notifications/send', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  },

  async getAllNotifications(params?: { page?: number; limit?: number }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return await apiRequest<any>(`admin/notifications${suffix}`, {
      method: 'GET',
    });
  },

  async scheduleNotifications(): Promise<any> {
    return await apiRequest<any>('admin/notifications/schedule', {
      method: 'POST',
    });
  },

  async getMyNotifications(params?: { page?: number; limit?: number }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return await apiRequest<any>(`admin/my-notifications${suffix}`, {
      method: 'GET',
    });
  },

  async markNotificationAsRead(notificationId: string): Promise<any> {
    return await apiRequest<any>(`admin/my-notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  async markAllNotificationsAsRead(): Promise<any> {
    return await apiRequest<any>('admin/my-notifications/read-all', {
      method: 'PUT',
    });
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await apiRequest<unknown>(`admin/my-notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },

  async deleteAllNotifications(): Promise<void> {
    await apiRequest<unknown>('admin/my-notifications/delete-all', {
      method: 'DELETE',
    });
  },

  // ==========================================
  // PLACEMENT ADMIN APIs
  // ==========================================

  async getPlacementQuestionBankStats(): Promise<any> {
    return await apiRequest<any>('admin/placement/question-bank/stats', {
      method: 'GET',
    });
  },

  async generatePlacementQuestions(params?: { count?: number; difficulty?: string }): Promise<any> {
    return await apiRequest<any>('admin/placement/question-bank/generate', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  },

  async getPlacementSessions(params?: { page?: number; limit?: number }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return await apiRequest<any>(`admin/placement/sessions${suffix}`, {
      method: 'GET',
    });
  },

  async getUserPlacementHistory(userId: string | number): Promise<any> {
    return await apiRequest<any>(`admin/placement/user/${userId}/history`, {
      method: 'GET',
    });
  },

  async resetPlacementCooldown(userId: string | number): Promise<any> {
    return await apiRequest<any>(`admin/placement/user/${userId}/reset-cooldown`, {
      method: 'POST',
    });
  },

  async deletePlacementSession(sessionId: string | number): Promise<void> {
    await apiRequest<unknown>(`admin/placement/session/${sessionId}`, {
      method: 'DELETE',
    });
  },

  async getPlacementAnalyticsDashboard(): Promise<any> {
    return await apiRequest<any>('admin/placement/analytics/dashboard', {
      method: 'GET',
    });
  },

  async getPlacementOverallStats(): Promise<any> {
    return await apiRequest<any>('admin/placement/analytics/stats', {
      method: 'GET',
    });
  },

  async getPlacementLevelDistribution(): Promise<any> {
    return await apiRequest<any>('admin/placement/analytics/levels', {
      method: 'GET',
    });
  },

  async getPlacementSkillPerformance(): Promise<any> {
    return await apiRequest<any>('admin/placement/analytics/skill-performance', {
      method: 'GET',
    });
  },

  async getPlacementDifficultQuestions(): Promise<any> {
    return await apiRequest<any>('admin/placement/analytics/difficult-questions', {
      method: 'GET',
    });
  },

  async getPlacementQuestionBankAnalytics(): Promise<any> {
    return await apiRequest<any>('admin/placement/analytics/question-bank', {
      method: 'GET',
    });
  },

  async getPlacementTrends(): Promise<any> {
    return await apiRequest<any>('admin/placement/analytics/trends', {
      method: 'GET',
    });
  },

  // ==========================================
  // FORUM ADMIN APIs
  // ==========================================

  async lockTopic(topicId: string | number, locked: boolean = true): Promise<any> {
    return await apiRequest<any>(`forum/topics/${topicId}/lock`, {
      method: 'PUT',
      body: JSON.stringify({ locked }),
    });
  },

  async getForumReports(params?: { status?: string; page?: number; limit?: number }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return await apiRequest<any>(`forum/reports${suffix}`, {
      method: 'GET',
    });
  },

  async updateReportStatus(reportId: string | number, status: string, resolution?: string): Promise<any> {
    return await apiRequest<any>(`forum/reports/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolution }),
    });
  },

  async banUserFromForum(userId: string | number, reason?: string, duration?: number): Promise<any> {
    return await apiRequest<any>(`forum/admin/users/${userId}/ban-forum`, {
      method: 'PUT',
      body: JSON.stringify({ reason, duration }),
    });
  },

  // ==========================================
  // ENROLLMENT ADMIN APIs (from protected.routes.js)
  // ==========================================

  async enrollUserToCourse(userId: string | number, courseId: string | number): Promise<any> {
    return await apiRequest<any>('admin/enrollments', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId }),
    });
  },

  async unenrollUserFromCourse(userId: string | number, courseId: string | number): Promise<void> {
    await apiRequest<unknown>('admin/enrollments', {
      method: 'DELETE',
      body: JSON.stringify({ userId, courseId }),
    });
  },

  async getCourseEnrollmentsAdmin(courseId: string | number): Promise<any> {
    return await apiRequest<any>(`admin/courses/${courseId}/enrollments-admin`, {
      method: 'GET',
    });
  },

  async getCourseContentForReview(courseId: string | number): Promise<any> {
    return await apiRequest<any>(`teacher/courses/${courseId}/chapters`, {
      method: 'GET',
    });
  },

  async getUserEnrollments(userId: string | number): Promise<any> {
    return await apiRequest<any>(`admin/users/${userId}/enrollments`, {
      method: 'GET',
    });
  },

  // ==========================================
  // COURSE REVIEW ADMIN APIs
  // ==========================================

  async getPendingReviewCourses(params?: { page?: number; limit?: number }): Promise<{ courses: any[]; pagination: Pagination }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';

    const res = await apiRequest<{ courses: any[]; pagination: Pagination }>(
      `admin/courses/pending-review${suffix}`,
      {
        method: 'GET',
      },
    );
    return {
      courses: res.courses || [],
      pagination: res.pagination,
    };
  },

  async reviewCourse(courseId: string | number, action: 'approve' | 'reject', rejectionReason?: string): Promise<{ message: string; course: any }> {
    const res = await apiRequest<{ message: string; course: any }>(
      `admin/courses/${courseId}/review`,
      {
        method: 'POST',
        body: JSON.stringify({ action, rejectionReason }),
      },
    );
    return {
      message: res.message,
      course: res.course,
    };
  },

  async togglePublishCourse(courseId: string | number): Promise<{ message: string; course: any }> {
    // apiRequest unwraps data when success: true, so we get the whole response
    const res = await apiRequest<any>(
      `admin/courses/${courseId}/toggle-publish`,
      {
        method: 'PATCH',
      },
    );
    // If res is the course object directly (data unwrapped)
    if (res && res.id) {
      return {
        message: res.published ? 'Đã publish khóa học' : 'Đã unpublish khóa học',
        course: res,
      };
    }
    return {
      message: res?.message || 'Thành công',
      course: res?.data || res,
    };
  },

  // ==========================================
  // TEACHER KPI APIs
  // ==========================================

  async getTeacherKPIs(
    teacherId: string | number,
    params?: { period?: 'all' | 'month' | 'quarter' | 'year'; year?: string | number; month?: string | number }
  ): Promise<{
    teacher: BackendAdminUser;
    period?: { label: string; period: string; startDate: string | null; endDate: string | null };
    kpis: {
      totalCourses: number;
      publishedCourses: number;
      pendingCourses: number;
      totalStudents: number;
      totalRevenue: number;
      avgRating: string;
      completionRate: string;
      compositeScore: string;
      currency: string;
    };
    topCourses: Array<{
      id: number;
      title: string;
      enrollmentCount: number;
      revenue: number;
    }>;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.year) queryParams.append('year', String(params.year));
    if (params?.month) queryParams.append('month', String(params.month));
    
    const url = `admin/teachers/${teacherId}/kpis${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res = await apiRequest<any>(url, {
      method: 'GET',
    });
    return res;
  },

  // ==========================================
  // AUDIT LOG APIs
  // ==========================================

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    targetType?: string;
  }): Promise<{
    data: Array<{
      id: number;
      adminId: number;
      action: string;
      targetType: string;
      targetId: number;
      reason: string | null;
      metadata: string;
      createdAt: string;
      admin: {
        id: number;
        name: string;
        email: string;
      };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.action) queryParams.append('action', params.action);
    if (params?.targetType) queryParams.append('targetType', params.targetType);

    const url = `admin/audit-logs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res = await apiRequest<any>(url, {
      method: 'GET',
    });
    return res;
  },
};
