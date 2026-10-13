---
title: Trang Web Xem Phim (Netflix Clone)
status: final
created: 2026-10-13
updated: 2026-10-13
---

# Tài Liệu Yêu Cầu Sản Phẩm: Trang Web Xem Phim

## 1. Tổng Quan

Xây dựng một trang web xem phim trực tuyến lấy cảm hứng từ Netflix, dành cho mục đích cá nhân / học tập. Người dùng có thể đăng nhập, duyệt phim theo thể loại, tìm kiếm, xem phim, lưu danh sách yêu thích và theo dõi lịch sử xem. Hệ thống có trang quản trị để thêm và quản lý nội dung phim.

**Mục tiêu dự án:**
- Xây dựng một sản phẩm hoàn chỉnh có giao diện đẹp, trải nghiệm mượt mà
- Thực hành full-stack development với các công nghệ hiện đại
- Có thể dùng làm portfolio showcase

---

## 2. Người Dùng Mục Tiêu

| Vai trò | Mô tả |
|---|---|
| Viewer (Người xem) | Người dùng đã đăng nhập, duyệt và xem phim |
| Admin | Quản trị viên thêm/sửa/xóa nội dung phim |

---

## 3. Tính Năng

### F1 — Xác Thực Người Dùng

| ID | Yêu cầu |
|---|---|
| FR-1.1 | Đăng ký / đăng nhập qua Clerk (email, Google, GitHub) |
| FR-1.2 | Trang hồ sơ cá nhân hiển thị tên, avatar |
| FR-1.3 | Đăng xuất |
| FR-1.4 | Route bảo vệ: chỉ người dùng đã đăng nhập mới truy cập được nội dung xem phim |

### F2 — Trang Chủ & Duyệt Phim

| ID | Yêu cầu |
|---|---|
| FR-2.1 | Hero banner nổi bật 1 phim được chọn (ảnh nền lớn, mô tả ngắn, nút "Xem ngay") |
| FR-2.2 | Danh sách phim chia theo thể loại (hàng ngang có thể cuộn ngang — kiểu Netflix row) |
| FR-2.3 | Hover vào poster phim hiện preview nhỏ (tên, rating, năm, thể loại) |
| FR-2.4 | Phân trang hoặc tải thêm (load more) khi cuộn đến cuối danh sách |

### F3 — Tìm Kiếm

| ID | Yêu cầu |
|---|---|
| FR-3.1 | Thanh tìm kiếm toàn cục trên header |
| FR-3.2 | Kết quả tìm kiếm realtime (debounce ~300ms) theo tên phim |
| FR-3.3 | Trang kết quả tìm kiếm với lưới phim phù hợp |

### F4 — Trang Chi Tiết Phim

| ID | Yêu cầu |
|---|---|
| FR-4.1 | Hiển thị: tiêu đề, mô tả, năm phát hành, thể loại, diễn viên, đạo diễn, rating |
| FR-4.2 | Trailer nhúng (YouTube embed) |
| FR-4.3 | Nút "Xem phim" chuyển sang trang player |
| FR-4.4 | Nút thêm / bỏ khỏi danh sách yêu thích |
| FR-4.5 | Phần "Phim tương tự" bên dưới (cùng thể loại) |

### F5 — Trình Phát Video

| ID | Yêu cầu |
|---|---|
| FR-5.1 | Nhúng video qua iframe (YouTube, hoặc URL video trực tiếp) [ASSUMPTION: không stream từ server riêng] |
| FR-5.2 | Giao diện fullscreen, tối giản |
| FR-5.3 | Lưu tiến độ xem (timestamp) sau mỗi phiên — dùng cho "Tiếp tục xem" |

### F6 — Tiếp Tục Xem & Lịch Sử

| ID | Yêu cầu |
|---|---|
| FR-6.1 | Hàng "Tiếp tục xem" trên trang chủ cho phim đã xem dở |
| FR-6.2 | Trang "Lịch sử xem" liệt kê các phim đã xem, sắp xếp theo thời gian |
| FR-6.3 | Người dùng có thể xóa một mục khỏi lịch sử |

### F7 — Yêu Thích / Watchlist

| ID | Yêu cầu |
|---|---|
| FR-7.1 | Thêm / bỏ phim vào danh sách yêu thích từ bất kỳ đâu (trang chủ, chi tiết) |
| FR-7.2 | Trang "Danh sách của tôi" hiển thị tất cả phim đã lưu |

### F8 — Trang Quản Trị (Admin)

| ID | Yêu cầu |
|---|---|
| FR-8.1 | Chỉ tài khoản có role Admin mới truy cập được |
| FR-8.2 | Thêm phim mới: tiêu đề, mô tả, poster URL, trailer URL, video URL, thể loại, năm, cast, rating |
| FR-8.3 | Sửa thông tin phim |
| FR-8.4 | Xóa phim |
| FR-8.5 | Danh sách tất cả phim kèm tìm kiếm nhanh trong admin |

---

## 4. Yêu Cầu Phi Chức Năng

| ID | Yêu cầu |
|---|---|
| NFR-1 | Giao diện dark theme, responsive (mobile + desktop) |
| NFR-2 | Trang chủ tải dưới 3 giây trên kết nối thông thường |
| NFR-3 | [ASSUMPTION] Stack: Next.js (App Router) + Tailwind CSS + Clerk Auth + MongoDB hoặc Supabase |

---

## 5. Ngoài Phạm Vi

- Không streaming video từ server riêng (dùng embed/URL ngoài)
- Không thanh toán / subscription
- Không đề xuất phim bằng AI / ML
- Không ứng dụng mobile native
- Không real-time features (chat, live stream)

---

## 6. Câu Hỏi Còn Mở

| # | Câu hỏi | Mức độ |
|---|---|---|
| OQ-1 | Database chọn MongoDB hay Supabase (PostgreSQL)? | Thấp — quyết định khi làm architecture |
| OQ-2 | Video nguồn: YouTube embed hay host video riêng (Cloudinary, S3)? | Thấp — có thể bắt đầu với YouTube embed |
| OQ-3 | Rating phim: dữ liệu thủ công admin nhập hay tích hợp TMDB API? | Thấp |

---

*Tài liệu này được tạo bằng BMad Method — draft, chưa finalize.*
