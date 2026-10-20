---
title: 'Movie Detail Page'
type: 'feature'
created: '2026-10-19'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '0618a64'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Người dùng không thể xem thông tin chi tiết của một bộ phim hoặc điều hướng đến trang xem phim — mọi link `/movie/:id` hiện tại chỉ là `.gitkeep`.

**Approach:** Tạo ISR Server Component tại `/movie/[id]` hiển thị metadata, trailer embed, nút "Xem phim" dẫn đến `/watch/[id]`, WatchlistButton stub, và grid "Phim tương tự"; backed bởi `GET /api/movies/[id]` mới và hai lib function mới trong `movieData.ts`.

## Boundaries & Constraints

**Always:**
- ISR `export const revalidate = 60` trên page
- `notFound()` khi movie ID không tồn tại
- Dùng `Movie` type (không phải `MovieSummary`) cho detail data; `genres: Genre[]`
- Supabase access qua `createAnonClient()` trong lib — không khởi tạo client trong page hay API route
- WatchlistButton là stub: render button với `aria-label`, không có `onClick`, không gọi API
- Trailer embed bằng `<iframe>` thông thường (YouTubePlayer IFrame SDK là Story 3.2)
- Skeleton loading khớp layout thực — `animate-pulse motion-reduce:animate-none`
- `next/image` cho poster và backdrop; `alt="[Tên phim] poster"` cho poster, `alt=""` cho backdrop decorative

**Never:**
- `watch_history`, `progress_seconds`, hoặc bất kỳ write nào vào DB (Story 3.3)
- Wiring WatchlistButton với API thực (Epic 4 Story 4.1)
- YouTubePlayer IFrame API SDK (Story 3.2)
- Auth guard trên trang detail (public page)

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy path — page | Valid `id` → movie exists | Render metadata, trailer iframe, "Xem phim" link, "Phim tương tự" grid | N/A |
| Movie không tồn tại | Unknown `id` | `notFound()` → Next.js 404 page | N/A |
| Không có phim tương tự | Movie chỉ có genre độc lạ / không share | Không hiển thị section "Phim tương tự" | Ẩn section |
| API route — valid | `GET /api/movies/[id]` với ID tồn tại | `200 { data: Movie }` | N/A |
| API route — not found | `GET /api/movies/[id]` với ID không tồn tại | `404 { error: "Không tìm thấy phim", code: "NOT_FOUND" }` | N/A |

</frozen-after-approval>

## Code Map

