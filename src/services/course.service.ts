import { apiRequest } from "./api";

export type BackendCourseListItem = {
  id: string | number;
  title: string;
  slug?: string;
  description?: string;
  imageUrl?: string | null;
  level?: string | null;
  rating?: number | string | null;
  reviewCount?: number | null;
  duration?: string | null;
  price?: number;
  published?: boolean;
  createdAt?: string;
  creator?: { id: string | number; name: string; username?: string };
};

export type BackendFormattedCourse = Partial<FrontendCourse> & {
  id: string | number;
  title: string;
};

export type BackendLecture = {
  id: string | number;
  title: string;
  type: string;
  contentUrl?: string;
  duration?: number;
  order?: number;
  isPreview?: boolean;
  attachments?: any;
};

export type BackendChapter = {
  id: string | number;
  title: string;
  order?: number;
  Lectures?: BackendLecture[];
};

export type BackendCourseDetail = BackendCourseListItem & {
  creator?: { id: string | number; name: string; username?: string };
  Chapters?: BackendChapter[];
};

function secondsToDuration(sec?: number) {
  if (!sec || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function normalizeIsPreview(value: unknown): boolean {
  if (value === true) return true;
  if (value === false) return false;
  if (value === 1) return true;
  if (value === 0) return false;
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return false;
  if (s === "1" || s === "true" || s === "yes") return true;
  if (s === "0" || s === "false" || s === "no") return false;
  return false;
}

export type FrontendCourse = {
  id: string;
  title: string;
  teacher: string;
  teacherAvatar?: string;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  students: number;
  level: "Cơ bản" | "Trung cấp" | "Nâng cao" | "Mọi cấp độ";
  totalLessons: number;
  duration: string;
  description: string;
  willLearn: string[];
  requirements: string[];
  curriculum: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
      duration: string;
      isPreview: boolean;
      videoUrl?: string;
    }[];
  }[];
  tags: string[];
  price: number;
  lastUpdated: string;
};

export function mapBackendCourseToFrontend(course: BackendCourseDetail): FrontendCourse {
  const chapters = course.Chapters || [];
  const curriculum = chapters
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((ch, idx) => ({
      id: String(ch.id ?? idx),
      title: ch.title,
      lessons: (ch.Lectures || [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((lec, lecIdx) => ({
          id: String(lec.id ?? lecIdx),
          title: lec.title,
          duration: secondsToDuration(lec.duration),
          isPreview: normalizeIsPreview((lec as any)?.isPreview),
          videoUrl: lec.contentUrl,
          type: lec.type,
        })),
    }));

  const totalLessons = curriculum.reduce((sum, m) => sum + m.lessons.length, 0);

  return {
    id: String(course.id),
    title: course.title,
    teacher: course.creator?.name || "",
    teacherAvatar:
      (course.creator as any)?.avatarUrl ||
      (course.creator as any)?.avatar ||
      (course.creator as any)?.imageUrl ||
      undefined,
    image: course.imageUrl || "/elearning-1.jpg",
    category: "Tất cả",
    rating: 0,
    reviewCount: 0,
    students: 0,
    level: "Mọi cấp độ",
    totalLessons,
    duration: "",
    description: course.description || "",
    willLearn: [],
    requirements: [],
    curriculum,
    tags: [],
    price: course.price || 0,
    lastUpdated: course.createdAt || "",
  };
}

export const courseService = {
  async listCourses(q?: string): Promise<FrontendCourse[]> {
    const query = q ? `?q=${encodeURIComponent(q)}` : "";
    const data = await apiRequest<{ courses: (BackendFormattedCourse | BackendCourseListItem)[] }>(`courses${query}`, {
      method: "GET",
      auth: false,
    });

    return (data.courses || []).map((c) => {
      // Your backend already formats published courses to FE shape.
      // Keep fallback mapping for legacy payloads.
      const maybe = c as BackendFormattedCourse;
      if (typeof maybe.category === "string" && typeof maybe.teacher === "string" && typeof maybe.image === "string") {
        return {
          id: String(maybe.id),
          title: String(maybe.title),
          teacher: maybe.teacher || "",
          teacherAvatar: maybe.teacherAvatar,
          image: maybe.image || "/elearning-1.jpg",
          category: maybe.category || "Khác",
          rating: Number(maybe.rating ?? 0),
          reviewCount: Number(maybe.reviewCount ?? 0),
          students: Number(maybe.students ?? 0),
          level: (maybe.level as FrontendCourse["level"]) || "Mọi cấp độ",
          totalLessons: Number(maybe.totalLessons ?? 0),
          duration: String(maybe.duration ?? ""),
          description: String(maybe.description ?? ""),
          willLearn: Array.isArray(maybe.willLearn) ? maybe.willLearn : [],
          requirements: Array.isArray(maybe.requirements) ? maybe.requirements : [],
          curriculum: Array.isArray(maybe.curriculum)
            ? maybe.curriculum.map((m: any) => ({
                ...m,
                lessons: Array.isArray(m?.lessons)
                  ? m.lessons.map((l: any) => ({
                      ...l,
                      isPreview: normalizeIsPreview(l?.isPreview),
                    }))
                  : [],
              }))
            : [],
          tags: Array.isArray(maybe.tags) ? maybe.tags : [],
          price: Number(maybe.price ?? 0),
          lastUpdated: String(maybe.lastUpdated ?? ""),
        };
      }

      return mapBackendCourseToFrontend({
        ...(c as BackendCourseListItem),
        Chapters: [],
      });
    });
  },

  async getCourseDetail(id: string): Promise<FrontendCourse> {
    const data = await apiRequest<{ course: BackendFormattedCourse | BackendCourseDetail }>(`courses/${id}`, {
      method: "GET",
      auth: false,
    });

    const maybe = data.course as BackendFormattedCourse;
    if (typeof maybe.category === "string" && typeof maybe.teacher === "string" && Array.isArray(maybe.curriculum)) {
      return {
        id: String(maybe.id),
        title: String(maybe.title),
        teacher: maybe.teacher || "",
        teacherAvatar: maybe.teacherAvatar,
        image: maybe.image || "/elearning-1.jpg",
        category: maybe.category || "Khác",
        rating: Number(maybe.rating ?? 0),
        reviewCount: Number(maybe.reviewCount ?? 0),
        students: Number(maybe.students ?? 0),
        level: (maybe.level as FrontendCourse["level"]) || "Mọi cấp độ",
        totalLessons: Number(maybe.totalLessons ?? 0),
        duration: String(maybe.duration ?? ""),
        description: String(maybe.description ?? ""),
        willLearn: Array.isArray(maybe.willLearn) ? maybe.willLearn : [],
        requirements: Array.isArray(maybe.requirements) ? maybe.requirements : [],
        curriculum: Array.isArray(maybe.curriculum)
          ? maybe.curriculum.map((m: any) => ({
              ...m,
              lessons: Array.isArray(m?.lessons)
                ? m.lessons.map((l: any) => ({
                    ...l,
                    isPreview: normalizeIsPreview(l?.isPreview),
                  }))
                : [],
            }))
          : [],
        tags: Array.isArray(maybe.tags) ? maybe.tags : [],
        price: Number(maybe.price ?? 0),
        lastUpdated: String(maybe.lastUpdated ?? ""),
      };
    }

    return mapBackendCourseToFrontend(data.course as BackendCourseDetail);
  },
};
