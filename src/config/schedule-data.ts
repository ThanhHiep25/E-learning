export interface ScheduleItem {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  type: "lesson" | "exam" | "assignment" | "live";
  date: string; // ISO format or YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: "upcoming" | "completed" | "missed" | "ongoing";
  description?: string;
  zoomLink?: string;
  location?: string;
}

export const mockSchedule: ScheduleItem[] = [
  {
    id: "s1",
    courseId: "1",
    courseTitle: "Toán học kiến thức cốt lõi ôn thi lớp 10",
    title: "Căn bậc hai và hằng đẳng thức",
    type: "lesson",
    date: "2024-03-20",
    startTime: "19:00",
    endTime: "20:30",
    status: "upcoming",
    description: "Ôn tập lý thuyết và giải bài tập nâng cao chương 1.",
  },
  {
    id: "s2",
    courseId: "1",
    courseTitle: "Toán học kiến thức cốt lõi ôn thi lớp 10",
    title: "Kiểm tra định kỳ Chương 1",
    type: "exam",
    date: "2024-03-22",
    startTime: "20:00",
    endTime: "21:00",
    status: "upcoming",
    description: "Bài kiểm tra online tính điểm chuyên cần.",
  },
  {
    id: "s3",
    courseId: "3",
    courseTitle: "Luyện thi TOEIC 4 kỹ năng cấp tốc từ 0 - 550+",
    title: "Live Stream: Giải đề Part 1 & 2",
    type: "live",
    date: "2024-03-21",
    startTime: "21:00",
    endTime: "22:30",
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
    date: "2024-03-19",
    startTime: "23:59",
    endTime: "23:59",
    status: "ongoing",
    description: "Học viên nộp link GitHub dự án cá nhân.",
  },
  {
    id: "s5",
    courseId: "2",
    courseTitle: "Ngữ văn theo chủ đề chiến thuật ăn điểm đại trà",
    title: "Văn bản nghị luận xã hội",
    type: "lesson",
    date: "2024-03-18",
    startTime: "18:00",
    endTime: "19:30",
    status: "completed",
    description: "Phân tích các đề thi thực tế 3 năm gần nhất.",
  },
];
