import { apiRequest } from "./api";

export type BackendTeacherCourse = {
  id: string | number;
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  published?: boolean;
  categoryId?: number | null;
  createdBy?: string | number;
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
};

export type BackendTeacherQuestion = {
  id: string | number;
  quizId: string | number;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
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
  questions?: BackendTeacherQuestion[];
};

export type BackendTeacherQuizDetail = BackendTeacherQuiz & {
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
};

export type CreateTeacherQuestionInput = {
  type: BackendTeacherQuestion['type'];
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
};

export const teacherService = {
  async listMyCourses(): Promise<BackendTeacherCourse[]> {
    const data = await apiRequest<{ courses: BackendTeacherCourse[] }>("teacher/courses", {
      method: "GET",
    });

    return data.courses || [];
  },

  async getCourseEnrollments(courseId: string): Promise<BackendCourseEnrollment[]> {
    const data = await apiRequest<{ enrollments: BackendCourseEnrollment[] }>(
      `teacher/courses/${courseId}/enrollments`,
      {
        method: "GET",
      },
    );

    return data.enrollments || [];
  },

  async getCourseForOwner(courseId: string): Promise<BackendOwnerCourse> {
    const data = await apiRequest<{ course: BackendOwnerCourse }>(`teacher/courses/${courseId}`, {
      method: "GET",
    });

    return data.course;
  },

  async createCourse(input: CreateTeacherCourseInput): Promise<BackendTeacherCourse> {
    const data = await apiRequest<{ course: BackendTeacherCourse }>("teacher/courses", {
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
      }),
    });

    return data.course;
  },

  async updateCourse(courseId: string, input: Partial<CreateTeacherCourseInput>): Promise<BackendOwnerCourse> {
    const data = await apiRequest<{ course: BackendOwnerCourse }>(`teacher/courses/${courseId}`, {
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
        willLearn: input.willLearn,
        requirements: input.requirements,
        tags: input.tags,
      }),
    });

    return data.course;
  },

  async deleteCourse(courseId: string): Promise<void> {
    await apiRequest<unknown>(`teacher/courses/${courseId}`, {
      method: "DELETE",
    });
  },

  async getCourseContent(courseId: string): Promise<TeacherCourseContentResponse> {
    const data = await apiRequest<TeacherCourseContentResponse>(`teacher/courses/${courseId}/chapters`, {
      method: "GET",
    });

    return data;
  },

  async getCourseQuizzes(courseId: string): Promise<BackendTeacherQuiz[]> {
    const data = await apiRequest<{ quizzes: BackendTeacherQuiz[] }>(`teacher/courses/${courseId}/quizzes`, {
      method: 'GET',
    });

    return data.quizzes || [];
  },

  async createQuiz(courseId: string, input: CreateTeacherQuizInput): Promise<BackendTeacherQuiz> {
    const data = await apiRequest<{ quiz: BackendTeacherQuiz }>(`teacher/courses/${courseId}/quizzes`, {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        maxScore: input.maxScore,
        timeLimit: input.timeLimit,
        passingScore: input.passingScore,
      }),
    });

    return data.quiz;
  },

  async getQuiz(quizId: string): Promise<BackendTeacherQuizDetail> {
    const data = await apiRequest<{ quiz: BackendTeacherQuizDetail }>(`teacher/quizzes/${quizId}`, {
      method: 'GET',
    });

    return data.quiz;
  },

  async addQuestion(quizId: string, input: CreateTeacherQuestionInput): Promise<BackendTeacherQuestion> {
    const data = await apiRequest<{ question: BackendTeacherQuestion }>(`teacher/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(input),
    });

    return data.question;
  },

  async updateQuestion(questionId: string, input: UpdateTeacherQuestionInput): Promise<BackendTeacherQuestion> {
    const data = await apiRequest<{ question: BackendTeacherQuestion }>(`teacher/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });

    return data.question;
  },

  async deleteQuestion(questionId: string): Promise<void> {
    await apiRequest<unknown>(`teacher/questions/${questionId}`, {
      method: 'DELETE',
    });
  },

  async uploadQuizMedia(file: File): Promise<UploadQuizMediaResponse> {
    const form = new FormData();
    form.set('file', file);

    const data = await apiRequest<UploadQuizMediaResponse>(`teacher/media/quiz`, {
      method: 'POST',
      body: form,
    });

    return data;
  },

  async uploadAttachmentMedia(file: File): Promise<UploadAttachmentMediaResponse> {
    return this.uploadQuizMedia(file);
  },

  async createChapter(params: { courseId: string; title: string; order?: number }): Promise<BackendTeacherChapter> {
    const data = await apiRequest<{ chapter: BackendTeacherChapter }>(`teacher/courses/${params.courseId}/chapters`, {
      method: "POST",
      body: JSON.stringify({
        title: params.title,
        order: params.order,
      }),
    });

    return data.chapter;
  },

  async updateChapter(params: { chapterId: string; title?: string; order?: number }): Promise<BackendTeacherChapter> {
    const data = await apiRequest<{ chapter: BackendTeacherChapter }>(`teacher/chapters/${params.chapterId}`, {
      method: "PUT",
      body: JSON.stringify({
        title: params.title,
        order: params.order,
      }),
    });

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
    file?: File;
  }): Promise<BackendTeacherLecture> {
    const form = new FormData();
    form.set("title", params.title);
    form.set("type", params.type);
    if (params.contentUrl != null) form.set("contentUrl", params.contentUrl);
    if (params.duration != null) form.set("duration", String(params.duration));
    if (params.isPreview != null) form.set("isPreview", String(params.isPreview));
    if (params.attachments != null) form.set("attachments", JSON.stringify(params.attachments));
    if (params.order != null) form.set("order", String(params.order));
    if (params.file) form.set("file", params.file);

    const data = await apiRequest<{ lecture: BackendTeacherLecture }>(`teacher/chapters/${params.chapterId}/lectures`, {
      method: "POST",
      body: form,
    });

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
    file?: File;
  }): Promise<BackendTeacherLecture> {
    const useForm = Boolean(params.file);
    const body = useForm ? (() => {
      const form = new FormData();
      if (params.title != null) form.set("title", params.title);
      if (params.type != null) form.set("type", params.type);
      if (params.contentUrl != null) form.set("contentUrl", params.contentUrl);
      if (params.duration != null) form.set("duration", String(params.duration));
      if (params.isPreview != null) form.set("isPreview", String(params.isPreview));
      if (params.attachments != null) form.set("attachments", JSON.stringify(params.attachments));
      if (params.order != null) form.set("order", String(params.order));
      if (params.file) form.set("file", params.file);
      return form;
    })() : JSON.stringify({
      title: params.title,
      type: params.type,
      contentUrl: params.contentUrl,
      duration: params.duration,
      isPreview: params.isPreview,
      attachments: params.attachments,
      order: params.order,
    });

    const data = await apiRequest<{ lecture: BackendTeacherLecture }>(`teacher/lectures/${params.lectureId}`, {
      method: "PUT",
      body,
      ...(useForm ? {} : { headers: { "Content-Type": "application/json" } }),
    });

    return data.lecture;
  },

  async deleteLecture(lectureId: string): Promise<void> {
    await apiRequest<unknown>(`teacher/lectures/${lectureId}`, {
      method: "DELETE",
    });
  },
};
