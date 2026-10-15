---
title: 'Story 2.1: Supabase Seed & Movie API Routes'
type: 'feature'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
context: []
baseline_commit: '1343d6fb510cb1bd066cf50799140835b142ece4'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Giao diện Epic 2 không thể render vì DB đang trống và tất cả endpoint trong `src/app/api/` chỉ là placeholder `.gitkeep` — chưa có dữ liệu phim lẫn API hoạt động.

**Approach:** Tạo seed script TypeScript để thêm ≥10 phim vào Supabase, sau đó implement 3 API route: `GET /api/movies` (toàn bộ + search), `GET /api/genres`, và `POST /api/admin/movies` (chỉ admin).

## Boundaries & Constraints

**Always:**
- Response convention: `{ data: T }` thành công, `{ error: string, code?: string }` lỗi; HTTP 401/403/404/422
- `GET /api/movies` dùng ISR `revalidate=60`; `GET /api/movies?q=` dùng `no-store`
- Supabase client chỉ import từ `lib/supabase/` — không import trực tiếp ở nơi khác
- Admin check: `publicMetadata.role === 'admin'` từ Clerk JWT via `auth()` — không query DB
- `POST /api/admin/movies` phải gọi `revalidateTag('movies')` sau insert thành công
- `MovieSummary` type (`genres: string[]`) cho `GET /api/movies` và `GET /api/genres`

**Never:**
- Không implement UI hay component trong story này
- Không dùng `admin.ts` client cho public/user routes
- Không implement PATCH/DELETE `/api/admin/movies` (dành cho Epic 5)

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lấy tất cả phim | `GET /api/movies`, không auth | `{ data: MovieSummary[] }` HTTP 200, ISR revalidate=60 | `{ error: "..." }` HTTP 500 nếu DB lỗi |
| Tìm kiếm phim | `GET /api/movies?q=inception` | `{ data: MovieSummary[] }` lọc title case-insensitive, `no-store` | `{ error: "..." }` HTTP 500 |
| Query rỗng | `GET /api/movies?q=` | Trả về toàn bộ phim (bỏ qua filter rỗng) | N/A |
| Lấy genres | `GET /api/genres` | `{ data: Genre[] }` HTTP 200 | `{ error: "..." }` HTTP 500 |
| Thêm phim — admin hợp lệ | `POST /api/admin/movies` với JWT role=admin | `{ data: Movie }` HTTP 201, `revalidateTag('movies')` kích hoạt | `{ error: "..." }` HTTP 400 nếu thiếu field |
| Thêm phim — không auth | `POST /api/admin/movies`, không JWT | `{ error: "Unauthorized" }` HTTP 401 | N/A |
| Thêm phim — không phải admin | `POST /api/admin/movies`, JWT role ≠ admin | `{ error: "Unauthorized" }` HTTP 401 | N/A |

</frozen-after-approval>

## Code Map

- `src/types/index.ts` — Định nghĩa `Genre`, `MovieSummary`, `Movie` đã hoàn chỉnh — KHÔNG sửa
- `src/lib/supabase/server.ts` — Clerk JWT client — dùng để verify auth trong admin route (`auth()` từ `@clerk/nextjs/server` để lấy `sessionClaims`); **KHÔNG dùng cho genres route** vì genres là public route không cần Clerk JWT
- `src/lib/supabase/admin.ts` — Service role client — dùng trong seed script và `POST /api/admin/movies` **chỉ** — **KHÔNG dùng** cho `GET /api/genres` hay bất kỳ public route nào
- `src/app/api/movies/route.ts` — Tạo mới (hiện `.gitkeep`); xóa `.gitkeep` khi tạo
- `src/app/api/genres/route.ts` — Tạo mới (hiện `.gitkeep`); xóa `.gitkeep` khi tạo — dùng Supabase anon client trực tiếp (`createClient(url, anonKey)`) vì genres không có RLS
- `src/app/api/admin/movies/route.ts` — Tạo mới (hiện `.gitkeep`); xóa `.gitkeep` khi tạo
- `scripts/seed.ts` — Tạo mới; dùng admin client, truncate `movie_genres` → `movies` → `genres` trước khi insert (idempotent); **IDs phải là UUID hợp lệ** — dùng `crypto.randomUUID()` cho tất cả movie và genre IDs
- `package.json` — Thêm `"seed": "npx tsx scripts/seed.ts"` và `"tsx": "^4.0.0"` vào devDependencies

