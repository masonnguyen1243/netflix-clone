---
title: 'Story 1.3: Authentication Pages & Route Protection'
type: 'feature'
created: '2026-10-14'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '33647dc77375573682159c10bdcc6d1f1a3dcf72'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Chưa có landing page, trang sign-in/sign-up, trang profile, hay trang 403 — middleware hiện tại chỉ là placeholder chưa có admin role gate. User chưa thể đăng ký, đăng nhập, hay xem profile; route `/admin` chưa được bảo vệ theo role.

**Approach:** Tạo landing page tối/cinematic tại `/`, trang auth qua Clerk components tại `/sign-in` và `/sign-up`, profile page tại `/profile` dùng Clerk user object, trang `/unauthorized` cho non-admin, và cập nhật middleware với full protected routes + admin role check từ JWT.

## Boundaries & Constraints

**Always:**
- Middleware async: `clerkMiddleware(async (auth, request) => {...})`, await `auth()` và `auth.protect()`
- Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)` — tất cả routes khác protected
- Admin gate: đọc `sessionClaims?.publicMetadata?.role === 'admin'` từ JWT — không query DB
- Non-admin hitting `/admin(.*)` → `NextResponse.redirect(new URL('/unauthorized', request.url))`
- Profile data: chỉ từ `currentUser()` — không read DB
- `(auth)/layout.tsx`: không có Header/BottomNav; centered layout
- `[[...sign-in]]` và `[[...sign-up]]` catch-all route pattern cho Clerk components
- Focus indicator trên tất cả interactive elements: `focus-visible:ring-2 focus-visible:ring-primary`
- Tất cả microcopy tiếng Việt

**Never:**
- Không custom UI sign-in/sign-up (Clerk component tự render)
- Không query DB trong profile page hoặc middleware
- Không thêm `<SignedIn>` wrapper trong viewer layout (middleware đã bảo vệ)
- Không install package mới

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Unauthenticated hits `/home` | Không có session | Redirect → `/sign-in?redirect_url=%2Fhome` | — |
| Sign-in thành công, có `redirect_url` | Session mới, param tồn tại | Redirect → URL trong `redirect_url` | — |
| Sign-in thành công, không có `redirect_url` | Session mới | Redirect → `/home` (fallback) | — |
| Authenticated hits `/` | Session hợp lệ | Landing page hiển thị, không redirect | — |
| Non-admin hits `/admin` | Session, `role ≠ 'admin'` | Redirect → `/unauthorized` | — |
| Admin hits `/admin` | Session, `role === 'admin'` | Pass through | — |
| `/profile` page load | Authenticated user | Avatar, tên, email từ Clerk render | Middleware đảm bảo auth trước |

</frozen-after-approval>

## Code Map

- `src/middleware.ts` — UPDATE: placeholder → full implementation; thêm `isAdminRoute`, async handler, admin role check, redirect `/unauthorized`; mở rộng `isPublicRoute` thêm `/sign-in(.*)` và `/sign-up(.*)`
- `src/app/page.tsx` — UPDATE: landing page dark/cinematic thay cho `<h1>` placeholder
- `src/app/(auth)/` — thư mục tồn tại với `.gitkeep`; tạo `layout.tsx`, `sign-in/[[...sign-in]]/page.tsx`, `sign-up/[[...sign-up]]/page.tsx`
- `src/app/(viewer)/layout.tsx` — không thay đổi; profile/unauthorized kế thừa Header + BottomNav
- `src/app/(viewer)/profile/page.tsx` — NEW: Server Component, `currentUser()` từ `@clerk/nextjs/server`
- `src/app/(viewer)/unauthorized/page.tsx` — NEW: Server Component, thông báo 403 + link về `/home`
- `src/app/globals.css` — không thay đổi; tokens `bg-background`, `text-primary`, `bg-primary`, `text-primary-foreground`, `text-muted-foreground` đã defined từ Story 1.2

**Continuity từ Story 1.2:**
- `--color-primary-foreground` token: đã patch và define trong `globals.css` (từ review Story 1.2)
- Design tokens sẵn dùng: `bg-background`, `bg-surface`, `text-foreground`, `text-primary`, `bg-primary`, `text-muted-foreground`

## Tasks & Acceptance

**Execution:**
- [x] `src/middleware.ts` — rewrite: `clerkMiddleware(async (auth, request) => {...})`; `isPublicRoute(["/", "/sign-in(.*)", "/sign-up(.*)"])`; `isAdminRoute(["/admin(.*)"])`; logic: if admin route + `sessionClaims?.publicMetadata?.role !== 'admin'` → `return NextResponse.redirect(new URL('/unauthorized', request.url))`; else if not public → `await auth.protect()` — full route protection + admin gate
- [x] `src/app/page.tsx` — rewrite: `<main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-[clamp(1rem,4vw,4rem)] text-center">`; logo `<h1 className="text-5xl font-bold text-primary">FilmVN</h1>`; tagline `<p className="mt-4 text-xl text-muted-foreground">Xem phim trực tuyến miễn phí</p>`; `<Link href="/sign-in" className="mt-8 inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary-hover transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">Đăng nhập</Link>` — cinematic dark hero, entry point duy nhất
- [x] `src/app/(auth)/layout.tsx` — tạo Server Component: `<main className="min-h-screen flex items-center justify-center bg-background">{children}</main>` — wrap auth pages không có Header/BottomNav
- [x] `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` — tạo: `import { SignIn } from '@clerk/nextjs'; export default function SignInPage() { return <SignIn fallbackRedirectUrl="/home" />; }` — Clerk handle redirect_url param tự động
- [x] `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` — tạo: `import { SignUp } from '@clerk/nextjs'; export default function SignUpPage() { return <SignUp fallbackRedirectUrl="/home" />; }` — match sign-in behavior
- [x] `src/app/(viewer)/profile/page.tsx` — tạo Server Component: `currentUser()` từ `@clerk/nextjs/server`; `<main>` với `<h1 className="text-2xl font-bold">Tài khoản</h1>`; avatar `<Image src={user.imageUrl} width={80} height={80} alt="Avatar" className="rounded-full">` nếu có; `fullName`; `primaryEmailAddress?.emailAddress`; semantic `<dl>` cho data — profile từ Clerk only
- [x] `src/app/(viewer)/unauthorized/page.tsx` — tạo Server Component: `<main>` với `<h1>403</h1>`, `<p>Bạn không có quyền truy cập</p>`, `<Link href="/home" className="... focus-visible:ring-2 focus-visible:ring-primary">Về trang chủ</Link>` — admin gate error page
- [x] `src/app/page.test.tsx` — tạo: render landing page; assert `<h1>FilmVN</h1>` hiển thị; assert link "Đăng nhập" có `href="/sign-in"`; mock `next/link` — AR-13
- [x] `src/app/(viewer)/profile/profile.test.tsx` — tạo: mock `@clerk/nextjs/server` `currentUser` trả `{ fullName: 'Nguyễn Test', primaryEmailAddress: { emailAddress: 'test@example.com' }, imageUrl: 'https://example.com/avatar.jpg' }`; assert renders tên và email — AR-13; mock `next/image`
- [x] `src/app/(viewer)/unauthorized/unauthorized.test.tsx` — tạo: assert renders "Bạn không có quyền truy cập" và Link với `href="/home"` — AR-13
- [x] `src/middleware.test.ts` — tạo: matrix audit rows 1, 4, 5, 6 — mock `@clerk/nextjs/server` và `next/server`; assert protect được gọi cho `/home`, không redirect cho `/` (public), redirect non-admin `/admin` → `/unauthorized`, admin pass through

