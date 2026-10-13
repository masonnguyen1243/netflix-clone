---
status: final
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-bmad-landing-page-2026-10-13/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-bmad-landing-page-2026-10-13/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad-landing-page-2026-10-13/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad-landing-page-2026-10-13/EXPERIENCE.md
---

# Trang Web Xem Phim (Netflix Clone) - Epic Breakdown

## Tổng Quan

Tài liệu này cung cấp bản phân rã epic và story đầy đủ cho dự án Trang Web Xem Phim, phân tách các yêu cầu từ PRD, UX Design và Architecture thành các story có thể triển khai được.

## Requirements Inventory

### Functional Requirements

FR-1.1: Đăng ký / đăng nhập qua Clerk (email, Google, GitHub)
FR-1.2: Trang hồ sơ cá nhân hiển thị tên, avatar
FR-1.3: Đăng xuất
FR-1.4: Route bảo vệ: chỉ người dùng đã đăng nhập mới truy cập được nội dung xem phim

FR-2.1: Hero banner nổi bật 1 phim được chọn (ảnh nền lớn, mô tả ngắn, nút "Xem ngay")
FR-2.2: Danh sách phim chia theo thể loại (hàng ngang có thể cuộn ngang — kiểu Netflix row)
FR-2.3: Hover vào poster phim hiện preview nhỏ (tên, rating, năm, thể loại)
FR-2.4: Phân trang hoặc tải thêm (load more) khi cuộn đến cuối danh sách

FR-3.1: Thanh tìm kiếm toàn cục trên header
FR-3.2: Kết quả tìm kiếm realtime (debounce ~300ms) theo tên phim
FR-3.3: Trang kết quả tìm kiếm với lưới phim phù hợp

FR-4.1: Hiển thị thông tin phim: tiêu đề, mô tả, năm phát hành, thể loại, diễn viên, đạo diễn, rating
FR-4.2: Trailer nhúng (YouTube embed)
FR-4.3: Nút "Xem phim" chuyển sang trang player
FR-4.4: Nút thêm / bỏ khỏi danh sách yêu thích
FR-4.5: Phần "Phim tương tự" bên dưới (cùng thể loại)

FR-5.1: Nhúng video qua iframe (YouTube hoặc URL video trực tiếp) — không stream từ server riêng
FR-5.2: Giao diện fullscreen, tối giản với overlay controls
FR-5.3: Lưu tiến độ xem (timestamp) sau mỗi phiên — dùng cho "Tiếp tục xem"

FR-6.1: Hàng "Tiếp tục xem" trên trang chủ cho phim đã xem dở
FR-6.2: Trang "Lịch sử xem" liệt kê các phim đã xem, sắp xếp theo thời gian
FR-6.3: Người dùng có thể xóa một mục khỏi lịch sử

FR-7.1: Thêm / bỏ phim vào danh sách yêu thích từ bất kỳ đâu (trang chủ, chi tiết)
FR-7.2: Trang "Danh sách của tôi" hiển thị tất cả phim đã lưu

FR-8.1: Chỉ tài khoản có role Admin mới truy cập được trang quản trị
FR-8.2: Thêm phim mới: tiêu đề, mô tả, poster URL, trailer URL, video URL, thể loại, năm, cast, rating
FR-8.3: Sửa thông tin phim
FR-8.4: Xóa phim (có confirm dialog)
FR-8.5: Danh sách tất cả phim kèm tìm kiếm nhanh trong admin

### NonFunctional Requirements

NFR-1: Giao diện dark theme, responsive (mobile + desktop)
NFR-2: Trang chủ tải dưới 3 giây trên kết nối thông thường
NFR-3: Stack: Next.js 16.4 (App Router) + Tailwind CSS 4.x + Clerk Auth (@clerk/nextjs 7.9.x) + Supabase PostgreSQL; deploy trên Vercel

### Additional Requirements

