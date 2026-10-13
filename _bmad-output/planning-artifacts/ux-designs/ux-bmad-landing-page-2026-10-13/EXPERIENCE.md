---
title: Trang Web Xem Phim — Experience
status: final
created: 2026-10-13
updated: 2026-10-13
design_ref: DESIGN.md
---

# Trang Web Xem Phim — Experience

## Foundation

**Platform:** Web (Next.js App Router). Responsive: desktop ≥1024px, tablet 768–1023px, mobile <768px. React Native port planned — token names và IA được thiết kế để map 1:1.

**UI system:** shadcn/ui + Tailwind CSS. Visual identity: `{colors.*}`, `{typography.*}`, `{rounded.*}` trong DESIGN.md. Behavioral delta dưới đây.

**Authentication gate:** Mọi nội dung phim (home feed, chi tiết, player, watchlist, history) yêu cầu đăng nhập. Landing/login page là màn hình duy nhất truy cập được khi chưa xác thực.

**Scope note:** Không có reviews/bình luận người dùng. Rating là dữ liệu tĩnh do admin nhập.

## Information Architecture

```
/                          ← Landing (unauthenticated)
/sign-in                   ← Clerk sign-in
/sign-up                   ← Clerk sign-up
/home                      ← Home feed (authenticated)
/search                    ← Trang kết quả tìm kiếm
/movie/[id]                ← Chi tiết phim
/watch/[id]                ← Video player
/my-list                   ← Watchlist của tôi
/history                   ← Lịch sử xem
/admin                     ← Admin dashboard (role-gated)
/admin/movies/new          ← Thêm phim
/admin/movies/[id]/edit    ← Sửa phim
```

**Navigation (authenticated):** Header sticky — logo trái, search bar giữa, avatar/menu phải. Nav links: Home · Danh sách của tôi · Lịch sử. Trên mobile: bottom tab bar (Home · Tìm kiếm · Danh sách · Tài khoản).

**Admin navigation:** Sidebar trái, separate layout khỏi viewer app.

## Voice and Tone

**Microcopy:** Ngắn gọn, tự tin, không patronizing. Tiếng Việt thuần — không Việt-Anh lẫn lộn trừ tên riêng kỹ thuật (Admin, Login).

| Context | Ví dụ |
|---|---|
| CTA chính | "Xem ngay" |
| Thêm watchlist | "Thêm vào danh sách" / "Đã lưu" |
| Continue watching | "Tiếp tục xem" |
| Empty state | "Chưa có phim nào. Hãy khám phá thêm →" |
| Error | "Không tải được. Thử lại." |
| Loading | Skeleton — không dùng spinner text |

## Component Patterns

### Movie Row (Netflix Row)
- Hàng ngang scroll, không wrap
- Label hàng: `text-lg semibold text-primary` + dấu mũi tên "Xem thêm" cuối
- Trên mobile: scroll ngang tự nhiên, không pagination dots
- Load more: infinite scroll khi gần cuối hàng (threshold 200px)
- → [mockups/key-home.html](mockups/key-home.html)

### Movie Card
- Hover behavior (desktop only): overlay gradient bottom-up + tên phim + rating + badge genre hiện ra sau 100ms delay
- Touch (mobile): tap thẳng vào `/movie/[id]` — không có hover state
- Trạng thái: default · hover · loading (skeleton) · unavailable (opacity 40%)
- Icon bookmark ở góc trên phải — hiện khi hover hoặc đã trong watchlist

### Hero Banner
- Auto-rotate không có. Chọn 1 phim nổi bật, static.
- Nội dung: tên phim (`4xl bold`) · tagline/mô tả ngắn (`base text-secondary`, max 2 dòng) · badge genres · rating · nút "Xem ngay" + nút "Thêm vào danh sách"
- Trên mobile: chiều cao `50vh`, text nhỏ hơn (`2xl bold`)

### Search Bar
- Global, trong header. Click mở expand animation (width `200px → 400px`, `200ms ease-out`)
- Debounce 300ms → dropdown kết quả realtime (tối đa 6 items)
- Nhấn Enter hoặc "Xem tất cả" → `/search?q=...`
- Đóng khi click ra ngoài hoặc Escape

### Video Player
- Fullscreen by default khi vào `/watch/[id]`
- Iframe embed (YouTube hoặc direct URL)
- Overlay controls tối giản: nút back (←), tiêu đề phim, fullscreen toggle
- Controls ẩn sau 3s idle, hiện khi move chuột/tap
- Lưu timestamp mỗi 30s vào backend (dùng cho "Tiếp tục xem")
- → [mockups/key-watch.html](mockups/key-watch.html)

### Admin Table
- Light utilitarian: background `surface` thay vì `background`, table striped nhẹ
- Columns: Poster thumbnail · Tên · Thể loại · Năm · Actions (Sửa / Xóa)
- Search inline trên table (client-side filter)
- Delete: confirm dialog trước khi xóa

## State Patterns

