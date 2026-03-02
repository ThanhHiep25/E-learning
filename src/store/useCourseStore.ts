import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockCourses, type Course } from "../config/mock-data";

interface CourseState {
  courses: Course[];
  addCourse: (course: Course) => void;
  updateCourse: (courseId: string, updatedCourse: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  getCourseById: (courseId: string) => Course | undefined;
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      courses: mockCourses,
      addCourse: (course) => set({ courses: [course, ...get().courses] }),
      updateCourse: (courseId, updatedCourse) => {
        set({
          courses: get().courses.map((c) =>
            c.id === courseId ? { ...c, ...updatedCourse } : c,
          ),
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
    }),
    {
      name: "course-storage",
    },
  ),
);
