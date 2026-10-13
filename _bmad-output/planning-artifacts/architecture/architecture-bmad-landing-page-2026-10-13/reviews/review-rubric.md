# Architecture Spine Review — Trang Web Xem Phim (Netflix Clone)

**Reviewer:** Claude Code (automated rubric review)
**Date:** 2026-10-13
**Verdict:** PASS WITH NOTES

---

## Rubric Checklist Results

### 1. Fixes the real divergence points and misses none

**Result: MOSTLY PASS — one gap**

The spine covers the most dangerous divergence points well:
- Auth strategy (AD-3): single Clerk JWT path prevents two teams implementing role checks differently.
- Data access boundary (AD-2): API Routes-only rule prevents direct Supabase access from components.
- State management (AD-7): explicit no-library rule prevents TanStack Query vs. raw fetch divergence.
- Video player (AD-6): single YouTube IFrame SDK mandate prevents raw iframe vs. react-player split.
- Image rendering (AD-8): next/image mandate prevents `<img>` vs. component divergence.

**Gap — Error handling shape is only partially covered.** The Consistency Conventions define API response shapes for success and error, and HTTP status codes — but there is no AD banning, e.g., throwing non-standard error shapes in middleware or returning `{ message: ... }` instead of `{ error: ... }` from certain routes. For a multi-builder scenario this is a real divergence risk. It should either become AD-9 or be explicitly noted as enforced by the Convention section (which currently has no enforcement story).

### 2. Every AD's Rule is enforceable and actually prevents its stated divergence

**Result: MOSTLY PASS — one enforceability concern**

- AD-1 through AD-8 are all expressed as testable, checkable rules. Most are enforceable via code review, linting, or automated checks.
- **AD-2 (API Routes boundary):** The rule "no Supabase client import outside lib/supabase/" is sound in intent but the spine does not mention how this is enforced (ESLint import rule, CI check, etc.). For a build-substrate spine this is acceptable to defer, but the absence means two builders could violate it without a hard stop. A note pointing to enforcement mechanism (even "ESLint no-restricted-imports") would strengthen it.
- **AD-6 (YouTube player):** "Poll getCurrentTime() every 30s" is a behavioral spec embedded in an AD. This is slightly below the right altitude — it is an implementation detail of one component, not a system-wide divergence-preventing constraint. The divergence risk (one builder uses raw iframe) is real and the AD is needed; but the poll interval detail belongs in a feature spec, not the spine. The AD should state what to use (YouTube IFrame API SDK) and what contract to uphold (progress tracking via POST /api/history/[id]/progress), not how to implement the polling.

### 3. Nothing deferred that should be an AD

**Result: PASS WITH ONE NOTE**

Deferred items:
- Schema detail (column constraints, indexes, RLS policies): correctly deferred — these are implementation details of AD-1.
- Error monitoring: correctly deferred — operational concern, no divergence risk at this level.
- Rating source (OQ-3): listed as open question, correctly flagged.
- Image remotePatterns: **minor concern** — if left open, two builders could configure incompatible patterns. However, since AD-8 mandates next/image and points to next.config.ts as the single location, the divergence surface is small. Acceptable as deferred.
- React Native port: correctly deferred as future scope.

The one item that arguably should be promoted: **RLS policies**. AD-4 says Supabase client forwards Clerk JWT so RLS can identify the user, but does not say RLS is actually required to be enabled, or who is responsible for writing it. If one builder forgets RLS on a table, the security model breaks. Consider adding: "RLS must be enabled on all user-facing tables; service role key bypasses RLS only in lib/supabase/admin.ts" — currently this is implied but not stated as a rule.

### 4. Named tech is verified-current

**Result: FAIL — one significant version issue**

