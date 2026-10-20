# Deferred Work

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-project-setup-infrastructure.md`
  summary: `admin.ts` và `server.ts` thiếu runtime guard khi SUPABASE env vars bị missing, createClient sẽ nhận undefined
  evidence: Env vars là manual prerequisites per spec; standard TS `!` operator không throw tại runtime; trong mis-configured env app sẽ fail với Supabase error thay vì message rõ ràng

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-project-setup-infrastructure.md`
  summary: `progress_seconds` trong `watch_history` thiếu CHECK constraint ngăn giá trị âm
  evidence: Không trong scope spec; sẽ cho phép negative progress values gây lỗi logic tại Epic 3 (watch progress); nên thêm `CHECK (progress_seconds >= 0)` trong migration tương lai

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-project-setup-infrastructure.md`
  summary: `rating` trong `movies` thiếu range constraint (không enforce 0–10)
  evidence: Không trong scope spec; invalid ratings có thể lọc vào qua API trực tiếp; nên thêm `CHECK (rating >= 0 AND rating <= 10)` trong migration tương lai

## Deferred from: code review of spec-1-2-design-token-system-global-layout (2026-10-14)

- BottomNav rendered unconditionally in `(viewer)/layout.tsx` — no mechanism to suppress for full-screen pages (e.g. video player). Pre-existing design; no full-screen pages exist yet. Revisit when Epic 3 (video player page) is implemented.

## Deferred from: code review of spec-1-3-authentication-pages-route-protection (2026-10-15)

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-authentication-pages-route-protection.md`
  summary: UnauthorizedPage thiếu metadata export — browser tab và SEO crawlers hiển thị root layout title
  evidence: Không có trong spec; design decision; pattern chung của pages trong project

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-authentication-pages-route-protection.md`
  summary: Unauthenticated user hitting /admin bị redirect → /unauthorized thay vì /sign-in
  evidence: Behavior per spec literal (non-admin → /unauthorized); unauthenticated = non-admin; nhưng confusing UX; cần design decision khi admin flows được implement (Epic 5)

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-authentication-pages-route-protection.md`
  summary: currentUser() không có error boundary riêng trong (viewer) route group
  evidence: Next.js root error.tsx handles; "không install package mới" constraint; revisit khi Epic 3+ nếu cần custom error UI

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-authentication-pages-route-protection.md`
  summary: Landing page `page.tsx` thiếu metadata export (title, description, OG tags) — SEO và social sharing
  evidence: Pre-existing pattern across all pages; không có trong spec; revisit trước public launch

## Deferred from: code review of spec-2-1-supabase-seed-movie-api-routes (2026-10-15)

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-supabase-seed-movie-api-routes.md`
  summary: GET /api/genres không có caching — mỗi request hit Supabase trực tiếp
  evidence: Genres ít thay đổi; không có unstable_cache, không có Cache-Control header; không trong scope của story này; nên cache tương tự movies endpoint trong Epic 2 hoặc sau

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-supabase-seed-movie-api-routes.md`
  summary: Seed script không load .env.local — developer phải export env vars thủ công trước khi chạy npm run seed
  evidence: Script chạy ngoài Next.js runtime; không có dotenv; explicit failure tại first DB call với error message rõ ràng; developer responsibility

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-supabase-seed-movie-api-routes.md`
  summary: "Next.js 16.4 App Router" version typo in epic-2-context.md — Next.js 16 does not exist; current stable is 15.x
  evidence: Fix requires editing agent-context file (epic-2-context.md); no runtime impact; deferred from iteration 3 code review

