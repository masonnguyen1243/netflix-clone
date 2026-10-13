---
type: adversarial-architecture-review
spine: ARCHITECTURE-SPINE.md
date: 2026-10-13
reviewer: adversarial-architecture-agent
verdict: FAIL
---

# Adversarial Architecture Review — Netflix Clone Spine

## Verdict: FAIL

Four incompatibility pairs were constructed. Each pair describes two builders/epics that both comply with every stated AD, yet produce systems that cannot interoperate without a breaking contract negotiation. Each pair closes with the AD gap that must be filled.

---

## Pair 1 — Dual ownership of `watch_history` progress state

### Unit A — Player Epic (F5, AD-6, AD-7)
`YouTubePlayer` polls `getCurrentTime()` every 30 s and calls `POST /api/history/[id]/progress` with body `{ progress_seconds: number }`. The API handler does an **upsert** keyed on `(user_id, movie_id)`, updating `progress_seconds` and `updated_at` on the existing row. Unit A treats the row as a single mutable record per (user, movie).

### Unit B — History Page Epic (F6, AD-5, AD-2)
`/history` page calls `GET /api/history/` which reads `watch_history`. Builder B, noticing no shape constraint in the spine, decides each play session is a **separate insert** so users can see a timeline of sessions (reasonable product interpretation). The table therefore contains multiple rows per `(user_id, movie_id)`, and `progress_seconds` on each row is the progress at the end of that session.

### Clash
- Unit A upserts (assumes one row per user+movie), so the `id PK` it targets on updates is ambiguous — which row? The upsert will conflict or silently update the wrong row.
- Unit B's `GET /api/history/` returns an array where `progress_seconds` means "session end timestamp", not "resume cursor". The `/watch/[id]` page (which must resume from last position) reads this endpoint and gets a meaningless list instead of a single cursor.
- The ERD in the spine shows one `watch_history` table with `progress_seconds` and `updated_at` but does not specify unique-per-user-movie or whether multiple rows per pair are allowed.

### Gap → New AD Required
The spine does not define the **cardinality contract** for `watch_history`. Required addition:

> **AD-X: `watch_history` MUST maintain at most one row per `(user_id, movie_id)` pair, enforced by a UNIQUE constraint. `POST /api/history/[id]/progress` MUST upsert on that constraint. `GET /api/history/` MUST return one entry per movie (latest row), and include `progress_seconds` as the resume cursor.**

---

## Pair 2 — Two builders own the movie response shape for ISR cache

### Unit A — Movie List Epic (F2, AD-5 ISR, AD-2)
Builder A implements `GET /api/movies/` for the home page. Because search (F3) also uses `api/movies/?q=`, and builder A sees AD-5 ("ISR revalidate=60" for home), they embed genre names inline: `{ data: Movie[] }` where each `Movie` includes `genres: string[]` (denormalised for the ISR-cached page, to avoid a second fetch on render).

### Unit B — Movie Detail Epic (F4, AD-5 ISR, AD-2)
Builder B implements `GET /api/movies/[id]`. They return `{ data: Movie }` where `Movie` includes `genres: Genre[]` — full genre objects `{ id: uuid, name: string }` — because the detail page needs genre IDs to link to filtered search.

### Clash
- The `Movie` TypeScript type in `types/index.ts` must satisfy both shapes. Builders will write incompatible types: `genres: string[]` vs `genres: Genre[]`.
- Client components that receive movies from the list endpoint and then navigate to detail will see a shape change mid-session, causing runtime errors if any shared component (e.g., a genre badge) is written against one shape.
- The `revalidateTag('movies')` triggered by admin writes (AD-5) blows both caches simultaneously, but the two endpoints return different shapes — a consumer holding a cached list-movie and fetching a detail-movie gets two different contracts for the same entity.
- AD-2 says "all read/write via `app/api/**`" but does not specify that the Movie entity has a **canonical response shape** that all endpoints must conform to.

### Gap → New AD Required
> **AD-Y: The canonical `Movie` API response shape MUST be defined once in `types/index.ts` and used identically by all endpoints (`/api/movies/`, `/api/movies/[id]`, `/api/admin/movies/**`). The shape MUST include `genres: Genre[]` (full objects). List endpoints may omit heavy fields (e.g. `cast`, `description`) via an explicit `MovieSummary` sub-type, but both types MUST extend a shared `MovieBase` with the same `id`, `title`, `poster_url`, and `genres` fields.**

---

## Pair 3 — Admin role check creates a split-brain authz surface

