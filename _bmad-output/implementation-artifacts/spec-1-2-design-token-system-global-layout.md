---
title: 'Story 1.2: Design Token System & Global Layout'
type: 'feature'
created: '2026-10-13'
status: 'done'
review_status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Chưa có design token nào và chưa có layout shell cho viewer — mọi story UI tiếp theo (Epic 2–5) sẽ không có màu sắc, typography, hay cấu trúc trang nhất quán để xây dựng trên.

**Approach:** Định nghĩa toàn bộ color token trong `globals.css` via Tailwind 4 `@theme`, cập nhật root layout dùng Inter CSS variable, tạo viewer layout shell với Header (desktop sticky) và BottomNav (mobile bottom tab bar).

## Boundaries & Constraints

**Always:**
- Tailwind 4 CSS-first config: tất cả token đặt trong `@theme {}` tại `globals.css`; không tạo `tailwind.config.js`
- Inter font dùng `variable` option (`--font-inter`) để Tailwind nhận via `--font-sans`; `body` dùng `${inter.variable} font-sans antialiased`
- Token tên `text-primary/secondary/muted` từ epic context có naming conflict với Tailwind utility `text-primary` (màu amber) → dùng `--color-foreground`, `--color-muted-foreground`, `--color-muted` (giữ nguyên hex)
- `(viewer)/layout.tsx` là Server Component; middleware đã bảo vệ routes, không cần `<SignedIn>` wrapper thêm
- `BottomNav.tsx` là Client Component (`"use client"`) vì cần `usePathname` cho active state
- `Header.tsx` là Server Component; dùng `<UserButton>` từ Clerk (tự render phía client)
- Focus indicator: tất cả interactive element phải có `focus-visible:ring-2 focus-visible:ring-primary`
- Search bar trong Header là placeholder input (`disabled`), không có chức năng — sẽ implement ở Story 2.4
- Tất cả microcopy tiếng Việt: "Trang chủ", "Danh sách của tôi", "Lịch sử", "Tìm kiếm", "Tài khoản"

**Never:**
- Không install shadcn/ui trong story này — Header/BottomNav dùng Tailwind thuần; shadcn defer đến khi cần component cụ thể
- Không implement search logic, auth check ở client, hoặc data fetching
- Không thay đổi middleware.ts hay types/index.ts
- Không đặt `force-dynamic` hay ISR cache directive (per AD-5, cấu hình ở page level tại Epic sau)

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Desktop viewport (≥768px) | Màn hình rộng, user đã auth | Header hiển thị sticky top; BottomNav ẩn | — |
| Mobile viewport (<768px) | Màn hình hẹp, user đã auth | BottomNav hiển thị bottom; Header ẩn nav links (chỉ giữ logo + UserButton) | — |
| Active tab highlight | URL khớp tab path (e.g. `/home`) | Tab đó có `aria-current="page"` và màu `text-primary` | — |
| Keyboard navigation | Tab qua Header links | Focus ring `ring-2 ring-primary` visible trên mỗi link | — |

</frozen-after-approval>

## Code Map

- `src/app/globals.css` -- hiện chỉ có `@import "tailwindcss"`; thêm `@theme` tokens + `@layer base` defaults
- `src/app/layout.tsx` -- đổi `inter.className` → `inter.variable`; thêm `font-sans antialiased bg-background text-foreground` vào `<body>`
- `src/app/(viewer)/layout.tsx` -- tạo mới: viewer shell layout bọc Header + `<main>` + BottomNav
- `src/components/layout/Header.tsx` -- tạo mới: Server Component; logo trái, search placeholder giữa, UserButton phải; sticky, z-50
- `src/components/layout/BottomNav.tsx` -- tạo mới: Client Component; `usePathname` cho active state; ẩn trên desktop
- `src/components/layout/Header.test.tsx` -- tạo mới: unit test render logo, nav links
- `src/components/layout/BottomNav.test.tsx` -- tạo mới: unit test render tabs, active state

