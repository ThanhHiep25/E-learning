import { apiRequest } from './api';

export type FinalQuiz = {
  id: string | number;
  title: string;
  description?: string;
  level: string;
  maxScore: number;
  timeLimit: number;
  passingScore: number;
  maxAttempts?: number | null;
  status: 'draft' | 'published';
  questions?: FinalQuizQuestion[];
};

export type FinalQuizQuestion = {
  id: string | number;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  content: string;
  options?: any;
  points: number;
};

export type UnlockStatus = {
  unlocked: boolean;
  requiredCourses: { id: string | number; title: string }[];
  completedCourses: (string | number)[];
};

export type FinalQuizAttempt = {
  id: string | number;
  score: number;
  percentageScore: number;
  passed: boolean;
  completedAt?: string;
  startedAt: string;
};

export const finalQuizService = {
  async getUnlockStatus(level: string): Promise<UnlockStatus> {
    return apiRequest<UnlockStatus>(
      `student/final-quizzes/${level}/unlock-status`,
      { method: 'GET' }
    );
  },

  async getFinalQuiz(level: string): Promise<{ quiz: FinalQuiz; unlockStatus: UnlockStatus; passedAttempt?: any; attempts?: any[]; maxAttempts?: number | null }> {
    return apiRequest<{ quiz: FinalQuiz; unlockStatus: UnlockStatus; passedAttempt?: any; attempts?: any[]; maxAttempts?: number | null }>(
      `student/final-quizzes/${level}`,
      { method: 'GET' }
    );
  },

  async startAttempt(quizId: string | number): Promise<{ attempt: any; quiz: FinalQuiz; resumed: boolean }> {
    return apiRequest<{ attempt: any; quiz: FinalQuiz; resumed: boolean }>(
      `student/quizzes/${quizId}/start`,
      { method: 'POST' }
    );
  },

  async submitAttempt(attemptId: string | number, answers: Record<string, any>): Promise<any> {
    return apiRequest<any>(
      `student/quizzes/attempts/${attemptId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }
    );
  },

  async getMyAttempts(): Promise<{ attempts: FinalQuizAttempt[] }> {
    return apiRequest<{ attempts: FinalQuizAttempt[] }>(
      `student/quizzes/attempts/my`,
      { method: 'GET' }
    );
  },

  async getAttemptDetail(attemptId: string | number): Promise<any> {
    return apiRequest<any>(
      `student/quizzes/attempts/${attemptId}`,
      { method: 'GET' }
    );
  },

  // Teacher/Admin
  async createFinalQuiz(input: {
    title: string;
    description?: string;
    level: string;
    maxScore?: number;
    timeLimit?: number;
    passingScore?: number;
    maxAttempts?: number | null;
  }): Promise<FinalQuiz> {
    const data = await apiRequest<{ data: { quiz: FinalQuiz } }>(
      `teacher/final-quizzes`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    return data.data.quiz;
  },

  async listFinalQuizzes(): Promise<FinalQuiz[]> {
    const data = await apiRequest<{ quizzes: FinalQuiz[] }>(
      `teacher/final-quizzes`,
      { method: 'GET' }
    );
    return data.quizzes || [];
  },
};
