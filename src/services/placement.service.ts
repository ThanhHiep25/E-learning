import { apiRequest } from "./api";

// Types matching BE response
export type PlacementSession = {
  sessionId: number;
  status: "in_progress" | "completed" | "abandoned";
  startingLevel: string;
  selfAssessedLevel?: string;
  totalQuestions?: number;
};

export type PlacementQuestion = {
  questionId: number;
  content: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  questionType?: "multiple_choice" | "true_false" | "fill_blank" | "sentence_ordering" | "listening";
  options: string[];
  segments?: string[];
  cefrLevel: string;
  skillArea?: "listening" | "reading" | "grammar" | "vocabulary";
  skillType?: string;
  difficultyScore?: number;
  audioText?: string;
  timeLimitSeconds?: number;
  audioUrl?: string;
  currentQuestion?: number;
  totalQuestions?: number;
  correctAnswer?: string;
};

export type SubmitAnswerResponse = {
  isCorrect: boolean;
  confidenceScore?: number;
  cefrLevel?: string;
  currentLevel?: string;
  abilityScore?: number;
  streakCorrect?: number;
  streakWrong?: number;
  canStopEarly?: boolean;
  questionCount?: number;
  minQuestions?: number;
  maxQuestions?: number;
  correctAnswer?: string;
  progress?: {
    totalQuestions: number;
    answered: number;
    skipped: number;
  };
  nextQuestion?: PlacementQuestion;
  completed: boolean;
  explanation?: string;
  result?: PlacementResultData;
};

export type PlacementResultData = {
  sessionId: number;
  finalCefrLevel: string;
  confidenceScore: number;
  skillBreakdown: {
    listening: string;
    reading: string;
    grammar: string;
    vocabulary: string;
  };
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  recommendedLevel: string;
  canRetake: boolean;
  retakeCooldownDays?: number;
};

export interface PlacementProgress {
  currentQuestion: number;
  totalQuestions: number;
  accuracy: number;
  correctCount?: number;
  wrongCount?: number;
  currentLevel?: string;
  status?: string;
  completed?: boolean;
  completionPercentage: number;
};

export type PlacementHistoryItem = {
  id: number;
  createdAt: string;
  completedAt?: string;
  finalCefrLevel?: string;
  confidenceScore?: number;
  totalQuestions: number;
  correctAnswers: number;
  status: string;
  recommendedLevel?: string;
};

export type RetakeEligibility = {
  canRetake: boolean;
  reason?: string;
  nextRetakeAvailableAt?: string;
  cooldownDays: number;
  lastTestDate?: string;
  totalAttempts: number;
};

// Extended session result type with recommendations
export type PlacementSessionResult = {
  sessionId: number;
  status: string;
  finalLevel: string;
  confidenceScore: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  skillBreakdown?: {
    listening: string;
    reading: string;
    grammar: string;
    vocabulary: string;
  };
  recommendations?: {
    aiAnalysis?: {
      summary?: string;
    };
    courses?: Array<{
      id: number;
      title: string;
      description?: string;
    }>;
  };
  completedAt?: string;
};

export type PlacementReviewQuestion = {
  questionId: number;
  type: string;
  content: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
  cefrLevel: string;
  skill: string;
  explanation: string | null;
};

export type PlacementReview = {
  sessionId: number;
  finalLevel: string;
  accuracy: number;
  confidenceScore: number;
  completedAt: string;
  totalQuestions: number;
  questions: PlacementReviewQuestion[];
};

export type QuickCheckSession = {
  sessionId: number;
  isQuickCheck: true;
  totalQuestions: number;
  currentQuestion: number;
  question: PlacementQuestion;
};

class PlacementService {
  // ========== FULL PLACEMENT TEST ==========

  /**
   * Start a new full placement test session
   * POST /api/student/placement/start
   */
  async startSession(params?: {
    targetCourseId?: number;
    selfAssessedLevel?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "unknown";
  }): Promise<PlacementSession> {
    const res = await apiRequest<{ sessionId: number; status: string; startingLevel: string; selfAssessedLevel?: string }>(
      "student/placement/start",
      {
        method: "POST",
        body: params ? JSON.stringify(params) : undefined,
      }
    );
    return {
      sessionId: res.sessionId,
      status: res.status as "in_progress" | "completed" | "abandoned",
      startingLevel: res.startingLevel,
      selfAssessedLevel: res.selfAssessedLevel,
    };
  }

