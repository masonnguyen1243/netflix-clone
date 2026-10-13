---
title: Trang Web Xem Phim — Design
status: final
created: 2026-10-13
updated: 2026-10-13
ui_system: shadcn/ui + Tailwind CSS
platform: Next.js (web-first; React Native–extensible)
colors:
  background: "#0a0a0a"
  surface: "#141414"
  surface-elevated: "#1f1f1f"
  border: "#2a2a2a"
  primary: "#d97706"
  primary-hover: "#b45309"
  primary-foreground: "#0a0a0a"
  text-primary: "#f5f5f5"
  text-secondary: "#a3a3a3"
  text-muted: "#525252"
  destructive: "#ef4444"
  success: "#22c55e"
typography:
  font-sans: "'Inter', system-ui, sans-serif"
  font-display: "'Inter', system-ui, sans-serif"
  scale-xs: "0.75rem / 1rem"
  scale-sm: "0.875rem / 1.25rem"
  scale-base: "1rem / 1.5rem"
  scale-lg: "1.125rem / 1.75rem"
  scale-xl: "1.25rem / 1.75rem"
  scale-2xl: "1.5rem / 2rem"
  scale-3xl: "1.875rem / 2.25rem"
  scale-4xl: "2.25rem / 2.5rem"
  weight-regular: "400"
  weight-medium: "500"
  weight-semibold: "600"
  weight-bold: "700"
rounded:
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  full: "9999px"
spacing:
  unit: "4px"
  page-x: "clamp(1rem, 4vw, 4rem)"
  section-y: "3rem"
  card-gap: "0.75rem"
  row-gap: "2rem"
components:
  movie-card:
    aspect: "2/3"
    hover: "scale-[1.04] + ring-2 ring-primary/60"
    transition: "150ms ease-out"
  button-primary:
    bg: "primary"
    text: "primary-foreground"
    rounded: "md"
    px: "1.5rem"
    py: "0.625rem"
  hero-overlay: "linear-gradient(to right, rgba(10,10,10,0.95) 30%, transparent 100%)"
  badge-genre:
    bg: "surface-elevated"
    text: "text-secondary"
    rounded: "full"
    px: "0.625rem"
    py: "0.125rem"
---

# Trang Web Xem Phim — Design

## Brand & Style

**Concept:** Cinema in the dark. Người dùng là khán giả ngồi trong rạp — màn hình là trung tâm, UI lùi vào bóng tối.

**Voice:** Tối giản, tự tin. Không ồn ào. Poster và tên phim nói thay UI.

**Anti-patterns:** Tránh gradients màu mè; tránh quá nhiều màu nhấn; tránh animation không có mục đích; tránh white background ở bất kỳ đâu.

## Colors

Nền tối gần đen (`#0a0a0a`) — không phải `#000000` thuần để tránh OLED burn và cảm giác nhựa. Các lớp surface nâng dần theo độ sáng nhẹ.

**Màu nhấn Amber** (`#d97706`) — ấm, gợi ánh đèn rạp. Dùng cho CTA chính (nút "Xem ngay"), badge trạng thái active, border focus ring.

| Token | Hex | Dùng khi |
|---|---|---|
| `background` | `#0a0a0a` | Nền trang |
| `surface` | `#141414` | Card, nav |
| `surface-elevated` | `#1f1f1f` | Modal, dropdown, tooltip |
| `border` | `#2a2a2a` | Divider, card border |
| `primary` | `#d97706` | CTA, focus ring, active state |
| `primary-hover` | `#b45309` | Hover trên primary |
| `text-primary` | `#f5f5f5` | Tiêu đề, body chính |
| `text-secondary` | `#a3a3a3` | Metadata (năm, thể loại) |
| `text-muted` | `#525252` | Placeholder, disabled |

## Typography

Inter — neutral, legible ở mọi kích thước, phù hợp cinema dark interface.

**Hierarchy:** Tiêu đề phim dùng `2xl–4xl bold`; metadata `sm regular text-secondary`; body `base regular`; labels/badges `xs medium`.

**Rule:** Không dùng font decorative. Không italic trừ tagline phim.

## Layout & Spacing

- **Page padding:** `clamp(1rem, 4vw, 4rem)` — co giãn tự nhiên theo viewport
- **Netflix row gap giữa các hàng:** `2rem`
- **Card gap trong row:** `0.75rem`
- **Max content width:** `1400px`, căn giữa

Grid: 12-column trên desktop, 4-column trên tablet (≥768px), 2-column trên mobile.

Movie card aspect ratio `2:3` (portrait poster).

## Elevation & Depth

Ba lớp:
1. **Base** (`background`) — trang
2. **Surface** (`surface`) — card, sidebar, header
3. **Elevated** (`surface-elevated`) — modal, dropdown, floating panel

Shadow: `0 4px 24px rgba(0,0,0,0.6)` cho modal. Card không dùng shadow — dùng border `border` để tách.

## Shapes

Nhất quán `rounded-md` (`0.375rem`) cho card và button. `rounded-full` chỉ cho badge genre và avatar. Không dùng sharp corners (`rounded-none`) ở UI chính.

## Components

### Movie Card
- Aspect `2:3`, overflow hidden, `rounded-lg`
- Hover: `scale(1.04)` + `ring-2 ring-primary/60` — **chỉ trên desktop pointer**
- Transition `150ms ease-out` — nhanh, không flashy
- Overlay gradient bottom-up khi hover: tên phim + rating hiện ra
- → [mockups/key-home.html](mockups/key-home.html)

### Hero Banner
- Full-width, chiều cao `60–70vh`
- Poster/backdrop full bleed, overlay gradient phải sang trái (`hero-overlay`)
- Content text căn trái, max-width `600px`
- Nút CTA: `button-primary` + icon Play
- → [mockups/key-home.html](mockups/key-home.html)

### Nút "Xem ngay" (CTA chính)
- Background `primary`, text `primary-foreground` (đen)
- Icon Play inline trái
- Hover: `primary-hover`, không scale

### Badge Genre
- `surface-elevated`, text `text-secondary`, `rounded-full`
- Nhỏ gọn — không chiếm nhiều không gian

### Search Bar
- Background `surface-elevated`, border `border`
- Focus: `ring-2 ring-primary`
- Placeholder `text-muted`

## Do's and Don'ts

**Do:**
- Để poster phim là điểm nhấn thị giác chính
- Dùng amber chỉ cho action và trạng thái active
- Giữ animation ≤150ms, ease-out, mục đích rõ ràng

**Don't:**
- Dùng background trắng hoặc sáng ở bất kỳ component nào
- Thêm animation chỉ để "đẹp" — mỗi transition phải có lý do UX
- Dùng quá 2 màu accent trên cùng một màn hình
- Scale card quá 1.05 — sẽ làm vỡ layout row
