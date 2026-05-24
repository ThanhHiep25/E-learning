import { apiRequest } from './api';

// Learning Path Interfaces
export interface LearningPathStep {
  id: string;
  type: 'lecture' | 'quiz' | 'assignment' | 'practice';
  title: string;
  description?: string;
  estimatedDuration?: number;
  isCompleted: boolean;
  isLocked: boolean;
  prerequisites?: string[];
  content?: {
    lectureId?: number;
    quizId?: number;
    assignmentId?: number;
  };
}

export interface LearningPath {
  id: string;
  userId: number;
  courseId: number;
  title: string;
  description: string;
  totalSteps: number;
  completedSteps: number;
  progress: number;
  estimatedTotalDuration: number;
  steps: LearningPathStep[];
  recommendations?: {
    nextSteps: string[];
    alternativePaths: string[];
    resources: Array<{
      type: 'video' | 'reading' | 'practice';
      title: string;
      url: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserLearningProfile {
  id: string;
  userId: number;
  courseId: number;
  currentLevel: string;
  strengths: string[];
  weaknesses: string[];
  learningGoals: string[];
  preferredLearningStyle: 'visual' | 'auditory' | 'kinesthetic';
  studyTimePreference: number; // minutes per session
  lastActivityAt: string;
  totalStudyTime: number; // minutes
  averageScore: number;
  completionRate: number;
}

export interface LearningAnalytics {
  userId: number;
  courseId: number;
  eventType: 'lecture_start' | 'lecture_complete' | 'quiz_start' | 'quiz_complete' | 'assignment_submit';
  duration?: number;
  score?: number;
  maxScore?: number;
  attempts?: number;
  difficulty?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  sessionId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// AI Learning Path Service
export const aiLearningPathService = {
  /**
   * Generate personalized learning path for user
   */
  generateLearningPath: async (courseId: number, options?: {
    selfAssessedLevel?: string;
    learningGoals?: string[];
    preferredDuration?: number;
  }): Promise<LearningPath> => {
    const res = await apiRequest<{ path: LearningPath }>('student/ai/learning-path/generate', {
      method: 'POST',
      body: JSON.stringify({
        courseId,
        ...options
      }),
    });
    return res.path;
  },

  /**
   * Get current learning path for user
   */
  getCurrentLearningPath: async (courseId: number): Promise<LearningPath | null> => {
    const res = await apiRequest<{ path: LearningPath | null }>(`student/ai/learning-path/current/${courseId}`);
    return res.path;
  },

  /**
   * Update learning path progress
   */
  updateProgress: async (pathId: string, stepId: string, data: {
    isCompleted: boolean;
    timeSpent?: number;
    score?: number;
    notes?: string;
  }): Promise<LearningPath> => {
    const res = await apiRequest<{ path: LearningPath }>(`student/ai/learning-path/${pathId}/progress/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.path;
  },

  /**
   * Get user learning profile
   */
  getLearningProfile: async (courseId: number): Promise<UserLearningProfile> => {
    const res = await apiRequest<{ profile: UserLearningProfile }>(`student/ai/learning-profile/${courseId}`);
    return res.profile;
  },

  /**
   * Update user learning profile
   */
  updateLearningProfile: async (courseId: number, data: Partial<UserLearningProfile>): Promise<UserLearningProfile> => {
    const res = await apiRequest<{ profile: UserLearningProfile }>(`student/ai/learning-profile/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.profile;
  },

  /**
   * Get learning analytics for user
   */
  getLearningAnalytics: async (courseId: number, options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<LearningAnalytics[]> => {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.limit) params.append('limit', String(options.limit));
    
    const res = await apiRequest<{ analytics: LearningAnalytics[] }>(`student/ai/learning-analytics/${courseId}?${params}`);
    return res.analytics;
  },

  /**
   * Get AI recommendations for next steps
   */
  getRecommendations: async (courseId: number): Promise<{
    nextSteps: LearningPathStep[];
    alternativePaths: LearningPathStep[];
    resources: Array<{
      type: 'video' | 'reading' | 'practice';
      title: string;
      url: string;
    }>;
  }> => {
    const res = await apiRequest<{ recommendations: any }>(`student/ai/recommendations/${courseId}`);
    return res.recommendations;
  },

  /**
   * Track learning event
   */
  trackLearningEvent: async (courseId: number, eventData: {
    eventType: LearningAnalytics['eventType'];
    lectureId?: number;
    chapterId?: number;
    quizId?: number;
    duration?: number;
    score?: number;
    maxScore?: number;
    attempts?: number;
    difficulty?: string;
    deviceType?: LearningAnalytics['deviceType'];
    sessionId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> => {
    await apiRequest(`student/ai/learning-analytics/${courseId}/track`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  /**
   * Get personalized content suggestions
   */
  getContentSuggestions: async (courseId: number, options?: {
    contentType?: 'lecture' | 'quiz' | 'practice';
    difficulty?: string;
    limit?: number;
  }): Promise<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    relevanceScore: number;
    estimatedDuration: number;
  }>> => {
    const params = new URLSearchParams();
    if (options?.contentType) params.append('contentType', options.contentType);
    if (options?.difficulty) params.append('difficulty', options.difficulty);
    if (options?.limit) params.append('limit', String(options.limit));
    
    const res = await apiRequest<{ suggestions: any[] }>(`student/ai/content-suggestions/${courseId}?${params}`);
    return res.suggestions;
  },
};
