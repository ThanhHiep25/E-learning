import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Course } from "../config/mock-data";

interface EnrollmentState {
  enrolledCourses: Course[];
  enroll: (course: Course) => void;
  unenroll: (courseId: string) => void;
  clearEnrollments: () => void;
  totalEnrolled: () => number;
}

export const useEnrollmentStore = create<EnrollmentState>()(
  persist(
    (set, get) => ({
      enrolledCourses: [],
      enroll: (course) => {
        const { enrolledCourses } = get();
        const isExist = enrolledCourses.find((c) => c.id === course.id);
        if (!isExist) {
          set({ enrolledCourses: [...enrolledCourses, course] });
        }
      },
      unenroll: (courseId) => {
        set({
          enrolledCourses: get().enrolledCourses.filter(
            (c) => c.id !== courseId,
          ),
        });
      },
      clearEnrollments: () => set({ enrolledCourses: [] }),
      totalEnrolled: () => get().enrolledCourses.length,
    }),
    {
      name: "enrollment-storage",
    },
  ),
);
