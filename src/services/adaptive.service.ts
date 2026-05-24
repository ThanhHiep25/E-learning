import { placementService } from "./placement.service";
import type { BackendCourseListItem } from "./course.service";
import { courseService } from "./course.service";

// Legacy interface - kept for backward compatibility
export interface PlacementQuiz {
  id: number;
  title: string;
  description?: string;
  questions: Array<{
    id: number;
    type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'fill_blank' | 'sentence_ordering';
    content: string;
    options?: any;
    segments?: string[];
    points: number;
    currentQuestion?: number;
    correctAnswer?: string;
    cefrLevel?: string;
    skillType?: string;
    difficultyScore?: number;
  }>;
  totalQuestions?: number;
  currentQuestion?: number;
}

export interface PlacementResult {
  sessionId?: number;
  score: number;
  maxScore: number;
  percentage: number;
  level: string;
  suggestedCourses: BackendCourseListItem[];
}

// Store active sessions in memory (will reset on page refresh)
const activeSessionState: {
  sessionId: number | null;
  questionMapping: Map<number, number>;
} = {
  sessionId: null,
  questionMapping: new Map(),
};

export const adaptiveService = {
  /**
   * Get placement test by category
   * Adapter: Uses placement service but returns legacy PlacementQuiz format
   */
  getPlacementTest: async (categoryId: number): Promise<PlacementQuiz> => {
    // Start a new placement session
    const session = await placementService.startSession({
      targetCourseId: categoryId,
    });

    // Collect all questions (adaptive - fetch until completed or max reached)
    const questions: PlacementQuiz["questions"] = [];
    let completed = false;

    while (!completed && questions.length < 50) {
      const result = await placementService.getNextQuestion(session.sessionId);

      if (result.completed) {
        completed = true;
        break;
      }

      // Convert BE question format to legacy format
      const q = result.question;
      questions.push({
        id: q.questionId,
        type: q.type === "multiple_choice" || q.type === "true_false" ? q.type : "multiple_choice",
        content: q.content,
        options: q.options,
        points: 1,
      });
    }

    // Store session state
    activeSessionState.sessionId = session.sessionId;
    activeSessionState.questionMapping = new Map(
      questions.map((q) => [q.id, q.id])
    );

    return {
      id: session.sessionId,
      title: "Bài kiểm tra đầu vào",
      description: "Bài test xác định trình độ tiếng Anh của bạn (A1-C2)",
      questions,
    };
  },

  /**
   * Submit placement test answers
   * Adapter: Submits each answer individually to placement service
   */
  submitPlacementTest: async (
    quizId: number,
    answers: Record<number, any>
  ): Promise<PlacementResult> => {
    // Get the session ID
    const sessionId = activeSessionState.sessionId || quizId;

    // Submit each answer
    const answerEntries = Object.entries(answers);

    for (const [questionIdStr, answer] of answerEntries) {
      const questionId = parseInt(questionIdStr, 10);
      if (isNaN(questionId)) continue;

      if (answer === null || answer === undefined || answer === "") {
        // Skip this question
        await placementService.skipQuestion(sessionId, {
          questionId,
          timeSpentSeconds: 30,
        });
      } else {
        // Submit answer
        const result = await placementService.submitAnswer(sessionId, {
          questionId,
          answer: String(answer),
          timeSpentSeconds: 30,
        });

        // If completed early (adaptive algorithm), break
        if (result.completed) {
          break;
        }
      }
    }

    // Get final result
    const result = await placementService.getResult(sessionId);

    // Map CEFR level to legacy level format
    const levelMap: Record<string, string> = {
      A1: "Cơ bản",
      A2: "Sơ cấp",
      B1: "Trung cấp",
      B2: "Trung cấp cao",
      C1: "Nâng cao",
      C2: "Chuyên sâu",
    };

    // Fetch recommended courses based on level
    const levelFilter = levelMap[result.finalLevel] || "Cơ bản";
    const allCourses = await courseService.listCourses();

    // Filter courses by level (simplified matching)
    const suggestedCourses = allCourses
      .filter((c) => {
        const courseLevel = c.level?.toLowerCase() || "";
        const targetLevel = levelFilter.toLowerCase();
        return (
          courseLevel.includes(targetLevel) ||
          (targetLevel === "cơ bản" && courseLevel.includes("beginner")) ||
          (targetLevel === "trung cấp" && courseLevel.includes("intermediate")) ||
          (targetLevel === "nâng cao" && courseLevel.includes("advanced"))
        );
      })
      .slice(0, 5);

    return {
      score: result.correctAnswers,
      maxScore: result.totalQuestions,
      percentage: Math.round((result.correctAnswers / result.totalQuestions) * 100),
      level: levelMap[result.finalLevel] || result.finalLevel,
      suggestedCourses,
    };
  },

  /**
   * Get placement test for beginner (self-assessed A1)
   * Creates session with selfAssessedLevel and returns quiz to take
   */
  getBeginnerPlacementTest: async (_categoryId: number): Promise<PlacementQuiz> => {
    // Start session with EMPTY body - let BE determine starting level
    const session = await placementService.startSession();

    const result = await placementService.getNextQuestion(session.sessionId);

    if (result.completed) {
      throw new Error('Bài test đã hoàn thành ngay sau khi bắt đầu');
    }

    if (!result.question) {
      console.error('[Placement] No question in response:', result);
      throw new Error('BE không trả về câu hỏi');
    }

    // Convert BE question format to legacy format
    const q = result.question;
    
    // Store session state for subsequent questions
    activeSessionState.sessionId = session.sessionId;
    activeSessionState.questionMapping = new Map([[q.questionId, q.questionId]]);

    return {
      id: session.sessionId,
      title: "Bài kiểm tra đầu vào (Cơ bản)",
      description: `Bài test xác định trình độ tiếng Anh của bạn - 20 câu hỏi`,
      questions: [{
        id: q.questionId,
        type: q.questionType === "fill_blank" ? "fill_blank" : q.questionType === "sentence_ordering" ? "sentence_ordering" : q.questionType === "multiple_choice" || q.questionType === "true_false" ? q.questionType : "multiple_choice",
        content: q.content,
        options: q.options,
        segments: q.segments,
        points: 1,
      }],
      totalQuestions: 20,
      currentQuestion: 1,
    };
  },

  /**
   * Fetch next question for ongoing placement test
   */
  fetchNextQuestion: async (sessionId: number, demoMode: boolean = false): Promise<PlacementQuiz['questions'][0] | null> => {
    const result = await placementService.getNextQuestion(sessionId, demoMode);

    if (result.completed) {
      return null;
    }

    if (!result.question) {
      console.error('[Placement] No question in response:', result);
      throw new Error('BE không trả về câu hỏi');
    }

    // Convert BE question format to legacy format
    const q = result.question;
    
    // Update question mapping
    activeSessionState.questionMapping.set(q.questionId, q.questionId);
    
    return {
      id: q.questionId,
      type: q.questionType === "fill_blank" ? "fill_blank" : q.questionType === "sentence_ordering" ? "sentence_ordering" : q.questionType === "multiple_choice" || q.questionType === "true_false" ? q.questionType : "multiple_choice",
      content: q.content,
      options: q.options,
      segments: q.segments,
      points: 1,
      currentQuestion: q.currentQuestion,
      correctAnswer: q.correctAnswer,
      cefrLevel: q.cefrLevel,
      skillType: q.skillType,
      difficultyScore: q.difficultyScore,
    };
  },

  /**
   * Get placement result directly (when all answers already submitted)
   */
  getPlacementResult: async (quizId: number): Promise<PlacementResult> => {
    const sessionId = activeSessionState.sessionId || quizId;
    
    // Get final result
    const result = await placementService.getResult(sessionId);

    // Map CEFR level to legacy level format
    const levelMap: Record<string, string> = {
      A1: "Cơ bản",
      A2: "Sơ cấp",
      B1: "Trung cấp",
      B2: "Trung cấp cao",
      C1: "Nâng cao",
      C2: "Chuyên sâu",
    };

    // Fetch recommended courses based on level
    const levelFilter = levelMap[result.finalLevel] || "Cơ bản";
    const allCourses = await courseService.listCourses();

    // Filter courses by level (simplified matching)
    const suggestedCourses = allCourses
      .filter((c) => {
        const courseLevel = c.level?.toLowerCase() || "";
        const targetLevel = levelFilter.toLowerCase();
        return (
          courseLevel.includes(targetLevel) ||
          (targetLevel === "cơ bản" && courseLevel.includes("beginner")) ||
          (targetLevel === "trung cấp" && courseLevel.includes("intermediate")) ||
          (targetLevel === "nâng cao" && courseLevel.includes("advanced"))
        );
      })
      .slice(0, 5);

    return {
      score: result.correctAnswers,
      maxScore: result.totalQuestions,
      percentage: Math.round((result.correctAnswers / result.totalQuestions) * 100),
      level: levelMap[result.finalLevel] || result.finalLevel,
      suggestedCourses,
    };
  },

  /**
   * Create self-assessed placement for beginner (skip test - for 'no-test' fallback only)
   * Creates a session with selfAssessedLevel and completes it immediately
   */
  createSelfAssessedPlacement: async (
    categoryId: number,
    selfAssessedLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "unknown"
  ): Promise<PlacementResult> => {
    // Create session with self-assessed level
    const session = await placementService.startSession({
      targetCourseId: categoryId,
      selfAssessedLevel,
    });

    // Complete immediately (self-declared, no test needed)
    void await placementService.completeSession(session.sessionId);

    // Map CEFR to legacy level
    const levelMap: Record<string, string> = {
      A1: "Cơ bản",
      A2: "Sơ cấp",
      B1: "Trung cấp",
      B2: "Trung cấp cao",
      C1: "Nâng cao",
      C2: "Chuyên sâu",
      unknown: "Cơ bản",
    };

    // Get courses for this level
    const levelFilter = levelMap[selfAssessedLevel] || "Cơ bản";
    const allCourses = await courseService.listCourses();

    const suggestedCourses = allCourses
      .filter((c) => {
        const courseLevel = c.level?.toLowerCase() || "";
        const targetLevel = levelFilter.toLowerCase();
        return (
          courseLevel.includes(targetLevel) ||
          (targetLevel === "cơ bản" && courseLevel.includes("beginner")) ||
          (targetLevel === "trung cấp" && courseLevel.includes("intermediate")) ||
          (targetLevel === "nâng cao" && courseLevel.includes("advanced"))
        );
      })
      .slice(0, 5);

    return {
      score: 0,
      maxScore: 0,
      percentage: 0,
      level: levelMap[selfAssessedLevel] || "Cơ bản",
      suggestedCourses,
    };
  },

  /**
   * Get recommendations for a category and level
   * Uses course service to find matching courses
   * Note: _categoryId is kept for API compatibility but filtering is by level only currently
   */
  getRecommendations: async (
    _categoryId: number,
    level: string
  ): Promise<PlacementResult> => {
    // Get all courses and filter by level
    const allCourses = await courseService.listCourses();

    // Level matching logic
    const levelKeywords = level.toLowerCase();
    const suggestedCourses = allCourses
      .filter((c) => {
        const courseLevel = c.level?.toLowerCase() || "";
        return (
          courseLevel.includes(levelKeywords) ||
          (levelKeywords.includes("cơ bản") &&
            (courseLevel.includes("beginner") || courseLevel.includes("cơ bản"))) ||
          (levelKeywords.includes("sơ cấp") &&
            (courseLevel.includes("elementary") || courseLevel.includes("sơ cấp"))) ||
          (levelKeywords.includes("trung cấp") &&
            (courseLevel.includes("intermediate") ||
              courseLevel.includes("trung cấp"))) ||
          (levelKeywords.includes("nâng cao") &&
            (courseLevel.includes("advanced") || courseLevel.includes("nâng cao")))
        );
      })
      .slice(0, 5);

    return {
      score: 0,
      maxScore: 0,
      percentage: 0,
      level,
      suggestedCourses,
    };
  },

  /**
   * Get assessment status
   * Uses placement service history
   */
  getAssessmentStatus: async (): Promise<{
    latest: {
      categoryId: number;
      categoryName: string;
      level: string;
      completedAt: string;
      sessionId?: number;
    };
    all: Array<{
      categoryId: number;
      categoryName: string;
      level: string;
      completedAt: string;
      sessionId?: number;
    }>;
  } | null> => {
    try {
      const history = await placementService.getHistory({ limit: 10 });

      if (!history.history || history.history.length === 0) {
        return null;
      }

      // Filter completed sessions - accept if status is completed OR if has finalLevel without status
      const completed = history.history.filter(
        (h: any) => (h.status === "completed" || !h.status) && (h.finalLevel || h.finalCefrLevel)
      );

      if (completed.length === 0) {
        return null;
      }

      // Map to legacy format
      const mapItem = (h: (typeof completed)[0]) => {
        const levelMap: Record<string, string> = {
          A1: "Cơ bản",
          A2: "Sơ cấp",
          B1: "Trung cấp",
          B2: "Trung cấp",
          C1: "Nâng cao",
          C2: "Nâng cao",
        };

        const item = h as any;
        return {
          categoryId: 1,
          categoryName: "Tiếng Anh",
          level: levelMap[item.finalLevel || item.finalCefrLevel || "A1"] || item.finalLevel || item.finalCefrLevel || "Cơ bản",
          completedAt: item.completedAt || item.createdAt,
          sessionId: item.id,
        };
      };

      return {
        latest: mapItem(completed[0]),
        all: completed.map(mapItem),
      };
    } catch (err) {
      console.error("Failed to get assessment status:", err);
      return null;
    }
  },
};
