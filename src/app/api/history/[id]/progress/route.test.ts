import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- hoisted mocks ----
const { mockAuth, mockUpsert } = vi.hoisted(() => {
  const mockUpsert = vi.fn();
  const mockAuth = vi.fn();
  return { mockAuth, mockUpsert };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: mockUpsert,
    })),
  })),
}));

describe("POST /api/history/[id]/progress", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 khi userId null (chưa đăng nhập)", async () => {
    mockAuth.mockResolvedValue({ userId: null, getToken: vi.fn() });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/history/movie-1/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress_seconds: 60 }),
    });

    const res = await POST(req, { params: { id: "movie-1" } });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "Chưa đăng nhập",
      code: "UNAUTHORIZED",
    });
  });

  it("returns 200 và upsert đúng shape khi auth hợp lệ", async () => {
    const mockGetToken = vi.fn().mockResolvedValue("jwt-token");
    mockAuth.mockResolvedValue({ userId: "user-1", getToken: mockGetToken });
    mockUpsert.mockResolvedValue({ error: null });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/history/movie-1/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress_seconds: 120 }),
    });

    const res = await POST(req, { params: { id: "movie-1" } });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ data: { progress_seconds: 120 } });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        movie_id: "movie-1",
        progress_seconds: 120,
      }),
      { onConflict: "user_id,movie_id" }
    );
  });

  it("returns 400 khi progress_seconds không hợp lệ (âm hoặc không phải số)", async () => {
    const mockGetToken = vi.fn().mockResolvedValue("jwt-token");
    mockAuth.mockResolvedValue({ userId: "user-1", getToken: mockGetToken });

    const { POST } = await import("./route");

    // Negative value
    const req1 = new Request("http://localhost/api/history/movie-1/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress_seconds: -5 }),
    });
    const res1 = await POST(req1, { params: { id: "movie-1" } });
    expect(res1.status).toBe(400);
    const body1 = await res1.json();
    expect(body1).toMatchObject({ code: "BAD_REQUEST" });

    // Non-numeric value
    const req2 = new Request("http://localhost/api/history/movie-1/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress_seconds: "invalid" }),
    });
    const res2 = await POST(req2, { params: { id: "movie-1" } });
    expect(res2.status).toBe(400);
    const body2 = await res2.json();
    expect(body2).toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns 500 khi supabase throw lỗi", async () => {
    const mockGetToken = vi.fn().mockResolvedValue("jwt-token");
    mockAuth.mockResolvedValue({ userId: "user-1", getToken: mockGetToken });
    mockUpsert.mockResolvedValue({ error: new Error("Supabase error") });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/history/movie-1/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress_seconds: 60 }),
    });

    const res = await POST(req, { params: { id: "movie-1" } });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({ code: "INTERNAL_ERROR" });
  });
});