**Acceptance Criteria:**
- Given unauthenticated user truy cập `/home`, when middleware xử lý, then redirect đến `/sign-in?redirect_url=%2Fhome`
- Given sign-in thành công không có `redirect_url`, when Clerk callback, then redirect đến `/home`
- Given authenticated user truy cập `/`, then landing page hiển thị — không redirect
- Given authenticated non-admin truy cập `/admin`, when middleware check `publicMetadata.role`, then redirect đến `/unauthorized`
- Given admin user (`publicMetadata.role === 'admin'`) truy cập `/admin`, then pass through
- Given `npx tsc --noEmit`, then 0 TypeScript errors
- Given `npm run test:run`, then tất cả tests trong `page.test.tsx`, `profile.test.tsx`, `unauthorized.test.tsx` pass
- Given `/profile` page, then `<main>` có `<h1>Tài khoản</h1>`, avatar img, tên và email từ Clerk

## Implementation Notes

## Review Triage Log

| # | Finding | Verdict | Evidence | Route |
|---|---------|---------|----------|-------|
| BH-1 | `AuthLayout` dùng `React.ReactNode` không có import React | false | `npx tsc --noEmit` exit 0; `@types/react` cung cấp React namespace globally trong Next.js | reject |
| BH-2 | `fallbackRedirectUrl="/home"` gây redirect loop | false | Sau sign-in user đã authenticated; middleware gọi `auth.protect()` cho `/home` và pass thành công — không có loop | reject |
| BH-3 | ProfilePage render trống khi `user` null | false | Spec nói "Middleware đảm bảo user authenticated"; null-user là không reachable; implementation hiện tại handle gracefully per spec | reject |
| BH-4 | `mt-2` trên `<dt>Email</dt>` — spacing redundant/sai khi `fullName` vắng | low | `<dl>` đã có `space-y-2`; `mt-2` trên `<dt>` thêm margin thừa khi fullName absent. Thực tế xảy ra. | patch |
| BH-5 | Không có test cho null-user branch trong profile.test | false | Middleware đảm bảo auth; null-user unreachable; không test scenario không thể xảy ra | reject |
| BH-6 | Top-level `await import` trong middleware.test | false | Tests pass (23/23); Vitest hỗ trợ top-level await trong test files | reject |
| BH-7 | Không verify redirect-to-sign-in với `redirect_url` param | false | `auth.protect()` là Clerk API; Clerk xử lý redirect nội bộ; test correctly verifies protect() được gọi — đúng unit-testable surface | reject |
| BH-8 | UnauthorizedPage không có metadata export | defer | Không có trong spec; pattern của pages khác trong project; design decision | defer |
| BH-9 | `bg-primary-hover` không phải Tailwind token chuẩn | false | `--color-primary-hover: #b45309` đã defined trong `@theme` block của globals.css; Tailwind v4 auto-generates utility từ @theme vars | reject |
| VG-1 | Sign-in/sign-up pages không có test coverage cho `fallbackRedirectUrl` | low | Pages có 1 prop duy nhất là business logic (`fallbackRedirectUrl="/home"`). Không có test file nào cho các pages này. Regression sẽ không bị phát hiện. | patch |
| VG-2 | Unauthenticated user hitting `/admin` → `/unauthorized` thay vì `/sign-in` | defer | Per spec literal: "non-admin → redirect /unauthorized"; unauthenticated = non-admin. Design decision không được address trong spec matrix. | defer |
| EC-1 | Unauthenticated `/admin` → `/unauthorized` (duplicate VG-2) | defer | Cùng finding với VG-2 | defer |
| EC-2 | Admin trên `/admin` — `auth.protect()` được gọi redundantly sau khi pass gate | low | Spec nói "else if not public → protect"; current code không dùng `else if` nên protect() được gọi cho admin trên admin routes. `protect()` là no-op cho authenticated user nhưng là deviation khỏi spec và adds latency. | patch |
| EC-3 | Không assert protect() behavior cho admin trên `/admin` test | low | Grouped với EC-2; cùng root cause | patch |
| EC-4 | `auth.protect()` không verify `redirect_url` param | false | Duplicate of BH-7; `false` | reject |
| EC-5 | `currentUser()` throws khi Clerk outage | defer | Next.js error.tsx handles; out of scope ("không install package mới") | defer |
| EC-6 | `capturedHandlerRef` module caching | false | Guard `if (!handler) throw` handles; tests pass | reject |
| EC-7 | `page.tsx` vắng mặt trong diff | false | Diff đã được regenerate với `git diff <baseline> --` để capture working-tree changes; page.tsx hiện có trong diff | reject |
| EC-8 | Unauthenticated `/admin` → `/unauthorized` claim | defer | Duplicate of VG-2 | defer |
| EC-9 | `auth()` được gọi cho public routes | false | By design của `clerkMiddleware`; Clerk needs session context cho mọi request; low confidence finding | reject |

