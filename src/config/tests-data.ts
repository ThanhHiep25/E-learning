export interface TestItem {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  teacher: string;
  duration: number; // minutes
  questions: number;
  deadline: string;
  status: "not_started" | "in_progress" | "completed";
  score?: number;
  attempts: number;
  maxAttempts: number;
  type: "quiz" | "midterm" | "final";
}

export const mockTests: TestItem[] = [
  {
    id: "t1",
    courseId: "1",
    courseTitle: "Toán học kiến thức cốt lõi ôn thi lớp 10",
    title: "Kiểm tra Chương 1: Căn bậc hai",
    teacher: "Thầy Nguyễn Văn A",
    duration: 45,
    questions: 20,
    deadline: "2024-03-25T23:59:59",
    status: "not_started",
    attempts: 0,
    maxAttempts: 2,
    type: "quiz",
  },
  {
    id: "t2",
    courseId: "3",
    courseTitle: "Luyện thi TOEIC 4 kỹ năng cấp tốc từ 0 - 550+",
    title: "Mini Test: Listening Part 1 & 2",
    teacher: "Cô Hoa TOEIC",
    duration: 30,
    questions: 25,
    deadline: "2024-03-22T12:00:00",
    status: "in_progress",
    attempts: 1,
    maxAttempts: 3,
    type: "quiz",
  },
  {
    id: "t3",
    courseId: "1",
    courseTitle: "Toán học kiến thức cốt lõi ôn thi lớp 10",
    title: "Kiểm tra giữa kỳ Toán 9",
    teacher: "Thầy Nguyễn Văn A",
    duration: 90,
    questions: 50,
    deadline: "2024-03-30T00:00:00",
    status: "not_started",
    attempts: 0,
    maxAttempts: 1,
    type: "midterm",
  },
  {
    id: "t4",
    courseId: "4",
    courseTitle: "Lập trình Python từ cơ bản đến nâng cao (AI & Data)",
    title: "Quiz 2: Data Structures in Python",
    teacher: "Thầy Trần Văn C",
    duration: 20,
    questions: 15,
    deadline: "2024-03-15T23:59:59",
    status: "completed",
    score: 9.5,
    attempts: 1,
    maxAttempts: 2,
    type: "quiz",
  },
  {
    id: "t5",
    courseId: "2",
    courseTitle: "Ngữ văn theo chủ đề chiến thuật ăn điểm đại trà",
    title: "Viết bài luận: Nghị luận xã hội",
    teacher: "Cô Mai Hạnh",
    duration: 60,
    questions: 1,
    deadline: "2024-03-28T18:00:00",
    status: "not_started",
    attempts: 0,
    maxAttempts: 1,
    type: "assignment" as any,
  },
];
