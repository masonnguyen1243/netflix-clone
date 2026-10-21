# Epic 4 Context: User Personalization (Watchlist & History)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enable authenticated users to save movies to a personal watchlist, track viewing history, and resume partially-watched films. This epic wires up the watchlist button that was stubbed in Epic 3, then delivers the history page, the "Tiếp tục xem" (Continue Watching) row on home, and the My List page — completing the full personalization loop.

## Stories

- Story 4.1: Watchlist API & WatchlistButton Component
- Story 4.2: "Tiếp tục xem" Row on Home & Progress Bar on Card
- Story 4.3: Watch History Page
- Story 4.4: My List Page (/my-list)

## Requirements & Constraints

**Watchlist (FR-4.4, FR-7.1, FR-7.2):**
- Toggle add/remove from MovieCard, HeroBanner, and Movie Detail page — all surfaces.
- `POST /api/watchlist/[id]` toggles; `GET /api/watchlist` returns `{ data: MovieSummary[] }`.
- Both API routes must export `dynamic = 'force-dynamic'`.
- Unauthenticated calls return `{ error: "Unauthorized" }` HTTP 401.

**Continue Watching / History (FR-6.1, FR-6.2, FR-6.3):**
- `GET /api/history` returns `{ data: Array<MovieSummary & { progress_seconds: number }> }` sorted by `updated_at` desc, force-dynamic.
- `DELETE /api/history/[id]` removes the row from `watch_history`.
- "Tiếp tục xem" row only renders if the user has at least one history entry.
- Each card in the row shows a small progress bar below the poster (percentage watched).
- Clicking a card navigates to `/watch/[id]` — progress seek is handled by the existing YouTubePlayer (Epic 3).

**State management:**
- All client mutations use `useState` + native `fetch` with optimistic update + manual rollback on error. No state management libraries (no TanStack Query, no Redux).

**Success criteria:**
- Bookmark icon fills amber on add, returns to outline on remove, with toast feedback each way.
- History list always reflects the current DB state (force-dynamic, no stale cache).
- Empty states show "Chưa có phim nào. Hãy khám phá thêm →" with a link to `/home`.

## Technical Decisions

**Data layer:**
- `watchlist` table: `(id, user_id text, movie_id uuid FK, created_at timestamptz)`. RLS must be enabled; user can only read/write their own rows.
- `watch_history` table: `(id, user_id text, movie_id uuid FK, progress_seconds int, updated_at timestamptz)`. UNIQUE constraint on `(user_id, movie_id)`. All writes use upsert: `ON CONFLICT (user_id, movie_id) DO UPDATE SET progress_seconds, updated_at`. Never insert a new row per session.
- Clerk `userId` (string) is the FK — no separate `users` table.

**API conventions:**
- Success: `{ data: T }`. Error: `{ error: string, code?: string }`. HTTP 401 = unauthenticated, 403 = forbidden.
- All routes in `app/api/watchlist/**` and `app/api/history/**` must be force-dynamic.
- Supabase client must be initialized with Clerk JWT (`getToken({ template: 'supabase' })`); import only from `lib/supabase/server.ts`.

**Rendering:**
- `/my-list` and `/history`: `force-dynamic` — user-specific, no CDN cache.
- `/home` already uses ISR revalidate=60; the "Tiếp tục xem" row fetches user history client-side or via a separate force-dynamic segment to avoid poisoning the ISR cache.

**TypeScript:**
- Use `MovieSummary` (genres: string[]) for all list/grid displays, including watchlist and history responses. Defined in `types/index.ts`.

**File & component naming:**
- API routes: kebab-case (`app/api/watchlist/[id]/route.ts`).
- Components: PascalCase (`WatchlistButton`, `ContinueWatchingRow`).
- Pages: `src/app/(viewer)/my-list/page.tsx`, `src/app/(viewer)/history/page.tsx`.

## UX & Interaction Patterns

**WatchlistButton states:**
- Default (not in watchlist): bookmark outline icon.
- In watchlist: bookmark filled, amber color — visible without hover.
- On add: optimistic fill + toast "Đã thêm vào danh sách" slides up, fades, auto-dismisses after 2s.
- On remove: optimistic outline + toast "Đã xóa" (same pattern).
- On API error: roll back UI state + toast "Không tải được. Thử lại."

**MovieCard in Continue Watching row:**
- Same card component as elsewhere with an additional thin progress bar below the poster (e.g., `h-1 bg-primary` over a `bg-surface-elevated` track).
- Progress percentage = `progress_seconds / movie_duration_seconds * 100` — if duration is not stored, use a fixed denominator or omit the bar fill percentage (implementation decision at story level).

**My List page grid:** 5–6 columns desktop, 4 tablet, 2 mobile. Max content width 1400px, gap 0.75rem.

**History page list:** Sorted newest first. Each entry: poster thumbnail, title, progress bar, last watched date. "Xóa" button per entry — optimistic removal, no confirm dialog required (unlike admin delete).

**Empty states:** "Chưa có phim nào. Hãy khám phá thêm →" illustration + CTA — consistent across /my-list and /history.

**Accessibility:** WatchlistButton must have accessible label ("Thêm vào danh sách" / "Đã lưu"); focus ring `ring-2 ring-primary` on all interactive elements.

## Cross-Story Dependencies

- **Story 4.1 must ship first** — it wires the WatchlistButton used by MovieCard (Epic 2), HeroBanner (Epic 2), and Movie Detail page (Epic 3). Stories 4.2–4.4 can proceed in parallel after 4.1.
- Story 4.2 depends on `GET /api/history` being available (built in 4.2 itself), and depends on the progress timestamp save already working from Epic 3 Story 3.3.
- Story 4.3 depends on `DELETE /api/history/[id]` (new in this epic) and `GET /api/history` (shared with 4.2).
- Story 4.4 depends on `GET /api/watchlist` and the toggle API from Story 4.1.
- The `/home` page (Epic 2) must be updated in Story 4.2 to render the "Tiếp tục xem" row — coordinate with the home page implementation to avoid layout breakage.
