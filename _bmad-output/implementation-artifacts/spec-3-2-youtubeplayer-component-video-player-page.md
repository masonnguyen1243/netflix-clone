---
title: 'YouTubePlayer Component & Video Player Page'
type: 'feature'
created: '2026-10-20'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '0e073e0d6f20b322195672893dd4c4af36476754'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Sau khi click "Xem ngay" từ trang detail, người dùng không thể xem phim — `/watch/[id]` là stub rỗng, không có YouTubePlayer, không có overlay controls, và tiến độ xem không được lưu.

**Approach:** Tạo `YouTubePlayer` dùng IFrame API SDK tại `components/player/`, tạo fullscreen watch page tại `/watch/[id]` với overlay controls tự ẩn sau 3s, thêm `POST /api/history/[id]/progress` lưu tiến độ mỗi 30s, và cập nhật `GET /api/movies/[id]` để trả về `progress_seconds` cho player seek khi load.

## Boundaries & Constraints

**Always:**
- YouTubePlayer dùng YouTube IFrame API SDK (`window.YT.Player`) — không dùng `<iframe>` trực tiếp, không `react-player`
- Player seek đến `initialSeconds` trong callback `onReady` (0 nếu null/undefined)
- Gọi `POST /api/history/[id]/progress` mỗi 30s qua `setInterval` trong `useEffect`; cleanup khi unmount
- `/watch/[id]`: `export const dynamic = 'force-dynamic'`; `/api/history/[id]/progress`: `export const dynamic = 'force-dynamic'`
- Progress API: lấy `userId` và `getToken` từ `auth()` (@clerk/nextjs/server); trả 401 nếu `!userId`; upsert dùng `onConflict: 'user_id,movie_id'`
- `createServerClient(getToken)` cho mọi write vào `watch_history` (RLS cần Clerk JWT); `createAnonClient()` chỉ cho read công khai
- `prefers-reduced-motion`: thêm `motion-reduce:transition-none` vào mọi transition của overlay
- Overlay controls: fade in khi mouse move / touch, auto-hide sau 3s bằng `setTimeout` + `useRef`; reset timer khi có activity mới
- Tất cả Supabase access qua `lib/supabase/`

**Never:**
- `react-player`, raw `<iframe>` cho video player
- Write trực tiếp vào `watch_history` từ page/client component (chỉ qua progress API)
- Lưu `progress_seconds` vào localStorage hay module-level state
- Thay đổi cache key hay logic của `getMovieById` — chỉ thêm query `progress_seconds` trong route handler

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Load watch page — có progress | Auth user, `progress_seconds=120` trong watch_history | Player seek đến 120s trong onReady | N/A |
| Load watch page — chưa xem | Auth user, không có row trong watch_history | Player bắt đầu từ 0s | N/A |
| Progress save — 30s tick | Player đang chạy | `POST /api/history/[id]/progress` với `{progress_seconds: N}` | Fetch fail → silent (không toast) |
| Progress API — unauthenticated | Không có Clerk session | 401 `{error:"Chưa đăng nhập",code:"UNAUTHORIZED"}` | N/A |
| Progress API — success | JWT hợp lệ, movie_id hợp lệ | Upsert watch_history; 200 `{data:{progress_seconds:N}}` | N/A |
| GET movie — authenticated | JWT hợp lệ | `{data:{...movie, progress_seconds:N}}` | N/A |
| GET movie — unauthenticated | Không có session | `{data:{...movie, progress_seconds:0}}` (không break existing behavior) | N/A |
| Overlay idle 3s | Không có activity | Controls fade out | N/A |
| prefers-reduced-motion | OS setting on | Không có transition/fade animation | N/A |

</frozen-after-approval>

## Code Map

