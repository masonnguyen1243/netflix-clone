---
title: 'Story 4.1: Watchlist API & WatchlistButton Component'
type: 'feature'
created: '2026-10-21'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '772574f6dcbbcbd3b9df79f0ffd362649ef56796'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `WatchlistButton` tồn tại dưới dạng stub bị disabled — không có props, không gọi API, bookmark icon không đổi trạng thái. Chưa có API endpoint watchlist nào; MovieCard, HeroBanner, Movie Detail page không kết nối với bảng `watchlist` trong Supabase.

**Approach:** Tạo `GET /api/watchlist` và `POST /api/watchlist/[id]` (toggle insert/delete), cài `sonner` để hiển thị toast, implement `WatchlistButton` đầy đủ với optimistic update + rollback, rồi wire nó vào MovieCard, HeroBanner, và Movie Detail page.

## Boundaries & Constraints

**Always:**
- Tất cả API routes: `export const dynamic = 'force-dynamic'`
- Auth: `auth()` từ `@clerk/nextjs/server`; Supabase client: `createServerClient(() => getToken({ template: 'supabase' }))` từ `@/lib/supabase/server`
- WatchlistButton dùng `useState` + native `fetch`; optimistic update + rollback on error
- Unauthenticated call → HTTP 401 `{ error: "Chưa đăng nhập", code: "UNAUTHORIZED" }`
- Success response: `{ data: T }`; error: `{ error: string, code?: string }`

**Never:**
- Không thêm state management library (TanStack Query, Redux, Zustand, v.v.)
- Không fetch initial watchlist state trong MovieCard/HeroBanner (đưa `initialInWatchlist={false}` cho Story 4.1; Stories 4.4 sẽ xử lý list-level state)
- Không sửa Supabase schema hay migration (bảng `watchlist` đã tồn tại với RLS đúng)
- Không sửa middleware

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output | Error Handling |
|----------|--------------|-----------------|----------------|
| Toggle: thêm vào watchlist | POST `/api/watchlist/[id]`, auth, movie chưa trong watchlist | INSERT row, `{ data: { movieId, inWatchlist: true } }` | 500 nếu DB lỗi |
| Toggle: xóa khỏi watchlist | POST `/api/watchlist/[id]`, auth, movie đã trong watchlist | DELETE row, `{ data: { movieId, inWatchlist: false } }` | 500 nếu DB lỗi |
| GET watchlist | `GET /api/watchlist`, auth | `{ data: MovieSummary[] }` sorted by `created_at` desc | 500 nếu DB lỗi |
| Unauthenticated | POST hoặc GET, không có userId | HTTP 401 `{ error: "Chưa đăng nhập", code: "UNAUTHORIZED" }` | — |
| WatchlistButton: add thành công | Click khi chưa trong watchlist | Optimistic fill amber → toast "Đã thêm vào danh sách" 2s | Rollback + toast lỗi nếu API fail |
| WatchlistButton: remove thành công | Click khi đã trong watchlist | Optimistic outline → toast "Đã xóa" 2s | Rollback + toast lỗi nếu API fail |
| API fail | Fetch trả error | Rollback UI về trạng thái trước | Toast "Không tải được. Thử lại." |

</frozen-after-approval>

## Code Map

- `src/components/movie/WatchlistButton.tsx` — STUB hiện tại: `disabled` button, không có props; cần implement đầy đủ
- `src/app/api/watchlist/route.ts` — CREATE: GET endpoint
- `src/app/api/watchlist/[id]/route.ts` — CREATE: POST toggle endpoint
- `src/components/movie/MovieCard.tsx` — MODIFY: thay bookmark SVG tĩnh bằng `<WatchlistButton>`; là server component, không cần `"use client"`
- `src/components/movie/HeroBanner.tsx` — MODIFY: thêm `"use client"`, thay static button bằng `<WatchlistButton>`; hiện là server component không có server-only code
- `src/app/(viewer)/movie/[id]/page.tsx` — MODIFY: server-fetch trạng thái watchlist cho movie này, truyền `initialInWatchlist` vào WatchlistButton
- `src/app/api/history/[id]/progress/route.ts` — REUSE pattern; không sửa
- `src/lib/supabase/server.ts` — REUSE `createServerClient`; không sửa
- `src/types/index.ts` — `MovieSummary` đã định nghĩa, dùng cho GET response

