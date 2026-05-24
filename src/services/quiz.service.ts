import { apiRequest } from "./api";

export type QuizQuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "essay";

export interface QuizQuestion {
  id: string | number;
  type: QuizQuestionType;
  content: string;
  options?: string[] | null;
  points: number;
  correctAnswer?: string | null;
  explanation?: string | null;
  userAnswer?: string | null;
  isCorrect?: boolean;
}

export interface StudentQuiz {
  id: string | number;
  courseId: string | number;
  title: string;
  description?: string;
  timeLimit: number;
  maxScore: number;
  passingScore: number;
  maxAttempts?: number | null;
  questions?: QuizQuestion[];
  courseTitle?: string;
  type?: "course" | "placement";
  isLevelFinal?: boolean;
  level?: string;
  categoryId?: number | string | null;
  startTime?: string | null;
  endTime?: string | null;
  showResults?: boolean;
  antiCheat?: boolean;
  userStatus?: {
    status: "not_started" | "in_progress" | "completed";
    lastScore?: number | null;
    isPassed?: boolean | null;
    attemptCount?: number;
    latestAttemptId?: string | number | null;
  };
}

export interface QuizAttempt {
  id: string | number;
  quizId: string | number;
  userId: string | number;
  status?: "in_progress" | "submitted" | "graded" | string;
  score?: number;
  percentageScore?: number;
  maxScore?: number;
  passed?: boolean;
  startedAt: string;
  completedAt?: string;
  submittedAt?: string;
  timeLimit?: number;
  remainingSeconds?: number | null;
  timedOut?: boolean;
  answers?: Record<string, any>;
  quiz?: StudentQuiz;
  questions?: QuizQuestion[];
  level?: string;
  suggestedCourses?: any[];
  summary?: {
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    manualGradingCount: number;
  };
}

export interface QuizResults {
  questionId: string | number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  explanation?: string;
}

export interface QuizStartResponse {
  attempt: QuizAttempt;
  quiz: StudentQuiz;
  resumed?: boolean;
}

export interface QuizSubmitResponse {
  attempt: QuizAttempt;
  results: QuizResults[];
  quiz?: StudentQuiz;
  certificate?: { certificateId: string; issuedAt: string; isNew: boolean };
  levelUp?: { leveledUp: boolean; newLevel?: string; message?: string };
}

export const quizService = {
  async getMyAttempts(quizId: string | number): Promise<QuizAttempt[]> {
    const data = await apiRequest<{ attempts: QuizAttempt[] }>(
      `student/quizzes/${quizId}/attempts`,
      {
        method: "GET",
      },
    );
    return data.attempts || [];
  },

  async startQuiz(quizId: string | number): Promise<QuizStartResponse> {
    return apiRequest<QuizStartResponse>(
      `student/quizzes/${quizId}/start`,
      {
        method: "POST",
      },
    );
  },

  async submitQuiz(
    attemptId: string | number,
    answers: Record<string, any>,
    violationsCount?: number,
    violationLogs?: any[],
  ): Promise<QuizSubmitResponse> {
    return apiRequest<QuizSubmitResponse>(
      `student/attempts/${attemptId}/submit`,
      {
        method: "POST",
        body: JSON.stringify({ answers, violationsCount, violationLogs }),
      },
    );
  },

  async getAttemptDetail(attemptId: string | number): Promise<QuizSubmitResponse & { quiz: StudentQuiz }> {
    return apiRequest<QuizSubmitResponse & { quiz: StudentQuiz }>(
      `student/attempts/${attemptId}`,
      {
        method: "GET",
      },
    );
  },

  async listMyQuizzes(): Promise<StudentQuiz[]> {
    const res = await apiRequest<{ quizzes: StudentQuiz[] }>(
      `student/quizzes`,
      {
        method: "GET",
      },
    );
    return res.quizzes || [];
  },

  async getQuizzesByCourse(courseId: string | number): Promise<StudentQuiz[]> {
    const data = await apiRequest<{ quizzes: StudentQuiz[] }>(
      `student/courses/${courseId}/quizzes`,
      {
        method: "GET",
      },
    );
    return data.quizzes || [];
  },

  async getPerformanceStats(): Promise<PerformanceStats> {
    return apiRequest<PerformanceStats>(`student/performance-stats`, {
      method: "GET",
    });
  },
};

export interface PerformanceStats {
  statistics: {
    totalAttempts: number;
    totalScore: number;
    averagePercentage: number;
    passedCount: number;
    passRate: number;
  };
  recentAttempts: {
    id: string | number;
    quizTitle: string;
    courseTitle: string;
    language: string;
    score: number;
    maxScore: number;
    percentageScore: number;
    passed: boolean;
    completedAt: string;
  }[];
}