## Schema Constraints (critical)

```
movies:   id UUID, title NOT NULL, description NOT NULL, poster_url NOT NULL,
          backdrop_url NOT NULL, trailer_url NOT NULL, video_url NOT NULL,
          year NOT NULL, rating NOT NULL, cast NOT NULL, director NOT NULL
genres:   id UUID, name NOT NULL UNIQUE
movie_genres: movie_id UUID FK, genre_id UUID FK
```

- `id` là UUID — không dùng string tuỳ ý như "m1", "g1"
- `backdrop_url`, `trailer_url`, `video_url`, `cast` là NOT NULL — dùng empty string `""` nếu không có giá trị

## Tasks & Acceptance

**Execution:**
- [x] `scripts/seed.ts` — Tạo seed script: import admin client; truncate `movie_genres`, `movies`, `genres` theo thứ tự; dùng `crypto.randomUUID()` cho tất cả IDs; insert ≥10 phim với đầy đủ poster TMDB, trailer YouTube, video YouTube (có thể khác trailer), cast, director, year, rating, description; insert genres; build và insert `movie_genres` dùng IDs đã tạo
- [x] `package.json` — Thêm `"seed": "npx tsx scripts/seed.ts"` vào phần `scripts`; thêm `"tsx": "^4.0.0"` vào `devDependencies`
- [x] `src/app/api/movies/route.ts` — `GET`: dùng `unstable_cache` với `tags: ["movies"]` và `revalidate: 60` cho path không có `q`; dùng LEFT JOIN (không phải `!inner`) để bao gồm phim không có genre; nếu `q` có giá trị, filter `ilike` và set `Cache-Control: no-store`; escape `%` và `_` trong `q` trước khi dùng ilike
- [x] `src/app/api/genres/route.ts` — `GET`: dùng anon Supabase client trực tiếp (`createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)`) — KHÔNG dùng createAdminClient; query `genres` tất cả rows, return `{ data: Genre[] }`
- [x] `src/app/api/admin/movies/route.ts` — `POST`: dùng `auth()` verify `sessionClaims.publicMetadata.role === 'admin'` (401 nếu fail); dùng admin client insert vào `movies` với các NOT NULL fields (backdrop_url/trailer_url/video_url/cast default `""`); nếu movie insert thành công nhưng movie_genres insert thất bại, delete movie đã insert trước khi return 500 (không để orphaned row); gọi `revalidateTag('movies')` sau khi tất cả inserts thành công; return `{ data: Movie }` HTTP 201

**Acceptance Criteria:**
- Sau khi chạy `npm run seed`, bảng `movies` có ≥10 rows với đầy đủ poster_url, trailer_url, video_url, các genres liên kết trong `movie_genres`
- `GET /api/movies` trả về `{ data: MovieSummary[] }` HTTP 200; mỗi item có `id, title, poster_url, year, rating, genres: string[]`
- `GET /api/movies?q=<term>` trả về chỉ phim có title khớp case-insensitive; response header `Cache-Control: no-store`
- `GET /api/genres` trả về `{ data: Genre[] }` HTTP 200
- `POST /api/admin/movies` với JWT admin hợp lệ trả về `{ data: Movie }` HTTP 201 và `GET /api/movies` trên request tiếp theo phản ánh phim mới
- `POST /api/admin/movies` thiếu auth hoặc không có role admin trả về `{ error: "Unauthorized" }` HTTP 401

## Design Notes

**ISR + revalidateTag com Supabase SDK:**
O Supabase client SDK não passa pelo cache do Next.js automaticamente — `export const revalidate = 60` sozinho não basta. A solução correta:

```ts
// src/app/api/movies/route.ts
import { unstable_cache } from 'next/cache';

const getCachedMovies = unstable_cache(
  async () => { /* query supabase */ },
  ['movies-list'],
  { revalidate: 60, tags: ['movies'] }
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (q) {
    // query diretamente sem cache, retornar com no-store
    const movies = await queryMovies(q);
    return NextResponse.json({ data: movies }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  }
  const movies = await getCachedMovies();
  return NextResponse.json({ data: movies });
}
```