  /**
   * Get next question for a session
   * GET /api/student/placement/:sessionId/question
   */
  async getNextQuestion(
    sessionId: number,
    demoMode: boolean = false
  ): Promise<
    | { completed: false; question: PlacementQuestion }
    | { completed: true; result: PlacementResultData }
  > {
    // BE returns { success: true, data: question } or { success: true, data: { completed, result } }
    const url = `student/placement/${sessionId}/question` + (demoMode ? '?demo=1' : '');
    const res = await apiRequest<
      | PlacementQuestion
      | { completed: true; result: PlacementResultData }
      | { data: PlacementQuestion }
      | { data: { completed: true; result: PlacementResultData } }
    >(url);

    // Handle case where apiRequest returns the data directly (question object)
    if (res && typeof res === 'object') {
      // Check if it's a completed response
      if ('completed' in res && res.completed === true) {
        return { completed: true, result: res.result as PlacementResultData };
      }
      
      // Check if res has a data property (double wrapped)
      if ('data' in res && res.data) {
        const inner = res.data;
        if (typeof inner === 'object' && 'completed' in inner && inner.completed === true) {
          return { completed: true, result: inner.result };
        }
        // inner is the question object
        return { completed: false, question: inner as PlacementQuestion };
      }
      
      // res is the question object directly
      return { completed: false, question: res as PlacementQuestion };
    }
    
    throw new Error('Invalid response from getNextQuestion');
  }

  /**
   * Submit answer for a question
   * POST /api/student/placement/:sessionId/answer
   */
  async submitAnswer(
    sessionId: number,
    data: {
      questionId: number;
      answer: string;
      timeSpentSeconds?: number;
    }
  ): Promise<SubmitAnswerResponse> {
    return apiRequest<SubmitAnswerResponse>(`student/placement/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Skip a question
   * POST /api/student/placement/:sessionId/skip
   */
  async skipQuestion(
    sessionId: number,
    data: {
      questionId: number;
      timeSpentSeconds?: number;
    }
  ): Promise<SubmitAnswerResponse> {
    return apiRequest<SubmitAnswerResponse>(`student/placement/${sessionId}/skip`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get test progress
   * GET /api/student/placement/:sessionId/progress
   */
  async getProgress(sessionId: number): Promise<PlacementProgress> {
    return apiRequest<PlacementProgress>(`student/placement/${sessionId}/progress`, {
      method: "GET",
    });
  }

  /**
   * Cancel a session
   * DELETE /api/student/placement/:sessionId/cancel
   */
  async cancelSession(sessionId: number): Promise<void> {
    await apiRequest(`/student/placement/${sessionId}/cancel`, { method: 'DELETE' });
  }

  async getCurrentSession(): Promise<any> {
    const res = await apiRequest('/student/placement/current');
    return res;
  }

  /**
   * Force complete a session
   * POST /api/student/placement/:sessionId/complete
   */
  async completeSession(sessionId: number): Promise<PlacementResultData> {
    const res = await apiRequest<{ success: boolean; data: PlacementResultData }>(
      `student/placement/${sessionId}/complete`,
      {
        method: "POST",
      }
    );
    return res.data;
  }

  /**
   * Get session result
   * GET /api/student/placement/:sessionId/result
   */
  async getResult(sessionId: number): Promise<PlacementSessionResult> {
    return apiRequest<PlacementSessionResult>(`student/placement/${sessionId}/result`, {
      method: "GET",
    });
  }

  /**
   * Get detailed session review
   * GET /api/student/placement/:sessionId/review
   */
  async getReview(sessionId: number): Promise<PlacementReview> {
    return apiRequest<PlacementReview>(`student/placement/${sessionId}/review`, {
      method: "GET",
    });
  }

  // ========== QUICK CHECK ==========

  /**
   * Start quick check (2-7 questions)
   * POST /api/student/placement/quick-check
   */
  async startQuickCheck(params?: {
    targetCourseId?: number;
  }): Promise<QuickCheckSession> {
    const res = await apiRequest<QuickCheckSession>("student/placement/quick-check", {
      method: "POST",
      body: params ? JSON.stringify(params) : undefined,
    });
    return res;
  }

  // ========== HISTORY & ELIGIBILITY ==========

  /**
   * Get user's placement test history
   * GET /api/student/placement/history
   */
  async getHistory(params?: { limit?: number; includeDetails?: boolean }): Promise<{
    history: PlacementHistoryItem[];
    count: number;
  }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.includeDetails) query.set("includeDetails", "true");

    const queryString = query.toString();
    return apiRequest<{ history: PlacementHistoryItem[]; count: number }>(
      `student/placement/history${queryString ? `?${queryString}` : ""}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Check retake eligibility
   * GET /api/student/placement/retake-eligibility
   */
  async checkRetakeEligibility(): Promise<RetakeEligibility> {
    return apiRequest<RetakeEligibility>("student/placement/retake-eligibility", {
      method: "GET",
    });
  }

  /**
   * Get suggested courses based on placement level
   * GET /api/student/placement/suggested-courses
   */
  async getSuggestedCourses(level: string, weakAreas?: string[]): Promise<any[]> {
    const query = new URLSearchParams();
    query.set("level", level);
    if (weakAreas && weakAreas.length > 0) {
      query.set("weakAreas", weakAreas.join(","));
    }
    query.set("_t", Date.now().toString());

    const queryString = query.toString();
    const res = await apiRequest<any[]>(
      `student/placement/suggested-courses?${queryString}`,
      {
        method: "GET",
      }
    );
    return res || [];
  }
}

export const placementService = new PlacementService();
