export type CurriculumModule = {
  id: string;
  title: string;
  lessonIds: string[];
};

export type CurriculumLesson = {
  id: string;
  title: string;
  duration: string;
  isPreview: boolean;
  videoUrl?: string;
  type?: string;
  moduleId: string;
};

export type CurriculumIndex = {
  courseId: string;
  moduleIds: string[];
  modulesById: Record<string, CurriculumModule>;
  lessonIds: string[];
  lessonsById: Record<string, CurriculumLesson>;
};

export function getLessonIdByProgressPercent(idx: CurriculumIndex, progressPercent: number): string | undefined {
  if (!idx.lessonIds.length) return undefined;

  const pct = Math.min(100, Math.max(0, Number(progressPercent) || 0));
  const raw = Math.floor((pct / 100) * idx.lessonIds.length);
  const lessonIndex = Math.min(idx.lessonIds.length - 1, Math.max(0, raw));
  return idx.lessonIds[lessonIndex];
}

export function getFirstLessonId(idx: CurriculumIndex): string | undefined {
  return idx.lessonIds[0];
}

export function buildCurriculumIndex(params: {
  courseId: string;
  curriculum: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
      duration: string;
      isPreview: boolean;
      videoUrl?: string;
      type?: string;
    }[];
  }[];
}): CurriculumIndex {
  const moduleIds: string[] = [];
  const modulesById: Record<string, CurriculumModule> = {};
  const lessonIds: string[] = [];
  const lessonsById: Record<string, CurriculumLesson> = {};

  for (const m of params.curriculum || []) {
    const moduleId = String(m.id);
    moduleIds.push(moduleId);

    const moduleLessonIds: string[] = [];
    for (const l of m.lessons || []) {
      const lessonId = String(l.id);
      moduleLessonIds.push(lessonId);
      lessonIds.push(lessonId);
      lessonsById[lessonId] = {
        id: lessonId,
        title: String(l.title ?? ""),
        duration: String(l.duration ?? ""),
        isPreview: Boolean(l.isPreview),
        videoUrl: l.videoUrl,
        type: l.type,
        moduleId,
      };
    }

    modulesById[moduleId] = {
      id: moduleId,
      title: String(m.title ?? ""),
      lessonIds: moduleLessonIds,
    };
  }

  return {
    courseId: String(params.courseId),
    moduleIds,
    modulesById,
    lessonIds,
    lessonsById,
  };
}
