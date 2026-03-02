export interface LessonAttachment {
  id: string;
  type: "pdf" | "image" | "video" | "link";
  title: string;
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  isPreview: boolean;
  videoUrl?: string;
  attachments?: LessonAttachment[];
}

export interface CurriculumModule {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
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
  curriculum: CurriculumModule[];
  tags: string[];
  price: number;
  lastUpdated: string;
}

export const mockCourses: Course[] = [
  {
    id: "1",
    title: "Toán học kiến thức cốt lõi ôn thi lớp 10",
    teacher: "Thầy Nguyễn Văn A",
    teacherAvatar: "https://i.pravatar.cc/150?u=a",
    image: "/elearning-1.jpg",
    category: "Bứt phá vào 10",
    rating: 4.9,
    reviewCount: 450,
    students: 1250,
    level: "Cơ bản",
    totalLessons: 45,
    duration: "25 giờ",
    description:
      "Khóa học tập trung vào các kiến thức trọng tâm của chương trình Toán lớp 9, giúp học sinh nắm vững các phương pháp giải đề thi vào 10.",
    willLearn: [
      "Các phương pháp giải phương trình và hệ phương trình",
      "Hình học phẳng và các định lý quan trọng",
      "Giải bài toán liên quan đến đồ thị hàm số",
      "Kỹ năng tối ưu hóa thời gian làm bài thi",
    ],
    requirements: [
      "Sách giáo khoa Toán 9",
      "Dụng cụ học tập (thước, compa, máy tính bỏ túi)",
    ],
    curriculum: [
      {
        id: "m1",
        title: "Chương 1: Căn bậc hai, căn bậc ba",
        lessons: [
          {
            id: "l1",
            title: "Căn bậc hai và hằng đẳng thức",
            duration: "15:00",
            isPreview: true,
          },
          {
            id: "l2",
            title: "Liên hệ giữa phép nhân và phép khai phương",
            duration: "20:00",
            isPreview: false,
          },
        ],
      },
      {
        id: "m2",
        title: "Chương 2: Hàm số bậc nhất",
        lessons: [
          {
            id: "l3",
            title: "Khái niệm hàm số bậc nhất",
            duration: "12:00",
            isPreview: false,
          },
          {
            id: "l4",
            title: "Đồ thị hàm số y = ax + b",
            duration: "25:00",
            isPreview: false,
          },
        ],
      },
    ],
    tags: ["Toán 9", "Ôn thi vào 10", "Kiến thức cốt lõi"],
    price: 199000,
    lastUpdated: "2024-02-15",
  },
  {
    id: "2",
    title: "Ngữ văn theo chủ đề chiến thuật ăn điểm đại trà",
    teacher: "Cô Lê Thị B",
    teacherAvatar: "https://i.pravatar.cc/150?u=b",
    image: "/elearning-1.jpg",
    category: "Bứt phá vào 10",
    rating: 4.8,
    reviewCount: 320,
    students: 850,
    level: "Trung cấp",
    totalLessons: 38,
    duration: "18 giờ",
    description:
      "Khám phá cách viết văn nghị luận xã hội và nghị luận văn học giúp bạn đạt điểm tối đa trong các kỳ thi.",
    willLearn: [
      "Cách lập dàn ý cho bài văn nghị luận",
      "Phân tích các tác phẩm văn học trọng tâm lớp 9",
      "Mẹo ghi điểm trong phần đọc hiểu văn bản",
      "Cải thiện khả năng diễn đạt và dùng từ",
    ],
    requirements: [
      "Yêu thích môn Văn và ham đọc sách",
      "Có kiến thức cơ bản về các tác phẩm văn học lớp 9",
    ],
    curriculum: [
      {
        id: "m1",
        title: "Chương 1: Văn bản nghị luận",
        lessons: [
          {
            id: "l1",
            title: "Nghị luận xã hội về một tư tưởng đạo lý",
            duration: "30:00",
            isPreview: true,
          },
          {
            id: "l2",
            title: "Nghị luận về một hiện tượng đời sống",
            duration: "35:00",
            isPreview: false,
          },
        ],
      },
    ],
    tags: ["Ngữ văn 9", "Chiến thuật làm bài", "Văn nghị luận"],
    price: 199000,
    lastUpdated: "2024-01-20",
  },
  {
    id: "3",
    title: "Luyện thi TOEIC 4 kỹ năng cấp tốc từ 0 - 550+",
    teacher: "Ms. Hoa TOEIC",
    teacherAvatar: "https://i.pravatar.cc/150?u=hoa",
    image: "/elearning-1.jpg",
    category: "Luyện thi TOEIC",
    rating: 5.0,
    reviewCount: 1200,
    students: 3400,
    level: "Mọi cấp độ",
    totalLessons: 60,
    duration: "40 giờ",
    description:
      "Lộ trình đào tạo toàn diện 4 kỹ năng Nghe - Nói - Đọc - Viết giúp bạn chinh phục chứng chỉ TOEIC nhanh nhất.",
    willLearn: [
      "Nắm vững cứu trúc đề thi TOEIC mới nhất",
      "Chiến thuật xử lý nhanh các phần trong đề thi",
      "Xây dựng vốn từ vựng chuyên môn trong môi trường công sở",
      "Phát âm chuẩn và phản xạ giao tiếp tự nhiên",
    ],
    requirements: [
      "Mất gốc tiếng Anh hoặc muốn hệ thống lại kiến thức",
      "Máy tính hoặc điện thoại có kết nối internet",
    ],
    curriculum: [
      {
        id: "m1",
        title: "Module 1: Ngữ pháp TOEIC trọng tâm",
        lessons: [
          {
            id: "l1",
            title: "Thì của động từ trong tiếng Anh",
            duration: "45:00",
            isPreview: true,
          },
          {
            id: "l2",
            title: "Các loại từ (Danh, Tính, Trạng, Động)",
            duration: "50:00",
            isPreview: false,
          },
        ],
      },
    ],
    tags: ["TOEIC", "English for Career", "4 Kỹ năng"],
    price: 0,
    lastUpdated: "2024-03-01",
  },
  {
    id: "4",
    title: "Lập trình Python từ cơ bản đến nâng cao (AI & Data)",
    teacher: "Thầy Trần C",
    teacherAvatar: "https://i.pravatar.cc/150?u=c",
    image: "/elearning-1.jpg",
    category: "Combo Lập trình",
    rating: 4.7,
    reviewCount: 560,
    students: 2100,
    level: "Cơ bản",
    totalLessons: 55,
    duration: "35 giờ",
    description:
      "Học lập trình Python một cách bài bản qua các dự án thực tế về xử lý dữ liệu và trí tuệ nhân tạo.",
    willLearn: [
      "Cú pháp Python và cấu trúc dữ liệu cơ bản (List, Tuple, Dictionary)",
      "Lập trình hướng đối tượng (OOP) và xử lý ngoại lệ chuyên nghiệp",
      "Làm việc với thư viện xử lý dữ liệu Numpy và Pandas",
      "Trực quan hóa dữ liệu với Matplotlib và Seaborn",
      "Xây dựng mô hình Machine Learning dự đoán thực tế",
      "Kỹ thuật cào dữ liệu (Web Scraping) tự động hóa công việc",
    ],
    requirements: [
      "Máy tính cá nhân (Windows, Mac hoặc Linux)",
      "Không yêu cầu kiến thức lập trình trước đó",
      "Sự tập trung và tư duy logic cơ bản",
    ],
    curriculum: [
      {
        id: "m1",
        title: "Module 1: Nền tảng Python Master",
        lessons: [
          {
            id: "l1",
            title: "Cài đặt môi trường Anaconda & VS Code",
            duration: "15:30",
            isPreview: true,
          },
          {
            id: "l2",
            title: "Biến và các kiểu dữ liệu cơ bản",
            duration: "25:00",
            isPreview: true,
          },
          {
            id: "l3",
            title: "Cấu trúc điều khiển If-Else và Vòng lặp",
            duration: "35:00",
            isPreview: false,
          },
        ],
      },
      {
        id: "m2",
        title: "Module 2: Phân tích dữ liệu chuyên sâu",
        lessons: [
          {
            id: "l4",
            title: "Thực hành với Pandas: Phân tích file CSV",
            duration: "45:00",
            isPreview: false,
          },
          {
            id: "l5",
            title: "Xử lý dữ liệu khuyết thiếu và làm sạch thông tin",
            duration: "40:00",
            isPreview: false,
          },
          {
            id: "l6",
            title: "Dự án: Phân tích xu hướng thị trường chứng khoán",
            duration: "60:00",
            isPreview: false,
          },
        ],
      },
    ],
    tags: ["Python", "Machine Learning", "Data Analysis"],
    price: 0,
    lastUpdated: "2024-02-28",
  },
  {
    id: "5",
    title: "Luyện thi TOEIC 2 kỹ năng (Listening & Reading)",
    teacher: "Thầy John Smith",
    teacherAvatar: "https://i.pravatar.cc/150?u=john",
    image: "/elearning-1.jpg",
    category: "Luyện thi TOEIC",
    rating: 4.6,
    reviewCount: 210,
    students: 1560,
    level: "Trung cấp",
    totalLessons: 40,
    duration: "20 giờ",
    description:
      "Khóa học chuyên sâu vào 2 kỹ năng cơ bản nhất của kỳ thi TOEIC.",
    willLearn: [
      "Nắm trọn 7 dạng câu hỏi trong phần Reading",
      "Kỹ thuật Scan & Skim tìm từ khóa cực nhanh",
      "Tuyệt chiêu xử lý Part 1, 2, 3, 4 Listening tránh bẫy",
      "Bộ 2000 từ vựng TOEIC thường gặp nhất",
      "Hệ thống ngữ pháp trọng tâm chắc chắn xuất hiện trong đề",
    ],
    requirements: [
      "Trình độ tiếng Anh cơ bản (từ 200/990)",
      "Sổ tay ghi chép từ vựng",
    ],
    curriculum: [
      {
        id: "m1",
        title: "Phần 1: Listening Mastery",
        lessons: [
          {
            id: "l1",
            title: "Part 1: Mô tả tranh - Các bẫy thường gặp",
            duration: "20:00",
            isPreview: true,
          },
          {
            id: "l2",
            title: "Part 2: Hỏi đáp - Kỹ thuật nghe từ khóa",
            duration: "25:00",
            isPreview: false,
          },
        ],
      },
      {
        id: "m2",
        title: "Phần 2: Reading Strategies",
        lessons: [
          {
            id: "l3",
            title: "Part 5: Hoàn thành câu - Ngữ pháp trọng tâm",
            duration: "30:00",
            isPreview: false,
          },
          {
            id: "l4",
            title: "Part 7: Đọc hiểu đoạn văn - Quản lý thời gian",
            duration: "40:00",
            isPreview: false,
          },
        ],
      },
    ],
    tags: ["TOEIC", "Listening", "Reading"],
    price: 0,
    lastUpdated: "2024-03-05",
  },
  {
    id: "6",
    title: "Tin học văn phòng chuẩn MOS Excel 2019",
    teacher: "Cô Mai Phương",
    teacherAvatar: "https://i.pravatar.cc/150?u=mai",
    image: "/elearning-1.jpg",
    category: "Tin học văn phòng",
    rating: 4.9,
    reviewCount: 890,
    students: 4200,
    level: "Cơ bản",
    totalLessons: 30,
    duration: "12 giờ",
    description: "Thành thạo Excel từ con số 0 đến chuyên gia văn phòng.",
    willLearn: [
      "Sử dụng thành thạo hơn 100 hàm Excel (Vlookup, Index, Match...)",
      "Thiết kế Dashboard báo cáo chuyên nghiệp với Pivot Table",
      "Tự động hóa báo cáo với Power Query cơ bản",
      "Kỹ năng định dạng dữ liệu và trình bày bảng tính",
      "Thực hành giải các bộ đề thi MOS thực tế",
    ],
    requirements: [
      "Máy tính cài sẵn Excel 2016 trở lên",
      "Kiến thức tin học cơ bản",
    ],
    curriculum: [
      {
        id: "m1",
        title: "Chương 1: Nền tảng và Hàm cơ bản",
        lessons: [
          {
            id: "l1",
            title: "Cấu trúc Excel và các phím tắt 'thần thánh'",
            duration: "15:00",
            isPreview: true,
          },
          {
            id: "l2",
            title: "Nhóm hàm Logic (IF, AND, OR)",
            duration: "25:00",
            isPreview: false,
          },
        ],
      },
      {
        id: "m2",
        title: "Chương 2: Xử lý dữ liệu nâng cao",
        lessons: [
          {
            id: "l3",
            title: "Hàm tìm kiếm nâng cao (VLOOKUP, XLOOKUP)",
            duration: "30:00",
            isPreview: false,
          },
          {
            id: "l4",
            title: "Pivot Table: Báo cáo chỉ trong 30 giây",
            duration: "35:00",
            isPreview: false,
          },
        ],
      },
    ],
    tags: ["Excel", "MOS", "Office"],
    price: 0,
    lastUpdated: "2024-01-10",
  },
  {
    id: "7",
    title: "Tiếng Anh cho người hoàn toàn mất gốc",
    teacher: "Thầy Paul",
    teacherAvatar: "https://i.pravatar.cc/150?u=paul",
    image: "/elearning-1.jpg",
    category: "Luyện thi TOEIC",
    rating: 4.5,
    reviewCount: 1500,
    students: 8900,
    level: "Cơ bản",
    totalLessons: 50,
    duration: "25 giờ",
    description: "Lấy lại nền tảng tiếng Anh chỉ trong 30 ngày.",
    willLearn: [
      "Phát âm chuẩn 44 âm trong bảng IPA",
      "Xây dựng vốn từ vựng theo 20 chủ đề giao tiếp thông dụng",
      "Nắm vững 12 thì căn bản và cấu trúc câu thông dụng",
      "Tự tin giới thiệu bản thân và hỏi đường, mua sắm",
      "Vượt qua nỗi sợ nói tiếng Anh sai ngữ pháp",
    ],
    requirements: [
      "Sự kiên trì và dành ít nhất 30 phút mỗi ngày",
      "Vở ghi chép và tai nghe",
    ],
    curriculum: [
      {
        id: "m1",
        title: "Giai đoạn 1: Chuẩn hóa phát âm",
        lessons: [
          {
            id: "l1",
            title: "Bảng âm IPA - Tại sao lại quan trọng?",
            duration: "20:00",
            isPreview: true,
          },
          {
            id: "l2",
            title: "Nguyên âm đơn và Nguyên âm đôi",
            duration: "30:00",
            isPreview: false,
          },
        ],
      },
    ],
    tags: ["English", "Basic", "Beginner"],
    price: 0,
    lastUpdated: "2024-03-10",
  },
  {
    id: "8",
    title: "Lập trình Web Fullstack với React và Node.js",
    teacher: "Thầy Hoàng Dev",
    teacherAvatar: "https://i.pravatar.cc/150?u=hoang",
    image: "/elearning-1.jpg",
    category: "Combo Lập trình",
    rating: 4.9,
    reviewCount: 420,
    students: 1800,
    level: "Nâng cao",
    totalLessons: 120,
    duration: "80 giờ",
    description: "Trở thành Fullstack Developer chuyên nghiệp sau 6 tháng.",
    willLearn: [
      "Xây dựng giao diện web hiện đại với React Hooks & Tailwind CSS",
      "Quản lý State ứng dụng phức tạp với Redux Toolkit",
      "Xây dựng API phía Server với Node.js và Express",
      "Thiết kế cơ sở dữ liệu linh hoạt với MongoDB",
      "Triển khai (Deploy) website lên AWS/Heroku",
      "Học cách viết Code sạch theo tiêu chuẩn doanh nghiệp",
    ],
    requirements: [
      "Biết HTML/CSS/JS cơ bản",
      "Máy tính cấu hình trung bình trở lên",
      "Biết sử dụng Git cơ bản",
    ],
    curriculum: [
      {
        id: "m1",
        title: "Frontend Mastery với React",
        lessons: [
          {
            id: "l1",
            title: "React Architecture & Component Lifecycle",
            duration: "40:00",
            isPreview: true,
          },
          {
            id: "l2",
            title: "Mastering useEffect & Custom Hooks",
            duration: "50:00",
            isPreview: false,
          },
        ],
      },
      {
        id: "m2",
        title: "Backend Development với Node.js",
        lessons: [
          {
            id: "l3",
            title: "Node.js Event Loop & Non-blocking I/O",
            duration: "35:00",
            isPreview: false,
          },
          {
            id: "l4",
            title: "Xây dựng RESTful API và Authentications",
            duration: "55:00",
            isPreview: false,
          },
        ],
      },
    ],
    tags: ["Javascript", "React", "Fullstack"],
    price: 0,
    lastUpdated: "2024-03-12",
  },
  {
    id: "9",
    title: "Tiếng Anh giao tiếp công sở cấp tốc",
    teacher: "Cô Hana",
    teacherAvatar: "https://i.pravatar.cc/150?u=hana",
    image: "/elearning-1.jpg",
    category: "Luyện thi TOEIC",
    rating: 4.7,
    reviewCount: 310,
    students: 1200,
    level: "Trung cấp",
    totalLessons: 35,
    duration: "20 giờ",
    description: "Tự tin giao tiếp với sếp và đồng nghiệp bằng tiếng Anh.",
    willLearn: [
      "Cách viết Email chuyên nghiệp cho đối tác và cấp trên",
      "Kỹ năng thuyết trình ý tưởng trong các buổi họp",
      "Tiếng Anh trong đàm phán và thuyết phục khách hàng",
      "Văn hóa ứng xử trong môi trường doanh nghiệp quốc tế",
      "Bộ cụm từ 'Phòng thân' cho các tình huống khẩn cấp",
    ],
    requirements: [
      "Trình độ tiếng Anh từ A2 trở lên",
      "Có môi trường hoặc nhu cầu sử dụng tại công sở",
    ],
    curriculum: [
      {
        id: "m1",
        title: "Chương 1: Email & Văn bản hành chính",
        lessons: [
          {
            id: "l1",
            title: "Cấu trúc chuẩn của một bức Email",
            duration: "25:00",
            isPreview: true,
          },
          {
            id: "l2",
            title: "Các mẫu câu trang trọng vs Thân mật",
            duration: "20:00",
            isPreview: false,
          },
        ],
      },
    ],
    tags: ["Communication", "Work", "Office"],
    price: 0,
    lastUpdated: "2024-02-25",
  },
  {
    id: "10",
    title: "Vật lý lớp 9 bứt phá điểm số vào 10",
    teacher: "Thầy Hùng Lý",
    teacherAvatar: "https://i.pravatar.cc/150?u=hung",
    image: "/elearning-1.jpg",
    category: "Bứt phá vào 10",
    rating: 4.8,
    reviewCount: 280,
    students: 950,
    level: "Cơ bản",
    totalLessons: 40,
    duration: "22 giờ",
    description: "Tổng ôn kiến thức Vật lý trọng tâm thi lớp 10.",
    willLearn: [
      "Tổng ôn toàn bộ kiến thức Điện học: Định luật Ohm, Công suất điện",
      "Làm chủ phần Quang học: Thấu kính, hiện tượng khúc xạ ánh sáng",
      "Giải nhanh các dạng bài tập thực tế thường có trong đề thi",
      "Kỹ năng làm bài trắc nghiệm Vật lý nhanh và chính xác",
      "Cách trình bày bài tự luận để đạt điểm tối đa",
    ],
    requirements: [
      "Kiến thức Toán học lớp 9 cơ bản",
      "Máy tính cầm tay Casiol",
    ],
    curriculum: [
      {
        id: "m1",
        title: "Chương 1: Điện học (Trọng tâm)",
        lessons: [
          {
            id: "l1",
            title: "Sự phụ thuộc của cường độ dòng điện",
            duration: "20:00",
            isPreview: true,
          },
          {
            id: "l2",
            title: "Đoạn mạch nối tiếp và song song",
            duration: "30:00",
            isPreview: false,
          },
        ],
      },
    ],
    tags: ["Physics", "Grade 9"],
    price: 0,
    lastUpdated: "2024-01-30",
  },
  {
    id: "11",
    title: "Tiếng Anh lớp 9 luyện thi vào 10 chuyên",
    teacher: "Cô Lan Anh",
    teacherAvatar: "https://i.pravatar.cc/150?u=lan",
    image: "/elearning-1.jpg",
    category: "Bứt phá vào 10",
    rating: 4.9,
    reviewCount: 520,
    students: 1400,
    level: "Nâng cao",
    totalLessons: 60,
    duration: "30 giờ",
    description: "Dành cho các bạn mục tiêu thi vào các trường chuyên.",
    willLearn: [
      "Nắm vững 15 cấu trúc ngữ pháp nâng cao thường gặp",
      "Mở rộng vốn từ vựng theo 30 chủ đề thi Chuyên",
      "Kỹ năng viết luận (Essay Writing) logic và thuyết phục",
      "Chiến thuật xử lý bài thi Reading khó (C1/C2 level)",
      "Luyện đề thực tế của các trường chuyên lớn (Amsterdam, Chu Văn An...)",
    ],
    requirements: [
      "Đã có nền tảng tiếng Anh chắc chắn",
      "Cam kết thời gian tự học cao",
    ],
    curriculum: [
      {
        id: "m1",
        title: "Module 1: Advanced Grammar Excellence",
        lessons: [
          {
            id: "l1",
            title: "Inversion & Conditional Sentences",
            duration: "45:00",
            isPreview: true,
          },
          {
            id: "l2",
            title: "Relative Clauses & Reduced Clauses",
            duration: "40:00",
            isPreview: false,
          },
        ],
      },
    ],
    tags: ["English", "Grade 9", "High Quality"],
    price: 0,
    lastUpdated: "2024-02-10",
  },
  {
    id: "12",
    title: "Thiết kế đồ họa với Photoshop và Illustrator",
    teacher: "Thầy Minh Art",
    teacherAvatar: "https://i.pravatar.cc/150?u=minh",
    image: "/elearning-1.jpg",
    category: "Combo Lập trình",
    rating: 4.6,
    reviewCount: 190,
    students: 750,
    level: "Cơ bản",
    totalLessons: 45,
    duration: "28 giờ",
    description: "Làm chủ bộ công cụ thiết kế của Adobe.",
    willLearn: [
      "Làm chủ Photoshop: Cắt ghép, chỉnh màu, xử lý chân dung",
      "Làm chủ Illustrator: Vẽ Vector, thiết kế Logo, Banner chuyên nghiệp",
      "Tư duy về bố cục, màu sắc và Typography trong thiết kế",
      "Thiết kế bộ nhận diện thương hiệu hoàn chỉnh",
      "Quy trình xuất file in ấn và hiển thị web chuẩn xác",
    ],
    requirements: [
      "Máy tính cấu hình ổn (Ram >8GB)",
      "Cài đặt bộ Adobe CC (có hướng dẫn)",
    ],
    curriculum: [
      {
        id: "m1",
        title: "Phần 1: Photoshop Masterclass",
        lessons: [
          {
            id: "l1",
            title: "Làm quen giao diện và Layer",
            duration: "20:00",
            isPreview: true,
          },
          {
            id: "l2",
            title: "Công cụ Pen Tool và kỹ thuật tách nền chuyên nghiệp",
            duration: "35:00",
            isPreview: false,
          },
        ],
      },
      {
        id: "m2",
        title: "Phần 2: Illustrator cho thiết kế Vector",
        lessons: [
          {
            id: "l3",
            title: "Vẽ Logo từ hình khối cơ bản",
            duration: "30:00",
            isPreview: false,
          },
          {
            id: "l4",
            title: "Phối màu và tạo Gradient nghệ thuật",
            duration: "40:00",
            isPreview: false,
          },
        ],
      },
    ],
    tags: ["Design", "Adobe", "Graphics"],
    price: 0.0,
    lastUpdated: "2024-03-08",
  },
];
