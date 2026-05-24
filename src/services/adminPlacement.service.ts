import { apiRequest } from './api';

export interface PlacementLevelDistribution {
  level: string;
  count: number;
  percentage: number;
}

export interface PlacementSkillPerformance {
  skill: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface PlacementDifficultQuestion {
  id: number;
  questionId?: number;
  questionText?: string;
  content?: string;
  skill?: string;
  skillType?: string;
  level?: string;
  cefrLevel?: string;
  correctRate?: number;
  wrongCount?: number;
  timesUsed?: number;
}

export interface PlacementTrendItem {
  date: string;
  completedCount: number;
}

export interface PlacementDashboardStats {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  averageTestDuration: number;
  levelDistribution: PlacementLevelDistribution[];
  skillPerformance: PlacementSkillPerformance[];
  recentTrends: PlacementTrendItem[];
}

export interface QuestionBankStats {
  totalQuestions: number;
  questionsByLevel: Record<string, number>;
  questionsBySkill: Record<string, number>;
  averageDifficulty: number;
  lastUpdated: string;
}

export interface PlacementSession {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  targetLevel?: string;
  targetCourseId?: number;
  finalLevel: string;
  finalCefrLevel?: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  questionCount?: number;
  totalQuestions?: number;
  correctCount?: number;
  answeredQuestions?: number;
  correctAnswers?: number;
  accuracy: number;
  isQuickCheck?: boolean;
  isRetake?: boolean;
  User?: {
    id: number;
    name: string;
    email: string;
  };
}

export const adminPlacementService = {
  // Get All Placement Sessions
  async getAllSessions(page = 1, limit = 20): Promise<{
    sessions: PlacementSession[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const res = await apiRequest<{
      data: {
        sessions: PlacementSession[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      };
    }>(`admin/placement/sessions?page=${page}&limit=${limit}`, { method: 'GET' });
    // Handle both formats: { data: { sessions, pagination } } or { sessions, pagination }
    const data = (res as any)?.data || res;
    return {
      sessions: data?.sessions || [],
      pagination: data?.pagination || { total: 0, page, limit, totalPages: 0 },
    };
  },

  // Analytics Dashboard
  async getDashboardStats(): Promise<PlacementDashboardStats> {
    const res = await apiRequest<{ data: PlacementDashboardStats }>(
      'admin/placement/analytics/dashboard',
      { method: 'GET' }
    );
    return res.data;
  },

  // Overall Statistics
  async getOverallStats(): Promise<{
    totalTests: number;
    activeTests: number;
    completedToday: number;
    averageScore: number;
  }> {
    const res = await apiRequest<{
      data: {
        totalTests: number;
        activeTests: number;
        completedToday: number;
        averageScore: number;
      };
    }>('admin/placement/analytics/stats', { method: 'GET' });
    return res.data;
  },

  // Level Distribution
  async getLevelDistribution(): Promise<PlacementLevelDistribution[]> {
    const res = await apiRequest<Record<string, number>>(
      'admin/placement/analytics/levels',
      { method: 'GET' }
    );
    const data = (res as unknown) as Record<string, number>;
    const counts = Object.values(data);
    const total = counts.reduce((sum, count) => sum + (count as number), 0);
    return Object.entries(data).map(([level, count]) => ({
      level,
      count: count as number,
      percentage: total > 0 ? ((count as number) / total) * 100 : 0,
    }));
  },

  // Skill Performance
  async getSkillPerformance(): Promise<PlacementSkillPerformance[]> {
    const res = await apiRequest<PlacementSkillPerformance[]>(
      'admin/placement/analytics/skill-performance',
      { method: 'GET' }
    );
    const data = (res as unknown) as PlacementSkillPerformance[];
    return Array.isArray(data) ? data : [];
  },

  // Most Difficult Questions
  async getDifficultQuestions(): Promise<PlacementDifficultQuestion[]> {
    const res = await apiRequest<PlacementDifficultQuestion[]>(
      'admin/placement/analytics/difficult-questions',
      { method: 'GET' }
    );
    const data = (res as unknown) as PlacementDifficultQuestion[];
    return Array.isArray(data) ? data : [];
  },

  // Question Bank Stats
  async getQuestionBankStats(): Promise<QuestionBankStats | null> {
    const res = await apiRequest<Record<string, { totalQuestions: number; totalUsage: number }>>(
      'admin/placement/analytics/question-bank',
      { method: 'GET' }
    );
    const data = (res as unknown) as Record<string, { totalQuestions: number; totalUsage: number }>;
    const levels = Object.entries(data);
    const totalQuestions = levels.reduce((sum, [, val]) => sum + (val.totalQuestions || 0), 0);
    return {
      totalQuestions,
      questionsByLevel: Object.fromEntries(levels.map(([level, val]) => [level, val.totalQuestions])),
      questionsBySkill: {},
      averageDifficulty: 5,
      lastUpdated: new Date().toISOString(),
    };
  },

  // Completion Trends
  async getTrends(days = 30): Promise<PlacementTrendItem[]> {
    const res = await apiRequest<PlacementTrendItem[]>(
      `admin/placement/analytics/trends?days=${days}`,
      { method: 'GET' }
    );
    const data = (res as unknown) as PlacementTrendItem[];
    return Array.isArray(data) ? data : [];
  },

  // Generate Questions
  async generateQuestions(count = 10): Promise<{
    generated: number;
    questions: Array<{
      id: number;
      text: string;
      level: string;
      skill: string;
    }>;
  }> {
    const res = await apiRequest<{
      data: {
        generated: number;
        questions: Array<{
          id: number;
          text: string;
          level: string;
          skill: string;
        }>;
      };
    }>('admin/placement/question-bank/generate', {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
    return res.data;
  },

  // Get User Placement History
  async getUserHistory(userId: number | string): Promise<PlacementSession[]> {
    const res = await apiRequest<{ data: { sessions: PlacementSession[] } }>(
      `admin/placement/user/${userId}/history`,
      { method: 'GET' }
    );
    return res.data.sessions;
  },

  // Reset User Cooldown
  async resetUserCooldown(userId: number | string): Promise<void> {
    await apiRequest(`admin/placement/user/${userId}/reset-cooldown`, {
      method: 'POST',
    });
  },

  // Delete Session
  async deleteSession(sessionId: number | string): Promise<void> {
    await apiRequest(`admin/placement/session/${sessionId}`, {
      method: 'DELETE',
    });
  },
};
