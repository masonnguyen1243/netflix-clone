---
title: 'Story 2.4: Global Search (Header Bar & Search Results Page)'
type: 'feature'
created: '2026-10-19'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '4871f6973acf82066cdc54344aa07f9320497b5a'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Người dùng không thể tìm kiếm phim — Header có input bị `disabled`, BottomNav trỏ tới `/search` nhưng route chỉ có `.gitkeep`, chưa có `SearchBar` component, chưa có trang kết quả tìm kiếm.

**Approach:** Tạo `SearchBar` Client Component (thay thế input disabled trong Header) với dropdown realtime ≤6 kết quả và debounce 300ms; tạo trang `/search` Client Component hiển thị kết quả đầy đủ; API và data layer (`GET /api/movies?q=`, `getMoviesByQuery`) đã có sẵn, không thay đổi.

## Boundaries & Constraints

**Always:**
- 300ms debounce qua custom hook `useDebounce` — không thêm package mới
- Dropdown chỉ hiện khi `query.length > 0` và có kết quả; tối đa 6 items
- Enter hoặc "Xem tất cả" trong dropdown → `router.push('/search?q=<query>')`
- Search page fetch `GET /api/movies?q=` client-side; URL đồng bộ qua `router.replace(..., { scroll: false })`
- Focus ring `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none` trên mọi element tương tác
- Tất cả CSS dùng Tailwind design tokens từ `globals.css` — không hardcode hex
- `motion-safe:` prefix cho transition/transform; reduced motion fallback

**Never:**
- Không thêm dependency vào `package.json`
- Không sửa `src/app/api/movies/route.ts` hay `src/lib/movieData.ts`
- Không thêm pagination vào trang search results
- Không wire watchlist bookmark trên search results (Epic 4 Story 4.1)

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tìm kiếm thành công (desktop) | User gõ ≥1 ký tự | Dropdown ≤6 kết quả sau 300ms debounce | — |
| Query không khớp (dropdown) | 0 kết quả trả về | Dropdown đóng | — |
| Điều hướng sang trang search | Enter / click "Xem tất cả" | Navigate `/search?q=<query>` | — |
| Trang search tải có ?q= | URL param `q` có giá trị | Kết quả hiện ngay, input pre-filled | — |
| Trang search không có query | q="" hoặc không có param | "Nhập tên phim để tìm kiếm" (centered) | — |
| Trang search không có kết quả | Query hợp lệ, 0 kết quả, không loading | "Chưa có phim nào. Hãy khám phá thêm →" | — |
| API thất bại | fetch throws | — | "Không tải được. Thử lại." + button retry |
| Đóng dropdown | Click ngoài / Escape | Dropdown đóng; query giữ nguyên trong input | — |

</frozen-after-approval>

## Code Map

- `src/components/layout/Header.tsx` — có disabled `<input>` trong `<div className="flex-1 flex justify-center px-4">`; REPLACE bằng `<SearchBar />`
- `src/components/layout/BottomNav.tsx` — đã có tab `{ label: "Tìm kiếm", href: "/search" }`; KHÔNG SỬA
- `src/app/(viewer)/search/.gitkeep` — XÓA khi tạo `page.tsx`
- `src/app/api/movies/route.ts` — GET `?q=` đã implement với `getMoviesByQuery`; KHÔNG SỬA
- `src/lib/movieData.ts` — `getMoviesByQuery(q: string): Promise<MovieSummary[]>` ilike filter; KHÔNG SỬA
- `src/types/index.ts` — `MovieSummary { id, title, poster_url, year, rating, genres: string[] }`; KHÔNG SỬA
- `src/components/movie/MovieCard.tsx` — REUSE trong search results grid
- `src/components/movie/MovieCardSkeleton.tsx` — REUSE trong loading skeleton
- `src/app/globals.css` — tokens: `background`, `surface`, `surface-elevated`, `border`, `primary`, `foreground`, `muted-foreground`

## Tasks & Acceptance

