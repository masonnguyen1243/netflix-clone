# Epic 2 Context: Movie Discovery (Home, Browse & Search)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enable authenticated users to browse the movie catalog by genre, discover content through a hero banner, and find specific films via global search. This epic delivers all shared movie display components (MovieCard, HeroBanner, MovieRow, SearchBar), the API routes that power them, the home page, and the search results page — the core content experience that every subsequent epic builds on.

## Stories

- Story 2.1: Supabase Seed & Movie API Routes
- Story 2.2: MovieCard & MovieRow Components
- Story 2.3: Home Page — Hero Banner & Genre Rows
- Story 2.4: Global Search (Header Bar & Search Results Page)

## Requirements & Constraints

**API routes:**
- `GET /api/movies` — returns `{ data: MovieSummary[] }`, ISR `revalidate=60`, no auth required
- `GET /api/movies?q=<term>` — case-insensitive title filter, `no-store` cache directive
- `GET /api/genres` — returns `{ data: Genre[] }`, HTTP 200
- `POST /api/admin/movies` — admin-only; triggers `revalidateTag('movies')`; returns HTTP 401 if caller lacks admin role

**Response convention:** success `{ data: T }`, error `{ error: string, code?: string }`, HTTP 401/403/404/422

**Type distinction:** use `MovieSummary` (for list/grid, `genres: string[]`) — not `Movie` — for all data in this epic. Both types are defined in `types/index.ts`.

**Data access:** all Supabase reads go through `app/api/**` routes; Server Components fetch internally. No direct Supabase imports outside `lib/supabase/`.

**Caching:** home page uses ISR `revalidate=60`; search results use `no-store`. Admin movie write triggers `revalidateTag('movies')`.

**State management:** `useState` + native `fetch` only — no TanStack Query, Redux, or other state libraries. Optimistic updates with manual rollback where applicable.

**Images:** all poster/backdrop images use `next/image` with `remotePatterns` wildcard hostname in `next.config.ts`.

**Seed requirement:** ≥10 movies with genres, poster URLs, trailer URLs, and video URLs must be seeded before UI stories can render real data.

## Technical Decisions

**Stack:** Next.js 16.4 App Router, Tailwind CSS 4.x, Supabase PostgreSQL. Deploy on Vercel.

**Directory structure:** `src/app/`, `src/components/`, `src/lib/`, `src/types/` per Architecture spine. Component naming: PascalCase; file/route naming: kebab-case.

**Supabase tables in scope:** `movies`, `genres`, `movie_genres`. RLS is enabled on `watch_history` and `watchlist` but those tables are not used in this epic.

**Clerk JWT:** Supabase client receives Clerk JWT via `getToken({ template: 'supabase' })`. Public movie/genre routes do not require auth; `POST /api/admin/movies` validates `publicMetadata.role === 'admin'` from the JWT without querying the DB.

**ISR invalidation:** `POST /api/admin/movies` must call `revalidateTag('movies')` so the home page reflects new movies on the next request.

**MovieRow load-more:** infinite scroll triggered at 200px from row end (no separate pagination endpoint needed for this epic).

**Search debounce:** 300ms client-side debounce before calling `GET /api/movies?q=`.

## UX & Interaction Patterns

**Color tokens (implement in Tailwind theme):** background `#0a0a0a`, surface `#141414`, surface-elevated `#1f1f1f`, border `#2a2a2a`, primary `#d97706`, primary-hover `#b45309`, text-primary `#f5f5f5`, text-secondary `#a3a3a3`, text-muted `#525252`.

**MovieCard:** aspect 2:3, `rounded-lg`, overflow hidden. Rendered as `<a>` tag (not `<div onClick>`). Alt text: `"[Tên phim] poster"`. Desktop hover: scale 1.04 + `ring-2 ring-primary/60` (150ms ease-out) + bottom-up gradient overlay showing title, rating, genre badge. Bookmark icon top-right (visible on hover or when in watchlist — filled amber if saved). Skeleton shimmer before image loads.

**HeroBanner:** full-width 60–70vh desktop / 50vh mobile. Full-bleed backdrop + hero-overlay gradient. Content left-aligned max-width 600px. Title 4xl bold desktop / 2xl mobile. Two buttons: "Xem ngay" (button-primary + Play icon) and "Thêm vào danh sách". Static — no auto-rotate.

**MovieRow:** row label `text-lg semibold text-primary` + "Xem thêm" arrow. Desktop: 5–6 cards, horizontal scroll no-wrap. Mobile: 2 cards, natural horizontal scroll (no pagination dots). Load-more at 200px threshold.

**SearchBar (desktop):** expands from 200px → 400px (200ms ease-out) on focus. Realtime dropdown ≤6 items (debounce 300ms). Closes on click-outside or Escape. Enter / "Xem tất cả" navigates to `/search?q=...`. Mobile: dedicated search tab in bottom bar.

**Layout:** max content width 1400px, page padding `clamp(1rem, 4vw, 4rem)`, card gap 0.75rem, row gap 2rem. Desktop 12-col grid (5–6 cards visible per row); tablet ≥768px 4-col; mobile <768px 2-col.

**State patterns:** Loading → skeleton cards (no spinner). Empty search → "Chưa có phim nào. Hãy khám phá thêm →". Error → destructive toast + "Thử lại" button.

**Accessibility:** movie card is `<a>`, not `<div onClick>`. Contrast: text-primary ≥7:1, text-secondary ≥4.5:1, amber CTA ≥7:1. Focus ring `ring-2 ring-primary` on all interactive elements. Semantic HTML: `<main>`, `<nav>`, `<header>`, `<section>`. Hero backdrop alt="".

**Reduced motion:** disable transform/transition; skeleton uses opacity pulse instead of shimmer.

**Microcopy (Vietnamese):** CTA "Xem ngay"; watchlist "Thêm vào danh sách"; empty "Chưa có phim nào. Hãy khám phá thêm →"; error "Không tải được. Thử lại."; loading → skeleton only (no text).

## Cross-Story Dependencies

- Story 2.1 (seed + API routes) must complete before Stories 2.2–2.4 can render real data.
- Story 2.2 (MovieCard + MovieRow) should complete before 2.3 (home page), as the home page composes these components.
- Epic 1 Story 1.1 must be complete (Supabase schema, Clerk JWT template, env vars) before Story 2.1 can run the seed script or implement authenticated API routes.
- Epic 1 Story 1.2 (design token system + global layout, including navigation and SearchBar slot) must be complete before Story 2.4 (SearchBar) can be integrated into the header.
- The `POST /api/admin/movies` route built in Story 2.1 is also used for the Epic 5 Admin Panel — keep the auth check and `revalidateTag` implementation clean for reuse.
- The "Tiếp tục xem" row on /home is intentionally absent in this epic — it is wired in Epic 4 Story 4.2.
- The watchlist bookmark on MovieCard shows UI state in this epic but the toggle API is wired in Epic 4 Story 4.1.