**Groups:**
- **Group A** (BH-4): `low`, `patch` — remove `mt-2` from `<dt>Email</dt>` in profile page
- **Group B** (VG-1): `low`, `patch` — add tests cho sign-in và sign-up pages
- **Group C** (EC-2, EC-3): `low`, `patch` — đổi `if (!isPublicRoute)` thành `else if (!isPublicRoute)` trong middleware

## Spec Change Log

## Design Notes

**Admin role check trong middleware:** `const { sessionClaims } = await auth();` — `sessionClaims.publicMetadata.role` được set thủ công trong Clerk Dashboard per user. Không cần custom JWT template cho `publicMetadata`.

**Clerk env vars (verify trong `.env.local`):** `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` — nếu thiếu, Clerk dùng default URL, routing sai. `fallbackRedirectUrl` prop trên `<SignIn>/<SignUp>` xử lý redirect sau auth.

**Profile page:** `currentUser()` chỉ available trong Server Components. Middleware đảm bảo user authenticated → không cần null-check defensive nhưng vẫn handle gracefully.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: 0 errors
- `npm run test:run` -- expected: tất cả tests pass (page.test.tsx, profile.test.tsx, unauthorized.test.tsx)
- `npm run build` -- expected: build thành công

**Manual checks:**
- Truy cập `/` khi chưa auth → landing page "FilmVN" + "Đăng nhập" button
- Click "Đăng nhập" → `/sign-in`, Clerk form render
- Sign in → redirect `/home`
- Non-admin truy cập `/admin` → redirect `/unauthorized` với "Bạn không có quyền truy cập"
