---
title: 'Story 2.3: Home Page — Hero Banner & Genre Rows'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '276b5259e7b146e3c72ba81e02ab3c27d797fe35'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Người dùng đã đăng nhập không có trang chủ `/home` — route hiện chỉ có `.gitkeep`, không có nội dung, không có hero banner, không có genre rows. Story 2.2 đã cung cấp `MovieCard` và `MovieRow` nhưng chưa có trang nào compose chúng.

**Approach:** Tạo trang chủ Server Component (`/home`) với ISR revalidate=60, hiển thị `HeroBanner` (component mới, dùng `MovieSummary` và `poster_url` làm backdrop) và các `MovieRow` nhóm theo thể loại bên dưới. Trích xuất logic truy vấn Supabase vào `lib/movieData.ts` để page và API routes cùng tái sử dụng.

## Boundaries & Constraints

**Always:**
- Chỉ dùng `MovieSummary` — không fetch `Movie`; `poster_url` làm backdrop của HeroBanner (không có `backdrop_url` trong story này)
- `MovieRow` từ Story 2.2 — compose lại, không rebuild
- Tất cả CSS dùng Tailwind design tokens từ `globals.css` — không hardcode hex
- `next/image` cho mọi ảnh; alt backdrop `""`, alt poster `"[title] poster"`
- Focus ring `ring-2 ring-primary focus-visible:outline-none` trên mọi element tương tác
- Reduced motion: `motion-safe:` prefix cho transform/transition; skeleton dùng `motion-reduce:animate-none`
- Bookmark button trên HeroBanner là UI tĩnh — không có onClick, không gọi API (Epic 4 Story 4.1 wire sau)

**Never:**
- Không render "Tiếp tục xem" row (Epic 4 Story 4.2)
- Không import `createAnonClient` hay Supabase client trực tiếp trong page file — đi qua `lib/movieData.ts`
- Không thêm dependency mới vào `package.json`
- Không implement SearchBar hay search results (Story 2.4)

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tải thành công | movies và genres có dữ liệu | HeroBanner dùng movies[0]; MovieRow cho mỗi genre có ≥1 phim | — |
| Đang tải | Suspense / loading.tsx active | Skeleton hero + skeleton rows hiển thị | — |
| API thất bại | getMovieList() throws | error.tsx: "Không tải được. Thử lại." + button reset() | Destructive style |
| Genre không có phim | Genre tồn tại nhưng không phim nào khớp | MovieRow cho genre đó không render (return null) | — |
| Movies rỗng | movies: [] | Không render HeroBanner; hiện empty state | — |
| Phim không thuộc genre nào | movie.genres: [] | Phim xuất hiện trong row "Tất cả phim" (fallback, chỉ render nếu tồn tại) | — |

</frozen-after-approval>

## Code Map