### Unit A — Middleware Epic (F1, AD-3)
Builder A writes `middleware.ts`: checks `publicMetadata.role === 'admin'` from the Clerk JWT, blocks `/admin/**` for non-admins. No DB query. This is exactly what AD-3 requires.

### Unit B — Admin API Routes Epic (F8, AD-4, Conventions)
Builder B writes `app/api/admin/movies/route.ts`. They notice AD-4 says "Admin routes use `SUPABASE_SERVICE_ROLE_KEY` only in `lib/supabase/admin.ts`" and that the service-role client bypasses RLS. Builder B, wanting defence-in-depth, adds a secondary check by querying a `user_roles` table in Supabase (or checking a `role` column on a `profiles` table they created) before executing admin mutations.

### Clash
- A user whose Clerk `publicMetadata.role` is `'admin'` but has no matching Supabase `user_roles` row (common during onboarding, or after a DB reset) passes middleware but is rejected at the API route.
- Conversely, a user demoted in Clerk metadata but still present in the Supabase roles table passes the API-level check until the DB is cleaned up — a privilege escalation window.
- The spine says "no DB query" for auth but only constrains middleware. It does not explicitly forbid a secondary DB-level role check inside API routes.
- Nothing in AD-3 or AD-4 states that the API routes themselves must not re-verify the role via a second mechanism.

### Gap → New AD Required
> **AD-Z: API routes MUST NOT perform a secondary role/permission check against Supabase. The sole authz gate for admin routes is the Clerk JWT check already enforced by middleware. API routes MAY call `auth()` from `@clerk/nextjs` to retrieve `userId` for ownership checks, but MUST NOT query any role or permission table in Supabase. This eliminates dual-source authz drift.**

---

## Pair 4 — ISR revalidation and force-dynamic collision on shared `watchlist` count badge

### Unit A — Home Page Epic (F2, AD-5 ISR revalidate=60)
Builder A implements a `WatchlistBadge` (count of movies in the user's list) displayed in the `Header` component, which is part of the `(viewer)` layout. Because the home page is ISR-cached, builder A makes `WatchlistBadge` a Client Component that fetches `GET /api/watchlist/count` on mount using `useState + fetch` (AD-7). The API route for the badge count has no caching annotation — builder A does not specify one.

### Unit B — Watchlist Page Epic (F7, AD-5 force-dynamic, AD-7)
Builder B implements `GET /api/watchlist/` returning all watchlist items. They also, independently, decide to add an aggregate `count` field to that response. They annotate the `/api/watchlist/` route with `export const dynamic = 'force-dynamic'` to match AD-5.

### Clash
- Builder A's `GET /api/watchlist/count` is a separate route with no `dynamic` annotation. Next.js 16 App Router will **statically cache** it at build time by default (no `force-dynamic`, no `no-store`, no `revalidate`). The badge count is therefore stale indefinitely after first build, regardless of watchlist mutations.
- Builder B's optimistic update in the watchlist page (AD-7) updates the UI but the badge in the Header does not update because it reads from a separately cached route.
- When a user adds a movie to their list on the watchlist page, the badge count is wrong until the next full deployment (since the route is statically frozen).
- AD-5 defines caching rules for pages, but not for API Route Handlers themselves. The spine is silent on whether API routes behind user-content pages must also carry `force-dynamic` or `no-store`.

### Gap → New AD Required
> **AD-W: API Route Handlers that serve user-specific data (watchlist, history, user profile) MUST include `export const dynamic = 'force-dynamic'` or set `Cache-Control: no-store`. ISR caching rules in AD-5 apply to page segments only. Client Components fetching user data via `fetch` MUST include `{ cache: 'no-store' }` in the fetch options to prevent the Next.js fetch cache from freezing user-scoped responses.**

---

## Summary of Gaps

| Pair | Affected ADs | New AD Needed |
|------|-------------|---------------|
| 1 — watch_history cardinality | AD-1, AD-6 | Unique constraint + upsert contract on `(user_id, movie_id)` |
| 2 — Movie response shape split | AD-2, AD-5, Conventions | Canonical `Movie` type + `MovieSummary` subtype, shared across all endpoints |
| 3 — Split-brain admin authz | AD-3, AD-4 | Explicit ban on secondary DB-level role checks inside API routes |
| 4 — API route caching undefined | AD-5, AD-7 | Caching rules extended to cover API Route Handlers serving user-scoped data |

---

## File Path

`/Users/mason/Workspace/masonnguyen/bmad-landing-page/_bmad-output/planning-artifacts/architecture/architecture-bmad-landing-page-2026-10-13/reviews/review-adversarial.md`
