# 🎓 LMS E-Learning - Premium Educational Platform

Một nền tảng học trực tuyến (LMS) hiện đại, chuyên nghiệp dành cho học sinh thi vào lớp 10, luyện thi TOEIC và lập trình viên. Dự án được thiết kế với trải nghiệm người dùng (UX) cao cấp, tích hợp trợ lý ảo và hệ quản trị (Admin Portal) mạnh mẽ.

---

## ✨ Tính năng nổi bật

### 👨‍🎓 Dành cho Học viên

- **Giao diện Premium:** Thiết kế theo phong cách Glassmorphism hiện đại, tinh tế và tối ưu cho mọi thiết bị (Responsive).
- **Trợ lý ảo Bot AI:** Hỗ trợ giải đáp thắc mắc và định hướng học tập ngay trên nền tảng.
- **Lộ trình học bài bản:** Hệ thống bài giảng phân theo chương hồi, tích hợp xem video và tải tài liệu đính kèm (PDF, Image).
- **Lịch học thông minh:** Quản lý thời gian học và các bài kiểm tra sắp tới dưới dạng Calendar trực quan.
- **Hệ thống Kiểm tra:** Làm bài trắc nghiệm với thời gian thực, xem kết quả và đáp án chi tiết ngay lập tức.
- **Trang cá nhân:** Theo dõi tiến độ học tập, các khóa học đã ghi danh và thành tích cá nhân.

### 👨‍🏫 Dành cho Giảng viên & Admin

- **Dashboard Thống kê:** Theo dõi số lượng học viên, đánh giá khóa học và hiệu quả giảng dạy qua biểu đồ.
- **Quản lý Khóa học:** Trình soạn thảo khóa học chuyên nghiệp với khả năng thiết lập mục tiêu và yêu cầu học tập.
- **Xây dựng nội dung (Curriculum):** Quản lý cấu trúc bài giảng theo từng chương, dễ dàng thêm video và tài liệu minh họa.
- **Quản lý Học viên:** Theo dõi danh sách và tiến độ của từng học viên trong mỗi khóa học.
- **Quản lý Đề thi:** Hệ thống soạn thảo câu hỏi và đề bài kiểm tra cho từng môn học.

---

## 🛠️ Công nghệ sử dụng

- **Frontend:** React.js + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS (Vanilla CSS & Glassmorphism)
- **Icons:** Lucide React
- **State Management:** Zustand
- **Routing:** React Router DOM (Separate Patient & Teacher Layouts)
- **Animations:** Framer Motion (Subtle micro-animations)
- **Notifications:** React Hot Toast

---

## 📂 Cấu trúc thư mục chính

```text
src/
├── components/      # UI Components (Header, Sidebar, Layouts...)
├── context/         # AuthContext và các Global Context
├── store/           # Zustand Stores (CourseStore, EnrollmentStore...)
├── pages/           # Các trang chức năng (Home, Courses, Teacher Portal...)
├── config/          # Mock data và cấu hình hệ thống
└── App.tsx          # Cấu hình Routing chính
```

---

## 🚀 Hướng dẫn cài đặt

1. **Clone project:**

   ```bash
   git clone [URL_PROJECT]
   cd e-learning
   ```

2. **Cài đặt dependencies:**

   ```bash
   npm install
   ```

3. **Chạy dự án ở chế độ phát triển:**
   ```bash
   npm run dev
   ```

---

## 🎨 Design Philosophy

Dự án tập trung vào tính **Premium** thông qua:

- Màu sắc chủ đạo: **Amber (Vàng hổ phách)** mang lại cảm giác năng động và đáng tin cậy.
- Typography: Sử dụng font chữ hiện đại, đậm chất công nghệ và học thuật.
- UX: Giảm thiểu các bước trung gian, tập trung vào nội dung bài giảng và tính tương tác cao.

---

_Phát triển bởi đội ngũ đam mê giáo dục và công nghệ._