- AR-1: Supabase là datastore duy nhất — tất cả dữ liệu bền vững (movies, genres, watchlist, watch_history) trong Supabase PostgreSQL với relational model + foreign keys
- AR-2: API Routes là ranh giới data duy nhất — mọi read/write qua `app/api/**`; Server Components fetch nội bộ; không import Supabase client ngoài `lib/supabase/`
- AR-3: Clerk JWT là nguồn auth/authz duy nhất — `publicMetadata.role === 'admin'` là điều kiện duy nhất vào `/admin`; không lưu role ở Supabase; middleware không query DB
- AR-4: Supabase client nhận Clerk JWT qua custom JWT template (`getToken({ template: 'supabase' })`); admin routes dùng `SUPABASE_SERVICE_ROLE_KEY` chỉ trong `lib/supabase/admin.ts`
- AR-5: Rendering strategy — ISR `revalidate=60` cho `/home` và `/movie/[id]`; `no-store` cho `/search`; `force-dynamic` cho `/my-list`, `/history`, `/watch/[id]` và API routes user-scoped; admin write triggers `revalidateTag('movies')`
- AR-6: YouTube IFrame API JS SDK là implementation duy nhất cho video player — component `YouTubePlayer` trong `components/player/`; không dùng raw iframe hoặc react-player
- AR-7: Client state: `useState` + native `fetch`; không dùng state management library (không TanStack Query, Redux, etc.); optimistic update thủ công với rollback
- AR-8: `watch_history` có UNIQUE constraint `(user_id, movie_id)`; mọi write dùng upsert `ON CONFLICT DO UPDATE SET progress_seconds, updated_at`; không insert row riêng per session
- AR-9: Hai TypeScript types riêng biệt: `MovieSummary` (list/grid — `genres: string[]`) và `Movie` (detail — `genres: Genre[]`); định nghĩa trong `types/index.ts`
- AR-10: `next/image` cho tất cả poster/backdrop; cấu hình `remotePatterns` wildcard hostname trong `next.config.ts`
- AR-11: Supabase schema cần tạo: tables `movies`, `genres`, `movie_genres`, `watch_history`, `watchlist`; RLS enable trên `watch_history` và `watchlist`; Clerk `userId` dùng làm FK
- AR-12: API response convention — success: `{ data: T }`; error: `{ error: string, code?: string }`; HTTP 401/403/404/422; file/route naming: kebab-case; component naming: PascalCase
- AR-13: Testing strategy chưa quyết định — phải quyết định trước khi bắt đầu build epic đầu tiên
- AR-14: Project cấu trúc thư mục cần theo Structural Seed trong ARCHITECTURE-SPINE.md (`src/app/`, `src/components/`, `src/lib/`, `src/types/`)

### UX Design Requirements

