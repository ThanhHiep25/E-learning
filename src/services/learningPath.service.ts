import { apiRequest } from "./api";

export type LearningPathCourse = {
  courseId: number;
  title: string;
  slug: string;
  skill?: string;
  progress: number;
  isEnrolled: boolean;
  imageUrl?: string | null;
  status?: string;
  isRequired?: boolean;
};

export type LevelProgress = {
  level: string;
  totalCourses: number;
  completedCourses: number;
  progressPercent: number;
  courses: LearningPathCourse[];
};

export type MyLearningPathProgress = {
  userPathId: number;
  currentLevel: string | null;
  overallProgress: number;
  pathName: string;
  pathSlug: string;
  levels: LevelProgress[];
};

export type AssignPathRequest = {
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
};

export type AssignPathResponse = {
  assigned: boolean;
  updated: boolean;
  userPathId: number;
  pathId: number;
  pathName: string;
  currentLevel: string;
};

export type CanEnrollResponse = {
  allowed: boolean;
  reason?: string;
  requiredProgress?: number;
  currentProgress?: number;
};

export const learningPathService = {
  async getMyProgress(): Promise<MyLearningPathProgress | null> {
    try {
      return await apiRequest<MyLearningPathProgress>("/learning-paths/my-progress", { method: "GET" });
    } catch {
      return null;
    }
  },

  async getAllPaths() {
    return apiRequest("/learning-paths", { method: "GET" });
  },

  async getPathDetail(pathId: number) {
    return apiRequest(`/learning-paths/${pathId}`, { method: "GET" });
  },

  async assignPath(cefrLevel: string): Promise<AssignPathResponse> {
    return apiRequest<AssignPathResponse>("/learning-paths/assign", {
      method: "POST",
      body: JSON.stringify({ cefrLevel }),
    });
  },

  async canEnrollCourse(courseId: number): Promise<CanEnrollResponse> {
    return apiRequest<CanEnrollResponse>(`/learning-paths/enroll-check/${courseId}`, { method: "GET" });
  },

  async updateLevelProgress(courseId: number) {
    return apiRequest(`/learning-paths/update-progress/${courseId}`, { method: "POST" });
  },

  async advanceLevel(): Promise<{ newLevel: string; previousLevel: string }> {
    return apiRequest<{ newLevel: string; previousLevel: string }>("/learning-paths/advance", { method: "POST" });
  },
};