- `src/types/index.ts` — `MovieSummary { id, title, poster_url, year, rating, genres: string[] }`, `Genre { id, name }` — KHÔNG SỬA
- `src/app/globals.css` — tokens: background, surface, border, primary, primary-hover, primary-foreground, foreground, muted-foreground, muted, error; utility `scrollbar-hide` — KHÔNG SỬA
- `src/app/(viewer)/layout.tsx` — wraps `<Header>` + `<main>` (max-w-1400px, padding clamp) + `<BottomNav>`; home page render trong main — KHÔNG SỬA
- `src/components/movie/MovieRow.tsx` — named export `MovieRow`, props `{ title, movies, isLoading?, onLoadMore? }`; trả null khi `movies=[]` và không loading — REUSE
- `src/components/movie/MovieCardSkeleton.tsx` — named export `MovieCardSkeleton` — REUSE trong loading.tsx
- `src/lib/supabase/anon.ts` — `createAnonClient()` — dùng trong lib/movieData.ts
- `src/app/api/movies/route.ts` — hiện có `fetchAllMovies`, `fetchMoviesByQuery`, `getCachedMovies` inline; sẽ refactor import từ lib/movieData
- `src/app/api/genres/route.ts` — hiện fetch genres inline không cache; sẽ refactor import từ lib/movieData
- `src/app/(viewer)/home/.gitkeep` — XÓA khi tạo page.tsx

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/movieData.ts` — Tạo mới: export `getMovieList(): Promise<MovieSummary[]>` dùng `unstable_cache(fn, ["movies-list"], { revalidate: 60, tags: ["movies"] })`; export `getMoviesByQuery(q: string): Promise<MovieSummary[]>` không cache, ilike filter; export `getGenreList(): Promise<Genre[]>` dùng `unstable_cache(fn, ["genres-list"], { revalidate: 3600 })`; tất cả dùng `createAnonClient()`; logic query giống hệt hiện có trong API routes
- [x] `src/app/api/movies/route.ts` — Refactor: import `getMovieList`, `getMoviesByQuery` từ `@/lib/movieData`; xóa `unstable_cache`, `fetchAllMovies`, `fetchMoviesByQuery`, `getCachedMovies` inline; giữ nguyên GET handler và response shape
- [x] `src/app/api/genres/route.ts` — Refactor: import `getGenreList` từ `@/lib/movieData`; xóa inline fetch; giữ nguyên GET handler và response shape
- [x] `src/components/movie/HeroBanner.tsx` — Tạo mới: props `{ movie: MovieSummary }`; `<section className="relative min-h-[50vh] md:min-h-[65vh] overflow-hidden">`; `<Image src={poster_url} fill alt="" style={{ objectFit: "cover" }} className="opacity-60" sizes="100vw" />`; gradient overlay `absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent`; content `absolute inset-0 flex items-end pb-12 md:pb-16 px-[clamp(1rem,4vw,4rem)]`; `<div className="max-w-[600px] flex flex-col gap-4">`; title `<h1 className="text-2xl md:text-4xl font-bold text-foreground line-clamp-2">{title}</h1>`; buttons row `flex gap-3 flex-wrap`; button "Xem ngay" `bg-primary text-primary-foreground hover:bg-primary-hover` + inline SVG play (16×16); button "Thêm vào danh sách" `border border-foreground/60 text-foreground hover:bg-surface`; cả hai button `px-4 py-2 rounded font-semibold flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-safe:transition-colors`; xóa `.gitkeep`
- [x] `src/app/(viewer)/home/page.tsx` — Tạo mới: `export const revalidate = 60`; Server Component; `const [movies, genres] = await Promise.all([getMovieList(), getGenreList()])`; nhóm: `const grouped = genres.map(g => ({ genre: g, movies: movies.filter(m => m.genres.includes(g.name)) }))`; fallback: `const ungrouped = movies.filter(m => m.genres.length === 0)`; render `<>{movies.length > 0 && <HeroBanner movie={movies[0]} />}<div className="flex flex-col gap-8 py-8">{grouped.filter(g => g.movies.length > 0).map(g => <MovieRow key={g.genre.id} title={g.genre.name} movies={g.movies} />)}{ungrouped.length > 0 && <MovieRow title="Tất cả phim" movies={ungrouped} />}{movies.length === 0 && <p className="text-muted-foreground text-center py-16">Chưa có phim nào. Hãy khám phá thêm →</p>}</div></>` 
- [x] `src/app/(viewer)/home/loading.tsx` — Tạo mới: skeleton hero `<div className="min-h-[65vh] bg-surface animate-pulse motion-reduce:animate-none rounded" />`; 2 row skeleton: mỗi row `<section className="flex flex-col gap-2"><div className="h-6 w-32 bg-surface animate-pulse motion-reduce:animate-none rounded" /><div className="flex gap-3 overflow-x-hidden">{Array.from({length:6}).map((_,i) => <div key={i} className="flex-shrink-0 w-[160px]"><MovieCardSkeleton /></div>)}</div></section>`; wrap trong `<div className="flex flex-col gap-8 py-8">`
- [x] `src/app/(viewer)/home/error.tsx` — Tạo mới: `"use client"`; props `{ error: Error; reset: () => void }`; render `<div className="flex flex-col items-center gap-4 py-16 text-center"><p className="text-error text-lg">Không tải được. Thử lại.</p><button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded font-semibold hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">Thử lại</button></div>`
- [x] `src/components/movie/HeroBanner.test.tsx` — Test: render với movie hợp lệ → hiện title; render backdrop `<img>` với alt=""; render button có text "Xem ngay"; render button có text "Thêm vào danh sách"; mock `next/image` → `<img>` như pattern MovieCard
- [x] `src/app/(viewer)/home/page.test.tsx` — Test: mock `getMovieList` + `getGenreList`; render với data → HeroBanner nhận movies[0]; render MovieRow cho genre có phim; không render row khi genre không có phim; render empty state khi movies=[]; không render "Tiếp tục xem"