**Token name mapping (epic context → CSS variable → Tailwind utility):**
- `text-primary #f5f5f5` → `--color-foreground` → `text-foreground`
- `text-secondary #a3a3a3` → `--color-muted-foreground` → `text-muted-foreground`
- `text-muted #525252` → `--color-muted` → `text-muted`
- `primary #d97706` → `--color-primary` → `text-primary`, `bg-primary`
- Tất cả token còn lại: tên giống epic context

## Tasks & Acceptance

**Execution:**
- [x] `src/app/globals.css` -- thêm `@theme {}` block với đầy đủ 12 color token + `--font-sans: var(--font-inter, Inter, sans-serif)` + font-size scale (xs→4xl); thêm `@layer base { body { @apply bg-background text-foreground; } * { @apply border-border; } }` -- design token foundation cho toàn bộ epics sau
- [x] `src/app/layout.tsx` -- đổi `Inter({ subsets: [...] })` thêm `variable: '--font-inter'`; đổi `<body className={inter.className}>` → `<body className={\`\${inter.variable} font-sans antialiased\`}>` -- cho phép Tailwind nhận Inter qua `--font-sans`
- [x] `src/app/(viewer)/layout.tsx` -- tạo Server Component: import Header, BottomNav; render `<div className="min-h-screen flex flex-col"><Header /><main className="flex-1 px-[clamp(1rem,4vw,4rem)] max-w-[1400px] mx-auto w-full py-6">{children}</main><BottomNav /></div>` -- viewer shell; `<main>` đúng theo AC semantic structure
- [x] `src/components/layout/Header.tsx` -- tạo Server Component: `<header className="sticky top-0 z-50 bg-surface border-b border-border h-16 flex items-center px-[clamp(1rem,4vw,4rem)]">`; logo text "FilmVN" trái (`text-primary font-bold text-xl`); search `<input disabled placeholder="Tìm kiếm phim..." className="hidden md:flex ...">` giữa; nav links Home/Danh sách của tôi/Lịch sử + `<UserButton>` phải; nav links ẩn mobile (`hidden md:flex`); `focus-visible:ring-2 focus-visible:ring-primary` trên tất cả links -- sticky desktop header; UserButton self-manages Clerk session
- [x] `src/components/layout/BottomNav.tsx` -- tạo Client Component (`"use client"`): `usePathname` để xác định active tab; `<nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border h-16 flex">` với 4 tabs (Trang chủ→`/home`, Tìm kiếm→`/search`, Danh sách→`/my-list`, Tài khoản→`/profile`); tab active dùng `text-primary`, inactive `text-muted-foreground`; `aria-current="page"` trên tab active -- mobile navigation
- [x] `src/components/layout/Header.test.tsx` -- viết tests: render logo "FilmVN", render nav links "Trang chủ"/"Danh sách của tôi"/"Lịch sử", search input có `disabled` attribute -- AR-13; mock `@clerk/nextjs` export `UserButton` as `() => null`
- [x] `src/components/layout/BottomNav.test.tsx` -- viết tests: render 4 tabs với đúng labels, tab "Trang chủ" active khi pathname `/home` (có `aria-current="page"`), tab khác không có `aria-current` -- AR-13; mock `next/navigation` `usePathname`

