import { apiClient } from "./api-client";

export interface BECourse {
  id: string;
  title: string;
  description: string;
  price: number;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
  categoryId?: number;
  createdBy?: string;
}

export interface BEChapter {
  id: string;
  title: string;
  order: number;
  courseId: string;
  Lectures?: BELecture[];
}

export interface BELecture {
  id: string;
  title: string;
  type: string;
  contentUrl: string;
  duration: number;
  order: number;
  chapterId: string;
}

export const teacherService = {
  // 6.1 Danh sách khóa học
  getCourses: async () =>
    apiClient.get<{ courses: BECourse[] }>("/api/teacher/courses"),

  // 6.2 Tạo khóa học
  createCourse: async (data: Partial<BECourse>) =>
    apiClient.post<{ course: BECourse }>("/api/teacher/courses", data),

  // 6.3 Chi tiết khóa học
  getCourseById: async (id: string) =>
    apiClient.get<{ course: BECourse }>(`/api/teacher/courses/${id}`),

  // 6.4 Cập nhật khóa học
  updateCourse: async (id: string, data: Partial<BECourse>) =>
    apiClient.patch<{ course: BECourse }>(`/api/teacher/courses/${id}`, data),

  // 6.5 Xóa khóa học
  deleteCourse: async (id: string) =>
    apiClient.delete<{ message: string }>(`/api/teacher/courses/${id}`),

  // 6.6 Nội dung khóa học (chương + bài giảng)
  getCourseCurriculum: async (courseId: string) =>
    apiClient.get<{ course: BECourse; chapters: BEChapter[] }>(
      `/api/teacher/courses/${courseId}/chapters`,
    ),

  // 6.7 Tạo chương
  createChapter: async (
    courseId: string,
    data: { title: string; order?: number },
  ) =>
    apiClient.post<{ chapter: BEChapter }>(
      `/api/teacher/courses/${courseId}/chapters`,
      data,
    ),

  // 6.8 Cập nhật chương
  updateChapter: async (id: string, data: { title?: string; order?: number }) =>
    apiClient.patch<{ chapter: BEChapter }>(
      `/api/teacher/chapters/${id}`,
      data,
    ),

  // 6.9 Xóa chương
  deleteChapter: async (id: string) =>
    apiClient.delete<{ message: string }>(`/api/teacher/chapters/${id}`),

  // 6.10 Tạo bài giảng
  createLecture: async (
    chapterId: string,
    data: {
      title: string;
      type: string;
      contentUrl?: string;
      duration?: number;
      order?: number;
    },
  ) =>
    apiClient.post<{ lecture: BELecture }>(
      `/api/teacher/chapters/${chapterId}/lectures`,
      data,
    ),

  // 6.11 Cập nhật bài giảng
  updateLecture: async (id: string, data: Partial<BELecture>) =>
    apiClient.patch<{ lecture: BELecture }>(
      `/api/teacher/lectures/${id}`,
      data,
    ),

  // 6.12 Xóa bài giảng
  deleteLecture: async (id: string) =>
    apiClient.delete<{ message: string }>(`/api/teacher/lectures/${id}`),

  // 5.1 Admin Dashboard (Admin can see all, teacher might use similar stats)
  getDashboardStats: async () =>
    apiClient.get<{
      stats: {
        totalUsers: number;
        totalCourses: number;
        totalEnrollments: number;
      };
    }>("/api/admin/dashboard"),
};