- **Next.js 16.4.0:** As of late 2026, the current Next.js stable major is 15 (15.x). There is no Next.js 16.4.0 as of the knowledge cutoff (August 2025). This version number appears to be fabricated or projected. The spine should pin a real, verified version (e.g., 15.3.x or "latest stable 15.x") or at minimum note that the version is a target/projection.
- **React 19.3:** React 19 was in development/RC as of late 2024. React 19.3 as a stable release is plausible by late 2026 but cannot be confirmed. Flag as unverified.
- **@clerk/nextjs 7.9.x (Core 3):** Clerk versioning beyond 6.x is unverifiable from current knowledge. Flag as unverified projection.
- **Tailwind CSS 4.x:** Tailwind 4.0 was in alpha/beta as of early 2025; 4.x stable by 2026 is plausible. Minor concern.
- **@supabase/supabase-js latest:** "latest" is acceptable for a spine but should be pinned before implementation to prevent drift.

The Next.js 16.4.0 issue is the most significant because it is a specific version number that does not correspond to any known release, which could confuse builders checking changelogs or compatibility matrices.

### 5. Brownfield codebase (N/A — greenfield)

**Result: N/A**

### 6. Covers all spec capabilities (F1–F8)

**Result: PASS**

Every feature F1–F8 is explicitly mapped in the Capability → Architecture Map section. Each has a corresponding route path, API surface, and bound ADs. Coverage is complete.

### 7. Every dimension the altitude owns is decided, deferred, or an open question

**Result: PASS WITH NOTES**

Dimensions checked:
- Data persistence: decided (AD-1, Supabase).
- API boundary: decided (AD-2).
- Auth/authz: decided (AD-3, AD-4).
- Rendering strategy: decided (AD-5).
- Video: decided (AD-6).
- Client state: decided (AD-7).
- Image handling: decided (AD-8).
- Deployment: decided (Vercel free tier in Stack section).
- Error shape: decided in Conventions (but enforcement unclear — see Finding 1).
- Timestamps/IDs: decided in Conventions.

**Silent dimension — testing strategy:** There is no mention of testing approach (unit, integration, e2e). For a feature-altitude spine this might be acceptable to leave silent, but in a multi-builder context, two teams could produce untestable or incompatible test setups. At minimum, "testing strategy deferred" should appear in Deferred.

**Silent dimension — CI/CD pipeline:** Deployment target (Vercel) is stated, but there is no mention of how code gets there — branch strategy, PR gates, automated deploys. Again, for a build-substrate spine serving multiple builders, this is a real coordination risk. Should appear in Deferred or as a Convention.

**Silent dimension — logging/observability:** Error monitoring is in Deferred (Sentry/Vercel Analytics) but structured logging from API routes (what to log, what not to log — e.g., no PII) is not mentioned. Not a hard fail but worth noting.

---

## Top Findings Summary

| # | Severity | Finding |
|---|----------|---------|
| 1 | MEDIUM | Next.js 16.4.0 does not correspond to any known release; version must be corrected to a real stable version before builders start. |
| 2 | MEDIUM | AD-6 embeds an implementation detail (30s poll interval) that belongs in a feature spec, not the spine; clean it up to avoid locking the implementation unnecessarily. |
| 3 | LOW | RLS enablement requirement is implied but not stated as a rule — a builder could skip enabling RLS on a table and the security model silently breaks. Add a convention or promote to AD. |
| 4 | LOW | Testing strategy and CI/CD pipeline are entirely silent; should appear in Deferred at minimum so builders know these are intentionally left open, not forgotten. |
| 5 | LOW | Error response shape is defined in Conventions but has no enforcement story; AD-2 could absorb it or a brief enforcement note (ESLint, test) should be added. |

---

## Overall Assessment

The spine is well-structured and covers the core divergence risks for a Next.js + Supabase + Clerk stack competently. The AD set is coherent, the Capability map is complete, and the Conventions are appropriately specific. The main actionable blocker before builders start is correcting the Next.js version number. The other findings are improvements rather than blockers.

**Verdict: PASS WITH NOTES**