**Acceptance Criteria:**
- Given `npm run dev`, when truy cập `/home` (sau khi đã auth), then Header hiển thị sticky trên desktop, BottomNav hiển thị bottom trên mobile
- Given `npx tsc --noEmit`, then 0 TypeScript errors
- Given `npm run test:run`, then tất cả test trong `Header.test.tsx` và `BottomNav.test.tsx` pass
- Given inspect DOM, then `<header>`, `<main>`, `<nav>` đều present; `<body>` có `font-sans` class
- Given resize xuống <768px, then nav links trong Header ẩn; BottomNav visible
- Given tab qua các link trong Header, then focus ring `ring-2 ring-primary` visible (không bị `outline: none` bare)
- Given Tailwind build, then class `bg-background`, `bg-surface`, `text-foreground`, `text-primary`, `bg-primary` hoạt động (không bị purge)

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence |
|---|---|---|
| BottomNav fixed overlaps main content on mobile | medium → patch | `<main>` has no bottom padding; BottomNav is `fixed bottom-0 h-16`; 64px of content permanently hidden on mobile |
| Header nav link href values untested | low → patch | Verification Gap layer demonstrated: change `href="/my-list"` to wrong value, zero tests fail |
| Type scale truncated | false | Spec explicitly specifies xs→4xl; implementation matches |
| `* { border-border }` overly broad | false | Spec task explicitly required this `@layer base` pattern |
| Missing SEO metadata | false | Out of scope — story intent is design tokens and layout shell only |
| `hidden md:flex` on search input | false | Valid Tailwind responsive pattern; `md:flex` overrides `hidden`; tests pass |
| BottomNav tabs missing icons | false | Spec does not require icons |
| Duplicate padding values | false | Spec explicitly specified both `clamp(1rem,4vw,4rem)` padding values independently |
| `hidden md:block` vs `hidden md:flex` for nav links | false | Functionally equivalent for anchor elements; `block` is semantically correct |
| Sub-path isActive not handled | false | Spec intent is exact match: "URL khớp tab path (e.g. /home)" |
| usePathname() null check | false | Next.js App Router guarantees non-null pathname; 11 tests pass |
| Inter font load failure | false | CSS `@theme` fallback `var(--font-inter, Inter, sans-serif)` handles gracefully |
| vi.hoisted for mockUsePathname | false | Tests currently pass 11/11; existing pattern works in this Vitest version |
| /search route missing | false | Route is created in Epic 2 (Story 2.4); expected deferred behavior |

## Design Notes

**Font variable pattern (Tailwind 4):** Next.js `Inter({ variable: '--font-inter' })` inject CSS variable `--font-inter` vào `:root`. `@theme { --font-sans: var(--font-inter, Inter, sans-serif); }` cho phép Tailwind utility `font-sans` dùng Inter. `body` cần có `font-sans` class để activate — không tự động.

**Token naming:** Đổi `text-primary/secondary/muted` từ epic context thành `foreground/muted-foreground/muted` để tránh collision với Tailwind utility `text-primary` (vốn map sang `--color-primary` = amber). Hex values không thay đổi.

**shadcn/ui deferred:** Header và BottomNav không cần shadcn component. Init shadcn khi story đầu tiên dùng component từ shadcn library (dự kiến Epic 2).

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: 0 errors
- `npm run test:run` -- expected: tất cả tests pass, không có skip
- `npm run build` -- expected: build thành công (env vars có thể thiếu, chỉ cần không có compile error)

### Review Findings

- [x] [Review][Patch] Missing `aria-label` on `<nav>` landmarks [`src/components/layout/BottomNav.tsx`, `src/components/layout/Header.tsx`] — Hai `<nav>` element không có `aria-label`; screen reader không phân biệt được "điều hướng chính" (Header) và "điều hướng dưới" (BottomNav) khi dùng landmark navigation.
- [x] [Review][Patch] Missing `--color-primary-foreground` token [`src/app/globals.css`] — Token `--color-primary: #d97706` (amber) được định nghĩa nhưng không có foreground-on-primary token; component dùng primary làm background (button, badge) sẽ không có token chuẩn cho màu chữ, phá vỡ invariant của token system.
- [x] [Review][Defer] BottomNav rendered unconditionally — no suppress mechanism [`src/app/(viewer)/layout.tsx`] — deferred: pre-existing design; không có trang full-screen (video player) nào tồn tại ở thời điểm này; cần xem xét lại khi Epic 3 (video player page) được implement.