UX-DR1: Implement color token system trong Tailwind CSS theme — background `#0a0a0a`, surface `#141414`, surface-elevated `#1f1f1f`, border `#2a2a2a`, primary `#d97706`, primary-hover `#b45309`, primary-foreground `#0a0a0a`, text-primary `#f5f5f5`, text-secondary `#a3a3a3`, text-muted `#525252`, destructive `#ef4444`, success `#22c55e`
UX-DR2: Implement typography system — Inter font; scale xs(0.75rem) đến 4xl(2.25rem); weights 400/500/600/700; hierarchy: movie titles 2xl–4xl bold, metadata sm regular text-secondary, labels xs medium
UX-DR3: Implement MovieCard component — aspect 2:3, `rounded-lg`, overflow hidden; hover desktop: `scale(1.04)` + `ring-2 ring-primary/60` 150ms ease-out + bottom-up overlay gradient hiện tên + rating + badge genre; bookmark icon góc trên phải (hiện khi hover hoặc đã trong watchlist); skeleton loading state; unavailable state opacity 40%
UX-DR4: Implement HeroBanner component — full-width 60–70vh desktop / 50vh mobile; full-bleed backdrop + hero-overlay gradient; content left-aligned max-width 600px; title 4xl bold desktop / 2xl mobile; nút "Xem ngay" (button-primary + icon Play) + nút "Thêm vào danh sách"; static (no auto-rotate)
UX-DR5: Implement MovieRow component — horizontal scroll no-wrap; row label `text-lg semibold text-primary` + "Xem thêm" arrow; mobile: natural horizontal scroll (no pagination dots); infinite scroll load-more threshold 200px
UX-DR6: Implement SearchBar component — global trong header; expand animation width 200px→400px 200ms ease-out; debounce 300ms realtime dropdown tối đa 6 items; close on click-outside/Escape; Enter hoặc "Xem tất cả" → `/search?q=...`; mobile: dedicated search tab
UX-DR7: Implement VideoPlayer page — fullscreen default; YouTube IFrame API; minimal overlay controls (back ←, tiêu đề phim, fullscreen toggle); controls ẩn sau 3s idle, hiện khi move/tap; lưu timestamp mỗi 30s via `POST /api/history/[id]/progress`
UX-DR8: Implement AdminTable component — background `surface`; striped rows; columns: poster thumbnail, tên, thể loại, năm, actions (Sửa/Xóa); client-side search filter; delete confirmation dialog
UX-DR9: Accessibility floor — contrast: text-primary ≥7:1, text-secondary ≥4.5:1, amber CTA ≥7:1; focus ring `ring-2 ring-primary` trên mọi interactive element (không `outline: none` không có thay thế); semantic HTML (`<main>`, `<nav>`, `<header>`, `<section>`); movie card là `<a>` không phải `<div onClick>`; poster `alt="[Tên phim] poster"`, hero backdrop `alt=""`
UX-DR10: State patterns — Loading: skeleton cards (không spinner); Empty: illustration tối giản + CTA; Error: destructive toast + "Thử lại"; Watchlist added: bookmark fill amber + toast "Đã thêm vào danh sách" 2s; Watchlist removed: bookmark outline + toast "Đã xóa" 2s; Auth required: redirect `/sign-in?redirect_url=...`; Admin 403: page "Bạn không có quyền truy cập" + nút về Home
UX-DR11: Animation system — card hover scale 150ms ease-out; search expand 200ms ease-out; toast slide-up+fade 200ms; page fade-in 150ms; modal fade+scale(0.97→1) 150ms; skeleton shimmer 1.5s loop; `prefers-reduced-motion`: tắt transform/transition, skeleton dùng opacity pulse
UX-DR12: Responsive layout — desktop: 12-col grid, 5–6 cards visible in row; tablet ≥768px: 4-col; mobile <768px: 2-col; max content width 1400px; page padding `clamp(1rem, 4vw, 4rem)`; card gap 0.75rem; row gap 2rem
UX-DR13: Navigation — authenticated: sticky header (logo trái, search bar giữa, avatar/menu phải), nav links: Home · Danh sách của tôi · Lịch sử; mobile: bottom tab bar (Home · Tìm kiếm · Danh sách · Tài khoản); admin: left sidebar separate layout
UX-DR14: Microcopy tiếng Việt — CTA: "Xem ngay"; watchlist: "Thêm vào danh sách" / "Đã lưu"; continue: "Tiếp tục xem"; empty: "Chưa có phim nào. Hãy khám phá thêm →"; error: "Không tải được. Thử lại."; loading: skeleton (không text)
UX-DR15: Admin mobile: hiển thị "Trang quản trị chỉ khả dụng trên desktop." — không cần responsive admin UI
UX-DR16: Progress bar nhỏ dưới poster trong "Tiếp tục xem" row cho biết đã xem đến đâu; video seek về timestamp đã lưu khi vào `/watch/[id]`

### FR Coverage Map

```
FR-1.1 → Epic 1 — Clerk sign-up/sign-in pages
FR-1.2 → Epic 1 — Profile page (avatar, name)
FR-1.3 → Epic 1 — Logout via Clerk
FR-1.4 → Epic 1 — Middleware route protection
FR-2.1 → Epic 2 — HeroBanner on home
FR-2.2 → Epic 2 — MovieRow by genre (home feed)
FR-2.3 → Epic 2 — MovieCard hover preview
FR-2.4 → Epic 2 — Load more / infinite scroll in MovieRow
FR-3.1 → Epic 2 — Global SearchBar in header
FR-3.2 → Epic 2 — Debounce 300ms realtime dropdown
FR-3.3 → Epic 2 — /search results grid
FR-4.1 → Epic 3 — Movie detail metadata page
FR-4.2 → Epic 3 — YouTube trailer embed
FR-4.3 → Epic 3 — "Xem ngay" button → /watch/[id]
FR-4.4 → Epic 4 — Watchlist toggle wired (Story 4.1, first story)
FR-4.5 → Epic 3 — Similar movies section (same genre)
FR-5.1 → Epic 3 — iframe video via YouTubePlayer
FR-5.2 → Epic 3 — Fullscreen minimal UI + overlay controls
FR-5.3 → Epic 3 — Save progress timestamp every 30s
FR-6.1 → Epic 4 — "Tiếp tục xem" row on home with progress bar
FR-6.2 → Epic 4 — History page sorted by time
FR-6.3 → Epic 4 — Delete item from history
FR-7.1 → Epic 4 — Add/remove watchlist from card + detail
FR-7.2 → Epic 4 — /my-list page
FR-8.1 → Epic 5 — Admin role gate (middleware)
FR-8.2 → Epic 5 — Add movie form
FR-8.3 → Epic 5 — Edit movie form
FR-8.4 → Epic 5 — Delete movie with confirm
FR-8.5 → Epic 5 — Admin table with inline search
```

## Epic List

