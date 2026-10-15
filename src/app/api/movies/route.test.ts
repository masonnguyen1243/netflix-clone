import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- hoisted mocks ----
const { mockFrom, mockSelect, mockIlike, mockUnstableCache } = vi.hoisted(() => {
  const mockIlike = vi.fn();
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();
  const mockUnstableCache = vi.fn();
  return { mockFrom, mockSelect, mockIlike, mockUnstableCache };
});

vi.mock("@/lib/supabase/anon", () => ({
  createAnonClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

vi.mock("next/cache", () => ({
  unstable_cache: mockUnstableCache,
}));

// Helpers to build the supabase chain
function buildChain(result: { data: unknown; error: unknown }) {
  mockIlike.mockResolvedValue(result);
  mockSelect.mockReturnValue({ ilike: mockIlike, ...result });
  // For the no-query case, select returns a thenable
  const thenable = { then: (cb: (v: unknown) => void) => cb(result) };
  mockSelect.mockReturnValueOnce(thenable); // first call for cached path is skipped by mock
  mockFrom.mockReturnValue({ select: mockSelect });
}

function makeRequest(url: string) {
  return new Request(url);
}

const MOVIE_ROW = {
  id: "uuid-1",
  title: "Inception",
  poster_url: "https://example.com/poster.jpg",
  year: 2010,
  rating: 8.8,
  movie_genres: [{ genres: { id: "g1", name: "Sci-Fi" } }],
};

describe("GET /api/movies", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("returns { data: MovieSummary[] } HTTP 200 for all movies (no q param)", async () => {
    // unstable_cache wraps the function — return the cached fn directly
    mockUnstableCache.mockImplementation((fn: () => Promise<unknown>) => fn);

    // Set up supabase to return a valid movie
    mockSelect.mockResolvedValue({ data: [MOVIE_ROW], error: null });
    mockFrom.mockReturnValue({ select: mockSelect });

    const { GET } = await import("./route");
    const res = await GET(makeRequest("http://localhost/api/movies"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data[0]).toMatchObject({
      id: "uuid-1",
      title: "Inception",
      genres: ["Sci-Fi"],
    });
  });

  it("returns all movies when q= is empty string (ignores filter)", async () => {
    mockUnstableCache.mockImplementation((fn: () => Promise<unknown>) => fn);

    mockSelect.mockResolvedValue({ data: [MOVIE_ROW], error: null });
    mockFrom.mockReturnValue({ select: mockSelect });

    const { GET } = await import("./route");
    const res = await GET(makeRequest("http://localhost/api/movies?q="));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("filters by title and sets Cache-Control: no-store when q is non-empty", async () => {
    mockUnstableCache.mockImplementation((fn: () => Promise<unknown>) => fn);

    // For search: ilike is used
    mockIlike.mockResolvedValue({ data: [MOVIE_ROW], error: null });
    mockSelect.mockReturnValue({ ilike: mockIlike });
    mockFrom.mockReturnValue({ select: mockSelect });

    const { GET } = await import("./route");
    const res = await GET(makeRequest("http://localhost/api/movies?q=inception"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data[0]).toMatchObject({ genres: expect.any(Array) });
  });

  it("returns HTTP 500 with { error } when DB fails on all-movies query", async () => {
    mockUnstableCache.mockImplementation((fn: () => Promise<unknown>) => fn);

    mockSelect.mockResolvedValue({ data: null, error: { message: "DB error" } });
    mockFrom.mockReturnValue({ select: mockSelect });

    const { GET } = await import("./route");
    const res = await GET(makeRequest("http://localhost/api/movies"));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });
});
