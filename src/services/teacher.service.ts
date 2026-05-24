import { apiRequest } from "./api";

export type CourseStatus = 'draft' | 'pending_review' | 'published' | 'rejected';

export type BackendTeacherCourse = {
  id: string | number;
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  level?: string;
  rating?: number;
  published?: boolean;
  status?: CourseStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  imageUrl?: string;
  categoryId?: number | null;
  createdBy?: string | number;
  createdAt?: string;
  updatedAt?: string;
  // Duration settings
  durationType?: 'lifetime' | 'fixed' | 'subscription';
  durationValue?: number;
  durationUnit?: 'days' | 'months' | 'years';
  renewalDiscountPercent?: number;
  gracePeriodDays?: number;
  isRequired?: boolean;
};

export type BackendCourseEnrollment = {
  id: string | number;
  userId: string | number;
  courseId: string | number;
  status: string;
  progressPercent: number;
  enrolledAt?: string;
  User?: {
    id: string | number;
    name?: string;
    username?: string;
    email?: string;
    role?: string;
  };
};

export type BackendTeacherLecture = {
  id: string | number;
  title: string;
  type: string;
  contentUrl?: string | null;
  duration?: number | null;
  isPreview?: boolean;
  attachments?: any;
  order?: number | null;
  chapterId: string | number;
  createdAt?: string;
  updatedAt?: string;
};

export type BackendTeacherChapter = {
  id: string | number;
  title: string;
  order?: number | null;
  courseId: string | number;
  Lectures?: BackendTeacherLecture[];
  quizzes?: BackendTeacherQuiz[];  // ← Thêm dòng này
  createdAt?: string;
  updatedAt?: string;
};

