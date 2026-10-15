---
title: 'Story 2.2: MovieCard & MovieRow Components'
type: 'feature'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'f256795aef7c9bf54e1c28b529c5557881cc953e'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Giao diện Epic 2 thiếu các component hiển thị phim — `MovieCard` và `MovieRow` — nên Story 2.3 (trang chủ) và các story sau không thể render catalog phim.

**Approach:** Tạo `MovieCard` (thẻ phim dạng link, hover animation, skeleton, bookmark icon tĩnh) và `MovieRow` (hàng ngang cuộn được, compose từ MovieCard, hỗ trợ loading state và load-more callback) cùng test tương ứng.

## Boundaries & Constraints

**Always:**
- `MovieCard` render là `<a href="/movie/{id}">`, không dùng `<div onClick>`
- Chỉ dùng Tailwind design tokens đã định nghĩa trong `globals.css` — không hardcode màu hex
- Tất cả ảnh dùng `next/image`; alt text `"[title] poster"`, backdrop alt `""`
- Focus ring: `ring-2 ring-primary focus-visible:outline-none` trên mọi element tương tác
- Reduced motion: dùng `motion-safe:` prefix cho transform/transition; skeleton dùng `motion-reduce:animate-none`
- Bookmark icon là UI tĩnh trong story này — không có onClick, không gọi API (Epic 4 Story 4.1 mới wire)
- Không import lucide-react hay thư viện icon nào — dùng inline SVG

**Never:**
- Không fetch API trong `MovieCard` hay `MovieRow` — nhận data qua props
- Không implement HeroBanner, SearchBar, hay trang chủ hoàn chỉnh (Story 2.3)
- Không thêm dependency mới vào `package.json`

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Render bình thường | `movie: MovieSummary` hợp lệ | `<a>` với ảnh, overlay title/rating/genre khi hover | — |
| Ảnh đang tải | `onLoad` chưa fire | Hiện skeleton shimmer (pulse) che toàn card | — |
| MovieRow loading | `isLoading: true` | Hiện 6 `MovieCardSkeleton` thay vì card thật | — |
| MovieRow rỗng | `movies: []`, `isLoading: false` | Không render gì (component tự ẩn) | — |
| Genres rỗng | `movie.genres: []` | Không hiện genre badge, vẫn hiện title và rating | — |
| Scroll gần cuối row | Sentinel trong viewport ±200px | Gọi `onLoadMore?.()` nếu được truyền | — |

</frozen-after-approval>

## Code Map

- `src/types/index.ts` — `MovieSummary { id, title, poster_url, year, rating, genres: string[] }` — KHÔNG sửa
- `src/app/globals.css` — Tailwind 4 `@theme`: `background`, `surface`, `border`, `primary`, `primary-hover`, `foreground`, `muted-foreground`, `muted` — dùng class tương ứng
- `src/components/movie/MovieCard.tsx` — Tạo mới (thay `.gitkeep`)
- `src/components/movie/MovieCardSkeleton.tsx` — Tạo mới
- `src/components/movie/MovieRow.tsx` — Tạo mới
- `src/components/movie/MovieCard.test.tsx` — Tạo mới
- `src/components/movie/MovieRow.test.tsx` — Tạo mới
- `src/components/movie/.gitkeep` — Xóa khi tạo file đầu tiên trong thư mục

## Tasks & Acceptance

