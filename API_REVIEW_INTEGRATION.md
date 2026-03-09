# Hướng dẫn Tích hợp API Đánh giá Khóa học (Course Review)

Tài liệu này hướng dẫn cách tích hợp các API liên quan đến đánh giá khóa học từ phía Client (Frontend).

## 1. Thông tin chung

- **Base URL:** `/api`
- **Định dạng dữ liệu:** `JSON`
- **Xác thực:** Hầu hết các yêu cầu yêu cầu Token JWT trong Header `Authorization: Bearer <token>`.

---

## 2. Các API Endpoints

### 2.1 Lấy danh sách đánh giá của một khóa học (Công khai)

Dùng để hiển thị các đánh giá trên trang chi tiết khóa học.

- **URL:** `GET /courses/:courseId/reviews`
- **Query Parameters:**
  - `page` (optional): Số trang (mặc định: 1)
  - `limit` (optional): Số lượng bản ghi mỗi trang (mặc định: 10)
  - `rating` (optional): Lọc theo số sao (1-5)
  - `sort` (optional): Sắp xếp (`newest`, `oldest`, `highest`, `lowest`)
- **Phản hồi thành công:**

```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "statistics": {
      "averageRating": "4.5",
      "totalReviews": 20,
      "distribution": { "1": 0, "2": 0, "3": 2, "4": 6, "5": 12 }
    },
    "pagination": { "total": 20, "page": 1, "limit": 10, "totalPages": 2 }
  }
}
```

### 2.2 Gửi đánh giá mới (Học viên)

Học viên phải đăng ký khóa học này mới có thể đánh giá. Mỗi học viên chỉ được đánh giá 1 lần cho mỗi khóa học.

- **URL:** `POST /student/courses/:courseId/reviews` hoặc `POST /courses/:courseId/reviews`
- **Xác thực:** Yêu cầu (Student/Admin)
- **Body:**

```json
{
  "rating": 5,
  "comment": "Khóa học rất hay và bổ ích, giảng viên nhiệt tình."
}
```

- **Điều kiện:**
  - `rating`: Bắt buộc, số nguyên từ 1-5.
  - `comment`: Tùy chọn, từ 10-1000 ký tự.
  - Học viên phải có trạng thái `enrolled` trong khóa học.

### 2.3 Chỉnh sửa đánh giá (Học viên)

- **URL:** `PUT /student/reviews/:reviewId` hoặc `PUT /reviews/:reviewId`
- **Xác thực:** Yêu cầu (Chủ sở hữu đánh giá hoặc Admin)
- **Body:** Giống như API tạo mới.

### 2.4 Xóa đánh giá (Học viên)

- **URL:** `DELETE /student/reviews/:reviewId` hoặc `DELETE /reviews/:reviewId`
- **Xác thực:** Yêu cầu (Chủ sở hữu đánh giá hoặc Admin)

### 2.5 Lấy danh sách đánh giá của chính mình

- **URL:** `GET /student/reviews`
- **Xác thực:** Yêu cầu (Student/Admin)

---

## 3. Các mã trạng thái phản hồi (HTTP Status Codes)

| Mã lỗi             | Ý nghĩa              | Chi tiết                                                             |
| ------------------ | -------------------- | -------------------------------------------------------------------- |
| `200 OK`           | Thành công           | Yêu cầu GET, PUT, DELETE thành công.                                 |
| `201 Created`      | Đã tạo               | Yêu cầu POST tạo mới thành công.                                     |
| `400 Bad Request`  | Dữ liệu không hợp lệ | Thiếu thông số bắt buộc (vd: rating) hoặc không đúng định dạng.      |
| `401 Unauthorized` | Chưa xác thực        | Token không hợp lệ hoặc đã hết hạn.                                  |
| `403 Forbidden`    | Không có quyền       | Học viên chưa đăng ký khóa học, hoặc không phải chủ sở hữu đánh giá. |
| `404 Not Found`    | Không tìm thấy       | ID khóa học hoặc ID đánh giá không tồn tại.                          |
| `409 Conflict`     | Xung đột             | Học viên cố gắng đánh giá khóa học đã được đánh giá trước đó.        |
| `500 Server Error` | Lỗi máy chủ          | Có lỗi xảy ra phía Backend.                                          |

---

## 4. Ví dụ Tích hợp (JavaScript/Axios)

### Gửi đánh giá mới

```javascript
const postReview = async (courseId, rating, comment) => {
  try {
    const response = await axios.post(
      `/api/student/courses/${courseId}/reviews`,
      { rating, comment },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    if (response.data.success) {
      alert("Đánh giá thành công!");
    }
  } catch (error) {
    console.error(
      "Lỗi khi gửi đánh giá:",
      error.response?.data?.message || error.message,
    );
    alert(error.response?.data?.message || "Có lỗi xảy ra");
  }
};
```

---

## 4. Lưu ý quan trọng

1. **Ràng buộc:** Một người dùng không thể đánh giá một khóa học nhiều lần. Nếu cố gắng tạo thêm sẽ nhận mã lỗi `409 Conflict`.
2. **Tự động cập nhật:** Khi một đánh giá được tạo, cập nhật hoặc xóa, hệ thống sẽ tự động tính toán lại `averageRating` và `reviewCount` của khóa học đó trong bảng `courses`.
3. **Thông báo:** Giảng viên sẽ nhận được thông báo khi có học viên gửi đánh giá mới cho khóa học của họ.
4. **Phân quyền:** Admin có quyền quản lý (xem, sửa, xóa) tất cả các đánh giá thông qua các endpoint Admin.
