import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuthProtect, mockRedirect, capturedHandlerRef } = vi.hoisted(() => {
  const mockAuthProtect = vi.fn();
  const mockRedirect = vi.fn();
  const capturedHandlerRef: { current: ((auth: unknown, req: unknown) => Promise<unknown>) | null } = { current: null };
  return { mockAuthProtect, mockRedirect, capturedHandlerRef };
});

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (handler: (auth: unknown, req: unknown) => Promise<unknown>) => {
    capturedHandlerRef.current = handler;
    return vi.fn();
  },
  createRouteMatcher: (patterns: string[]) => {
    return (req: { nextUrl: { pathname: string } }) => {
      const url = req.nextUrl.pathname;
      return patterns.some((p) => {
        // Convert Clerk pattern: (.*)  → .*; then anchor with ^ and $
        const regexStr = "^" + p.replace(/\(\.\*\)/g, ".*") + "$";
        return new RegExp(regexStr).test(url);
      });
    };
  },
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, NextResponse: { redirect: mockRedirect } };
});

import { NextRequest } from "next/server";
await import("./middleware");

function makeRequest(pathname: string) {
  return new NextRequest(new URL(`http://localhost${pathname}`));
}

function makeAuth(role?: string) {
  const sessionClaims = { publicMetadata: role ? { role } : {} };
  const fn = vi.fn().mockResolvedValue({ sessionClaims });
  return Object.assign(fn, { protect: mockAuthProtect });
}

describe("middleware", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRedirect.mockImplementation((url: URL) => ({ type: "redirect", url: url.toString() }));
  });

  it("calls auth.protect for non-public route (matrix row 1: /home unauthenticated)", async () => {
    const handler = capturedHandlerRef.current;
    if (!handler) throw new Error("handler not registered");
    const auth = makeAuth();
    await handler(auth, makeRequest("/home"));
    expect(mockAuthProtect).toHaveBeenCalled();
  });

  it("redirects non-admin from /admin to /unauthorized (matrix row 5)", async () => {
    const handler = capturedHandlerRef.current;
    if (!handler) throw new Error("handler not registered");
    const auth = makeAuth("viewer");
    await handler(auth, makeRequest("/admin"));
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/unauthorized" })
    );
  });

  it("allows admin through /admin without 403 redirect (matrix row 6)", async () => {
    const handler = capturedHandlerRef.current;
    if (!handler) throw new Error("handler not registered");
    const auth = makeAuth("admin");
    await handler(auth, makeRequest("/admin"));
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("does not protect public route / (matrix row 4: authenticated hits /)", async () => {
    const handler = capturedHandlerRef.current;
    if (!handler) throw new Error("handler not registered");
    const auth = makeAuth();
    await handler(auth, makeRequest("/"));
    expect(mockAuthProtect).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