| State | Behavior |
|---|---|
| **Loading** | Skeleton cards — cùng layout với content thật, không spinner |
| **Empty** | Illustration tối giản + CTA text (xem ví dụ Voice & Tone) |
| **Error** | Toast `destructive` + "Thử lại" link — không page redirect |
| **Watchlist added** | Icon bookmark fill amber + toast "Đã thêm vào danh sách" (2s) |
| **Watchlist removed** | Icon bookmark outline + toast "Đã xóa" (2s) |
| **Auth required** | Redirect `/sign-in?redirect_url=...` |
| **Admin unauthorized** | 403 page: "Bạn không có quyền truy cập" + nút về Home |

## Interaction Primitives

**Animations — minimal philosophy:** Chỉ animate khi có mục đích UX rõ ràng. Không animate để "đẹp".

| Interaction | Animation | Duration |
|---|---|---|
| Card hover scale | `scale(1.04)` | 150ms ease-out |
| Search bar expand | width expand | 200ms ease-out |
| Toast appear | slide-up + fade-in | 200ms ease-out |
| Page transition | fade-in | 150ms ease-in |
| Modal open | fade + scale(0.97→1) | 150ms ease-out |
| Skeleton shimmer | shimmer sweep | 1.5s linear loop |

**Không animate:** Row scroll, card reorder, hero content, navigation links.

**Reduced motion:** Khi `prefers-reduced-motion: reduce`, tắt tất cả transform/transition trừ skeleton shimmer (giảm còn opacity pulse).

## Accessibility Floor

- **Contrast:** Text `text-primary` trên `background` ≥ 7:1. Text `text-secondary` ≥ 4.5:1. Amber CTA text `primary-foreground` (đen) trên `primary` ≥ 7:1.
- **Focus ring:** `ring-2 ring-primary` visible trên mọi interactive element — không dùng `outline: none` không có thay thế
- **Keyboard nav:** Tab order logic theo reading order. Escape đóng modal/search. Arrow keys trong movie row (optional enhancement)
- **Semantic HTML:** `<main>`, `<nav>`, `<header>`, `<section>` đúng vai trò. Movie card là `<a>` không phải `<div onClick>`
- **Images:** Poster có `alt="[Tên phim] poster"`. Hero backdrop `alt=""` (decorative)
- **Motion:** `prefers-reduced-motion` respected (xem Interaction Primitives)

## Key Flows

→ [mockups/key-movie-detail.html](mockups/key-movie-detail.html) — chi tiết phim (bước 4–5)

### Flow 1 — Minh khám phá và xem phim lần đầu

*Minh, 25 tuổi, về nhà sau giờ làm, ngồi vào laptop, muốn xem phim tối nay.*

1. **Mở app** → Landing page tối, hero ảnh phim lớn, nút "Đăng nhập". Không có content cho đến khi login — tạo cảm giác "nội dung đang chờ bên trong".
2. **Đăng nhập** → Clerk modal (Google one-click). Redirect về `/home`.
3. **Trang chủ** → Hero banner phim nổi bật đập vào mắt. Minh lướt xuống xem các hàng phim theo thể loại.
4. **Tìm kiếm** → Minh nhớ tên phim, click search bar trên header. Gõ tên, dropdown realtime hiện 6 gợi ý ngay. Chọn đúng phim.
5. **Chi tiết phim** → `/movie/[id]`: Xem poster lớn, mô tả, trailer YouTube embed, rating, cast. Nút "Xem ngay" màu amber nổi bật. Click thêm watchlist (bookmark).
6. **Xem phim** → `/watch/[id]`: Trang fullscreen tối, iframe video load. Controls ẩn sau 3s. **Climax:** Minh đang xem phim, quên hết UI — chỉ còn màn hình phim. Mục tiêu UX đạt.

### Flow 2 — Minh quay lại xem tiếp

*Hôm sau Minh mở app, muốn xem tiếp phim hôm qua.*

1. **Home** → Hàng "Tiếp tục xem" xuất hiện đầu tiên, progress bar nhỏ dưới poster cho biết đã xem đến đâu.
2. **Click card** → Vào `/watch/[id]`, video tự seek đến timestamp đã lưu.
3. **Sau khi xem xong** → Phim biến khỏi "Tiếp tục xem", vẫn còn trong "Lịch sử".

### Flow 3 — Admin thêm phim mới

*Admin đăng nhập, thêm phim mới vào hệ thống.*

1. `/admin` → Danh sách phim dạng table. Nút "Thêm phim" góc trên phải.
2. Form thêm phim: các field trên layout 2 cột (utilitarian, không cinematic).
3. Submit → Toast "Thêm phim thành công", redirect về table.

## Responsive & Platform

| Surface | Desktop (≥1024px) | Mobile (<768px) |
|---|---|---|
| Navigation | Header sticky | Bottom tab bar |
| Movie row | 5–6 cards visible | 2–2.5 cards visible |
| Hero | 60–70vh, text trái | 50vh, text căn giữa |
| Movie card hover | Scale + overlay | Không có hover |
| Search | Expand trong header | Dedicated search tab |
| Admin | Sidebar layout | Hidden (mobile not supported) |

**Admin trên mobile:** Hiển thị thông báo "Trang quản trị chỉ khả dụng trên desktop." — không cần responsive admin UI.

**React Native readiness:** Token names (`colors.*`, `typography.*`, `spacing.*`) được đặt tên platform-agnostic. IA và flow logic giữ nguyên. Component behavior tách biệt khỏi HTML semantics để dễ port sau.