- `src/components/player/YouTubePlayer.tsx` — TẠO MỚI: `'use client'`; load YT IFrame API script; props: `videoId: string, initialSeconds: number, onTimeUpdate: (s: number) => void`
- `src/app/(viewer)/watch/[id]/page.tsx` — TẠO MỚI: Server Component, `force-dynamic`; gọi `auth()` + `getMovieById` + query `watch_history` progress; truyền xuống `WatchPageClient`
- `src/app/(viewer)/watch/[id]/WatchPageClient.tsx` — TẠO MỚI: `'use client'`; fullscreen layout; overlay controls với auto-hide; setInterval 30s progress save
- `src/app/(viewer)/watch/[id]/loading.tsx` — TẠO MỚI: skeleton dark screen
- `src/app/api/history/[id]/progress/route.ts` — TẠO MỚI: POST, `force-dynamic`; `auth()` → upsert `watch_history` qua `createServerClient`
- `src/app/api/movies/[id]/route.ts` — SỬA: thêm query `progress_seconds` từ `watch_history` nếu user auth; merge vào response
- `src/lib/supabase/server.ts` — REUSE `createServerClient(getToken)` — KHÔNG SỬA
- `src/lib/movieData.ts` — REUSE `getMovieById` — KHÔNG SỬA
- `src/middleware.ts` — KHÔNG SỬA: `/watch/*` và `/api/history/*` đã protected
- `src/app/globals.css` — REUSE: `bg-background` = `#0a0a0a`, `bg-surface` cho skeleton

## Tasks & Acceptance

