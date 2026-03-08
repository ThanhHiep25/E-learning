import { apiRequest } from "./api";
import type { BackendCourseListItem } from "./course.service";

export type BackendEnrollment = {
  id: string | number;
  userId: string | number;
  courseId: string | number;
  status: string;
  progressPercent: number;
  enrolledAt?: string;
  Course?: BackendCourseListItem;
};

let cachedEnrollments: BackendEnrollment[] | null = null;
let cachedAtMs = 0;
const CACHE_TTL_MS = 1_000;

export const enrollmentService = {
  clearCache() {
    cachedEnrollments = null;
    cachedAtMs = 0;
  },
  async listMyEnrollments(): Promise<BackendEnrollment[]> {
    const now = Date.now();
    if (cachedEnrollments && now - cachedAtMs < CACHE_TTL_MS) {
      return cachedEnrollments;
    }

    const data = await apiRequest<{ enrollments: BackendEnrollment[] }>(
      "student/enrollments",
      {
        method: "GET",
      },
    );

    cachedEnrollments = data.enrollments;
    cachedAtMs = now;
    return data.enrollments;
  },

  async enroll(courseId: string): Promise<BackendEnrollment> {
    const data = await apiRequest<{ enrollment: BackendEnrollment }>(
      `student/courses/${courseId}/enroll`,
      {
        method: "POST",
      },
    );

    this.clearCache();
    return data.enrollment;
  },

  async unenroll(courseId: string): Promise<void> {
    await apiRequest<unknown>(`student/courses/${courseId}/enroll`, {
      method: "DELETE",
    });
    this.clearCache();
  },

  async updateProgress(
    courseId: string,
    progressPercent: number,
  ): Promise<BackendEnrollment> {
    const data = await apiRequest<{ enrollment: BackendEnrollment }>(
      `student/progress/${courseId}`,
      {
        method: "PUT",
        body: JSON.stringify({ progressPercent }),
      },
    );

    this.clearCache();
    return data.enrollment;
  },
};
