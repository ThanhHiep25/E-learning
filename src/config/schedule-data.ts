export interface ScheduleItem {
  id: string;
  courseId?: string | number | null;
  courseTitle?: string;
  title: string;
  type: "lesson" | "lecture" | "exam" | "assignment" | "live" | "note";
  status: "upcoming" | "completed" | "missed" | "ongoing";
  startAt: string;
  endAt: string;
  description?: string;
  zoomLink?: string;
  meetingId?: string;
  passcode?: string;
  platform?: "zoom" | "teams" | "google-meet" | "other";
  location?: string;
  isPersonal?: boolean;
  isQuiz?: boolean;
}

export const mockSchedule: ScheduleItem[] = [
  {
    id: "s1",
    courseId: "1",
    courseTitle: "Toán học kiến thức cốt lõi ôn thi lớp 10",
    title: "Căn bậc hai và hằng đẳng thức",
    type: "lesson",
    startAt: "2024-03-20T19:00:00.000Z",
    endAt: "2024-03-20T20:30:00.000Z",
    status: "upcoming",
    description: "Ôn tập lý thuyết và giải bài tập nâng cao chương 1.",
  },
  {
    id: "s2",
    courseId: "1",
    courseTitle: "Toán học kiến thức cốt lõi ôn thi lớp 10",
    title: "[LỊCH THI] Kiểm tra định kỳ Chương 1",
    type: "exam",
    startAt: "2024-03-22T20:00:00.000Z",
    endAt: "2024-03-22T21:00:00.000Z",
    status: "upcoming",
    isQuiz: true,
    description: "Bài kiểm tra online tính điểm chuyên cần.",
  },
  {
    id: "s3",
    courseId: "3",
    courseTitle: "Luyện thi TOEIC 4 kỹ năng cấp tốc từ 0 - 550+",
    title: "Live Stream: Giải đề Part 1 & 2",
    type: "live",
    startAt: "2024-03-21T21:00:00.000Z",
    endAt: "2024-03-21T22:30:00.000Z",
    status: "upcoming",
    zoomLink: "https://zoom.us/j/123456789",
    description: "Cô Hoa hướng dẫn mẹo tránh bẫy Part 1, 2.",
  },
  {
    id: "s4",
    courseId: "4",
    courseTitle: "Lập trình Python từ cơ bản đến nâng cao (AI & Data)",
    title: "Báo cáo bài tập Module 1",
    type: "assignment",
    startAt: "2024-03-19T23:59:00.000Z",
    endAt: "2024-03-19T23:59:59.000Z",
    status: "ongoing",
    description: "Học viên nộp link GitHub dự án cá nhân.",
  },
  {
    id: "s5",
    courseId: "2",
    courseTitle: "Ngữ văn theo chủ đề chiến thuật ăn điểm đại trà",
    title: "Văn bản nghị luận xã hội",
    type: "lesson",
    startAt: "2024-03-18T18:00:00.000Z",
    endAt: "2024-03-18T19:30:00.000Z",
    status: "completed",
    description: "Phân tích các đề thi thực tế 3 năm gần nhất.",
  },
];