**Execution:**
- [x] `src/app/globals.css` — Thêm custom utility `scrollbar-hide` (xem Design Notes) vào cuối file bằng `@utility scrollbar-hide { ... }`
- [x] `src/components/movie/MovieCardSkeleton.tsx` — Tạo skeleton: `div` aspect-[2/3], `rounded-lg`, `bg-surface animate-pulse motion-reduce:animate-none motion-reduce:opacity-50`; export named `MovieCardSkeleton`
- [x] `src/components/movie/MovieCard.tsx` — Tạo component: wrapper `<a href="/movie/{id}">` với `relative aspect-[2/3] rounded-lg overflow-hidden block group motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:hover:scale-[1.04] hover:ring-2 hover:ring-primary/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`; bên trong: `next/image` fill objectFit cover alt=`"${title} poster"` + state `imageLoaded`; nếu `!imageLoaded` render `MovieCardSkeleton` absolute inset-0; overlay bottom-up gradient `from-black/90 via-black/40 to-transparent` absolute inset-0 `opacity-0 group-hover:opacity-100 motion-safe:transition-opacity`; trong overlay: title `text-sm font-semibold text-foreground truncate`, rating `text-xs text-muted-foreground`, genre badge đầu tiên `text-xs bg-primary/20 text-primary rounded px-1`; bookmark SVG outline top-right `absolute top-2 right-2 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity text-foreground` (24×24, path outline bookmark); xóa `.gitkeep` khi tạo
- [x] `src/components/movie/MovieRow.tsx` — Tạo component: props `{ title: string; movies: MovieSummary[]; isLoading?: boolean; onLoadMore?: () => void }`; nếu `!isLoading && movies.length === 0` return null; render `<section>`: label `<h2>` `text-lg font-semibold text-primary` + inline "Xem thêm" arrow `›` `text-primary text-xl`; scroll container `flex gap-3 overflow-x-auto scrollbar-hide snap-x` với `flex-shrink-0` cho mỗi card, width mỗi card `w-[calc((100vw-2*clamp(1rem,4vw,4rem)-5*0.75rem)/6)] min-w-[120px] max-w-[180px]`; khi `isLoading` hiện 6 `MovieCardSkeleton` cùng class width; sentinel `div ref={sentinelRef}` cuối list; `useEffect` dùng `IntersectionObserver({ rootMargin: '0px 200px 0px 0px' })` trên sentinel, gọi `onLoadMore?.()` khi intersect; mobile 2 cards: class card thêm `sm:w-[calc((100vw-2*clamp(1rem,4vw,4rem)-1*0.75rem)/2)]` override với responsive
- [x] `src/components/movie/MovieCard.test.tsx` — Test: render link với href `/movie/{id}` đúng; image với alt `"Test Movie poster"`; genre badge hiện genres[0] khi genres không rỗng; không hiện badge khi genres rỗng; bookmark SVG có mặt trong DOM; skeleton hiện khi imageLoaded=false
- [x] `src/components/movie/MovieRow.test.tsx` — Test: render `<h2>` với title; render đúng số `MovieCard` khi không loading; render 6 `MovieCardSkeleton` khi `isLoading=true`; return null khi `movies=[]` và không loading; gọi `onLoadMore` khi IntersectionObserver trigger (mock observer)

**Acceptance Criteria:**
- Given `movies: MovieSummary[]` hợp lệ, when render `MovieRow`, then hiện đúng số card với tiêu đề hàng và arrow "Xem thêm"
- Given card đang hover, when pointer vào, then overlay gradient xuất hiện với title, rating, genre badge và bookmark icon (motion-safe)
- Given `isLoading: true`, when render `MovieRow`, then hiện 6 skeleton thay vì card thật
- Given `movies: []` và `isLoading: false`, when render `MovieRow`, then component không render ra DOM
- Given scroll đến 200px trước cuối `MovieRow`, when sentinel vào viewport, then `onLoadMore` được gọi

## Design Notes

**Card width responsive:** Mỗi card dùng `flex-shrink-0`. Width: mobile `w-[45vw]`, tablet `sm:w-[22vw]`, desktop `md:w-[160px]`. Container MovieRow dùng `flex overflow-x-auto gap-3 pb-2` — scroll tự nhiên không cần pagination.

**Scrollbar ẩn:** Thêm custom utility vào `src/app/globals.css` (Tailwind 4 `@layer utilities`):
```css
@utility scrollbar-hide {
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
```
Dùng class `scrollbar-hide` trên scroll container.

**Skeleton che ảnh:** `MovieCardSkeleton` absolute inset-0 bên trong card — xóa khi image `onLoad` fire. Không dùng spinner.

**Bookmark tĩnh:** Chỉ SVG outline, opacity-0 by default, hiện khi hover. Không có state, không có click handler. Epic 4 Story 4.1 sẽ thêm WatchlistButton thay thế.

**IntersectionObserver cleanup:** `useEffect` return cleanup function để `observer.disconnect()` khi unmount.

