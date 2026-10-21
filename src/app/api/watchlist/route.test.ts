import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- hoisted mocks ----
const { mockAuth, mockFrom, mockSelect, mockEq, mockOrder } = vi.hoisted(() => {
  const mockOrder = vi.fn();
  const mockEq = vi.fn();
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();
  const mockAuth = vi.fn();
  return { mockAuth, mockFrom, mockSelect, mockEq, mockOrder };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

const WATCHLIST_ROW = {
  created_at: "2026-10-01T00:00:00Z",
  movies: {
    id: "movie-1",
    title: "Test Movie",
    poster_url: "https://example.com/poster.jpg",
    year: 2023,
    rating: 7.5,
    movie_genres: [{ genres: { id: "g1", name: "Action" } }],
  },
};

function buildChain(result: { data: unknown; error: unknown }) {
  mockOrder.mockResolvedValue(result);
  mockEq.mockReturnValue({ order: mockOrder, eq: mockEq });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect });
}

describe("GET /api/watchlist", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("returns HTTP 401 when userId is null (unauthenticated)", async () => {
    mockAuth.mockResolvedValue({ userId: null, getToken: vi.fn() });

    const { GET } = await import("./route");
    const res = await GET();

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({ error: "Chưa đăng nhập", code: "UNAUTHORIZED" });
  });

  it("returns HTTP 200 with { data: MovieSummary[] } when authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", getToken: vi.fn().mockResolvedValue("token") });
    buildChain({ data: [WATCHLIST_ROW], error: null });

    const { GET } = await import("./route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data[0]).toMatchObject({
      id: "movie-1",
      title: "Test Movie",
      genres: ["Action"],
    });
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns HTTP 500 when Supabase throws an error", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", getToken: vi.fn().mockResolvedValue("token") });
    mockOrder.mockResolvedValue({ data: null, error: { message: "DB error" } });
    mockEq.mockReturnValue({ order: mockOrder, eq: mockEq });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const { GET } = await import("./route");
    const res = await GET();

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });
});
