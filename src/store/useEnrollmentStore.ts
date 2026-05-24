import { create } from "zustand";
import { persist } from "zustand/middleware";
import { enrollmentService } from "../services/enrollment.service";
import {
  mapBackendCourseToFrontend,
  type FrontendCourse,
} from "../services/course.service";

interface EnrollmentMetadata {
  expiresAt?: string | null;
  enrollmentStatus?: 'active' | 'expired' | 'grace_period';
  gracePeriodEndsAt?: string | null;
}

interface EnrollmentState {
  enrolledCourses: FrontendCourse[];
  courseProgress: Record<string, number>;
  enrollmentMetadata: Record<string, EnrollmentMetadata>; // courseId -> metadata
  isLoading: boolean;
  error: string | null;
  syncEnrollments: () => Promise<void>;
  enrollCourse: (courseId: string) => Promise<void>;
  unenrollCourse: (courseId: string) => Promise<void>;
  clearEnrollments: () => Promise<void>;
  reset: () => void;
  totalEnrolled: () => number;
}

export const useEnrollmentStore = create<EnrollmentState>()(
  persist(
    (set, get) => ({
      enrolledCourses: [],
      courseProgress: {},
      enrollmentMetadata: {},
      isLoading: false,
      error: null,
      syncEnrollments: async () => {
        set({ isLoading: true, error: null });
        try {
          const enrollments = await enrollmentService.listMyEnrollments();
          const courses: FrontendCourse[] = enrollments
            .map((e) => e.Course)
            .filter(Boolean)
            .map((c: any) => {
              if (
                typeof c?.category === "string" &&
                typeof c?.teacher === "string" &&
                typeof c?.image === "string"
              ) {
                return {
                  id: String(c.id),
                  title: String(c.title),
                  teacher: c.teacher || "",
                  teacherAvatar: c.teacherAvatar,
                  image: c.image || "/elearning-1.jpg",
                  category: c.category || "Khác",
                  rating: Number(c.rating ?? 0),
                  reviewCount: Number(c.reviewCount ?? 0),
                  students: Number(c.students ?? 0),
                  level: (c.level as FrontendCourse["level"]) || "Mọi cấp độ",
                  totalLessons: Number(c.totalLessons ?? 0),
                  duration: String(c.duration ?? ""),
                  description: String(c.description ?? ""),
                  willLearn: Array.isArray(c.willLearn) ? c.willLearn : [],
                  requirements: Array.isArray(c.requirements)
                    ? c.requirements
                    : [],
                  curriculum: Array.isArray(c.curriculum) ? c.curriculum : [],
                  tags: Array.isArray(c.tags) ? c.tags : [],
                  price: Number(c.price ?? 0),
                  lastUpdated: String(c.lastUpdated ?? ""),
                  // Duration settings
                  durationType: c.durationType,
                  durationValue: c.durationValue,
                  durationUnit: c.durationUnit,
                  renewalDiscountPercent: c.renewalDiscountPercent,
                  gracePeriodDays: c.gracePeriodDays,
                };
              }

              return mapBackendCourseToFrontend({
                ...(c as any),
                Chapters: [],
              });
            });

          // Deduplicate courses by id
          const uniqueCourses: FrontendCourse[] = [];
          const seenIds = new Set<string>();
          for (const course of courses) {
            if (!seenIds.has(course.id)) {
              seenIds.add(course.id);
              uniqueCourses.push(course);
            }
          }

          const progressMap: Record<string, number> = {};
          const metadataMap: Record<string, EnrollmentMetadata> = {};
          enrollments.forEach((e) => {
            const rawProgress = e.progressPercent ?? 0;
            const progress = Math.min(100, Math.max(0, Number(rawProgress)));
            const safeProgress = isNaN(progress) ? 0 : progress;
            progressMap[String(e.courseId)] = safeProgress;
            // Store enrollment metadata for expiration display
            metadataMap[String(e.courseId)] = {
              expiresAt: e.expiresAt,
              enrollmentStatus: e.enrollmentStatus,
              gracePeriodEndsAt: e.gracePeriodEndsAt,
            };
          });

          set({ enrolledCourses: uniqueCourses, courseProgress: progressMap, enrollmentMetadata: metadataMap });
        } catch (err) {
          set({
            error:
              err instanceof Error
                ? err.message
                : "Không thể tải danh sách khóa học đã ghi danh",
          });
        } finally {
          set({ isLoading: false });
        }
      },
      enrollCourse: async (courseId: string) => {
        set({ isLoading: true, error: null });
        try {
          await enrollmentService.enroll(courseId);
          await get().syncEnrollments();
        } finally {
          set({ isLoading: false });
        }
      },
      unenrollCourse: async (courseId: string) => {
        set({ isLoading: true, error: null });
        try {
          await enrollmentService.unenroll(courseId);
          set({
            enrolledCourses: get().enrolledCourses.filter(
              (c) => c.id !== courseId,
            ),
          });
        } finally {
          set({ isLoading: false });
        }
      },
      clearEnrollments: async () => {
        const ids = get().enrolledCourses.map((c) => c.id);
        set({ isLoading: true, error: null });
        try {
          await Promise.all(ids.map((id) => enrollmentService.unenroll(id)));
          set({ enrolledCourses: [] });
        } finally {
          set({ isLoading: false });
        }
      },
      reset: () => {
        set({
          enrolledCourses: [],
          courseProgress: {},
          enrollmentMetadata: {},
          isLoading: false,
          error: null,
        });
      },
      totalEnrolled: () => get().enrolledCourses.length,
    }),
    {
      name: "enrollment-storage",
    },
  ),
);