### Epic 1: Foundation & Authentication
Users can register, log in, and access a protected app — the skeleton everything else builds on. Includes Vercel project setup, Supabase schema, Clerk configuration, design token system, global layout, and all auth pages.
**FRs covered:** FR-1.1, FR-1.2, FR-1.3, FR-1.4
**Story notes:** Story 1.1 = Vercel project setup + env vars + Supabase project init + Clerk JWT template configured (explicit infrastructure story, not a footnote)

### Epic 2: Movie Discovery (Home, Browse & Search)
Users can browse movies by genre, see a hero banner, and search — the core content experience. Includes all shared movie display components (MovieCard, HeroBanner, MovieRow), API routes for movies/genres, home page, and search page.
**FRs covered:** FR-2.1, FR-2.2, FR-2.3, FR-2.4, FR-3.1, FR-3.2, FR-3.3
**Story notes:** Includes seed script story (populate DB with test movies for dev). Includes admin API smoke-test story: `POST /api/admin/movies` → verify ISR revalidation → movie appears on `/home` (validates full write/cache cycle without Admin UI).

### Epic 3: Movie Detail & Video Player
Users can view full movie info and watch a film — the core action the whole app drives toward. Includes movie detail page, YouTubePlayer component, video player page, and progress-save API.
**FRs covered:** FR-4.1, FR-4.2, FR-4.3, FR-4.5, FR-5.1, FR-5.2, FR-5.3
**Note:** FR-4.4 (watchlist button) is stubbed on the detail page and wired in Epic 4 Story 4.1.

### Epic 4: User Personalization (Watchlist & History)
Users can save movies, track viewing history, and resume where they left off. Wires up watchlist toggle everywhere and delivers history + continue-watching features.
**FRs covered:** FR-4.4, FR-6.1, FR-6.2, FR-6.3, FR-7.1, FR-7.2
**Story notes:** Story 4.1 = wire watchlist API + WatchlistButton component (enables FR-4.4 on Movie Detail first thing in this epic).

### Epic 5: Admin Panel
Admin users can manage the movie catalog — content creation pipeline. Full CRUD UI for movies with role-gated access.
**FRs covered:** FR-8.1, FR-8.2, FR-8.3, FR-8.4, FR-8.5

---

## Epic 1: Foundation & Authentication

Users can register, log in, and access a protected app — the skeleton everything else builds on. Includes Vercel project setup, Supabase schema, Clerk configuration, design token system, global layout, and all auth pages.

### Story 1.1: Project Setup & Infrastructure

As a developer,
I want the project scaffolded with Vercel, Supabase, and Clerk configured,
So that all subsequent stories have a working foundation to build on.

**Acceptance Criteria:**

