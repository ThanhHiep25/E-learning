import { apiRequest } from "./api";

export type ForumType = "global" | "course" | "lecture";

export interface ForumPost {
  id: number;
  topicId: number;
  content: string;
  userId: number;
  parentId: number | null;
  isSolution: boolean;
  likes?: number;
  replyCount?: number;
  replies?: ForumPost[];
  author?: {
    id: number;
    name: string;
    avatar: string | null;
    role: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface ForumTopic {
  id: number;
  title: string;
  content: string;
  type: ForumType;
  courseId: number | null;
  lectureId: number | null;
  userId: number;
  views: number;
  postCount: number;
  lastPostAt: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isLocked: boolean;
  author?: {
    id: number;
    name: string;
    avatar: string | null;
    role: string;
  };
  posts?: ForumPost[];
}

export interface ForumTopicDetailsResponse {
  topic: ForumTopic;
  posts: ForumPost[];
}

export interface ForumTopicListResponse {
  topics: ForumTopic[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface ForumReport {
  id: number;
  topicId: number | null;
  postId: number | null;
  reporterId: number;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  reporter?: {
    id: number;
    name: string;
    avatar: string | null;
    email?: string;
  };
  topic?: ForumTopic;
  post?: ForumPost;
}

export interface ForumReportListResponse {
  reports: ForumReport[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export const forumService = {
  async getTopics(
    params: {
      courseId?: number | string;
      lectureId?: number | string;
      type?: ForumType;
      q?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<ForumTopicListResponse> {
    const query = new URLSearchParams();
    if (params.courseId) query.append("courseId", String(params.courseId));
    if (params.lectureId) query.append("lectureId", String(params.lectureId));
    if (params.type) query.append("type", params.type);
    if (params.q) query.append("q", params.q);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    return apiRequest<ForumTopicListResponse>(
      `forum/topics?${query.toString()}`,
    );
  },

  async createTopic(data: {
    title: string;
    content: string;
    type: ForumType;
    courseId?: number | string | null;
    lectureId?: number | string | null;
  }): Promise<ForumTopic> {
    return apiRequest<ForumTopic>(`forum/topics`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getTopicDetails(
    topicId: number | string,
  ): Promise<ForumTopicDetailsResponse> {
    return apiRequest<ForumTopicDetailsResponse>(`forum/topics/${topicId}`);
  },

  async createPost(
    topicId: number | string,
    data: {
      content: string;
      parentId?: number | string | null;
    },
  ): Promise<ForumPost> {
    return apiRequest<ForumPost>(`forum/topics/${topicId}/posts`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async markAsSolution(postId: number | string): Promise<void> {
    await apiRequest(`forum/posts/${postId}/solution`, {
      method: "PUT",
    });
  },

  async toggleLike(postId: number | string): Promise<{ action: 'liked' | 'unliked', likes: number }> {
    return apiRequest<{ action: 'liked' | 'unliked', likes: number }>(`forum/posts/${postId}/like`, {
      method: "POST",
    });
  },

  async deleteTopic(topicId: number | string): Promise<void> {
    await apiRequest(`forum/topics/${topicId}`, {
      method: "DELETE",
    });
  },

  async deletePost(postId: number | string): Promise<void> {
    await apiRequest(`forum/posts/${postId}`, {
      method: "DELETE",
    });
  },

  async editTopic(topicId: number | string, data: { title?: string, content?: string }): Promise<ForumTopic> {
    return apiRequest<ForumTopic>(`forum/topics/${topicId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async editPost(postId: number | string, data: { content: string }): Promise<ForumPost> {
    return apiRequest<ForumPost>(`forum/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async reportPost(postId: number | string, data: { reason: string }): Promise<void> {
    await apiRequest(`forum/posts/${postId}/report`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getReports(params: { status?: 'pending' | 'resolved' | 'dismissed' } = {}): Promise<ForumReportListResponse> {
    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    
    return apiRequest<ForumReportListResponse>(`forum/reports?${query.toString()}`);
  },

  async updateReportStatus(reportId: number | string, data: { status: 'pending' | 'resolved' | 'dismissed' }): Promise<void> {
    await apiRequest(`forum/reports/${reportId}/status`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async reportTopic(topicId: number | string, data: { reason: string }): Promise<void> {
    await apiRequest(`forum/topics/${topicId}/report`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async banUserForum(userId: number | string, data: { chatBannedUntil: string | null, chatBanReason?: string }): Promise<any> {
    return apiRequest(`admin/users/${userId}/ban-forum`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
