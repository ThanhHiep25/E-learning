import { apiRequest } from './api';

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
  Course?: {
    id: string | number;
    title: string;
  };
  User?: {
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

export const adminService = {
  async getDashboard(): Promise<AdminDashboardStats> {
    const res = await apiRequest<{ stats: AdminDashboardStats }>('admin/dashboard', {
      method: 'GET',
    });

    return res.stats;
  },

  async listUsers(): Promise<BackendAdminUser[]> {
    const res = await apiRequest<{ users: BackendAdminUser[] }>('admin/users', {
      method: 'GET',
    });
    return res.users || [];
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
};
