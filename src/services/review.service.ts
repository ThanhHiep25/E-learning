import { apiRequest } from "./api";

export type ReviewUser = {
  id: string | number;
  name: string;
  avatar?: string;
};

export type Review = {
  id: string | number;
  courseId: string | number;
  userId: string | number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: ReviewUser;
};

export type ReviewStatistics = {
  averageRating: string | number;
  totalReviews: number;
  distribution: {
    [key: string]: number;
  };
};

export type ReviewListResponse = {
  reviews: Review[];
  statistics: ReviewStatistics;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export const reviewService = {
  async getCourseReviews(
    courseId: string | number,
    params: {
      page?: number;
      limit?: number;
      rating?: number;
      sort?: string;
    } = {},
  ): Promise<ReviewListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.rating) searchParams.append("rating", params.rating.toString());
    if (params.sort) searchParams.append("sort", params.sort);

    const queryString = searchParams.toString();
    const path = `courses/${courseId}/reviews${queryString ? `?${queryString}` : ""}`;

    return apiRequest<ReviewListResponse>(path, {
      method: "GET",
      auth: false,
    });
  },

  async createReview(
    courseId: string | number,
    data: { rating: number; comment?: string },
  ): Promise<Review> {
    return apiRequest<Review>(`student/courses/${courseId}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateReview(
    reviewId: string | number,
    data: { rating: number; comment?: string },
  ): Promise<Review> {
    return apiRequest<Review>(`student/reviews/${reviewId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteReview(reviewId: string | number): Promise<void> {
    await apiRequest<void>(`student/reviews/${reviewId}`, {
      method: "DELETE",
    });
  },

  async getMyReviews(): Promise<Review[]> {
    return apiRequest<Review[]>("student/reviews", {
      method: "GET",
    });
  },
};
