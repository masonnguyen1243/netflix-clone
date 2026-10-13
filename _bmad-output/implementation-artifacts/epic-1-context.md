# Epic 1 Context: Foundation & Authentication

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Establish the complete working foundation the entire app depends on: Vercel project wired to Supabase and Clerk, all environment variables configured, the full database schema created with RLS enabled, and the design token system + global layout in place. By the end of this epic, an authenticated user can register, log in (email, Google, or GitHub), land on a protected home shell, view their profile, and log out — and every other epic can start building on a stable, running app.

## Stories

- Story 1.1: Project Setup & Infrastructure
- Story 1.2: Design Token System & Global Layout
- Story 1.3: Authentication Pages & Route Protection

## Requirements & Constraints

**Functional (FR-1.1 – FR-1.4):**
- Sign-up and sign-in via Clerk (email, Google, GitHub)
- Profile page displaying name and avatar sourced from Clerk user object
- Logout clears the Clerk session and redirects to `/sign-in`
- All routes under `(viewer)/` and `/admin` are protected; unauthenticated requests redirect to `/sign-in?redirect_url=...` and bounce back after login

**Database schema (must be complete before any later epic):**
Tables: `movies`, `genres`, `movie_genres`, `watch_history`, `watchlist`. RLS must be enabled on `watch_history` and `watchlist`. Clerk `userId` (string) is the FK into both user-facing tables — no separate `users` table.

**Non-functional:**
- Dark theme (background `#0a0a0a`) applied globally from Story 1.2 onward
- Responsive from day one: desktop sticky header, mobile bottom tab bar
- All interactive elements carry `ring-2 ring-primary` focus indicator — never bare `outline: none`
- Loading states use skeleton shimmer (1.5s loop), not spinners; `prefers-reduced-motion` switches shimmer to opacity pulse
- Page padding `clamp(1rem, 4vw, 4rem)`, max content width `1400px`

**Testing strategy:** resolved in Story 1.1: Vitest + React Testing Library (xem ARCHITECTURE-SPINE.md AR-13).

## Technical Decisions

**Stack (locked):** Next.js 16.4 (App Router), React 19.3, TypeScript 5.x, Tailwind CSS 4.x, shadcn/ui, @clerk/nextjs 7.9.x (Core 3), @supabase/supabase-js latest. Deploy on Vercel.

**Directory structure (follow exactly):**
```
src/app/(auth)/        — unauthenticated pages
src/app/(viewer)/      — authenticated viewer shell
src/app/admin/         — role-gated admin shell
src/app/api/           — all API route handlers
src/components/layout/ — Header, BottomNav, AdminSidebar
src/lib/supabase/      — server.ts (Clerk JWT client), admin.ts (service role)
src/types/index.ts     — Movie, MovieSummary, Genre types
src/middleware.ts      — Clerk route protection + admin role check
```

**Two required Supabase clients (created in Story 1.1):**
- `lib/supabase/server.ts` — initialised with `getToken({ template: 'supabase' })` Clerk JWT; used by all non-admin routes
- `lib/supabase/admin.ts` — initialised with `SUPABASE_SERVICE_ROLE_KEY`; imported only inside `app/api/admin/**`

**Auth/authz rules (Clerk-only, no DB involvement):**
- `publicMetadata.role === 'admin'` is the sole gate for `/admin`; middleware reads JWT, never queries DB
- API response shape: success `{ data: T }`, error `{ error: string, code?: string }`; HTTP 401 unauthenticated, 403 unauthorized

**TypeScript types (defined in Story 1.1):**
- `MovieSummary` — list/grid context, `genres: string[]`
- `Movie` — detail context, `genres: Genre[]`
- These two types must not be conflated; later epics depend on this contract

**Env vars required:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — set in both `.env.local` and Vercel project.

**Rendering:** The viewer shell built in Story 1.2 is a layout; no ISR/dynamic cache directive applies at this stage. Per AD-5, `force-dynamic` and ISR are configured at the page level in later epics.

## UX & Interaction Patterns

**Color tokens (implement in Tailwind theme, Story 1.2):**

| Token | Hex |
|---|---|
| background | #0a0a0a |
| surface | #141414 |
| surface-elevated | #1f1f1f |
| border | #2a2a2a |
| primary | #d97706 |
| primary-hover | #b45309 |
| primary-foreground | #0a0a0a |
| text-primary | #f5f5f5 |
| text-secondary | #a3a3a3 |
| text-muted | #525252 |
| destructive | #ef4444 |
| success | #22c55e |

**Typography:** Inter font; xs (0.75rem) through 4xl (2.25rem); weights 400/500/600/700. Movie titles 2xl–4xl bold; metadata sm regular text-secondary; labels xs medium.

**Global layout (Story 1.2):**
- Authenticated desktop: sticky header — logo left, search bar center, avatar/menu right; nav links: Home · Danh sách của tôi · Lịch sử
- Authenticated mobile (<768px): bottom tab bar — Home · Tìm kiếm · Danh sách · Tài khoản
- Semantic structure: `<html>`, `<body>`, `<main>`, `<header>`, `<nav>` present on every page

**Auth pages (Story 1.3):**
- Landing `/` is the only page accessible without login — dark, cinematic, a single "Đăng nhập" entry point
- Sign-in/sign-up rendered via Clerk components; after login, redirect to original `redirect_url` or `/home`
- Profile page at `/profile` uses semantic `<main>` with accessible heading; data comes from Clerk user object only (no DB read)

**Microcopy:** Vietnamese only. Error: "Không tải được. Thử lại." Auth-required state: redirect silently (no error message). Admin 403: "Bạn không có quyền truy cập" + nút về Home.

## Cross-Story Dependencies

- Story 1.2 (layout) and Story 1.3 (auth) both depend on Story 1.1 being complete — the Supabase schema, Clerk JWT template, env vars, and directory structure must all exist first.
- Story 1.2's design token system (Tailwind theme config) is a hard prerequisite for every UI story in Epics 2–5; it must not be skipped or deferred.
- Epic 2 (MovieCard, HeroBanner, home feed) depends on the `MovieSummary` and `Genre` types defined in Story 1.1 and the viewer layout shell from Story 1.2.
- Epic 5 (Admin Panel) depends on the admin role gate in `middleware.ts` established in Story 1.3.
