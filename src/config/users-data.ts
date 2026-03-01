export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  bio?: string;
  phone?: string;
  // Specific for Students
  enrolledCourses: string[]; // IDs
  // Specific for Teachers
  teachingCourses?: string[]; // IDs
  expertise?: string[];
  rating?: number;
}

export const mockUsers: User[] = [
  {
    id: "s1",
    fullName: "Nguyễn Văn Học Viên",
    email: "student@elearning.vn",
    password: "password123",
    role: "STUDENT",
    avatar: "https://i.pravatar.cc/150?u=s1",
    phone: "0333444555",
    enrolledCourses: ["1", "3"],
  },
  {
    id: "t1",
    fullName: "Thầy Nguyễn Văn A",
    email: "teacher.a@elearning.vn",
    password: "password123",
    role: "TEACHER",
    avatar: "https://i.pravatar.cc/150?u=a",
    bio: "Chuyên gia ôn thi Toán vào 10 với hơn 10 năm kinh nghiệm.",
    phone: "0999888777",
    enrolledCourses: [],
    teachingCourses: ["1"],
    expertise: ["Toán lớp 9", "Ôn thi vào 10"],
  },
  {
    id: "t2",
    fullName: "Ms. Hoa TOEIC",
    email: "mshoa@elearning.vn",
    password: "password123",
    role: "TEACHER",
    avatar: "https://i.pravatar.cc/150?u=hoa",
    bio: "Sứ giả truyền cảm hứng tiếng Anh, giúp hàng ngàn bạn trẻ chinh phục TOEIC.",
    phone: "0888777666",
    enrolledCourses: [],
    teachingCourses: ["3"],
    expertise: ["TOEIC", "Giao tiếp"],
  },
];