`POST /api/admin/movies` chỉ cần gọi `revalidateTag('movies')` từ `next/cache` sau insert.

## Implementation Notes

- `unstable_cache` dùng thay cho `export const revalidate` vì Supabase SDK không tự đi qua Next.js fetch cache. Tag `movies` + `revalidate: 60` cho path không có `?q`.
- `revalidateTag('movies', { expire: 0 })` dùng trong admin POST (Next.js 16 yêu cầu second argument).
- Test coverage: 39 tests pass — tất cả 7 matrix rows được cover. Tests dùng vitest + vi.mock, không cần live Supabase.
- `tsx` chưa có trong devDependencies — `npx tsx` tự install lần đầu. Recommend thêm `npm install -D tsx`.

## Review Triage Log

| # | Finding | Verdict | Evidence | Route |
|---|---------|---------|----------|-------|
| 1 | Seed dùng string IDs "m1","g1" cho UUID PK columns | high | Schema: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` — "m1" không phải UUID hợp lệ; seed sẽ fail hoàn toàn | bad_spec |
| 2 | `GET /api/genres` dùng `createAdminClient()` vi phạm spec "Never" | high | admin.ts JSDoc: "Chỉ import trong app/api/admin/**"; spec Never: "Không dùng admin.ts client cho public/user routes" | bad_spec |
| 3 | Admin route set `backdrop_url/cast/trailer_url/video_url ?? null` nhưng schema NOT NULL | high | Schema: tất cả 4 fields là TEXT NOT NULL; insert null sẽ fail DB constraint | bad_spec |
| 4 | `revalidateTag("movies", { expire: 0 })` second argument | false | type-check 0 lỗi; Next.js 16 types chấp nhận second argument | — |
| 5 | `trailer_url = video_url` trong seed data | low | Seed demo data — cùng YouTube URL phổ biến trong demo app | reject (low, không gặp trong dev thông thường) |
| 6 | Không có sort order trong movies API | low | Spec không yêu cầu ordering | defer |
| 7 | `!inner` join loại trừ phim không có genre | medium | POST có thể tạo phim với genre_ids:[] — phim đó không xuất hiện trong GET | moot (bad_spec loopback) |
| 8 | ilike không escape wildcards % và _ | medium | User query chứa % được DB interpret là wildcard | moot (bad_spec loopback) |
| 9 | `any` casts trong movies route | low | TypeScript limitation cho deep Supabase joins; không ảnh hưởng runtime | reject (low, fix phức tạp) |
| 10 | `tsx` thiếu trong devDependencies | low | npx tsx auto-download; fragile trong CI | moot (bad_spec loopback) |
| 11 | Test POST dùng genre_ids:[] không cover genre insertion branch | medium | Branch movie_genres insert chưa được test | moot (bad_spec loopback) |
| 12 | `MovieSummary.genres` chưa được assert trong GET tests | medium | Tests kiểm tra body.data là array nhưng không kiểm tra item shape | moot (bad_spec loopback) |
| 13 | `buildSupabaseChain` helper định nghĩa nhưng không dùng trong test | low | Dead code | moot (bad_spec loopback) |
| 14 | Orphaned movie khi movie_genres insert thất bại | medium | Movie tồn tại trong DB nhưng response trả về 500 | moot (bad_spec loopback) |
| 15 | Genre fetch silent failure → genres:[] trong 201 response | medium | Caller nhận HTTP 201 với genres rỗng dù genres đã associate | moot (bad_spec loopback) |
| 16 | Design Notes viết bằng tiếng Bồ Đào Nha | cosmetic | Language inconsistency trong spec | reject (fix đòi hỏi edit spec này) |
| 17 | createAdminClient() có thể throw synchronous trong seed | maybe-false | Supabase createClient ít khi throw sync; error bắt được ở first DB call | defer |
| 18 | `!year`/`!rating` falsy khi = 0 | low | year=0 và rating=0 không thực tế | reject |
| 19 | genre_ids không validate element types | low | Type mismatch gây 500 (acceptable cho invalid input) | reject |

**Iteration 2 findings:**

| # | Finding | Verdict | Evidence | Route |
|---|---------|---------|----------|-------|
| 20 | Seed nil-UUID sentinel `.neq("id","00000000...")` | false | `crypto.randomUUID()` không bao giờ tạo nil UUID; pattern an toàn | — |
| 21 | request.url malformed → TypeError uncaught trong movies GET | false | Next.js luôn cung cấp valid URL trong Request object trước khi reach route handler | — |
| 22 | Rollback delete không kiểm tra lỗi (line 82 admin route) | medium | Nếu delete fails, orphaned movie tồn tại nhưng không có log/warning | patch |
| 23 | genres fetch error bị bỏ qua → 201 với genres:[] sai | medium | `const { data: genreData }` không capture error; 201 response trả genres sai | patch |
| 24 | movies route và genres route import `createClient` trực tiếp từ `@supabase/supabase-js` vi phạm "Always" constraint | medium | "Supabase client chỉ import từ lib/supabase/" nhưng cả 2 routes import trực tiếp | patch |
| 25 | Search path test không assert genres field trong MovieSummary | medium | Test chỉ kiểm tra Array.isArray(body.data); regression trong genres mapping không bị catch | patch |
| 26 | POST admin success test dùng genre_ids:[] — branch genre insertion chưa test | medium | Chỉ test với empty genre_ids; movie_genres insert + genres fetch path chưa bao giờ chạy trong success test | patch |
| 27 | Dead import NextResponse trong movies route.test.ts | low | Import không dùng | patch |
| 28 | Seed: không có dotenv; env vars silently undefined | low | Developer-facing issue; explicit failure tại first DB call | reject (low) |
| 29 | Duplicate mapping logic trong fetchAllMovies/fetchMoviesByQuery | low | Code quality; không ảnh hưởng runtime | reject (low) |
| 30 | GET /api/genres không có caching | low | Genres ít thay đổi nhưng hit DB mỗi request | defer |
| 31 | carried: trailer_url = video_url trong seed | low | Carried từ row #5; rejected | reject |
| 32 | carried: Portuguese trong Design Notes | cosmetic | Carried từ row #16; fix edits spec | reject |
| 33 | carried: !year/!rating falsy | low | Carried từ row #18; rejected | reject |

## Spec Change Log

### Iteration 1 — Bad Spec loopback (2026-10-15)

**Triggering findings:** (1) Seed dùng string IDs "m1","g1" thay vì UUID — schema dùng `UUID PRIMARY KEY`; (2) `GET /api/genres` dùng `createAdminClient()` vi phạm spec "Never"; (3) Admin route set `backdrop_url/cast/trailer_url/video_url ?? null` nhưng schema NOT NULL.

**Amended:** Code Map cập nhật để cấm dùng admin client trong genres route; thêm section Schema Constraints với các NOT NULL fields; Tasks cập nhật để rõ ràng về UUID IDs, LEFT JOIN thay vì !inner, escaping wildcards, anon client cho genres, rollback orphaned movie.

**Known-bad state avoided:** Seed script hoàn toàn fail do UUID type mismatch; genres route dùng service role key cho public endpoint; admin POST fail silently vì NOT NULL constraint.

**KEEP instructions:** Giữ nguyên pattern unstable_cache + tags:["movies"] + revalidate:60; bifurcation search/non-search với Cache-Control: no-store; auth check pattern sessionClaims.publicMetadata.role; revalidateTag("movies", { expire: 0 }) sau insert; truncate order movie_genres→movies→genres; 12 phim với TMDB posters và 10 genres (chỉ fix IDs thành UUID).

## Verification

**Commands:**
- `npm run type-check` — expected: 0 TypeScript errors
- `npm run lint` — expected: 0 lint errors
- `npm run seed` — expected: output không có error, kết thúc bình thường

**Manual checks:**
- Sau seed: kiểm tra Supabase dashboard hoặc `SELECT COUNT(*) FROM movies` — kết quả ≥10
- Dev server đang chạy: `curl http://localhost:3000/api/movies` — JSON với array phim
- `curl http://localhost:3000/api/movies?q=inception` — chỉ trả về phim có "inception" trong tên
- `curl -X POST http://localhost:3000/api/admin/movies` (không header) — trả về `{"error":"Unauthorized"}` HTTP 401