## Deferred from: code review of spec-2-3-home-page-hero-banner-genre-rows (2026-10-16)

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-home-page-hero-banner-genre-rows.md`
  summary: movies[0] làm featured hero — không có ordering → hero movie non-deterministic giữa các cache invalidation
  evidence: fetchAllMovies không có .order(); hero thay đổi khi cache bust. Low UX impact nhưng ideally nên pin featured movie hoặc sort by rating/year.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-home-page-hero-banner-genre-rows.md`
  summary: getGenreList trong movieData.ts không có cache tags — không thể programmatic invalidation qua revalidateTag
  evidence: unstable_cache({ revalidate: 3600 }) nhưng không có tags: ["genres"]. Không có story nào yêu cầu genre cache invalidation hiện tại.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-home-page-hero-banner-genre-rows.md`
  summary: Promise.all([getMovieList(), getGenreList()]) trong home page — genres failure làm toàn bộ page fail dù movies healthy
  evidence: Không có .catch(() => []) fallback trên getGenreList. Error boundary (error.tsx) xử lý case này per spec, nhưng partial degraded UI (show movies without genre grouping) sẽ tốt hơn.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-home-page-hero-banner-genre-rows.md`
  summary: fetchAllMovies và getMoviesByQuery trong movieData.ts có map() transform duplicated
  evidence: Pre-existing từ route.ts cũ; refactor sang shared toMovieSummary() helper trong story sau.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-home-page-hero-banner-genre-rows.md`
  summary: route.test.ts mock supabase/anon và next/cache thay vì @/lib/movieData — khó đọc sau refactor
  evidence: Tests pass vì mock áp dụng transitive, nhưng future reader sẽ không thấy movieData mock và có thể confused.

## Deferred from: code review of spec-2-3-home-page-hero-banner-genre-rows (2026-10-19)

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-home-page-hero-banner-genre-rows.md`
  summary: genres/route.ts task checked [x] in spec but refactor deliberately not executed
  evidence: Pre-existing acknowledged decision — Implementation Notes explain genres route kept inline due to Vitest/unstable_cache incompatibility. Checkbox is misleading but the decision is documented. Fix would require editing the spec (uncheck) or doing the refactor (out of scope per implementation decision).

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-home-page-hero-banner-genre-rows.md`
  summary: getMoviesByQuery escape logic does not escape backslash before % and _ — in environments where \ is ILIKE escape char, user input containing \ could corrupt the pattern
  evidence: Pre-existing — identical escape logic present in 276b525:src/app/api/movies/route.ts before this story's refactor. Fix: replace backslash first: `q.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")`.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-home-page-hero-banner-genre-rows.md`
  summary: next/image mock in HeroBanner.test.tsx spreads all props (including `fill` boolean) onto DOM img — generates React unknown-prop warning
  evidence: Pre-existing pattern — same mock shape used in MovieCard.test.tsx (Story 2.2). Fix: destructure fill, sizes, priority out of spread before passing rest to img.

## Deferred from: code review of spec-2-4-global-search-header-bar-search-results-page (2026-10-19)

- source_spec: `_bmad-output/implementation-artifacts/spec-2-4-global-search-header-bar-search-results-page.md`
  summary: Thumbnail in SearchBar dropdown does not guard against empty `poster_url` — next/image throws for empty src
  evidence: Pre-existing concern applicable to all movie components (MovieCard, HeroBanner). `MovieSummary.poster_url` is typed as `string` (not optional) and the DB should always have it. Fix: add `src={movie.poster_url || '/placeholder.jpg'}` fallback when a placeholder asset exists.

## Deferred from: code review of spec-2-4 round 2 (2026-10-19)

- source_spec: `_bmad-output/implementation-artifacts/spec-2-4-global-search-header-bar-search-results-page.md`
  summary: Back/forward navigation desync — `searchParams` changes (browser history nav) do not re-sync `query` state in SearchPage
  evidence: `query` initialized once from `searchParams.get("q")` with no reactive effect on searchParams changes. Fix needs loop-safe effect watching searchParams; complex interaction with existing URL-sync effect (could cause infinite replace loop).

- source_spec: `_bmad-output/implementation-artifacts/spec-2-4-global-search-header-bar-search-results-page.md`
  summary: Spurious `router.replace` on mount when URL already correct in SearchPage
  evidence: URL-sync effect fires on mount calling `router.replace` with the same URL already in the address bar. Spec triage row 12 explicitly accepted; guard (`if debouncedQuery !== searchParams.get("q")`) adds complexity beyond the accepted trade-off.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-4-global-search-header-bar-search-results-page.md`
  summary: No shared `next/image` mock setup file — mock duplicated independently in SearchBar.test.tsx and page.test.tsx
  evidence: Pre-existing pattern across all test files in project (HeroBanner.test.tsx, MovieCard.test.tsx). Fix requires new vitest.setup.ts with shared mock; out of scope for this story.

## Deferred from: code review of spec-3-1-movie-detail-page (2026-10-20)

- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-movie-detail-page.md`
  summary: iframe in movie detail page missing sandbox attribute — embeds arbitrary YouTube URLs without content isolation
  evidence: Spec intent says "iframe thông thường" with no sandbox requirement; adding sandbox is a security improvement outside the captured intent. Revisit when iframe security policy is standardized across the project.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-movie-detail-page.md`
  summary: getSimilarMovies results are non-deterministic — no ORDER BY clause on Supabase query
  evidence: Supabase/Postgres returns rows in undefined order without .order(); "Phim tương tự" section can vary between ISR refreshes. Spec does not require ordering; add .order("id") or order by rating when query ordering is standardized.
