import { create } from "zustand";
import { persist } from "zustand/middleware";
import { courseService, type FrontendCourse } from "../services/course.service";
import { buildCurriculumIndex, type CurriculumIndex } from "./curriculumIndex";

interface CourseState {
  courses: FrontendCourse[];
  curriculumIndexByCourseId: Record<string, CurriculumIndex>;
  isLoading: boolean;
  error: string | null;
  loadCourses: (q?: string) => Promise<void>;
  loadCourseDetail: (courseId: string) => Promise<FrontendCourse | undefined>;
  reset: () => void;
  addCourse: (course: FrontendCourse) => void;
  updateCourse: (courseId: string, updatedCourse: Partial<FrontendCourse>) => void;
  deleteCourse: (courseId: string) => void;
  getCourseById: (courseId: string) => FrontendCourse | undefined;
  getCurriculumIndex: (courseId: string) => CurriculumIndex | undefined;
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      courses: [],
      curriculumIndexByCourseId: {},
      isLoading: false,
      error: null,
      loadCourses: async (q?: string) => {
        set({ isLoading: true, error: null });
        try {
          const courses = await courseService.listCourses(q);
          set({ courses });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : "Không thể tải danh sách khóa học" });
        } finally {
          set({ isLoading: false });
        }
      },
      loadCourseDetail: async (courseId: string) => {
        try {
          const detail = await courseService.getCourseDetail(courseId);
          set({
            courses: [
              detail,
              ...get().courses.filter((c) => c.id !== courseId),
            ],
            curriculumIndexByCourseId: {
              ...get().curriculumIndexByCourseId,
              [String(courseId)]: buildCurriculumIndex({
                courseId: String(courseId),
                curriculum: detail.curriculum,
              }),
            },
          });
          return detail;
        } catch (err) {
          set({ error: err instanceof Error ? err.message : "Không thể tải chi tiết khóa học" });
          return undefined;
        }
      },
      reset: () => {
        set({
          courses: [],
          curriculumIndexByCourseId: {},
          isLoading: false,
          error: null,
        });
      },
      addCourse: (course) => set({ courses: [course, ...get().courses] }),
      updateCourse: (courseId, updatedCourse) => {
        set({
          courses: get().courses.map((c) =>
            c.id === courseId ? { ...c, ...updatedCourse } : c,
          ),
          curriculumIndexByCourseId: updatedCourse.curriculum
            ? {
                ...get().curriculumIndexByCourseId,
                [String(courseId)]: buildCurriculumIndex({
                  courseId: String(courseId),
                  curriculum: updatedCourse.curriculum,
                }),
              }
            : get().curriculumIndexByCourseId,
        });
      },
      deleteCourse: (courseId) => {
        set({
          courses: get().courses.filter((c) => c.id !== courseId),
        });
      },
      getCourseById: (courseId) => {
        return get().courses.find((c) => c.id === courseId);
      },
      getCurriculumIndex: (courseId: string) => {
        const cached = get().curriculumIndexByCourseId[String(courseId)];
        if (cached) return cached;

        const course = get().courses.find((c) => String(c.id) === String(courseId));
        if (!course) return undefined;

        const idx = buildCurriculumIndex({
          courseId: String(courseId),
          curriculum: course.curriculum,
        });

        set({
          curriculumIndexByCourseId: {
            ...get().curriculumIndexByCourseId,
            [String(courseId)]: idx,
          },
        });

        return idx;
      },
    }),
    {
      name: "course-storage",
      partialize: (state) => ({
        courses: state.courses,
      }),
    },
  ),
);