**Test mocking:** Theo pattern hiện tại trong `Header.test.tsx`: mock `next/image` trả về `<img>` thường; mock `next/link` trả về `<a>`; mock `window.IntersectionObserver` trong `beforeEach` của MovieRow test bằng `vi.stubGlobal('IntersectionObserver', ...)` với callback thủ công để kiểm tra `onLoadMore`.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| # | Finding | Verdict | Route | Evidence |
|---|---------|---------|-------|----------|
| 1 | `<a>` thay vì Next.js `<Link>` (Blind Hunter) | false | reject | Spec yêu cầu tường minh `<a href="/movie/{id}">` trong Boundaries & Constraints và Tasks. Đây là đặc tả có chủ ý. |
| 2 | `rating.toFixed(1)` throws nếu null/undefined (Blind Hunter, ECH) | false | reject | `MovieSummary.rating: number` không nullable; type-check 0 errors xác nhận. Runtime data integrity là trách nhiệm API layer. |
| 3 | Test visibility overlay opacity-0 misleading (Blind Hunter) | false | reject | `screen.getByText` kiểm tra sự có mặt trong DOM — đúng với mục đích test "renders title and rating". CSS opacity không ảnh hưởng DOM presence. |
| 4 | IntersectionObserver re-subscribe khi `onLoadMore` reference thay đổi (Blind Hunter, ECH) | defer | defer | Thực tế trong React — caller cần memoize với `useCallback`. Không gây bug, chỉ recreate observer. Là caller responsibility. |
| 5 | `onLoadMore` fire khi load đang in-flight (ECH #5, #6) | defer | defer | Spec không yêu cầu debounce; caller phải quản lý loading state. Ngoài scope story này. |
| 6 | `@utility scrollbar-hide` chỉ dùng Tailwind v4 (Blind Hunter) | false | reject | Project dùng Tailwind v4 — xác nhận qua `@theme` blocks hiện có trong globals.css. |
| 7 | `MovieRow` return null khi empty+not loading — user thấy gap (Blind Hunter) | false | reject | Hành vi đúng per spec: AC yêu cầu "component không render ra DOM" khi movies=[] và isLoading=false. |
| 8 | `bg-surface` không phải standard Tailwind class (Blind Hunter) | false | reject | `surface` là custom token trong `@theme` của globals.css; `bg-surface` là cú pháp Tailwind v4 hợp lệ. |
| 9 | Test `movies={[]}` với `isLoading=true` fragile (Blind Hunter) | false | reject | Test hiệu quả — nếu null-return được đặt trước skeleton render, test sẽ fail (container rỗng thay vì 6 skeletons). |
| 10 | Stale IO mock callback giữa các tests (Blind Hunter) | low | reject | `beforeEach` reset state trước mỗi test; stale state chỉ xảy ra nếu `beforeEach` tự fail — rất khó xảy ra trong thực tế. |
| 11 | Không có isolated tests cho `MovieCardSkeleton` (Blind Hunter) | false | reject | Spec Tasks không yêu cầu test file riêng cho Skeleton; được test gián tiếp qua MovieCard và MovieRow tests. |
| 12 | Rating `toFixed(1)` contract không detectabe bởi fixture (Verification Gap) | patch | patch | Pre-verified: fixture `8.5` render giống hệt với và không có `toFixed(1)`. Nếu xóa `toFixed(1)`, test vẫn pass. Thêm fixture `rating: 8.0` và assert `"8.0"`. |
| 13 | Skeleton dismissal sau image load không được test (Verification Gap, ECH) | patch | patch | Pre-verified: next/image mock drop `onLoad`, không bao giờ fire. Xóa `onLoad` handler → test vẫn pass. Cần test fire callback và check skeleton biến mất. |
| 14 | Image 404/error: `onLoad` không fire → skeleton tồn tại mãi (ECH) | patch | patch | Thực tế: poster bị lỗi → shimmer mãi, không có fallback. Fix: thêm `onError={() => setImageLoaded(true)}` vào `<Image>`. |
| 15 | `movie.id` null/empty → href `/movie/null` (ECH) | false | reject | `MovieSummary.id: string` không nullable; type-check pass; Supabase UUID đảm bảo non-empty. |
| 16 | "Xem thêm" text literal thiếu bên cạnh `›` (ECH) | false | reject | "Xem thêm" trong spec là nhãn mô tả cho ký tự `›` (tức arrow này có nghĩa là "xem thêm"), không phải text cần render. Implementation `›` đúng với UI Netflix-style. |

## Verification

**Commands:**
- `npm run type-check` — expected: 0 TypeScript errors
- `npm run lint` — expected: 0 lint errors
- `npm test -- --testPathPattern="movie"` — expected: tất cả tests pass