- `src/types/index.ts` — `Movie` (genres: Genre[]), `MovieSummary`, `Genre` đều đã tồn tại — KHÔNG SỬA
- `src/lib/movieData.ts` — THÊM `getMovieById` và `getSimilarMovies`; REUSE pattern `createAnonClient` + `unstable_cache` từ `fetchAllMovies`; join `movie_genres(genres(id,name))` + select full fields
- `src/app/api/movies/[id]/route.ts` — TẠO MỚI: public GET handler
- `src/app/(viewer)/movie/[id]/page.tsx` — TẠO MỚI: async Server Component
- `src/app/(viewer)/movie/[id]/loading.tsx` — TẠO MỚI: skeleton
- `src/components/movie/WatchlistButton.tsx` — TẠO MỚI: stub button
- `src/components/movie/MovieCard.tsx` — REUSE cho "Phim tương tự" grid (props: `movie: MovieSummary`)
- `src/components/movie/MovieCardSkeleton.tsx` — REUSE trong loading
- `src/app/(viewer)/layout.tsx` — wrap viewer pages với Header + BottomNav; KHÔNG SỬA
- `src/app/globals.css` — tokens: `background`, `surface`, `surface-elevated`, `border`, `primary`, `foreground`, `muted-foreground`, `secondary`

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/movieData.ts` — THÊM `getMovieById(id: string): Promise<Movie | null>`: query `movies` select `id,title,description,poster_url,backdrop_url,trailer_url,video_url,year,rating,cast,director` + join `movie_genres(genres(id,name))`; `.eq("id", id)`; trả `null` nếu không có data; wrap bằng `unstable_cache` với key `["movie", id]` và `revalidate: 60`. THÊM `getSimilarMovies(genreIds: string[], excludeId: string, limit = 6): Promise<MovieSummary[]>`: query movies có cùng genre thông qua join, `.neq("id", excludeId)`, `.limit(limit)`; trả `MovieSummary[]`; KHÔNG wrap cache (đã cached ở caller level).
- [x] `src/app/api/movies/[id]/route.ts` — TẠO MỚI `export async function GET(_, { params })`: gọi `getMovieById(params.id)`; nếu null → `Response.json({error:"Không tìm thấy phim", code:"NOT_FOUND"}, {status:404})`; nếu có → `Response.json({data: movie})`
- [x] `src/components/movie/WatchlistButton.tsx` — TẠO MỚI Client Component: `<button aria-label="Thêm vào danh sách" className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-foreground opacity-60 cursor-not-allowed" disabled><BookmarkIcon/> Thêm vào danh sách</button>`; inline SVG bookmark icon 20×20; không có onClick; comment `// Epic 4 Story 4.1 wires the watchlist API`
- [x] `src/app/(viewer)/movie/[id]/page.tsx` — TẠO MỚI `export const revalidate = 60`; gọi `getMovieById(params.id)` → `notFound()` nếu null; layout: `<main>` với backdrop `<Image fill alt="">` + gradient overlay `from-background via-background/80 to-transparent` (left to right); content `max-w-[600px]` gồm poster (160×240), title `text-3xl md:text-4xl font-bold`, `text-muted-foreground` metadata line (năm · đạo diễn · rating ⭐), description, genre badges `bg-surface-elevated rounded-full px-3 py-1 text-sm text-secondary`, CTA row: `<Link href="/watch/${id}">Xem ngay</Link>` (amber `bg-amber-600 text-black rounded-md px-6 py-2 inline-flex items-center gap-2`) + `<WatchlistButton/>`; trailer `<iframe>` dưới content (16:9 aspect `aspect-video w-full rounded-lg`); section "Phim tương tự" nếu `similarMovies.length > 0`: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3`
- [x] `src/app/(viewer)/movie/[id]/loading.tsx` — TẠO MỚI: skeleton backdrop (full-width `h-[400px] bg-surface`), content skeleton (poster rect + 3 lines metadata + 2 genre pill), trailer skeleton (`aspect-video bg-surface`); 6× `<MovieCardSkeleton/>`; tất cả `animate-pulse motion-reduce:animate-none`
- [x] `src/app/api/movies/[id]/route.test.ts` — TẠO MỚI: mock `@/lib/movieData`; test 200 + đúng shape khi `getMovieById` trả Movie; test 404 + `code:"NOT_FOUND"` khi trả null

**Acceptance Criteria:**
- Given movie ID hợp lệ, when trang load, then hiển thị title, description, năm, rating, đạo diễn, genres, cast
- Given movie ID hợp lệ, when trang load, then trailer_url được embed trong `<iframe aspect-video>` phía dưới metadata
- Given "Xem ngay" được render, when click, then navigate tới `/watch/[id]`
- Given movie ID không tồn tại, when request, then Next.js 404 page (không crash)
- Given ISR revalidate=60, when page được cache, then `export const revalidate = 60` có mặt
- Given ≥1 phim cùng genre tồn tại, when trang load, then section "Phim tương tự" hiển thị MovieCard
- Given không có phim cùng genre, when trang load, then section "Phim tương tự" không render
- Given WatchlistButton render, when click, then không có network request nào xảy ra

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence | Route |
|---------|---------|----------|-------|
| `page.tsx` root element is `<div>` not `<main>` | medium | Spec task explicitly states "layout: `<main>` with backdrop"; accessibility landmark missing. Verified at page.tsx line 25. Patched: changed to `<main>`. | patch → fixed |
| `movie.rating.toFixed(1)` no null guard | medium | `Movie.rating: number` typed non-optional but DB could return null; would crash at runtime. Patched: added `movie.rating != null ?` guard. | patch → fixed |
| `movie.director` rendered inline without null guard | low | `director: string` non-optional in type but DB may return null; renders "null" text. Patched: conditional interpolation. | patch → fixed |
| `getSimilarMovies` `.limit(limit)` on join table, not unique movies | medium | Querying `movie_genres` with `.limit(limit)` can return `limit` rows for the same movie across genres, leaving fewer unique results. Patched: fetch `limit * genreIds.length` rows then dedup+cap. | patch → fixed |
| `MovieDetailPage` `notFound()` path has no test | medium | No page.test.tsx existed; removal of null check would ship silently. Added `page.test.tsx` with notFound() assertion. | patch → fixed |
| `getSimilarMovies` dedup/limit logic has no test | medium | New non-trivial function with dedup loop, no tests. Added `movieData.test.ts` covering empty genreIds, deduplication, and limit cap. | patch → fixed |
| `aria-label` on WatchlistButton overrides visible text | false | Both `aria-label` and visible text are identical ("Thêm vào danh sách"); no real mismatch. | false — rejected |
| `iframe` missing `sandbox` attribute | low | Pre-existing DB trust concern, spec says "iframe thông thường" — no sandbox requirement in intent. | defer |
| Loading skeleton missing CTA/cast rows | low | Spec skeleton requirement lists specific elements; CTA/cast skeleton not required. Cosmetic shift negligible. | low → rejected (cosmetic) |
| `params` should be `Promise<{id}>` for Next.js 15 | false | `tsc --noEmit` passes with zero errors confirming current typing is valid for this project's Next.js version. | false |
| `≥3 similar movies` minimum floor required | false | Spec says section renders if `similarMovies.length > 0` — no minimum of 3 in spec or intent. | false — reviewer invented requirement |
| Cast outside `max-w-[600px]` | false | Cast block has its own `max-w-[600px]` class directly on its wrapper; correctly constrained. | false |
| `getSimilarMovies` not cached — spec claim false | false | Spec says "cached at caller level" — caller is `page.tsx` with ISR `revalidate=60`; whole render including getSimilarMovies is covered by ISR. | false |

## Verification

**Commands:**
- `pnpm vitest run src/app/api/movies` -- expected: all tests pass
- `pnpm tsc --noEmit` -- expected: no type errors