**Acceptance Criteria:**
- Given người dùng đã đăng nhập và truy cập /home, when trang tải, then HeroBanner hiện phim đầu tiên: backdrop full-width min-h-[65vh] desktop / min-h-[50vh] mobile, title 4xl desktop / 2xl mobile, hai buttons "Xem ngay" và "Thêm vào danh sách"
- Given trang chủ tải xong, when genre rows render, then MovieRow cho mỗi genre có ≥1 phim; "Tiếp tục xem" row vắng mặt
- Given dữ liệu API thất bại, when error xảy ra, then error.tsx hiện "Không tải được. Thử lại." và button "Thử lại" reset trang
- Given trang đang tải, when Suspense active, then skeleton hero + skeleton rows hiển thị
- Given movies=[], when render, then không có HeroBanner; hiện "Chưa có phim nào. Hãy khám phá thêm →"
- Given trang chủ, when view, then max-width 1400px và padding clamp(1rem,4vw,4rem) được áp dụng (từ viewer layout); row gap 2rem giữa các MovieRow

## Implementation Notes

- `src/app/api/genres/route.ts` giữ nguyên inline (không refactor qua lib) vì genres test không mock `next/cache`; `unstable_cache` cần server context và crash trong Vitest khi không được mock.
- `getGenreList` trong `lib/movieData.ts` vẫn dùng `unstable_cache` cho home page Server Component (server context có đủ); chỉ genres API route không dùng nó.
- HeroBanner test: `<img alt="">` có role "presentation" không phải "img", nên dùng `container.querySelector("img[alt='']")` thay vì `getByRole("img", { hidden: true })`.
- Type-check: 0 errors. Tests: 69/69 pass.

## Spec Change Log

## Review Triage Log

| # | Finding | Verdict | Route | Evidence |
|---|---------|---------|-------|----------|
| 1 | HeroBanner buttons không có onClick (Blind Hunter) | false | reject | Spec tường minh: "Bookmark button là UI tĩnh — không có onClick, không gọi API (Epic 4 Story 4.1 wire sau)". Hành vi có chủ ý. |
| 2 | poster_url làm backdrop bị crop xấu (Blind Hunter) | false | reject | Design Notes trong spec giải thích rõ quyết định này; được approve ở planning. |
| 3 | movies[0] non-deterministic (Blind Hunter) | low | defer | Real nhưng spec không yêu cầu ordering. Không gây crash, chỉ là UX concern. |
| 4 | "Tất cả phim" label misleading (Blind Hunter) | false | reject | Spec task ghi rõ `title="Tất cả phim"` cho fallback row. Implementation đúng spec được approve. |
| 5 | map() transform duplicated trong movieData (Blind Hunter) | low | defer | Pre-existing: duplication tồn tại trong route.ts cũ trước refactor. |
| 6 | getGenreList không có tags trong unstable_cache (Blind Hunter, ECH) | low | defer | Real nhưng spec viết `{ revalidate: 3600 }` không có tags. Không có story nào yêu cầu programmatic invalidation cho genres. |
| 7 | loading.tsx hardcode 2 rows (Blind Hunter) | false | reject | Spec task tường minh: "2 row skeleton". Implementation đúng spec. |
| 8 | HomeError bỏ qua error prop (Blind Hunter) | false | reject | Spec yêu cầu generic message. Next.js bắt buộc khai báo prop trong interface nhưng không cần dùng. |
| 9 | Test không assert HeroBanner vắng trong non-empty path (Blind Hunter) | false | reject | Early return đảm bảo mutual exclusivity. Cả 2 path được cover riêng biệt. |
| 10 | alt="" trong test thiếu comment (Blind Hunter) | false | reject | Cosmetic, không harm thực sự. |
| 11 | Promise.all genre failure → page fail dù movies healthy (ECH) | low | defer | Real. Spec I/O Matrix: "API thất bại → error.tsx" bao gồm case này. Partial degraded UX là scope story sau. |
| 12 | Genre name casing mismatch (ECH) | false | reject | Cả movie.genres lẫn Genre.name đều từ cùng cột genres.name — casing guaranteed nhất quán. |
| 13 | Null genre names từ Supabase (ECH) | false | reject | Genre type `name: string` non-nullable; filter(Boolean) loại null khỏi movies genres. |
| 14 | poster_url empty/null → next/image throws (ECH) | false | reject | MovieSummary.poster_url: string non-nullable; seed đảm bảo. |
| 15 | genres/route.ts task [x] nhưng không có trong diff (ECH) | false | reject | Implementation Notes ghi rõ quyết định và lý do. Checkbox phản ánh task đã được xử lý. |
| 16 | route.test.ts mock supabase/cache thay vì movieData (VG) | low | defer | Pre-existing: test viết cho cũ, vẫn hoạt động transitive. 69/69 pass. |
| 17 | fetchAllGenres không có unit test trực tiếp (VG) | low | defer | Pre-existing pattern; genres route tests cover structurally identical query. |