**Execution:**
- [x] `src/hooks/useDebounce.ts` — Tạo mới: `export function useDebounce<T>(value: T, delay: number): T`; dùng `useState` + `useEffect` với `setTimeout` / `clearTimeout` cleanup; trả `debouncedValue`
- [x] `src/components/layout/SearchBar.tsx` — Tạo mới Client Component: state `query`, `results: MovieSummary[]`, `isOpen: boolean`, `isLoading: boolean`; `debouncedQuery = useDebounce(query, 300)`; effect fetch `/api/movies?q=${debouncedQuery}` khi non-empty → set `results.slice(0,6)`, `isOpen = results.length > 0`; click-outside: `containerRef` + `document.addEventListener("mousedown", ...)` trong useEffect cleanup; Escape: `onKeyDown` đóng dropdown; Enter: `router.push('/search?q=${encodeURIComponent(query)}')`; wrapper: `<div ref={containerRef} className="relative hidden md:flex flex-1 justify-center px-4">`; input: `className="w-[200px] motion-safe:focus:w-[400px] motion-safe:transition-[width] motion-safe:duration-200 ease-out bg-surface border border-border rounded-full px-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"` `role="combobox"` `aria-label="Tìm kiếm phim"` `aria-expanded={isOpen}` `aria-controls="search-dropdown"`; dropdown: `role="listbox"` `id="search-dropdown"` `className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[400px] bg-surface-elevated border border-border rounded-lg shadow-lg z-50 overflow-hidden"`; mỗi item `<a role="option">` flex gap-3 thumbnail (32×48 `next/image`) + title + year; dòng cuối `<a href="/search?q=...">Xem tất cả</a>` text-primary centered
- [x] `src/components/layout/Header.tsx` — Sửa: import `SearchBar`; thay thế toàn bộ block `<div className="flex-1 flex justify-center px-4">...<input disabled .../></div>` bằng `<SearchBar />`
- [x] `src/app/(viewer)/search/page.tsx` — Tạo mới Client Component: `useSearchParams()` init `query`; `useRouter()` cho sync; `debouncedQuery = useDebounce(query, 300)`; effect: empty → clear results; non-empty → fetch `/api/movies?q=...`, set results / error; sync URL `router.replace(...)` khi query thay đổi; layout `<div className="flex flex-col gap-6 py-6">`; search input full-width (không debounce riêng, dùng cùng state); kết quả grid `grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3`; mỗi item `<MovieCard movie={m} />`; loading → 6× `<MovieCardSkeleton />`; empty query → `<p className="text-muted-foreground text-center py-16">Nhập tên phim để tìm kiếm</p>`; no-results → `<p>Chưa có phim nào. Hãy khám phá thêm →</p>`; error → `<p>Không tải được. Thử lại.</p>` + `<button onClick={() => setRetry(r => r+1)}`
- [x] `src/app/(viewer)/search/loading.tsx` — Tạo mới: skeleton input bar + grid 6× `<MovieCardSkeleton />`; `animate-pulse motion-reduce:animate-none`
- [x] `src/hooks/useDebounce.test.ts` — Test: value thay đổi không trả ngay; sau delay trả debouncedValue; cleanup khi unmount; dùng `vi.useFakeTimers()`
- [x] `src/components/layout/SearchBar.test.tsx` — Test: không hiện dropdown khi chưa gõ; mock fetch trả 3 movies → dropdown hiện 3 items + "Xem tất cả"; Escape → dropdown đóng; click outside → dropdown đóng; Enter → `router.push` đúng URL; mock `next/navigation` useRouter
- [x] `src/app/(viewer)/search/page.test.tsx` — Test: render với `?q=term` → fetch gọi với term; kết quả hiện MovieCard; empty state khi no query; no-results state; error state; mock `useSearchParams`, `useRouter`, `global.fetch`

**Acceptance Criteria:**
- Given user desktop focus vào search input, when focused, then input mở rộng 200px → 400px với 200ms ease-out (motion-safe)
- Given user gõ ≥1 ký tự, when 300ms debounce qua, then dropdown hiện ≤6 kết quả + link "Xem tất cả"
- Given dropdown đang mở, when nhấn Escape hoặc click ra ngoài, then dropdown đóng
- Given dropdown đang mở, when nhấn Enter hoặc click "Xem tất cả", then navigate `/search?q=<query>`
- Given user truy cập `/search?q=phim`, when trang tải, then input pre-filled và kết quả hiển thị
- Given user gõ trong input trên /search page, when 300ms qua, then grid cập nhật và URL đồng bộ
- Given query không có kết quả, when fetch xong, then "Chưa có phim nào. Hãy khám phá thêm →"
- Given query rỗng khi vào /search, when render, then "Nhập tên phim để tìm kiếm"
- Given API thất bại, when fetch throws, then "Không tải được. Thử lại." + button retry

## Implementation Notes

## Review Triage Log