## Tasks & Acceptance

**Execution:**
- [x] `package.json` — INSTALL `sonner` — dự án chưa có toast library
- [x] `src/app/layout.tsx` (hoặc root layout) — ADD `<Toaster />` từ `sonner` vào providers
- [x] `src/app/api/watchlist/route.ts` — CREATE: `export const dynamic = 'force-dynamic'`; `auth()` → nếu không có userId 401; query `watchlist` JOIN `movies` SELECT all fields cho user hiện tại sorted by `created_at` desc; map sang `MovieSummary[]`; return `{ data }`
- [x] `src/app/api/watchlist/[id]/route.ts` — CREATE POST: `auth()` → 401 nếu chưa auth; check `SELECT id FROM watchlist WHERE user_id=userId AND movie_id=params.id`; nếu tồn tại → DELETE; nếu không → INSERT; return `{ data: { movieId: params.id, inWatchlist: boolean } }`; try/catch → 500
- [x] `src/components/movie/WatchlistButton.tsx` — IMPLEMENT `"use client"`: props `{ movieId: string, initialInWatchlist?: boolean }`; `const [inWatchlist, setInWatchlist] = useState(initialInWatchlist ?? false)`; `const [isLoading, setIsLoading] = useState(false)`; onClick: guard nếu loading, optimistic toggle state, `fetch('/api/watchlist/${movieId}', { method: 'POST' })`; on success parse json và confirm state từ `data.inWatchlist`; on success toast (sonner `toast()`) "Đã thêm vào danh sách" hoặc "Đã xóa"; on error rollback state + toast "Không tải được. Thử lại."; `aria-label` = "Thêm vào danh sách" / "Đã lưu"; bookmark SVG fill amber khi `inWatchlist`, outline khi không; `disabled={isLoading}`
- [x] `src/components/movie/MovieCard.tsx` — MODIFY: xóa static bookmark SVG, import và render `<WatchlistButton movieId={movie.id} />` ở góc trên phải
- [x] `src/components/movie/HeroBanner.tsx` — MODIFY: thêm `"use client"` directive; xóa static "Thêm vào danh sách" button; import và render `<WatchlistButton movieId={movie.id} />` bên cạnh "Xem ngay" button
- [x] `src/app/(viewer)/movie/[id]/page.tsx` — MODIFY: sau khi `auth()`, nếu `userId`: query `SELECT id FROM watchlist WHERE user_id=userId AND movie_id=params.id LIMIT 1` dùng `createServerClient`; `initialInWatchlist = !!data`; truyền `initialInWatchlist` vào `<WatchlistButton movieId={movie.id} initialInWatchlist={initialInWatchlist} />`
- [x] `src/app/api/watchlist/route.test.ts` — CREATE: mock `@clerk/nextjs/server` và `@/lib/supabase/server`; test 401 khi `userId` null; test 200 + shape `{ data: MovieSummary[] }` khi auth; test 500 khi Supabase throw
- [x] `src/app/api/watchlist/[id]/route.test.ts` — CREATE: test 401 khi không auth; test toggle INSERT (movie chưa trong list → `inWatchlist: true`); test toggle DELETE (movie đã trong list → `inWatchlist: false`); test 500 khi Supabase throw