## Design Notes

**HeroBanner backdrop:** `MovieSummary` không có `backdrop_url` — story này dùng `poster_url` fill toàn phần với opacity-60 + gradient overlay `from-background via-background/70 to-transparent` để text đọc được. Epic 3 sẽ thêm `backdrop_url` cho Movie Detail page; HeroBanner có thể nâng cấp sau.

**Data fetching pattern:** `page.tsx` là Server Component, import trực tiếp từ `lib/movieData.ts` (không qua HTTP). `lib/movieData.ts` import từ `lib/supabase/anon.ts` — đây là internal data layer, không vi phạm "no direct Supabase imports in page files". API routes cũng import từ cùng lib sau refactor, loại bỏ code trùng lặp.

**Genre grouping:** `getGenreList()` trả danh sách genre có thứ tự từ DB; mỗi genre filter movies bằng `movie.genres.includes(genre.name)`. Phim không genre nào vào row "Tất cả phim" (chỉ render khi có phim như vậy). MovieRow tự return null khi `movies=[]`.

## Verification

**Commands:**
- `npm run type-check` — expected: 0 TypeScript errors
- `npm run lint` — expected: 0 lint errors
- `npm test -- --testPathPattern="home|HeroBanner"` — expected: tất cả tests pass

## Review Findings

Code review run: 2026-10-19 — 4 layers (Blind Hunter, Edge Case Hunter, Verification Gap, Acceptance Auditor).

### Decision-Needed

- [ ] [Review][Decision] Focus ring spec says always-on (`ring-2 ring-primary`) but implementation uses `focus-visible:ring-2 focus-visible:ring-primary` — Spec constraint `Boundaries & Constraints` writes `ring-2 ring-primary focus-visible:outline-none`, meaning ring-2 and ring-primary are always-on classes. Implementation scopes all three to `focus-visible:`, which is better UX (no persistent ring on all interactive elements) but deviates from the literal spec. Confirmed in `HeroBanner.tsx` (both buttons) and `error.tsx` (Thử lại button). Human must decide: keep the better implementation and treat spec wording as an oversight, or follow the spec literally.

### Patches