| # | Finding | Verdict | Route | Evidence |
|---|---------|---------|-------|----------|
| 1 | `<li role="option"><a>` — `role="option"` on wrapper `<li>` instead of on `<a>` | medium | patch | Spec task says `<a role="option">` directly. Screen readers expose both list-item and link roles for the same node. Fix: remove `<li>` wrapper, add `role="option"` directly to `<a>`. |
| 2 | No ArrowDown/ArrowUp or `aria-activedescendant` on combobox | false | — | Spec only specifies Escape (close) and Enter (navigate). Arrow-key navigation is not required by intent. |
| 3 | `isLoading` has no visual indicator inside dropdown | false | — | Spec does not mention a loading state for the dropdown. Dropdown stays hidden until results arrive — acceptable per spec. |
| 4 | Search page input shares same `aria-label="Tìm kiếm phim"` as header SearchBar | low | patch | Both inputs visible simultaneously on `/search` page. Screen readers encounter two identically-labeled inputs. Fix: give page input a distinct aria-label. Trivial, no new surface. |
| 5 | URL-sync effect fires on mount wiping `?q=` URL for 300ms | false | — | `useDebounce` initializes state with the passed value, so initial `debouncedQuery` equals initial `query`. No wipe occurs; `router.replace` is called with the same URL that's already in the address bar. |
| 6 | `global.fetch` not restored in `afterEach` in `SearchBar.test.tsx` | low | patch | `vi.clearAllMocks()` clears call history but not the `global.fetch` assignment itself. Stale mock could leak if test order changes. Fix: save and restore `global.fetch` in `afterEach`. Trivial. |
| 7 | "Xem tất cả" href uses non-debounced `query` while results reflect `debouncedQuery` | false | — | Spec says navigate to `/search?q=<query>` (the current input). Using current `query` (not debounced) is correct and matches the spec's intent. |
| 8 | `SearchBar` fetch-error catch path has no test (verification-gap) | low | patch | No test in `SearchBar.test.tsx` uses `mockRejectedValue`. Catch block is uncovered. Fix: add one test that rejects fetch and asserts dropdown stays closed. |
| 9 | `SearchBar` fetch non-ok status not checked before `.json()` | false | — | If server returns 500 with HTML body, `res.json()` rejects and `.catch()` already handles it silently (dropdown closes). Spec does not require error handling in the SearchBar dropdown. |
| 10 | Race condition: stale fetch overwrites newer results in `page.tsx` | low | reject | `doFetch` uses a `cancelled` flag pattern via `useCallback`. Debounce already serializes calls. Race is theoretically possible but negligible in practice. Fix would add AbortController complexity beyond "trivial direct correction". |
| 11 | "Chưa có phim nào" flashes 300ms when user clears input | low | patch | When user clears input, `trimmedQuery=""` but `trimmedDebounced` holds old value 300ms. If old query returned 0 results, no-results message shows briefly. Fix: guard empty-state on `!trimmedQuery` alone. Trivial change. |
| 12 | Spurious `router.replace` on every mount | low | reject | Replace is called with identical URL on mount — no history mutation, no behavioral harm. Fix adds `window.location` comparison complexity beyond trivial. |
| 13 | ARIA `role="option"` on `<li>` not `<a>` (edge-case hunter claim) | medium | patch | Same root cause as finding 1 — grouped. |
| 14 | "Xem tất cả" uses plain `<a href>` not `router.push`; dropdown not closed on click | medium | patch | Spec Boundaries says "Xem tất cả" → `router.push`. Plain `<a>` works for navigation but doesn't close the dropdown. Fix: replace with `<button onClick>` that calls `router.push(searchUrl)` and `setIsOpen(false)`. Trivial, no new public surface. |
| 15 | `movie.poster_url` empty string handling in SearchBar thumbnail | low | defer | Pre-existing concern applicable to all movie components (MovieCard, HeroBanner). Not caused by this story. |
| 16 | `global.fetch` not restored (edge-case hunter) | low | patch | Same root cause as finding 6 — grouped. |

## Spec Change Log

## Design Notes

**SearchBar width transition:** Input mở rộng `w-[200px] → focus:w-[400px]` với `motion-safe:transition-[width]` trên input element. Component ẩn hoàn toàn trên mobile (`hidden md:flex`) — search tab BottomNav trỏ tới `/search` page là entry point trên mobile.

**Click-outside pattern:** `useRef` container + `document.addEventListener("mousedown", handler)` trong useEffect cleanup — không dùng thư viện external. Handler kiểm tra `!containerRef.current?.contains(event.target as Node)`.

**URL sync trên search page:** `router.replace(url, { scroll: false })` tránh push history entry mới mỗi keystroke; Back button vẫn hoạt động bình thường sau khi navigate từ dropdown.

**Dropdown thumbnail:** `next/image` với `width=32 height=48` (aspect 2:3 mini); `alt={title}`; cùng `remotePatterns` wildcard hostname trong `next.config.ts`.

**useSearchParams và Suspense:** Next.js App Router yêu cầu Client Component dùng `useSearchParams()` được bọc trong `<Suspense>`. `loading.tsx` của route phục vụ vai trò này — không cần thêm `<Suspense>` thủ công trong page.

## Verification

**Commands:**
- `npm run type-check` — expected: 0 TypeScript errors
- `npm run lint` — expected: 0 lint errors
- `npm test -- --testPathPattern="SearchBar|search|useDebounce"` — expected: tất cả tests pass
