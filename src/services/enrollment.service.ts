import { apiRequest } from "./api";
import type { BackendCourseListItem } from "./course.service";

export type BackendEnrollment = {
  id: string | number;
  userId: string | number;
  courseId: string | number;
  status: string;
  progressPercent: number;
  enrolledAt?: string;
  lastAccessedAt?: string | null;
  lastLectureId?: number | null;
  // Expiration fields
  expiresAt?: string | null;
  gracePeriodEndsAt?: string | null;
  renewalCount?: number;
  lastRenewedAt?: string | null;
  enrollmentStatus?: 'active' | 'expired' | 'grace_period';
  Course?: BackendCourseListItem;
};

export type RenewalPriceResponse = {
  renewalPrice: number;
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  renewalMonths: number;
  currentExpiry: string | null;
  newExpiry: string;
  enrollmentStatus: string;
};

export type RenewEnrollmentResponse = {
  enrollment: BackendEnrollment;
  renewalMonths: number;
  newExpiresAt: string;
  newGracePeriodEndsAt: string;
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
      { method: "GET" }
    );

    cachedEnrollments = data.enrollments;
    cachedAtMs = now;
    return data.enrollments;
  },

  async getEnrollmentByCourse(courseId: string | number): Promise<BackendEnrollment> {
    const data = await apiRequest<{ enrollment: BackendEnrollment }>(
      `student/enrollments/course/${courseId}`,
      { method: "GET" }
    );
    return data.enrollment;
  },

  async enroll(courseId: string): Promise<BackendEnrollment> {
    const data = await apiRequest<{ enrollment: BackendEnrollment }>(
      `student/enroll/${courseId}`,
      { method: "POST" }
    );
    this.clearCache();
    return data.enrollment;
  },

  /**
   * Unenroll — FIXED: catches 400 errors for paid courses and re-throws with readable message
   */
  async unenroll(courseId: string): Promise<void> {
    try {
      await apiRequest<unknown>(`student/enroll/${courseId}`, {
        method: "DELETE",
      });
      this.clearCache();
    } catch (err: any) {
      // Backend returns 400 with message for paid courses
      const message =
        err?.message ||
        err?.data?.message ||
        "Không thể hủy ghi danh. Nếu đã thanh toán, vui lòng yêu cầu hoàn tiền.";
      throw new Error(message);
    }
  },

  async updateProgress(
    courseId: string,
    progressPercent: number
  ): Promise<BackendEnrollment> {
    const data = await apiRequest<{ enrollment: BackendEnrollment }>(
      `student/progress/${courseId}`,
      {
        method: "PUT",
        body: JSON.stringify({ progressPercent }),
      }
    );
    this.clearCache();
    return data.enrollment;
  },

  /**
   * Get enrollments expiring soon (renewal reminders)
   */
  async getExpiringEnrollments(daysThreshold: number = 7): Promise<BackendEnrollment[]> {
    const data = await apiRequest<{ enrollments: BackendEnrollment[] }>(
      `student/enrollments/expiring?days=${daysThreshold}`,
      { method: "GET" }
    );
    return data.enrollments;
  },

  /**
   * Get renewal price for an enrollment
   */
  async getRenewalPrice(
    enrollmentId: string | number,
    months: number
  ): Promise<RenewalPriceResponse> {
    // apiRequest auto-unwraps { success: true, data: {...} }
    const data = await apiRequest<RenewalPriceResponse>(
      `student/enrollments/${enrollmentId}/renewal-price?months=${months}`,
      { method: "GET" }
    );
    return data;
  },

  /**
   * Renew enrollment for a course
   */
  async renewEnrollment(
    enrollmentId: string | number,
    months: number,
    paymentId?: string
  ): Promise<RenewEnrollmentResponse> {
    const data = await apiRequest<{ data: RenewEnrollmentResponse }>(
      `student/enrollments/${enrollmentId}/renew`,
      {
        method: "POST",
        body: JSON.stringify({ months, paymentId }),
      }
    );
    this.clearCache();
    return data.data;
  },
};
