import { apiRequest } from "./api";

export type LectureProgressInput = {
  lectureId: string;
  watchedPercent: number;
};

export type LectureProgressResponse = {
  success: boolean;
  message: string;
  data: {
    progress: {
      id: number;
      userId: number;
      lectureId: number;
      courseId: number;
      watchedPercent: number;
      isCompleted: boolean;
      completedAt: string | null;
      lastAccessedAt: string;
    };
  };
};

export type CourseProgressResponse = {
  course: { id: number; title: string; slug?: string };
  courseProgress: number;
  enrolledAt?: string;
  lecturesProgress: Array<{
    id: number;
    userId: number;
    lectureId: number;
    watchedPercent: number;
    isCompleted: boolean;
    completedAt: string | null;
    lastAccessedAt: string;
    Lecture: {
      id: number;
      title: string;
      type: string;
      duration: string;
      chapter?: { id: number; title: string; order: number };
    };
  }>;
  totalLectures: number;
  completedLectures: number;
  totalQuizzes?: number;
  completedQuizzes?: number;
  quizProgress?: {
    allPassed: boolean;
    total: number;
    passed: number;
    quizDetails: Array<{
      quizId: number;
      quizTitle: string;
      required: boolean;
      passed: boolean;
      bestScore: number | null;
    }>;
  };
  isCompleted?: boolean;
};

export type ContinueLearningResponse = {
  courseId: number;
  progressPercent: number;
  lastAccessed: {
    lectureId: number;
    lectureTitle: string;
    chapterId: number;
    chapterTitle: string;
    watchedPercent: number;
    isCompleted: boolean;
    lastAccessedAt: string;
  } | null;
  nextLecture: {
    lectureId: number;
    lectureTitle: string;
    chapterId: number;
    chapterTitle: string;
    type: string;
  } | null;
};

export type CertificateEligibilityResponse = {
  courseId: number;
  course: { id: number; title: string; slug: string; imageUrl?: string };
  isEligible: boolean;
  progressPercent: number;
  totalLectures: number;
  completedLectures: number;
  quizRequirement: {
    allPassed: boolean;
    total: number;
    passed: number;
    quizDetails: Array<{
      quizId: number;
      quizTitle: string;
      required: boolean;
      passed: boolean;
      bestScore: number | null;
    }>;
  };
  completedAt: string | null;
  certificateData: {
    studentId: number;
    courseId: number;
    courseTitle: string;
    issuedAt: string;
    certificateId: string;
  } | null;
};

export type StudentDashboardResponse = {
  enrollments: {
    total: number;
    inProgress: number;
    completed: number;
    notStarted: number;
  };
  recentProgress: Array<{
    courseId: number;
    courseTitle: string;
    courseSlug: string;
    courseImage: string | null;
    progressPercent: number;
    lastAccessedAt: string | null;
    enrolledAt: string;
  }>;
  quizzes: {
    total: number;
    pending: number;
    completed: number;
    passed: number;
  };
  nextEvent: {
    id: string;
    title: string;
    type: string;
    courseTitle: string;
    startAt: string;
    status: string;
  } | null;
  streak: { current: number; longest: number };
};

export const progressService = {
  async updateLectureProgress(
    lectureId: string,
    watchedPercent: number
  ): Promise<LectureProgressResponse> {
    return apiRequest<LectureProgressResponse>(`progress/lectures/${lectureId}`, {
      method: "PUT",
      body: JSON.stringify({ watchedPercent }),
    });
  },

  async getCourseProgress(courseId: string): Promise<CourseProgressResponse> {
    return apiRequest<CourseProgressResponse>(`progress/courses/${courseId}`, {
      method: "GET",
    });
  },

  async getContinueLearning(courseId: string | number): Promise<ContinueLearningResponse> {
    return apiRequest<ContinueLearningResponse>(`progress/courses/${courseId}/continue`, {
      method: "GET",
    });
  },

  async getCertificateEligibility(courseId: string | number): Promise<CertificateEligibilityResponse> {
    return apiRequest<CertificateEligibilityResponse>(`progress/courses/${courseId}/certificate`, {
      method: "GET",
    });
  },

  async getStudentDashboard(): Promise<StudentDashboardResponse> {
    return apiRequest<StudentDashboardResponse>(`progress/dashboard`, {
      method: "GET",
    });
  },

  async downloadCertificate(courseId: string | number): Promise<void> {
    const token = localStorage.getItem("elearning_token");
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000";
    const apiUrl = `${baseUrl}/api/certificate/download/${courseId}`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = "Lỗi khi tải chứng chỉ";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Lỗi hệ thống: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Certificate_${courseId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async getMyCertificates(): Promise<any[]> {
    return apiRequest<any[]>(`certificate/my-certificates`, {
      method: "GET",
    });
  },
};
