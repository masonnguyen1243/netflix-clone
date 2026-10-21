import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- hoisted mocks ----
const {
  mockAuth,
  mockFrom,
  mockSelect,
  mockEq,
  mockMaybeSingle,
  mockDelete,
  mockInsert,
} = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn();
  const mockDelete = vi.fn();
  const mockInsert = vi.fn();
  const mockEq = vi.fn();
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();
  const mockAuth = vi.fn();
  return {
    mockAuth,
    mockFrom,
    mockSelect,
    mockEq,
    mockMaybeSingle,
    mockDelete,
    mockInsert,
  };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

function makeRequest() {
  return new Request("http://localhost/api/watchlist/movie-1", {
    method: "POST",
  });
}

const mockParams = Promise.resolve({ id: "movie-1" });

describe("POST /api/watchlist/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("returns HTTP 401 when userId is null (unauthenticated)", async () => {
    mockAuth.mockResolvedValue({ userId: null, getToken: vi.fn() });

    const { POST } = await import("./route");
    const res = await POST(makeRequest(), { params: mockParams });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({ error: "Chưa đăng nhập", code: "UNAUTHORIZED" });
  });

  it("INSERTs when movie is not in watchlist → inWatchlist: true", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", getToken: vi.fn().mockResolvedValue("token") });

    // SELECT returns null (not in watchlist)
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    // INSERT succeeds
    mockInsert.mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "watchlist") {
        return {
          select: mockSelect,
          insert: mockInsert,
          delete: mockDelete,
        };
      }
      return {};
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest(), { params: mockParams });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ data: { movieId: "movie-1", inWatchlist: true } });
  });

  it("DELETEs when movie is already in watchlist → inWatchlist: false", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", getToken: vi.fn().mockResolvedValue("token") });

    // SELECT returns existing row
    mockMaybeSingle.mockResolvedValue({ data: { id: "wl-row-1" }, error: null });
    mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    // DELETE chain: .delete().eq(userId).eq(movieId) — first eq returns chainable, second returns Promise
    const mockDeleteEqFinal = vi.fn().mockResolvedValue({ error: null });
    const mockDeleteEqFirst = vi.fn().mockReturnValue({ eq: mockDeleteEqFinal });
    mockDelete.mockReturnValue({ eq: mockDeleteEqFirst });

    mockFrom.mockImplementation((table: string) => {
      if (table === "watchlist") {
        return {
          select: mockSelect,
          insert: mockInsert,
          delete: mockDelete,
        };
      }
      return {};
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest(), { params: mockParams });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ data: { movieId: "movie-1", inWatchlist: false } });
  });

  it("returns HTTP 500 when Supabase throws an error", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", getToken: vi.fn().mockResolvedValue("token") });

    // SELECT throws
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: "DB error" } });
    mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    mockFrom.mockImplementation(() => ({
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
    }));

    const { POST } = await import("./route");
    const res = await POST(makeRequest(), { params: mockParams });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });
});