export type BackendTeacherQuestion = {
  id: string | number;
  quizId: string | number;
  type: "multiple_choice" | "true_false" | "short_answer" | "essay";
  content: string;
  options?: any;
  correctAnswer?: any;
  points?: number;
  explanation?: string | null;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type BackendTeacherQuiz = {
  id: string | number;
  courseId: string | number;
  title: string;
  description?: string | null;
  maxScore?: number;
  timeLimit?: number;
  passingScore?: number;
  createdBy?: string | number;
  createdAt?: string;
  updatedAt?: string;
  startTime?: string | null;
  endTime?: string | null;
  showResults?: boolean;
  antiCheat?: boolean;
  status?: 'draft' | 'published';
  questions?: BackendTeacherQuestion[];
};

export type BackendTeacherQuizDetail = BackendTeacherQuiz & {
  status?: 'draft' | 'published';
  course?: {
    id: string | number;
    title: string;
    createdBy?: string | number;
  };
};

export type CreateTeacherQuizInput = {
  title: string;
  description?: string;
  maxScore?: number;
  timeLimit?: number;
  passingScore?: number;
  startTime?: string | null;
  endTime?: string | null;
  showResults?: boolean;
  antiCheat?: boolean;
  type?: 'course' | 'placement';
  categoryId?: number | string | null;
  chapterId?: string | number;
};

export type CreateTeacherQuestionInput = {
  type: BackendTeacherQuestion["type"];
  content: string;
  options?: any;
  correctAnswer?: any;
  points?: number;
  explanation?: string;
};

export type UpdateTeacherQuestionInput = Partial<CreateTeacherQuestionInput>;

export type UploadQuizMediaResponse = {
  url: string;
  bytes?: number;
  format?: string;
  publicId?: string;
};

export type UploadAttachmentMediaResponse = UploadQuizMediaResponse;

export type TeacherCourseContentResponse = {
  course: BackendTeacherCourse;
  chapters: BackendTeacherChapter[];
};

export type BackendAttempt = {
  id: string | number;
  userId: string | number;
  quizId: string | number;
  score: string | number;
  percentageScore?: string | number;
  passed: boolean;
  isPassed?: boolean;
  startedAt: string;
  completedAt: string;
  duration?: string;
  completionTime?: string;
  violationsCount?: number;
  isCheated?: boolean;
  violationLogs?: { type: string; time: string; message: string }[];
  user?: {
    id: string | number;
    name?: string;
    username?: string;
    email?: string;
  };
  User?: {
    name?: string;
    username?: string;
    email?: string;
  };
  quiz?: any;
};

export type QuizAttemptsResponse = {
  quiz: {
    id: string | number;
    title: string;
    description?: string;
    maxScore: number;
    passingScore: number;
    attempts: BackendAttempt[];
  };
  // Dữ liệu dự phòng nếu API vẫn trả về các trường ngoài
  statistics?: {
    passRate: number;
    averageScore: number;
    totalAttempts: number;
  };
  ranking?: {
    rank: number;
    userName: string;
    highestScore: number;
    passed: boolean;
    completedAt: string;
  }[];
  unattemptedUsers?: {
    userId: string | number;
    userName: string;
    userEmail: string;
    status: string;
  }[];
};
export type TeacherAttemptDetailResponse = {
  attempt: BackendAttempt & { summary?: any };
  quiz: BackendTeacherQuiz;
  results: {
    questionId: string | number;
    userAnswer: any;
    correctAnswer: any;
    isCorrect: boolean;
    pointsEarned: number;
    maxPoints: number;
    explanation?: string;
  }[];
};

export type TeacherStatisticsResponse = {
  summary: {
    activeStudents: number;
    averageProgress: number;
    totalCourses: number;
    averageScore: number;
    trends: {
      activeStudents: string;
      averageProgress: string;
      totalCourses: string;
      averageScore: string;
    };
  };
  scoreDistribution: {
    range: string;
    count: number;
    label: string;
    color?: string; // Opt-in for frontend coloring
  }[];
  ranking: {
    // User fields (from User model)
    id?: string | number;
    name?: string;
    username?: string;
    fullName?: string;
    email?: string;
    avatar?: string;
    // Stats fields
    averageScore?: number | string;
    highestScore?: number;
    courseProgress?: number;
    achievement?: string;
    rank?: number;
  }[];
  aiSuggestions: {
    type: string;
    title: string;
    description: string;
    action: string;
  }[];
};

export type BackendOwnerCourse = {
  id: string | number;
  title: string;
  slug?: string;
  description?: string;
  imageUrl?: string | null;
  level?: string | null;
  price?: number | string | null;
  published?: boolean;
  categoryId?: number | null;
  createdBy?: string | number;
  duration?: string | null;
  willLearn?: string[];
  requirements?: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  // Duration settings
  durationType?: 'lifetime' | 'fixed' | 'subscription';
  durationValue?: number | null;
  durationUnit?: 'days' | 'months' | 'years' | null;
  renewalDiscountPercent?: number | null;
  gracePeriodDays?: number | null;
  // Course content
  chapters?: any[];
  totalLessons?: number | null;
  students?: number | null;
};

export type CreateTeacherCourseInput = {
  title: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  categoryId?: number | null;
  published?: boolean;
  level?: string;
  duration?: string;
  willLearn?: string[];
  requirements?: string[];
  tags?: string[];
  // Duration settings for expiration system
  durationType?: 'lifetime' | 'fixed' | 'subscription';
  durationValue?: number;
  durationUnit?: 'days' | 'months' | 'years';
  renewalDiscountPercent?: number;
  gracePeriodDays?: number;
  isRequired?: boolean;
};

export const teacherService = {
  async listMyCourses(): Promise<BackendTeacherCourse[]> {
    const data = await apiRequest<{ courses: BackendTeacherCourse[] }>(
      "teacher/courses",
      {
        method: "GET",
      },
    );

    return data.courses || [];
  },

  async getCourseEnrollments(
    courseId: string,
  ): Promise<BackendCourseEnrollment[]> {
    const data = await apiRequest<{ enrollments: BackendCourseEnrollment[] }>(
      `teacher/courses/${courseId}/enrollments`,
      {
        method: "GET",
      },
    );

    return data.enrollments || [];
  },

  async getCourseForOwner(courseId: string): Promise<BackendOwnerCourse> {
    const data = await apiRequest<{ course: BackendOwnerCourse }>(
      `teacher/courses/${courseId}`,
      {
        method: "GET",
      },
    );

    return data.course;
  },

  async createCourse(
    input: CreateTeacherCourseInput,
  ): Promise<BackendTeacherCourse> {
    const data = await apiRequest<{ course: BackendTeacherCourse }>(
      "teacher/courses",
      {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          imageUrl: input.imageUrl,
          price: input.price ?? 0,
          categoryId: input.categoryId ?? null,
          published: Boolean(input.published),
          level: input.level,
          duration: input.duration,
          willLearn: input.willLearn || [],
          requirements: input.requirements || [],
          tags: input.tags || [],
          isRequired: Boolean(input.isRequired),
          // Duration settings
          durationType: input.durationType,
          durationValue: input.durationValue,
          durationUnit: input.durationUnit,
          renewalDiscountPercent: input.renewalDiscountPercent,
          gracePeriodDays: input.gracePeriodDays,
        }),
      },
    );

    return data.course;
  },

  async updateCourse(
    courseId: string,
    input: Partial<CreateTeacherCourseInput>,
  ): Promise<BackendOwnerCourse> {
    const data = await apiRequest<{ course: BackendOwnerCourse }>(
      `teacher/courses/${courseId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          imageUrl: input.imageUrl,
          price: input.price,
          categoryId: input.categoryId,
          published: input.published,
          level: input.level,
          duration: input.duration,
          // Only send array fields if they are defined
          ...(input.willLearn !== undefined && { willLearn: input.willLearn }),
          ...(input.requirements !== undefined && { requirements: input.requirements }),
          ...(input.tags !== undefined && { tags: input.tags }),
          // Duration settings
          ...(input.durationType !== undefined && { durationType: input.durationType }),
          ...(input.durationValue !== undefined && { durationValue: input.durationValue }),
          ...(input.durationUnit !== undefined && { durationUnit: input.durationUnit }),
          ...(input.renewalDiscountPercent !== undefined && { renewalDiscountPercent: input.renewalDiscountPercent }),
          ...(input.gracePeriodDays !== undefined && { gracePeriodDays: input.gracePeriodDays }),
        }),
      },
    );

    return data.course;
  },

  async deleteCourse(courseId: string): Promise<void> {
    await apiRequest<unknown>(`teacher/courses/${courseId}`, {
      method: "DELETE",
    });
  },

  async submitCourseForReview(courseId: string): Promise<{ message: string; course: BackendTeacherCourse }> {
    const data = await apiRequest<{ message: string; course: BackendTeacherCourse }>(
      `teacher/courses/${courseId}/submit-review`,
      {
        method: "POST",
      },
    );
    return { message: data.message, course: data.course };
  },

  async getCourseContent(
    courseId: string,
  ): Promise<TeacherCourseContentResponse> {
    const data = await apiRequest<TeacherCourseContentResponse>(
      `teacher/courses/${courseId}/chapters`,
      {
        method: "GET",
      },
    );

    return data;
  },

  async getCourseQuizzes(courseId: string): Promise<BackendTeacherQuiz[]> {
    const data = await apiRequest<{ quizzes: BackendTeacherQuiz[] }>(
      `teacher/courses/${courseId}/quizzes`,
      {
        method: "GET",
      },
    );

    return data.quizzes || [];
  },

  async createQuiz(
    courseId: string | number,
    input: CreateTeacherQuizInput,
  ): Promise<BackendTeacherQuiz> {
    const url = `teacher/courses/${courseId}/quizzes`;
    const data = await apiRequest<{ quiz: BackendTeacherQuiz }>(
      url,
      {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          maxScore: input.maxScore,
          timeLimit: input.timeLimit,
          passingScore: input.passingScore,
          startTime: input.startTime,
          endTime: input.endTime,
          showResults: input.showResults,
          antiCheat: input.antiCheat,
          type: input.type,
          categoryId: input.categoryId,
          chapterId: input.chapterId,
        }),
      },
    );

    return data.quiz;
  },

  async updateQuiz(
    quizId: string | number,
    input: Partial<CreateTeacherQuizInput>,
  ): Promise<BackendTeacherQuiz> {
    const data = await apiRequest<{ quiz: BackendTeacherQuiz }>(
      `teacher/quizzes/${quizId}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      },
    );
    return data.quiz;
  },

  async deleteQuiz(quizId: string | number): Promise<void> {
    await apiRequest<unknown>(`teacher/quizzes/${quizId}`, {
      method: "DELETE",
    });
  },

  async getQuiz(quizId: string | number): Promise<BackendTeacherQuizDetail> {
    const data = await apiRequest<{ quiz: BackendTeacherQuizDetail }>(
      `teacher/quizzes/${quizId}`,
      {
        method: "GET",
      },
    );

    return data.quiz;
  },

  async getQuizAttempts(
    quizId: string | number,
  ): Promise<QuizAttemptsResponse> {
    return apiRequest<QuizAttemptsResponse>(
      `teacher/quizzes/${quizId}/attempts`,
      {
        method: "GET",
      },
    );
  },

  async deleteAttempt(attemptId: string | number): Promise<void> {
    await apiRequest<unknown>(`teacher/attempts/${attemptId}`, {
      method: "DELETE",
    });
  },

  // AI Quiz Generation APIs
  async generateAIQuiz(
    lectureId: string | number,
    options: {
      count?: number;
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
      questionTypes?: string[];
    } = {}
  ): Promise<{ questions: BackendTeacherQuestion[]; content?: string }> {
    const data = await apiRequest<{ success: boolean; data: { questions: BackendTeacherQuestion[]; content?: string } }>(
      `teacher/ai/generate-quiz`,
      {
        method: "POST",
        body: JSON.stringify({
          lectureId: Number(lectureId),
          options: {
            count: options.count || 10,
            difficulty: options.difficulty || 'mixed',
            questionTypes: options.questionTypes || ['multiple_choice'],
          },
        }),
      },
    );
    return data.data;
  },

  async generateRAGQuiz(
    courseId: string | number,
    options: {
      scope?: 'course' | 'chapter' | 'lecture' | 'multi';
      lectureIds?: (string | number)[];
      chapterId?: string | number;
      count?: number;
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
      questionTypes?: string[];
    } = {}
  ): Promise<{ questions: BackendTeacherQuestion[]; metadata: any }> {
    const data = await apiRequest<{ success: boolean; data: { questions: BackendTeacherQuestion[]; metadata: any } }>(
      `teacher/ai/generate-rag-quiz`,
      {
        method: "POST",
        body: JSON.stringify({
          courseId: Number(courseId),
          options: {
            scope: options.scope || 'lecture',
            lectureIds: options.lectureIds || [],
            chapterId: options.chapterId,
            questionCount: options.count || 10,
            difficulty: options.difficulty || 'mixed',
            questionTypes: options.questionTypes || ['multiple_choice'],
          },
        }),
      },
    );
    return data.data;
  },

  async generateAndSaveRAGQuiz(
    courseId: string | number,
    quizData: {
      title: string;
      description?: string;
      timeLimit?: number;
      maxScore?: number;
      passingScore?: number;
    },
    options: {
      scope?: 'course' | 'chapter' | 'lecture' | 'multi';
      lectureIds?: (string | number)[];
      chapterId?: string | number;
      count?: number;
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
      questionTypes?: string[];
    } = {}
  ): Promise<{ quiz: BackendTeacherQuiz; questions: BackendTeacherQuestion[]; metadata: any }> {
    const data = await apiRequest<{ quiz: BackendTeacherQuiz; questions: BackendTeacherQuestion[]; metadata: any }>(
      `teacher/ai/generate-and-save-rag-quiz`,
      {
        method: "POST",
        body: JSON.stringify({
          courseId: Number(courseId),
          quizData: {
            title: quizData.title,
            description: quizData.description,
            timeLimit: quizData.timeLimit || 30,
            maxScore: quizData.maxScore || 100,
            passingScore: quizData.passingScore || 60,
          },
          options: {
            scope: options.scope || 'lecture',
            lectureIds: options.lectureIds || [],
            chapterId: options.chapterId,
            questionCount: options.count || 10,
            difficulty: options.difficulty || 'mixed',
            questionTypes: options.questionTypes || ['multiple_choice'],
          },
        }),
      },
    );
    return data;
  },

  async generateAndSaveAIQuiz(
    lectureId: string | number,
    quizData: {
      title: string;
      description?: string;
      timeLimit?: number;
      maxScore?: number;
      passingScore?: number;
    },
    options: {
      count?: number;
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
      questionTypes?: string[];
    } = {}
  ): Promise<{ quiz: BackendTeacherQuiz; questions: BackendTeacherQuestion[] }> {
    const data = await apiRequest<{ success: boolean; data: { quiz: BackendTeacherQuiz; questions: BackendTeacherQuestion[] } }>(
      `teacher/ai/generate-and-save-quiz`,
      {
        method: "POST",
        body: JSON.stringify({
          lectureId: Number(lectureId),
          quizData: {
            title: quizData.title,
            description: quizData.description,
            timeLimit: quizData.timeLimit || 30,
            maxScore: quizData.maxScore || 100,
            passingScore: quizData.passingScore || 60,
          },
          options: {
            count: options.count || 10,
            difficulty: options.difficulty || 'mixed',
            questionTypes: options.questionTypes || ['multiple_choice'],
          },
        }),
      },
    );
    return data.data;
  },

  async publishAIQuiz(quizId: string | number): Promise<{ quiz: BackendTeacherQuiz }> {
    const data = await apiRequest<{ success: boolean; data: { quiz: BackendTeacherQuiz } }>(
      `teacher/ai/quizzes/${quizId}/publish`,
      {
        method: "POST",
      },
    );
    return data.data;
  },

  async getAttemptDetail(
    attemptId: string | number,
  ): Promise<TeacherAttemptDetailResponse> {
    return apiRequest<TeacherAttemptDetailResponse>(
      `teacher/attempts/${attemptId}`,
      {
        method: "GET",
      },
    );
  },

  async addQuestion(
    quizId: string | number,
    input: CreateTeacherQuestionInput,
  ): Promise<BackendTeacherQuestion> {
    const data = await apiRequest<{ question: BackendTeacherQuestion }>(
      `teacher/quizzes/${quizId}/questions`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

    return data.question;
  },

  async updateQuestion(
    questionId: string,
    input: UpdateTeacherQuestionInput,
  ): Promise<BackendTeacherQuestion> {
    const data = await apiRequest<{ question: BackendTeacherQuestion }>(
      `teacher/questions/${questionId}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      },
    );

    return data.question;
  },

  async deleteQuestion(questionId: string): Promise<void> {
    await apiRequest<unknown>(`teacher/questions/${questionId}`, {
      method: "DELETE",
    });
  },

  async gradeQuestion(attemptId: string | number, questionId: string | number, points: number, feedback?: string): Promise<void> {
    await apiRequest<unknown>(
      `teacher/attempts/${attemptId}/questions/${questionId}/grade`,
      {
        method: "POST",
        body: JSON.stringify({ points, feedback }),
      },
    );
  },

  async getAttemptForGrading(attemptId: string | number): Promise<any> {
    const data = await apiRequest<{ attempt: any }>(
      `teacher/attempts/${attemptId}`,
      {
        method: "GET",
      },
    );
    return data.attempt;
  },

  async uploadQuizMedia(file: File): Promise<UploadQuizMediaResponse> {
    const form = new FormData();
    form.set("file", file);

    const data = await apiRequest<UploadQuizMediaResponse>(
      `teacher/media/quiz`,
      {
        method: "POST",
        body: form,
      },
    );

    return data;
  },

  async uploadAttachmentMedia(
    file: File,
  ): Promise<UploadAttachmentMediaResponse> {
    return this.uploadQuizMedia(file);
  },

  async createChapter(params: {
    courseId: string;
    title: string;
    order?: number;
  }): Promise<BackendTeacherChapter> {
    const data = await apiRequest<{ chapter: BackendTeacherChapter }>(
      `teacher/chapters`,
      {
        method: "POST",
        body: JSON.stringify({
          courseId: params.courseId,
          title: params.title,
          order: params.order,
        }),
      },
    );

    return data.chapter;
  },

  async updateChapter(params: {
    chapterId: string;
    title?: string;
    order?: number;
  }): Promise<BackendTeacherChapter> {
    const data = await apiRequest<{ chapter: BackendTeacherChapter }>(
      `teacher/chapters/${params.chapterId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          title: params.title,
          order: params.order,
        }),
      },
    );

    return data.chapter;
  },

  async deleteChapter(chapterId: string): Promise<void> {
    await apiRequest<unknown>(`teacher/chapters/${chapterId}`, {
      method: "DELETE",
    });
  },

  async createLecture(params: {
    chapterId: string;
    title: string;
    type: string;
    contentUrl?: string;
    duration?: number;
    isPreview?: boolean;
    attachments?: any;
    order?: number;
    content?: string;
    file?: File;
  }): Promise<BackendTeacherLecture> {
    const form = new FormData();
    form.set("title", params.title);
    form.set("type", params.type);
    if (params.contentUrl != null) form.set("contentUrl", params.contentUrl);
    if (params.duration != null) form.set("duration", String(params.duration));
    if (params.isPreview != null)
      form.set("isPreview", String(params.isPreview));
    if (params.attachments != null)
      form.set("attachments", JSON.stringify(params.attachments));
    if (params.order != null) form.set("order", String(params.order));
    if (params.content != null) form.set("content", params.content);
    if (params.file) form.set("file", params.file);

    const data = await apiRequest<{ lecture: BackendTeacherLecture }>(
      `teacher/chapters/${params.chapterId}/lectures`,
      {
        method: "POST",
        body: form,
      },
    );

    return data.lecture;
  },

  async updateLecture(params: {
    lectureId: string;
    title?: string;
    type?: string;
    contentUrl?: string;
    duration?: number;
    isPreview?: boolean;
    attachments?: any;
    order?: number;
    content?: string;
    file?: File;
  }): Promise<BackendTeacherLecture> {
    const useForm = Boolean(params.file);
    const body = useForm
      ? (() => {
          const form = new FormData();
          if (params.title != null) form.set("title", params.title);
          if (params.type != null) form.set("type", params.type);
          if (params.contentUrl != null)
            form.set("contentUrl", params.contentUrl);
          if (params.duration != null)
            form.set("duration", String(params.duration));
          if (params.isPreview != null)
            form.set("isPreview", String(params.isPreview));
          if (params.attachments != null)
            form.set("attachments", JSON.stringify(params.attachments));
          if (params.order != null) form.set("order", String(params.order));
          if (params.content != null) form.set("content", params.content);
          if (params.file) form.set("file", params.file);
          return form;
        })()
      : JSON.stringify({
          title: params.title,
          type: params.type,
          contentUrl: params.contentUrl,
          duration: params.duration,
          isPreview: params.isPreview,
          attachments: params.attachments,
          order: params.order,
          content: params.content,
        });

    const data = await apiRequest<{ lecture: BackendTeacherLecture }>(
      `teacher/lectures/${params.lectureId}`,
      {
        method: "PUT",
        body,
        ...(useForm ? {} : { headers: { "Content-Type": "application/json" } }),
      },
    );

    return data.lecture;
  },

  async deleteLecture(lectureId: string): Promise<void> {
    await apiRequest<unknown>(`teacher/lectures/${lectureId}`, {
      method: "DELETE",
    });
  },

  async getStatistics(courseId?: string): Promise<TeacherStatisticsResponse> {
    const q = courseId && courseId !== "all" ? `?courseId=${courseId}` : "";
    const res = await apiRequest<TeacherStatisticsResponse>(
      `teacher/statistics${q}`,
      {
        method: "GET",
      },
    );
    return res;
  },

  // ==========================================
  // AI TEACHER APIS
  // ==========================================

  async generateContent(params: {
    lectureId: string | number;
    prompt?: string;
    type?: 'summary' | 'explanation' | 'examples' | 'key_points';
  }): Promise<{ content: string; metadata: any }> {
    const data = await apiRequest<{ success: boolean; data: { content: string; metadata: any } }>(
      `teacher/ai/generate-content`,
      {
        method: "POST",
        body: JSON.stringify(params),
      },
    );
    return data.data;
  },

  async generateExercises(params: {
    courseId?: string | number;
    lectureId?: string | number;
    count?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    type?: 'practice' | 'homework' | 'revision';
  }): Promise<{ exercises: any[]; metadata: any }> {
    const data = await apiRequest<{ success: boolean; data: { exercises: any[]; metadata: any } }>(
      `teacher/ai/generate-exercises`,
      {
        method: "POST",
        body: JSON.stringify(params),
      },
    );
    return data.data;
  },

  async analyzeContentQuality(params: {
    courseId?: string | number;
    lectureId?: string | number;
  }): Promise<{
    quality: {
      overall: number;
      clarity: number;
      completeness: number;
      engagement: number;
    };
    suggestions: string[];
    analysis: string;
  }> {
    const query = new URLSearchParams();
    if (params.courseId) query.append('courseId', String(params.courseId));
    if (params.lectureId) query.append('lectureId', String(params.lectureId));
    
    const data = await apiRequest<{ success: boolean; data: any }>(
      `teacher/ai/content-quality?${query.toString()}`,
      {
        method: "GET",
      },
    );
    return data.data;
  },

  async getCourseAnalytics(courseId?: string | number): Promise<{
    overview: {
      totalStudents: number;
      averageProgress: number;
      averageScore: number;
      completionRate: number;
    };
    engagement: {
      activeStudents: number;
      inactiveStudents: number;
      averageTimeSpent: number;
    };
    performance: {
      topPerformers: any[];
      strugglingStudents: any[];
      scoreDistribution: any[];
    };
    insights: string[];
  }> {
    const query = courseId ? `?courseId=${courseId}` : '';
    const data = await apiRequest<{ success: boolean; data: any }>(
      `teacher/ai/course-analytics${query}`,
      {
        method: "GET",
      },
    );
    return data.data;
  },

  async getQualityReport(courseId?: string | number): Promise<{
    report: {
      summary: string;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
    };
    generatedAt: string;
  }> {
    const query = courseId ? `?courseId=${courseId}` : '';
    const data = await apiRequest<{ success: boolean; data: any }>(
      `teacher/ai/quality-report${query}`,
      {
        method: "GET",
      },
    );
    return data.data;
  },

  async generateTeachingGuide(params: {
    lectureId: string | number;
    classDuration?: number;
    classSize?: number;
    teachingMode?: 'offline' | 'online' | 'hybrid';
    studentLevel?: 'beginner' | 'intermediate' | 'advanced';
  }): Promise<{
    guide: {
      title: string;
      objectives: string[];
      activities: any[];
      materials: string[];
      assessment: string;
      timeline: any[];
    };
    metadata: any;
  }> {
    const data = await apiRequest<{ success: boolean; data: any }>(
      `teacher/ai/teaching-guide`,
      {
        method: "POST",
        body: JSON.stringify(params),
      },
    );
    return data.data;
  },

  async generateStudentFeedback(params: {
    courseId: string | number;
    studentId: string | number;
    type?: 'general' | 'specific' | 'improvement';
    context?: string;
  }): Promise<{
    feedback: {
      strengths: string[];
      improvements: string[];
      encouragement: string;
      actionItems: string[];
    };
  }> {
    const data = await apiRequest<{ success: boolean; data: any }>(
      `teacher/ai/student-feedback`,
      {
        method: "POST",
        body: JSON.stringify(params),
      },
    );
    return data.data;
  },

  async generateExam(params: {
    courseId: string | number;
    coverage?: 'course' | 'chapter' | 'lecture';
    chapterId?: string | number;
    lectureId?: string | number;
    duration?: number;
    questionCount?: number;
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
    includeAnswerKey?: boolean;
  }): Promise<{
    exam: {
      title: string;
      instructions: string;
      questions: any[];
      totalPoints: number;
      duration: number;
    };
    answerKey?: {
      answers: any[];
      gradingNotes: string;
    };
    metadata: any;
  }> {
    const data = await apiRequest<{ success: boolean; data: any }>(
      `teacher/ai/generate-exam`,
      {
        method: "POST",
        body: JSON.stringify(params),
      },
    );
    return data.data;
  },

  async generateTeachingMaterials(params: {
    courseId: string | number;
    chapterId?: string | number;
    lectureId?: string | number;
    type?: 'slides' | 'handout' | 'worksheet' | 'all';
    format?: 'pptx' | 'pdf' | 'docx';
  }): Promise<{
    materials: {
      slides?: { url: string; pages: number };
      handout?: { url: string; pages: number };
      worksheet?: { url: string; pages: number };
    };
    metadata: any;
  }> {
    const data = await apiRequest<{ success: boolean; data: any }>(
      `teacher/ai/teaching-materials`,
      {
        method: "POST",
        body: JSON.stringify(params),
      },
    );
    return data.data;
  },

  async analyzeCourseDifficulty(courseId: string | number): Promise<{
    analysis: {
      overall: 'easy' | 'moderate' | 'challenging' | 'difficult';
      breakdown: {
        beginner: number;
        intermediate: number;
        advanced: number;
      };
      recommendations: string[];
      comparedToAverage: string;
    };
  }> {
    const data = await apiRequest<{ success: boolean; data: any }>(
      `teacher/ai/course-difficulty/${courseId}`,
      {
        method: "GET",
      },
    );
    return data.data;
  },

  async generateCourseOutline(params: {
    title: string;
    description?: string;
    targetAudience?: string;
    duration?: string;
    learningObjectives?: string[];
  }): Promise<{
    outline: {
      title: string;
      description: string;
      chapters: any[];
      estimatedDuration: string;
      prerequisites: string[];
    };
  }> {
    const data = await apiRequest<{ success: boolean; data: any }>(
      `teacher/ai/generate-course-outline`,
      {
        method: "POST",
        body: JSON.stringify(params),
      },
    );
    return data.data;
  },

  async saveCourseOutline(params: {
    outline: any;
  }): Promise<{
    courseId: string | number;
    chaptersCreated: number;
    lecturesCreated: number;
  }> {
    const data = await apiRequest<{ success: boolean; data: any }>(
      `teacher/ai/save-course-outline`,
      {
        method: "POST",
        body: JSON.stringify(params),
      },
    );
    return data.data;
  },

  async generateAndSaveCourseOutline(params: {
    title: string;
    description?: string;
    targetAudience?: string;
    duration?: string;
    learningObjectives?: string[];
    saveToDatabase?: boolean;
  }): Promise<{
    outline: any;
    courseId?: string | number;
    chaptersCreated?: number;
    lecturesCreated?: number;
  }> {
    const data = await apiRequest<{ success: boolean; data: any }>(
      `teacher/ai/generate-and-save-course-outline`,
      {
        method: "POST",
        body: JSON.stringify(params),
      },
    );
    return data.data;
  },

  async triggerCourseContentGeneration(params: {
    courseId: string | number;
    options?: {
      generateLectures?: boolean;
      generateQuizzes?: boolean;
      generateMaterials?: boolean;
    };
  }): Promise<{
    jobId: string;
    status: string;
    estimatedTime: string;
  }> {
    const data = await apiRequest<{ success: boolean; data: any }>(
      `teacher/ai/generate-course-content`,
      {
        method: "POST",
        body: JSON.stringify(params),
      },
    );
    return data.data;
  },

  async ingestLecture(lectureId: string | number): Promise<{
    documentId: number;
    status: string;
    chunks?: number;
  }> {
    try {
      console.log('Calling ingest API for lecture:', lectureId);
      const data = await apiRequest<{
        documentId: number;
        status: string;
        chunks?: number;
      }>(
        `teacher/ai/ingest/lecture/${lectureId}`,
        {
          method: "POST",
        },
      );
      console.log('Ingest API response:', data);
      if (!data) {
        throw new Error('Ingest failed: No response from server');
      }
      return data;
    } catch (error: any) {
      console.error('Ingest API error:', error);
      console.error('Error details:', error.message, error.status, error.payload);
      throw error;
    }
  },
};
