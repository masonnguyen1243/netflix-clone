---
title: 'Story 1.1: Project Setup & Infrastructure'
type: 'chore'
created: '2026-10-13'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/planning-artifacts/architecture/architecture-bmad-landing-page-2026-10-13/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Chưa có project nào — cần scaffold toàn bộ nền tảng (Next.js, Supabase, Clerk) trước khi các story sau có thể bắt đầu.

**Approach:** Tạo Next.js 16.4 App Router project với cấu trúc thư mục theo architecture spine, khởi tạo Supabase schema (5 bảng + RLS), cấu hình Clerk JWT template, tạo hai Supabase clients, định nghĩa TypeScript types cốt lõi, stub middleware, và link Vercel deploy.

## Boundaries & Constraints

**Always:**
- Stack đã khóa: Next.js 16.4 (App Router), React 19.3, TypeScript 5.x, Tailwind CSS 4.x, shadcn/ui, @clerk/nextjs 7.9.x, @supabase/supabase-js latest — không thay thế bất kỳ dependency nào
- Cấu trúc thư mục: `src/app/(auth)/`, `src/app/(viewer)/`, `src/app/admin/`, `src/app/api/`, `src/components/layout/`, `src/lib/supabase/`, `src/types/` — phải tuân theo đúng theo ARCHITECTURE-SPINE.md Structural Seed
- `lib/supabase/server.ts` khởi tạo bằng `getToken({ template: 'supabase' })` từ Clerk JWT; `lib/supabase/admin.ts` khởi tạo bằng `SUPABASE_SERVICE_ROLE_KEY` — chỉ import trong `app/api/admin/**`
- RLS bắt buộc trên `watch_history` và `watchlist`; Clerk `userId` (string) làm FK — không tạo bảng `users` riêng
- 5 env vars bắt buộc set trong `.env.local`: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Never:**
- Không implement UI hay logic nghiệp vụ — story này chỉ là infrastructure và scaffolding
- Không import Supabase client trực tiếp ngoài `lib/supabase/` (AR-2)
- Không conflate `MovieSummary` và `Movie` — hai types hoàn toàn riêng biệt (AR-9)
- Không commit `.env.local` lên git

**Decisions (AR-13 & prerequisites):**
- Testing strategy: **Vitest + React Testing Library** — add dependency trong story 1.1, viết test thực từ story 1.2 trở đi; ghi quyết định vào ARCHITECTURE-SPINE.md
- External services (Vercel project, Supabase project, Clerk application): treat as **manual prerequisites** — agent chỉ xử lý code; developer tự tạo các services và điền env vars vào `.env.local` trước khi chạy

</frozen-after-approval>

## Code Map

Greenfield — không có file nào tồn tại. Các file mới sẽ được tạo theo ARCHITECTURE-SPINE.md Structural Seed:

- `src/app/layout.tsx` -- root layout; bọc `<ClerkProvider>`; import Inter font
- `src/app/page.tsx` -- placeholder landing page (redirect hoặc nội dung tối giản)
- `src/middleware.ts` -- stub Clerk route protection; hoàn thiện ở Story 1.3
- `src/lib/supabase/server.ts` -- Supabase client với Clerk JWT (`createServerClient`)
- `src/lib/supabase/admin.ts` -- Supabase client với service role key (`createAdminClient`)
- `src/types/index.ts` -- `Genre`, `MovieSummary`, `Movie` types
- `next.config.ts` -- `remotePatterns` wildcard cho `next/image`
- `vitest.config.ts` -- Vitest setup với jsdom environment
- `supabase/migrations/001_initial_schema.sql` -- DDL cho 5 bảng + RLS policies
- `.env.local` -- template file (values trống, thêm vào `.gitignore`)

## Prerequisites (manual — developer tự thực hiện trước khi chạy agent)

