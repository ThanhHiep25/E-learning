export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

export interface Skill {
  name: string;
  level: number; // 1-5
}

export interface Experience {
  period: string;
  company: string;
  position: string;
}

export interface Education {
  period: string;
  school: string;
  major: string;
}

export interface User {
  id: string;
  fullName: string;
  username?: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  bio?: string;
  phone?: string;
  location?: string;
  joinDate?: string;
  exp?: number;
  maxExp?: number;
  skills?: Skill[];
  experienceList?: Experience[];
  educationList?: Education[];
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
    fullName: "Nguyễn Thành Hiệp",
    username: "vuongthiennguyenhiep",
    email: "hiepnguyen.250402@gmail.com",
    password: "password123",
    role: "STUDENT",
    avatar: "https://i.pravatar.cc/150?u=s1",
    phone: "0333444555",
    location: "Hồ Chí Minh - Vietnam",
    joinDate: "07/04/2021",
    exp: 1201,
    maxExp: 1601,
    skills: [
      { name: "C++", level: 5 },
      { name: "Java", level: 5 },
      { name: "C", level: 5 },
      { name: "C#", level: 4 },
      { name: "JavaScript", level: 4 },
      { name: "Postgresql", level: 3 },
    ],
    experienceList: [
      {
        period: "2023 - Present",
        company: "FPT Software",
        position: "Fullstack Developer Intern",
      },
    ],
    educationList: [
      {
        period: "01/01/2023 - Present",
        school: "Đại học Công nghiệp HCM",
        major: "Kỹ thuật phần mềm",
      },
    ],
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
    location: "Hà Nội - Vietnam",
    joinDate: "01/01/2020",
    exp: 5000,
    maxExp: 10000,
    enrolledCourses: [],
    teachingCourses: ["1"],
    expertise: ["Toán lớp 9", "Ôn thi vào 10"],
    skills: [
      { name: "Toán học", level: 5 },
      { name: "Giảng dạy", level: 5 },
    ],
  },
];