**Execution:**
- [x] `src/components/player/YouTubePlayer.tsx` — TẠO MỚI `'use client'`: `useEffect` load script `https://www.youtube.com/iframe_api` một lần (guard bằng `window.YT`); đặt `window.onYouTubeIframeAPIReady` callback; sau khi API ready, `new window.YT.Player(divRef.current, { videoId, playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1 }, events: { onReady: e => { e.target.seekTo(initialSeconds, true); setInterval(() => onTimeUpdate(Math.floor(e.target.getCurrentTime())), 1000) } } })`; cleanup `.destroy()` khi unmount; render `<div ref={divRef} className="w-full h-full" />`; extract `videoId` từ `video_url` nếu là full URL (parse `?v=` param)
- [x] `src/app/(viewer)/watch/[id]/WatchPageClient.tsx` — TẠO MỚI `'use client'`: props `{ movie: Movie & { progress_seconds: number } }`; `const [currentTime, setCurrentTime] = useState(0)`; `const [visible, setVisible] = useState(true)`; `const timerRef = useRef<ReturnType<typeof setTimeout>>()`; `handleActivity`: `setVisible(true)`, clear + reset timeout 3000ms → `setVisible(false)`; `useEffect` gắn `mousemove` / `touchstart` listener trên `window`, cleanup; `useEffect` `setInterval(30000)`: `fetch('/api/history/${movie.id}/progress', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ progress_seconds: Math.floor(currentTime) }) })` — silent on error; cleanup; layout: `<div className="fixed inset-0 bg-background overflow-hidden" onMouseMove={handleActivity} onTouchStart={handleActivity}>`; `<YouTubePlayer videoId={movie.video_url} initialSeconds={movie.progress_seconds} onTimeUpdate={setCurrentTime} />`; overlay top `<div className={cn("absolute inset-x-0 top-0 p-4 flex items-center gap-4 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 motion-reduce:transition-none", visible?"opacity-100":"opacity-0 pointer-events-none")}>`: `<Link href={/movie/${movie.id}} className="text-white text-2xl focus:ring-2 focus:ring-primary rounded">←</Link>` + `<span className="text-white font-medium">{movie.title ?? ""}</span>`
- [x] `src/app/(viewer)/watch/[id]/page.tsx` — TẠO MỚI: `export const dynamic = 'force-dynamic'`; `const { userId, getToken } = await auth()`; `const movie = await getMovieById(params.id)` → `notFound()` nếu null; query `progress_seconds`: nếu `userId`, `createServerClient(() => getToken({ template: 'supabase' }))` → `.from('watch_history').select('progress_seconds').eq('user_id', userId).eq('movie_id', params.id).maybeSingle()` → default 0; render `<main className="fixed inset-0"><WatchPageClient movie={{ ...movie, progress_seconds }} /></main>`
- [x] `src/app/(viewer)/watch/[id]/loading.tsx` — TẠO MỚI: `<div className="fixed inset-0 bg-background animate-pulse motion-reduce:animate-none" />`
- [x] `src/app/api/history/[id]/progress/route.ts` — TẠO MỚI: `export const dynamic = 'force-dynamic'`; `const { userId, getToken } = await auth()`; `if (!userId) return Response.json({ error: 'Chưa đăng nhập', code: 'UNAUTHORIZED' }, { status: 401 })`; parse `{ progress_seconds }` từ `req.json()`; `createServerClient(() => getToken({ template: 'supabase' }))` → `.from('watch_history').upsert({ user_id: userId, movie_id: params.id, progress_seconds, updated_at: new Date().toISOString() }, { onConflict: 'user_id,movie_id' })`; trả `{ data: { progress_seconds } }`; try/catch → 500 `{ error: 'Lỗi máy chủ', code: 'INTERNAL_ERROR' }`
- [x] `src/app/api/movies/[id]/route.ts` — SỬA: sau khi `getMovieById` thành công, `const { userId, getToken } = await auth()`; nếu `userId`: query `watch_history` `select('progress_seconds').eq('user_id', userId).eq('movie_id', params.id).maybeSingle()` dùng `createServerClient`; `progress_seconds = data?.progress_seconds ?? 0`; trả `{ data: { ...movie, progress_seconds } }`; nếu không auth: `progress_seconds = 0`; giữ nguyên error handling hiện tại
- [x] `src/app/api/history/[id]/progress/route.test.ts` — TẠO MỚI: mock `@clerk/nextjs/server` và `@/lib/supabase/server`; test 401 khi `userId` null; test 200 + upsert shape khi auth; test 500 khi supabase throw
- [x] `src/app/api/movies/[id]/route.test.ts` — SỬA: thêm test: unauthenticated → `progress_seconds: 0` trong data; authenticated → `progress_seconds: N` trong data

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence | Route |
|---------|---------|----------|-------|
| `WatchPageClient.tsx:63-72` — `currentTime` trong dependency array của setInterval useEffect gây reset interval mỗi giây, progress không bao giờ được lưu khi đang xem | high | Diff xác nhận: `[movie.id, currentTime]` là deps, `currentTime` update mỗi giây → interval bị restart trước khi fire | patch |
| `api/history/[id]/progress/route.ts:285` — `progress_seconds` từ request body không validate, giá trị NaN/null/âm có thể ghi vào DB | medium | Diff xác nhận không có validation trước khi pass vào upsert | patch |
| `WatchPageClient.tsx` — duplicate listeners: `window.addEventListener(mousemove/touchstart)` trong useEffect lẫn JSX `onMouseMove`/`onTouchStart` trên fullscreen div | low | Diff xác nhận cả hai tồn tại; handleActivity chạy 2 lần/event nhưng behavior giống nhau | patch |
| `YouTubePlayer.tsx` `extractVideoId` — không có test coverage cho URL parsing | low | Verification-gap pre-verified: không có test file nào cover extractVideoId | patch |
| `extractVideoId` không handle `youtu.be` hay `/embed/` paths | false | Spec explicitly prescribes "parse `?v=` param" — implementation đúng spec | rejected |
| Concurrent players overwrite `window.onYouTubeIframeAPIReady` | low | Watch page fullscreen chỉ có 1 player; fix thêm complexity → rejected | rejected |
| Leaked interval khi `videoId` thay đổi trong khi onReady pending | low | `videoId` không thay đổi trên watch page (fixed từ server render) → rejected | rejected |
| `WatchPage` page.tsx — auth() failure không có try/catch, gây 500 thay vì fallback | medium | Real nhưng là architectural decision về Next.js error boundary scope | defer |
| `params.id` không validate UUID trước khi upsert | maybe-false | Pre-existing pattern; Supabase FK constraint sẽ reject nếu invalid movie_id | defer |

## Verification

**Commands:**
- `pnpm vitest run src/app/api/history src/app/api/movies/[id]` -- expected: all tests pass
- `pnpm tsc --noEmit` -- expected: no type errors