Trước khi agent bắt đầu, bạn cần:
1. Tạo **Supabase project** → lấy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
2. Tạo **Clerk application** → lấy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`; cấu hình JWT template tên `"supabase"` với claim `sub` map sang Clerk `userId`
3. Tạo **Vercel project** và link repo; thêm 5 env vars vào Vercel dashboard
4. Điền 5 env vars vào `.env.local` local

## Tasks & Acceptance

**Execution:**
- [x] Scaffold project -- `npx create-next-app@16.4 .` với flags: `--app --typescript --tailwind --src-dir --import-alias "@/*"` -- project foundation với đúng version 16.4
- [x] Tạo cấu trúc thư mục -- `src/app/(auth)/`, `src/app/(viewer)/`, `src/app/admin/`, `src/app/api/`, `src/components/layout/`, `src/components/movie/`, `src/components/player/` với `.gitkeep` placeholder -- AR-14; phải tạo trước các file tasks bên dưới
- [x] Install core dependencies -- `npm install @clerk/nextjs@7.9.x @supabase/supabase-js` -- required trước khi viết bất kỳ file nào import chúng
- [x] Install Vitest + RTL -- `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom`; tạo `vitest.config.ts` với `environment: 'jsdom'` và `plugins: [react()]` -- AR-13; tests thực viết từ story 1.2
- [x] `next.config.ts` -- thêm `images.remotePatterns: [{ protocol: 'https', hostname: '**' }]`; `reactStrictMode: true` -- AR-10 wildcard cho poster/backdrop từ bất kỳ CDN nào
- [x] `src/app/layout.tsx` -- wrap với `<ClerkProvider>`; load Inter font qua `next/font/google` với `subsets: ['latin', 'vietnamese']`; set `<html lang="vi">` -- auth foundation + accessibility
- [x] `src/middleware.ts` -- export `clerkMiddleware` + `createRouteMatcher(['/'])` stub (không dùng `authMiddleware` deprecated từ v5+); Story 1.3 sẽ hoàn thiện danh sách routes và admin role check -- route protection scaffold cho Stories 1.3, 5.x
- [x] `src/lib/supabase/server.ts` -- export `createServerClient(getToken: () => Promise<string | null>)` nhận Clerk JWT callback; tạo Supabase client với Authorization header -- AR-4
- [x] `src/lib/supabase/admin.ts` -- export `createAdminClient()` dùng `process.env.SUPABASE_SERVICE_ROLE_KEY`; JSDoc comment: `@warn Chỉ import trong app/api/admin/**` -- AR-4
- [x] `src/types/index.ts` -- export `Genre { id: string; name: string }`, `MovieSummary { id: string; title: string; poster_url: string; year: number; rating: number; genres: string[] }`, `Movie { id: string; title: string; description: string; poster_url: string; backdrop_url: string; trailer_url: string; video_url: string; year: number; rating: number; cast: string; director: string; genres: Genre[] }` -- AR-9; contract cho toàn bộ epics sau; không thêm field nào chưa có trong schema
- [x] `supabase/migrations/001_initial_schema.sql` -- tạo `movies` (id uuid PK, title, description, poster_url, backdrop_url, trailer_url, video_url, year, rating, cast, director, created_at), `genres` (id uuid PK, name), `movie_genres` (movie_id FK, genre_id FK, PK composite), `watch_history` (id uuid PK, user_id TEXT, movie_id FK, progress_seconds INT, updated_at, UNIQUE(user_id, movie_id)), `watchlist` (id uuid PK, user_id TEXT, movie_id FK, created_at, UNIQUE(user_id, movie_id)); `ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY; ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;` -- AR-11
- [x] `.env.local` -- tạo template với 5 keys rỗng; append `.env.local` vào `.gitignore` nếu chưa có -- credential safety
- [x] `ARCHITECTURE-SPINE.md` -- append vào cuối section "Architecture Decisions": `### AR-13 — Testing strategy\n- **Decision:** Vitest + React Testing Library\n- **Rationale:** Tích hợp tốt với Vite toolchain, test theo cách user interact (role/label queries), bắt a11y bugs sớm. Playwright để ngỏ cho tương lai.\n- **Convention:** Story 1.1 chỉ install dependency; test thực viết từ Story 1.2 trở đi.` -- AR-13 prerequisite; file nằm tại `_bmad-output/planning-artifacts/architecture/architecture-bmad-landing-page-2026-10-13/ARCHITECTURE-SPINE.md`

**Acceptance Criteria:**
- Given setup hoàn tất, when `npm run dev`, then server khởi động tại localhost:3000 không có TypeScript errors
- Given `npx tsc --noEmit`, then 0 errors
- Given import `MovieSummary` từ `src/types/index.ts`, then field `genres` có type `string[]`; given import `Movie`, then `genres` có type `Genre[]`
- Given SQL migration chạy trên Supabase (`supabase db push` hoặc paste vào SQL editor), when kiểm tra dashboard, then 5 bảng tồn tại và RLS enabled trên `watch_history` và `watchlist`
- Given `src/middleware.ts` tồn tại, then `npx tsc --noEmit` không báo lỗi về file này
- Given `.env.local` tồn tại, then `git status` không hiện file này (bị gitignore)

## Design Notes

**Hai Supabase clients:** `server.ts` inject Clerk JWT để Supabase RLS có thể identify user — đây là pattern chính cho mọi non-admin route. `admin.ts` dùng service role key để bypass RLS hoàn toàn — chỉ dùng trong admin API routes để tránh security hole. Hai clients không thể hoán đổi cho nhau.

**Type split (AR-9):** `MovieSummary` dùng `genres: string[]` để render nhanh trong list/grid mà không cần join; `Movie` dùng `genres: Genre[]` cho detail page cần genre id. Conflate hai types sẽ làm vỡ contract từ Epic 2 trở đi.

**`middleware.ts` stub strategy:** Story 1.1 chỉ scaffold file với `publicRoutes: ['/']` để TypeScript compile. Story 1.3 extend với đầy đủ protected routes và admin role check. Nếu skip stub, Story 1.3 sẽ tạo file từ đầu mà không có context về routes đã có.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence |
|---|---|---|
| `client.ts` vs `server.ts` (HIGH) | false — spec đúng | ARCHITECTURE-SPINE.md line 173 dùng `server.ts`; epics.md có typo `client.ts` |
| BH-1: `.gitignore` bare `.env` entry suppresses `.env.example` | false | `.env` trong gitignore chỉ match filename chính xác `.env`, không match `.env.example` hay các variant khác |
| BH-2: `createAdminClient()` không có memoization | low → reject | Thực sự là inefficiency nhưng trong serverless mỗi invocation là module mới; fix cần thêm singleton pattern (not a direct correction); reject per low+complexity rule |
| BH-3: `server.ts` dùng "fragile fetch patching" | false | Code dùng `global.fetch` option chính thức của Supabase createClient — không phải monkey-patch toàn cục; đây là cách được khuyến nghị |
| BH-4: `middleware.ts` `auth.protect()` API sai | false | `auth.protect()` là API đúng của `@clerk/nextjs@7.9.x` (Clerk Core 2); `(await auth()).protect()` chỉ dùng trong Clerk Core 3 |
| BH-5: Không có RLS comment trên `movies`/`genres` | low → patch | Thiếu comment giải thích intentional public read; fix trivial (thêm SQL comment) |
| BH-6: ClerkProvider placement "ngoài `<html>`" | false | Pattern `<ClerkProvider><html>...</html></ClerkProvider>` là pattern chính thức của Clerk + Next.js App Router |
| BH-7: Thiếu `@testing-library/jest-dom` | medium → patch | `globals: true` cần jest-dom matchers khi Story 1.2 viết tests; thiếu package này sẽ làm hỏng RTL matchers; fix trivial |
| BH-8: `watchlist` không có UPDATE policy | false | Intentional design — watchlist chỉ add/remove, không update; khác với watch_history cần track progress |
| BH-9: `Movie.cast` là `string` không có delimiter convention | false | Spec và SQL schema đều định nghĩa `cast TEXT`/`cast: string`; implementation follow spec chính xác |
| BH-10: `epic-1-context.md` ghi AR-13 "currently deferred" nhưng đã resolved | low → patch | AR-13 được append vào ARCHITECTURE-SPINE.md trong cùng commit; context file cần update để tránh confuse |
| VG/ECH-7: Spec task dùng `authMiddleware` (deprecated) nhưng code đúng dùng `clerkMiddleware` | medium → patch | `authMiddleware` bị deprecated từ `@clerk/nextjs` v5+; code đúng nhưng spec task description sẽ mislead Story 1.3 author; fix: update spec task description |
| ECH-1: `admin.ts` thiếu guard cho missing env vars | low → defer | Env vars là manual prerequisites theo spec; thiếu guard là pattern phổ biến trong Next.js; không gây harm trong normal deployment |
| ECH-2: `server.ts` thiếu guard cho missing env vars | low → defer | Tương tự ECH-1; defer |
| ECH-3: `watch_history` UPDATE policy thiếu `WITH CHECK` | medium → patch | User có thể reassign `user_id` sang user khác qua UPDATE; USING chỉ check row cũ, không check giá trị mới; fix: thêm `WITH CHECK (user_id = (auth.jwt() ->> 'sub'))` |
| ECH-4: `progress_seconds` thiếu CHECK constraint cho negative | low → defer | Enhancement ngoài scope spec; defer sang future hardening |
| ECH-5: `rating` thiếu range constraint | low → defer | Enhancement ngoài scope spec; defer sang future hardening |
| ECH-6: `vitest.config.ts` `globals: true` nhưng `tsconfig.json` thiếu `"types": ["vitest/globals"]` | medium → patch | TypeScript sẽ không nhận `describe`/`it`/`expect` là globals khi test files được add trong Story 1.2; fix trivial: thêm types vào tsconfig |
| ECH-8: `.env.local` không có trong diff | false | File tồn tại trên disk; gitignored nên không xuất hiện trong git diff — không phải thiếu |

## Verification

**Commands:**
- `npm run dev` -- expected: server khởi động tại localhost:3000, không có compile error
- `npx tsc --noEmit` -- expected: 0 TypeScript errors
- `npm run build` -- expected: build thành công sau khi env vars được set

**Manual checks:**
- Supabase dashboard: 5 bảng tồn tại, RLS toggle ON trên `watch_history` và `watchlist`
- `git status` không hiện `.env.local`
- Vercel dashboard: preview deployment trigger thành công sau first push (post-setup manual check)
