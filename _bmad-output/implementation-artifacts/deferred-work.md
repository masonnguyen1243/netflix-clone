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