**Given** a fresh repo with Next.js 16.4 App Router
**When** the setup story is complete
**Then** Next.js project chạy được trên local (`npm run dev`)
**And** Supabase project tạo xong, schema gồm: `movies`, `genres`, `movie_genres`, `watch_history`, `watchlist`; RLS enable trên `watch_history` và `watchlist`
**And** Clerk JWT template "supabase" configured; env vars `NEXT_PUBLIC_CLERK_*`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` set trong `.env.local` và Vercel project
**And** cấu trúc thư mục: `src/app/`, `src/components/`, `src/lib/`, `src/types/` theo Architecture spine
**And** `lib/supabase/client.ts` (Clerk JWT) và `lib/supabase/admin.ts` (service role) tạo xong
**And** `types/index.ts` định nghĩa `Movie`, `MovieSummary`, `Genre` types
**And** Vercel project linked, deploy preview hoạt động
**And** testing strategy quyết định và ghi vào ARCHITECTURE-SPINE.md (AR-13)

### Story 1.2: Design Token System & Global Layout

As a user,
I want to see a consistent dark-themed interface with proper navigation,
So that the app feels polished and navigable from the first page I land on.

**Acceptance Criteria:**

**Given** the Next.js project is set up (Story 1.1 complete)
**When** I visit any page
**Then** the background is #0a0a0a, surface #141414, text-primary #f5f5f5 (contrast ≥7:1)
**And** the Inter font loads correctly at all defined scales (xs → 4xl)
**And** the color token system is defined in Tailwind CSS theme config
**And** semantic HTML structure present: `<html>`, `<body>`, `<main>`, `<header>`, `<nav>`

**Given** I'm an authenticated user on desktop
**When** I view the sticky header
**Then** logo is left-aligned, search bar in center, avatar/menu on right
**And** nav links visible: Home · Danh sách của tôi · Lịch sử

**Given** I'm an authenticated user on mobile (<768px)
**When** I view the app
**Then** bottom tab bar shows: Home · Tìm kiếm · Danh sách · Tài khoản

**Given** a page is loading
**When** content hasn't arrived yet
**Then** skeleton shimmer animation plays at 1.5s loop (not a spinner)
**And** prefers-reduced-motion: skeleton dùng opacity pulse thay vì transform

**Given** any interactive element
**When** it receives keyboard focus
**Then** `ring-2 ring-primary` focus indicator is visible (không `outline: none` không có thay thế)

### Story 1.3: Authentication Pages & Route Protection

As a visitor,
I want to sign up or log in via email, Google, or GitHub,
So that I can access protected movie content.

**Acceptance Criteria:**

**Given** I'm not logged in
**When** I visit a protected route (e.g. /home, /watch/[id])
**Then** middleware redirects me to `/sign-in?redirect_url=...`
**And** after successful login I'm redirected back to the original page

**Given** I'm on the sign-up page
**When** I register with email, Google, or GitHub via Clerk
**Then** my account is created and I'm redirected to /home

**Given** I'm logged in
**When** I click logout
**Then** Clerk session is cleared and I'm redirected to /sign-in

**Given** I'm logged in
**When** I visit /profile
**Then** I see my name and avatar (from Clerk user object)
**And** the page uses semantic HTML `<main>` with accessible heading

**Given** I'm not logged in and attempt to access /admin
**When** the middleware checks my role
**Then** I'm redirected to /sign-in (role check handled by middleware, no DB query)

---

## Epic 2: Movie Discovery (Home, Browse & Search)

Users can browse movies by genre, see a hero banner, and search — the core content experience. Includes all shared movie display components (MovieCard, HeroBanner, MovieRow), API routes for movies/genres, home page, and search page.

### Story 2.1: Supabase Seed & Movie API Routes

As a developer,
I want sample movies in the database and working API routes,
So that UI stories have real data to render.

**Acceptance Criteria:**

**Given** the Supabase schema is set up (Story 1.1)
**When** the seed script runs
**Then** ≥10 movies with genres, poster URLs, trailer URLs, and video URLs are in the DB

**Given** GET /api/movies
**When** called without auth
**Then** returns `{ data: MovieSummary[] }` with HTTP 200
**And** response shape matches MovieSummary type (genres: string[])
**And** uses ISR revalidate=60

**Given** GET /api/movies?q=\<term\>
**When** called
**Then** returns `{ data: MovieSummary[] }` filtered by title (case-insensitive)
**And** uses no-store cache directive

**Given** GET /api/genres
**When** called
**Then** returns `{ data: Genre[] }` with HTTP 200

**Given** POST /api/admin/movies (with valid admin JWT)
**When** a new movie is added
**Then** `revalidateTag('movies')` is triggered and calling GET /api/movies reflects the new movie within next request
**And** returns `{ error: "Unauthorized" }` HTTP 401 if called without admin role

### Story 2.2: MovieCard & MovieRow Components

As a user,
I want to see movie cards with hover previews arranged in horizontal rows,
So that I can quickly browse content.

**Acceptance Criteria:**

**Given** a MovieCard is rendered
**When** displayed normally
**Then** shows poster image (next/image, aspect 2:3, rounded-lg)
**And** shows skeleton loading state before image loads
**And** movie card is an `<a>` tag (not `<div onClick>`), alt="[Tên phim] poster"

**Given** a MovieCard on desktop
**When** I hover over it
**Then** card scales to 1.04 with ring-2 ring-primary/60 (150ms ease-out)
**And** bottom-up overlay gradient appears showing: tên phim, rating, badge genre
**And** bookmark icon appears in top-right corner

**Given** a MovieCard is in the user's watchlist
**When** displayed (even without hover)
**Then** bookmark icon shows filled amber state

**Given** a MovieRow is rendered
**When** displayed on desktop
**Then** shows row label (text-lg semibold text-primary) + "Xem thêm" arrow
**And** 5–6 cards visible, horizontal scroll no-wrap
**And** load-more triggers when scroll reaches 200px from end

**Given** a MovieRow on mobile
**When** I scroll horizontally
**Then** natural horizontal scroll works (no pagination dots)
**And** 2 cards visible per row

### Story 2.3: Home Page — Hero Banner & Genre Rows

As an authenticated user,
I want to see a hero banner and genre rows on the home page,
So that I can discover movies to watch.

**Acceptance Criteria:**

**Given** I'm logged in and visit /home
**When** the page loads
**Then** HeroBanner shows 1 featured film: full-width 60–70vh desktop / 50vh mobile
**And** full-bleed backdrop with hero-overlay gradient
**And** content left-aligned max-width 600px: title 4xl bold desktop / 2xl mobile
**And** two buttons: "Xem ngay" (button-primary + Play icon) and "Thêm vào danh sách"

**Given** the home page loads
**When** genre rows render
**Then** MovieRows grouped by genre appear below the banner
**And** "Tiếp tục xem" row absent (wired in Epic 4)
**And** page uses ISR revalidate=60

**Given** the home page data fails to load
**When** an error occurs
**Then** destructive toast + "Thử lại" button shown
**And** skeleton cards shown while loading

**Given** I'm on the home page on desktop
**When** I view the grid
**Then** max content width 1400px, page padding clamp(1rem, 4vw, 4rem), card gap 0.75rem, row gap 2rem

### Story 2.4: Global Search (Header Bar & Search Results Page)

As a user,
I want to search for movies from any page and see results,
So that I can quickly find a specific film.

**Acceptance Criteria:**

**Given** I'm on any page (desktop)
**When** I focus the search bar in the header
**Then** it expands from 200px to 400px (200ms ease-out)
**And** as I type (debounce 300ms), a dropdown shows ≤6 matching movies
**And** clicking outside or pressing Escape closes the dropdown

**Given** I type a search term and press Enter (or click "Xem tất cả")
**When** navigating to /search?q=\<term\>
**Then** results page shows a grid of matching movies using no-store cache
**And** shows "Chưa có phim nào. Hãy khám phá thêm →" when no results

**Given** I'm on mobile
**When** I tap the search tab in the bottom bar
**Then** I'm taken to a dedicated search tab/page

**Given** the search API returns an error
**When** results fail
**Then** "Không tải được. Thử lại." error message shown

---

## Epic 3: Movie Detail & Video Player

Users can view full movie info and watch a film — the core action the whole app drives toward. Includes movie detail page, YouTubePlayer component, video player page, and progress-save API.

### Story 3.1: Movie Detail Page

As an authenticated user,
I want to view full movie information including trailer and related films,
So that I can decide whether to watch it.

**Acceptance Criteria:**

**Given** I'm logged in and navigate to /movie/[id]
**When** the page loads
**Then** I see: tiêu đề, mô tả, năm phát hành, thể loại, diễn viên, đạo diễn, rating
**And** YouTube trailer embedded below the info section
**And** "Xem phim" button (navigates to /watch/[id])
**And** watchlist button (stubbed — UI present, not wired to API yet; wired in Epic 4)
**And** "Phim tương tự" section shows ≥3 movies of the same genre at the bottom
**And** page uses ISR revalidate=60

**Given** /movie/[id] where id does not exist
**When** the page loads
**Then** Next.js notFound() is called, rendering the 404 page

**Given** the page is loading
**When** data hasn't arrived
**Then** skeleton layout shown for all sections (poster, metadata, similar films)

**Given** I'm on mobile
**When** I view the detail page
**Then** layout is single-column, title 2xl, all content readable

### Story 3.2: YouTubePlayer Component & Video Player Page

As an authenticated user,
I want to watch a movie in a fullscreen player with minimal controls,
So that I have an immersive viewing experience.

**Acceptance Criteria:**

**Given** I navigate to /watch/[id]
**When** the page loads
**Then** YouTubePlayer component renders using YouTube IFrame API JS SDK
**And** video starts from the last saved progress timestamp (0 if none)
**And** page is fullscreen default with dark background #0a0a0a

**Given** the video is playing
**When** I move the mouse or tap the screen
**Then** overlay controls appear: back ← button, film title, fullscreen toggle
**And** controls auto-hide after 3s of inactivity

**Given** /watch/[id] where video URL is a YouTube URL
**When** rendered
**Then** YouTubePlayer (`components/player/YouTubePlayer`) handles it — no raw iframe, no react-player

**Given** I press the back ← button
**When** on any device
**Then** I'm navigated back to /movie/[id]

**Given** prefers-reduced-motion is enabled
**When** animations play
**Then** transform/transition animations are disabled

### Story 3.3: Watch Progress Save API

As an authenticated user,
I want my viewing progress saved automatically,
So that I can resume where I left off.

**Acceptance Criteria:**

**Given** I'm watching a video at /watch/[id]
**When** 30 seconds pass
**Then** POST /api/history/[id]/progress is called with `{ progress_seconds: N }`
**And** the request includes my Clerk JWT for auth

**Given** POST /api/history/[id]/progress
**When** called with valid auth
**Then** upserts into watch_history using ON CONFLICT (user_id, movie_id) DO UPDATE SET progress_seconds, updated_at
**And** returns `{ data: { progress_seconds: N } }` HTTP 200

**Given** POST /api/history/[id]/progress
**When** called without auth
**Then** returns `{ error: "Unauthorized" }` HTTP 401

**Given** GET /api/movies/[id]
**When** called
**Then** response includes last saved progress_seconds for the current user (0 if none)
**And** the YouTubePlayer seeks to that timestamp on load

---

## Epic 4: User Personalization (Watchlist & History)

Users can save movies, track viewing history, and resume where they left off. Wires up watchlist toggle everywhere and delivers history + continue-watching features.

### Story 4.1: Watchlist API & WatchlistButton Component

As an authenticated user,
I want to add or remove movies from my watchlist from any page,
So that I can save films I plan to watch.

**Acceptance Criteria:**

**Given** I'm logged in and view any MovieCard or the Movie Detail page
**When** I click the watchlist (bookmark) button
**Then** POST /api/watchlist/[id] toggles the movie in/out of my watchlist
**And** uses useState + native fetch with optimistic update + rollback on error (no state library)
**And** WatchlistButton is wired on: MovieCard, HeroBanner, Movie Detail page

**Given** I add a movie to my watchlist
**When** the API call succeeds
**Then** bookmark icon fills amber + toast "Đã thêm vào danh sách" shown for 2s (slide-up+fade 200ms)

**Given** I remove a movie from my watchlist
**When** the API call succeeds
**Then** bookmark icon returns to outline + toast "Đã xóa" shown for 2s

**Given** the API call fails
**When** an error occurs
**Then** optimistic UI rolls back to previous state
**And** "Không tải được. Thử lại." toast shown

**Given** GET /api/watchlist
**When** called with valid auth
**Then** returns `{ data: MovieSummary[] }` of my saved movies, force-dynamic

**Given** POST /api/watchlist/[id]
**When** called without auth
**Then** returns `{ error: "Unauthorized" }` HTTP 401

### Story 4.2: "Tiếp tục xem" Row on Home & Progress Bar on Card

As an authenticated user,
I want to see movies I've started watching on the home page with a progress indicator,
So that I can easily resume where I left off.

**Acceptance Criteria:**

**Given** I'm logged in and have partially watched movies
**When** I visit /home
**Then** a "Tiếp tục xem" row appears above the genre rows
**And** each card in the row shows a small progress bar below the poster indicating % watched

**Given** I click a card in the "Tiếp tục xem" row
**When** navigating to /watch/[id]
**Then** video seeks to the saved progress_seconds timestamp

**Given** GET /api/history
**When** called with valid auth
**Then** returns `{ data: Array<MovieSummary & { progress_seconds: number }> }` sorted by updated_at desc
**And** uses force-dynamic cache directive

**Given** I have no watch history
**When** I visit /home
**Then** "Tiếp tục xem" row is not rendered

### Story 4.3: Watch History Page

As an authenticated user,
I want to view and manage my full watch history,
So that I can see what I've watched and remove entries I don't want.

**Acceptance Criteria:**

**Given** I'm logged in and navigate to /history
**When** the page loads
**Then** all watched movies are listed, sorted by updated_at descending
**And** each entry shows: poster thumbnail, title, progress bar, last watched date
**And** page is force-dynamic (always fresh)

**Given** I click "Xóa" on a history entry
**When** the delete API call succeeds
**Then** the entry is removed from the list immediately (optimistic update)
**And** DELETE /api/history/[id] removes the record from watch_history

**Given** DELETE /api/history/[id]
**When** called without auth
**Then** returns `{ error: "Unauthorized" }` HTTP 401

**Given** I have no watch history
**When** I visit /history
**Then** "Chưa có phim nào. Hãy khám phá thêm →" empty state shown

### Story 4.4: My List Page (/my-list)

As an authenticated user,
I want to view all movies I've saved to my watchlist in one place,
So that I can find films I planned to watch.

**Acceptance Criteria:**

**Given** I'm logged in and navigate to /my-list
**When** the page loads
**Then** all saved movies are displayed in a responsive grid (5–6 cols desktop, 4 tablet, 2 mobile)
**And** WatchlistButton is active on each card (removing a movie updates the list immediately)
**And** page is force-dynamic

**Given** I have no saved movies
**When** I visit /my-list
**Then** "Chưa có phim nào. Hãy khám phá thêm →" empty state shown with link to /home

**Given** I remove a movie from my list
**When** the WatchlistButton is clicked
**Then** the card disappears from the grid immediately (optimistic update)
**And** toast "Đã xóa" shown for 2s

---

## Epic 5: Admin Panel

Admin users can manage the movie catalog — content creation pipeline. Full CRUD UI for movies with role-gated access.

### Story 5.1: Admin Layout & Role Gate

As an admin user,
I want a dedicated admin area that only I can access,
So that the movie catalog is protected from unauthorized changes.

**Acceptance Criteria:**

**Given** I'm logged in with `publicMetadata.role === 'admin'`
**When** I navigate to /admin
**Then** I see the admin left sidebar layout (separate from viewer layout)
**And** sidebar links: Quản lý phim

**Given** I'm logged in but NOT an admin
**When** I navigate to /admin
**Then** middleware returns HTTP 403 and renders "Bạn không có quyền truy cập" page
**And** a "Về trang chủ" button is shown

**Given** I'm not logged in
**When** I navigate to /admin
**Then** middleware redirects to /sign-in?redirect_url=/admin

**Given** I'm on mobile and access /admin
**When** the page loads
**Then** "Trang quản trị chỉ khả dụng trên desktop." message is shown (no responsive admin UI)

**Given** the role check in middleware
**When** evaluating access to /admin
**Then** only `publicMetadata.role === 'admin'` is checked — no DB query performed

### Story 5.2: Admin Movie Table (List + Search)

As an admin user,
I want to see all movies in a table with inline search,
So that I can find and manage any movie quickly.

**Acceptance Criteria:**

**Given** I'm an admin on /admin/movies
**When** the page loads
**Then** AdminTable renders with columns: poster thumbnail, tên, thể loại, năm, actions (Sửa / Xóa)
**And** background surface (#141414), striped rows

**Given** the table is loaded
**When** I type in the search filter
**Then** table filters movies by name client-side (no new API call)
**And** results update instantly

**Given** the movie list loads
**When** called via GET /api/admin/movies (service role)
**Then** returns all movies — not filtered by user
**And** uses SUPABASE_SERVICE_ROLE_KEY only in `lib/supabase/admin.ts`

**Given** the page loads
**When** there are no movies
**Then** "Chưa có phim nào" empty state shown with "Thêm phim mới" CTA button

### Story 5.3: Add & Edit Movie Form

As an admin user,
I want to add new movies and edit existing ones via a form,
So that I can manage the movie catalog.

**Acceptance Criteria:**

**Given** I'm an admin and click "Thêm phim mới"
**When** the form page /admin/movies/new loads
**Then** a form appears with fields: tiêu đề, mô tả, poster URL, trailer URL, video URL, thể loại (multi-select), năm, cast, đạo diễn, rating

**Given** I fill in all required fields and submit
**When** POST /api/admin/movies is called
**Then** the movie is saved to Supabase via service role client
**And** `revalidateTag('movies')` is triggered
**And** I'm redirected to /admin/movies with the new movie in the table

**Given** I click "Sửa" on an existing movie
**When** the form page /admin/movies/[id]/edit loads
**Then** the form is pre-populated with the movie's current data

**Given** I update fields and submit the edit form
**When** PATCH /api/admin/movies/[id] is called
**Then** the movie is updated in Supabase
**And** `revalidateTag('movies')` is triggered
**And** I'm redirected back to /admin/movies

**Given** any admin API route (/api/admin/*)
**When** called without admin role
**Then** returns `{ error: "Unauthorized" }` HTTP 403

### Story 5.4: Delete Movie

As an admin user,
I want to delete a movie with a confirmation step,
So that I don't accidentally remove content.

**Acceptance Criteria:**

**Given** I'm an admin and click "Xóa" on a movie in the table
**When** the delete button is clicked
**Then** a confirmation dialog appears: "Bạn có chắc muốn xóa [tên phim]?"
**And** dialog has "Hủy" and "Xóa" buttons

**Given** I confirm the deletion
**When** DELETE /api/admin/movies/[id] is called
**Then** the movie is removed from Supabase
**And** `revalidateTag('movies')` is triggered
**And** the movie disappears from the admin table immediately (optimistic update)

**Given** I click "Hủy" in the confirmation dialog
**When** the dialog closes
**Then** no deletion occurs and the table remains unchanged

**Given** DELETE /api/admin/movies/[id]
**When** called without admin role
**Then** returns `{ error: "Unauthorized" }` HTTP 403
