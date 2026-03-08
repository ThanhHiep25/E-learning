import { create } from "zustand";
import { persist } from "zustand/middleware";
import { enrollmentService } from "../services/enrollment.service";
import {
  mapBackendCourseToFrontend,
  type FrontendCourse,
} from "../services/course.service";

interface EnrollmentState {
  enrolledCourses: FrontendCourse[];
  courseProgress: Record<string, number>;
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
                };
              }

              return mapBackendCourseToFrontend({
                ...(c as any),
                Chapters: [],
              });
            });

          const progressMap: Record<string, number> = {};
          enrollments.forEach((e) => {
            progressMap[String(e.courseId)] = Number(e.progressPercent ?? 0);
          });

          set({ enrolledCourses: courses, courseProgress: progressMap });
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