**Acceptance Criteria:**
- Given user đã đăng nhập, When click bookmark trên MovieCard hoặc HeroBanner, Then icon đổi trạng thái optimistically, toast hiện đúng message ("Đã thêm" / "Đã xóa") 2s
- Given Movie Detail page load bởi user đã bookmark movie này, When page render, Then WatchlistButton hiển thị filled amber (initialInWatchlist=true từ server)
- Given API call thất bại, When error returned, Then UI roll back về trạng thái trước + toast "Không tải được. Thử lại."
- Given unauthenticated request, When POST /api/watchlist/[id] called, Then HTTP 401 `{ error: "Chưa đăng nhập", code: "UNAUTHORIZED" }`
- Given authenticated user, When GET /api/watchlist, Then `{ data: MovieSummary[] }` của các phim đã lưu

## Design Notes

**HeroBanner client boundary:** HeroBanner hiện là server component nhưng không có server-only code (không fetch data, không dùng cookies trực tiếp). Thêm `"use client"` là đủ — không cần tạo wrapper component riêng.

**MovieCard bookmark placement:** WatchlistButton thay thế bookmark SVG tĩnh ở góc trên phải card, hiển thị khi hover hoặc khi đã trong watchlist (theo UX-DR3). WatchlistButton là `"use client"` boundary riêng — MovieCard server component có thể render nó trực tiếp.