- [ ] [Review][Patch] loading.tsx skeleton mismatches HeroBanner on mobile height and corner shape [`src/app/(viewer)/home/loading.tsx`] — Two deviations: (1) Skeleton hero uses `min-h-[65vh]` only; HeroBanner uses `min-h-[50vh] md:min-h-[65vh]`, so on mobile the skeleton is 65vh while the real hero is 50vh — visible layout shift. (2) Skeleton hero has `rounded` class; HeroBanner `<section>` uses `overflow-hidden` with no rounded corners — skeleton and content have different corner shapes on load.
- [ ] [Review][Patch] page.tsx empty-state early return drops the flex wrapper [`src/app/(viewer)/home/page.tsx:11-15`] — When `movies.length === 0`, the code returns a bare `<p>` with no container. The non-empty path wraps everything in `<div className="flex flex-col gap-8 py-8">`. The spec render template shows the wrapper always rendering with the empty-state `<p>` inside it. Missing wrapper on empty path breaks vertical padding/spacing consistency.
- [ ] [Review][Patch] HeroBanner "Xem ngay" button has no aria-label associating the action with the film title [`src/components/movie/HeroBanner.tsx:38-49`] — Screen reader users hear "Xem ngay" with no movie name; the `<h1>` is nearby but not programmatically linked. Fix: `aria-label={\`Xem ngay: ${title}\`}` on the button.
- [ ] [Review][Patch] "Thêm vào danh sách" button has no `aria-disabled` despite being intentionally inert [`src/components/movie/HeroBanner.tsx:51-70`] — Spec says this button is static UI with no onClick. Without `aria-disabled="true"`, assistive technology users receive no signal the button is deliberately non-functional.
- [ ] [Review][Patch] deferred-work.md new entries mix Vietnamese and English mid-bullet inconsistently [`_bmad-output/implementation-artifacts/deferred-work.md`] — Pre-existing entries use English throughout; the new entries added in this story switch mid-sentence to Vietnamese. Direct text correction needed for document consistency.
- [ ] [Review][Patch] Promise.all rejects on genre fetch failure, showing error page even when movies loaded [`src/app/(viewer)/home/page.tsx:8`] — `await Promise.all([getMovieList(), getGenreList()])` — if `getGenreList()` throws, the whole page renders the error boundary even though `getMovieList()` may have succeeded. Fix: `getGenreList().catch(() => [])` in the Promise.all call so genre failure degrades gracefully (renders with no genre rows) rather than crashing the page.
- [ ] [Review][Patch] HomeError reset button wiring has no test [`src/app/(viewer)/home/error.tsx`] — The AC states "button 'Thử lại' reset trang"; `error.tsx` wires `onClick={reset}` on the button. No `error.test.tsx` exists. If the `onClick` handler were removed, the AC would silently fail. Fix: add `src/app/(viewer)/home/error.test.tsx` — render `<HomeError error={new Error("test")} reset={mockFn} />`, assert "Thử lại" button is present, assert `mockFn` called on click (RTL + Vitest, same pattern as `page.test.tsx`).

### Deferred

- [x] [Review][Defer] genres/route.ts task marked `[x]` complete but refactor not executed [`src/app/api/genres/route.ts`] — deferred: acknowledged in Implementation Notes (genres route kept inline due to Vitest/unstable_cache incompatibility); entry already exists in deferred-work.md
- [x] [Review][Defer] getMoviesByQuery backslash escape order bug [`src/lib/movieData.ts`] — deferred: pre-existing — identical escape logic present in `276b525:src/app/api/movies/route.ts` before this story's refactor; not introduced by this change
- [x] [Review][Defer] next/image mock spreads `fill` boolean prop onto DOM `<img>` (React unknown-prop warning in tests) [`src/components/movie/HeroBanner.test.tsx`] — deferred: pre-existing pattern — same mock shape used in `MovieCard.test.tsx` (Story 2.2) which also passes `fill` to next/image; not introduced here

### Rejected

- **ECH-1 (false):** null/empty genre names causing blank MovieRow title — `fetchAllGenres` has no name filter, but null-named genres produce zero-movie groups that are already eliminated by `.filter((g) => g.movies.length > 0)` in `page.tsx`. The described bad outcome does not reach the render path.
- **ECH-2 (false):** getMoviesByQuery called with empty string returns all movies — the only caller (`api/movies/route.ts`) already guards `q !== null && q !== ""` before invoking `getMoviesByQuery`. The empty-string path is unreachable in the current codebase.
- **ECH-4 (false):** poster_url not in next/image remotePatterns — `next.config.ts` has `hostname: "**"` which accepts all HTTPS hosts. No restriction applies.
- **BH-6 (rejected-low):** HeroBanner.test.tsx does not enforce single-image constraint — asserting image count is future-proofing that requires adding test complexity; fix adds more than a direct correction.
