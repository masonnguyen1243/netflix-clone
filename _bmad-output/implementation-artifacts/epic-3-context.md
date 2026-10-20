# Epic 3 Context: Movie Detail & Video Player

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Users can view full movie information and watch a film — the core action the whole app drives toward. This epic delivers the movie detail page (metadata, trailer, similar films), the YouTubePlayer component, the fullscreen video player page, and the API that persists viewing progress. The watchlist button is stubbed on the detail page (UI present, not wired to API) and will be fully wired in Epic 4 Story 4.1.

## Stories

- Story 3.1: Movie Detail Page
- Story 3.2: YouTubePlayer Component & Video Player Page
- Story 3.3: Watch Progress Save API

## Requirements & Constraints

**Movie Detail Page (`/movie/[id]`):**
- Displays: title, description, release year, genres, cast, director, rating
- Embeds YouTube trailer below the info section
- "Xem phim" button navigates to `/watch/[id]`
- Watchlist button: UI present but not wired to API (stubbed for Epic 4)
- "Phim tương tự" section: ≥3 movies of the same genre at the bottom
- ISR with `revalidate=60`; `notFound()` on unknown IDs
- Skeleton layout shown while data loads (poster, metadata, similar films)
- Mobile: single-column layout, title at `2xl`

**Video Player Page (`/watch/[id]`):**
- Fullscreen default, dark background `#0a0a0a`
- Video starts from last saved `progress_seconds` (0 if none)
- Minimal overlay controls: back ←, film title, fullscreen toggle
- Controls auto-hide after 3s of inactivity; reappear on mouse move / tap
- Back button navigates to `/movie/[id]`
- `force-dynamic` cache (user-specific state)
- `prefers-reduced-motion`: disable all transform/transition animations

**Progress Save API (`POST /api/history/[id]/progress`):**
- Player calls endpoint every 30 seconds with `{ progress_seconds: N }`
- Request requires Clerk JWT; returns 401 if unauthenticated
- Upserts into `watch_history` using `ON CONFLICT (user_id, movie_id) DO UPDATE SET progress_seconds, updated_at`
- Returns `{ data: { progress_seconds: N } }` on success
- `GET /api/movies/[id]` must include the current user's `progress_seconds` (0 if none) so the player can seek on load

## Technical Decisions

**YouTubePlayer (AD-6):** Must use the YouTube IFrame API JS SDK — no raw `<iframe>`, no `react-player` or other wrapper. Component lives at `components/player/YouTubePlayer`. Use `player.getCurrentTime()` to read timestamp. Poll interval and error handling are implementation details for this epic.

**Rendering strategy (AD-5):**
- `/movie/[id]`: ISR `revalidate=60`
- `/watch/[id]`: `force-dynamic` (user-specific progress)
- `api/history/[id]/progress`: export `const dynamic = 'force-dynamic'`

**Data layer (AD-2):** No Supabase client outside `lib/supabase/`. All reads/writes go through `app/api/**`. Server Components fetch internally.

**Auth (AD-3 / AD-4):** Progress API verifies Clerk JWT. Supabase client initialized with `getToken({ template: 'supabase' })`.

**watch_history upsert (AD-9):** Table has UNIQUE constraint on `(user_id, movie_id)`. Every write must upsert — never insert a new row per session.

**Types (AD-10):** Movie detail uses the `Movie` type (`genres: Genre[]`), not `MovieSummary`. Both are defined in `types/index.ts`.

**Images (AD-8):** All posters and backdrops use `next/image`; `remotePatterns` in `next.config.ts` covers wildcard hostnames.

**API response shape:** Success: `{ data: T }`. Error: `{ error: string, code?: string }`. HTTP 401 for unauthenticated, 404 for not found.

**Client state (AD-7):** `useState` + native `fetch` only. No state management libraries.

## UX & Interaction Patterns

**Movie Detail layout:**
- Large poster/backdrop with hero-overlay gradient (right-to-left: `rgba(10,10,10,0.95)` → transparent)
- Content left-aligned, max-width 600px
- "Xem phim" button: `button-primary` style (amber `#d97706`, black text, `rounded-md`) with Play icon
- Genre badges: `surface-elevated` background, `text-secondary`, `rounded-full`
- Similar movies rendered as a MovieCard grid below, same grid conventions (aspect 2:3, hover scale 1.04)

**Video Player overlay:**
- Background `#0a0a0a`; iframe fills viewport
- Overlay controls fade in on interaction, auto-hide after 3s idle
- Animation: fade + opacity only; `prefers-reduced-motion` disables all transitions

**Accessibility:**
- Movie card `<a>` tags, not `<div onClick>`
- Poster `alt="[Tên phim] poster"`; hero backdrop `alt=""` (decorative)
- Focus ring: `ring-2 ring-primary` on all interactive elements; no bare `outline: none`
- Semantic HTML: `<main>`, `<section>` in detail page

**Error/loading states:**
- Loading: skeleton cards (not spinners) matching the real layout
- Error: destructive toast + "Thử lại" — no page redirect
- 404 (unknown movie ID): Next.js `notFound()` → standard 404 page

**Microcopy (Vietnamese):** CTA "Xem ngay", back affordance "←", error "Không tải được. Thử lại."

## Cross-Story Dependencies

- **Depends on Epic 1 (Story 1.1):** Supabase `watch_history` table with UNIQUE `(user_id, movie_id)` and `progress_seconds` column must exist; Clerk JWT template configured; `lib/supabase/server.ts` client available.
- **Depends on Epic 2 (Story 2.1):** `GET /api/movies/[id]` route and `Movie` type must be established; seed data with `trailer_url` and `video_url` fields required for the player to function.
- **Depends on Epic 2 (Story 2.2):** `MovieCard` component reused in the "Phim tương tự" section.
- **Feeds Epic 4:** Story 3.3 writes `watch_history` rows that Epic 4 reads to power "Tiếp tục xem" row and `/history` page. The `progress_seconds` field and upsert semantics established here must not change in Epic 4.
- **Watchlist stub:** Detail page renders a WatchlistButton in disabled/stubbed state. Epic 4 Story 4.1 wires the actual API — the button component slot must be in place before that story begins.