**Initial state cho list views:** MovieCard và HeroBanner nhận `initialInWatchlist` mặc định `false`. Nghĩa là khi user quay lại home page, các card đã bookmark chưa hiện filled cho đến khi user toggle. Đây là scope được chấp nhận cho Story 4.1 — Story 4.4 (My List) sẽ giải quyết list-level state.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| # | Finding | Verdict | Evidence | Route |
|---|---------|---------|----------|-------|
| A | `route.ts GET:44-54` — `row.movies` null (broken FK) crashes map, returns 500 for all | medium | Supabase join returns null when movie deleted; `const m = row.movies; m.id` throws TypeError; outer catch returns 500 for entire response | patch |
| B | `MovieCard.tsx` — `e.preventDefault()` without `stopPropagation()` in wrapper div | false | `preventDefault()` stops `<a>` navigation; stopPropagation not needed; browsers don't fire keyboard link-nav from a button inside an anchor | reject |
| C | `page.test.tsx` — `initialInWatchlist` server fetch untested; `auth()` and Supabase not mocked | medium | WatchlistButton mock ignores props; wrong query or missing query would go undetected; auth() not mocked — any userId path is unverified | patch |
| D | `HeroBanner.test.tsx` — movieId prop forwarding unverified | low | TypeScript already guards wrong prop types; regression probability low; fix adds spy complexity | reject-low |
| E | `[id]/route.test.ts` — DELETE mock: `mockReturnValue` overwrites `mockResolvedValue`; chain resolves synchronously, not as Promise | medium | `mockDeleteEq` returns `{eq:mockDeleteEq}` sync; `await` of non-Promise yields object; `deleteError=undefined`; test passes for wrong reason | patch |
| F | GET route — `any` types on `row` and `m` | low | Real but cosmetic; proper Supabase join typing requires schema generation | reject-low |
| G | POST route — no UUID validation on `params.id` | low | Supabase parameterized queries prevent injection; DB FK rejects invalid UUIDs; returns 500 correctly | reject-low |
| H | `tsx` lockfile version pinning | false | tsx was already in devDeps at `^4.0.0` before this change; lock at 4.23.15 is normal semver resolution | reject |
| I | HeroBanner `"use client"` breaks server pipeline | false | HeroBanner had no server-only code before; spec Design Notes explicitly approve this approach | reject |
| J | Empty `movieId` → POST to wrong route | false | `!res.ok` on 405 triggers rollback; error is handled correctly | reject |
| K | 401 returns same toast as 500 (no sign-in prompt) | — | Pre-existing scope decision; spec matrix does not differentiate client toast for 401 vs 500 | defer |
| L | Concurrent POST race on INSERT → unique-constraint 500 | maybe-false (medium if verified) | Real under concurrency but rare; fix requires upsert or conflict handling; not caused by this story's design | defer |
| M | `MovieCard.test.tsx` SVG test finds wrong SVG after refactor | low | Test still passes; misleading but no user-facing gap; fix adds complexity | reject-low |
| N | `WatchlistButton` component has no React unit tests | — | Spec only requested route tests; optimistic update/rollback/toast logic untested; out of Story 4.1 scope | defer |
| O | `route.test.ts GET` — `mockEq` called but eq("user_id", userId) args never asserted; dropping the user filter passes tests silently | medium | Line 37 `mockEq.mockReturnValue({ order: mockOrder, eq: mockEq })`; test checks response shape but not that eq was called with correct column+value; a regression removing the user_id filter exposes all users' watchlists | patch |
| P | `page.test.tsx` — `mockEq` argument values unasserted for watchlist SELECT; wrong column names or swapped user_id/movie_id pass undetected | medium | Lines 165, 182 set up mockEq chain but never call `expect(mockEq).toHaveBeenCalledWith`; swapped eq args would serve wrong user's data | patch |
| Q | `MovieCard.tsx` — wrapper div `opacity-0 group-hover:opacity-100` never shows button when `inWatchlist=true` on non-hover card; contradicts Design Notes "hiển thị khi hover hoặc khi đã trong watchlist" | medium | Line 56: `className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 ..."`; no CSS exception for saved state; when `inWatchlist` becomes true, filled amber bookmark invisible until hover | patch |
| R | `MovieCard.test.tsx` — WatchlistButton rendered unmocked; movieId prop forwarding unverified (VG pre-verified) | medium | VG layer read test file: no `vi.mock("@/components/movie/WatchlistButton")`, no assertion on movieId value; dropping `movieId={id}` from MovieCard would POST to `/api/watchlist/undefined` — no test catches it | patch |
| S | `[id]/route.test.ts` — `mockDeleteEq` declared in `vi.hoisted()` block (line 11, 15, 29) but never used in any test; DELETE test uses local `mockDeleteEqFinal`/`mockDeleteEqFirst` instead | low | Dead hoisted mock; confuses test intent and masks that the DELETE chain test does not use the hoisted mock at all | patch |
| T | `watchlist/route.ts` and `watchlist/[id]/route.ts` — `getToken({ template: 'supabase' })` may return null if Clerk JWT template not configured; null passed to `createServerClient` factory with no guard | maybe-false (medium if true) | Both routes call `createServerClient(() => getToken({ template: 'supabase' }))` without null check; if token is null, Supabase client may use anon key, bypassing RLS or exposing data; depends on `createServerClient` impl + RLS config outside this diff; pre-existing pattern in all routes | defer |
| U | `WatchlistButton.tsx` — `res.json()` not guarded; if server returns ok with malformed body, json parse throws into catch, triggering rollback despite successful server write | low | Extremely unlikely: all API routes use `Response.json()` which always produces valid JSON; infrastructure anomaly required; fix adds a `.catch(() => null)` wrapper | reject-low |
| V | `HeroBanner.tsx` — missing comment explaining intentional `"use client"` conversion for future developers | low | Cosmetic; Design Notes in spec already document rationale; code reviewers can see the directive directly | reject-low |
| W | POST route — missing 404/422 when `movieId` is valid UUID but movie not in `movies` table (FK violation → generic 500) | low | FK constraint rejects → 500 is correct per spec; client shows "Không tải được. Thử lại." — acceptable; adding 404 branch adds surface not in spec intent | reject-low |
| X | `GET /api/watchlist route` — Supabase rows with null `movies` (broken FK) silently filtered with no error log | low | Line 47: `if (!m) return null`; data is filtered correctly; FK constraints prevent broken refs in practice; logging gap but not a user-visible defect | reject-low |

## Verification

**Commands:**
- `npm run build` — expected: no TypeScript errors, clean build
- `npm test -- --testPathPattern="watchlist"` — expected: all watchlist route tests pass
