import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- hoisted mocks ----
const { mockFrom, mockSelect, mockIn, mockNeq, mockLimit, mockUnstableCache } = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockNeq = vi.fn();
  const mockIn = vi.fn();
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();
  const mockUnstableCache = vi.fn();
  return { mockFrom, mockSelect, mockIn, mockNeq, mockLimit, mockUnstableCache };
});

vi.mock("@/lib/supabase/anon", () => ({
  createAnonClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

vi.mock("next/cache", () => ({
  unstable_cache: mockUnstableCache,
}));

function buildSimilarChain(result: { data: unknown; error: unknown }) {
  mockLimit.mockResolvedValue(result);
  mockNeq.mockReturnValue({ limit: mockLimit });
  mockIn.mockReturnValue({ neq: mockNeq });
  mockSelect.mockReturnValue({ in: mockIn });
  mockFrom.mockReturnValue({ select: mockSelect });
}

describe("getSimilarMovies", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    // Pass unstable_cache through so getSimilarMovies is not affected (it doesn't use it)
    mockUnstableCache.mockImplementation((fn: (...args: unknown[]) => Promise<unknown>) => fn);
  });

  it("returns [] immediately when genreIds is empty without calling Supabase", async () => {
    const { getSimilarMovies } = await import("./movieData");
    const result = await getSimilarMovies([], "exclude-id");
    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("deduplicates movies that appear multiple times due to genre matching", async () => {
    const DUPLICATE_ROWS = [
      {
        movies: {
          id: "movie-1",
          title: "Inception",
          poster_url: "/p1.jpg",
          year: 2010,
          rating: 8.8,
          movie_genres: [{ genres: { name: "Sci-Fi" } }],
        },
      },
      {
        movies: {
          id: "movie-1", // same movie — duplicate
          title: "Inception",
          poster_url: "/p1.jpg",
          year: 2010,
          rating: 8.8,
          movie_genres: [{ genres: { name: "Sci-Fi" } }],
        },
      },
      {
        movies: {
          id: "movie-2",
          title: "Interstellar",
          poster_url: "/p2.jpg",
          year: 2014,
          rating: 8.6,
          movie_genres: [{ genres: { name: "Sci-Fi" } }],
        },
      },
    ];

    buildSimilarChain({ data: DUPLICATE_ROWS, error: null });

    const { getSimilarMovies } = await import("./movieData");
    const result = await getSimilarMovies(["genre-1"], "exclude-id");

    // movie-1 appears twice in DB rows but result should deduplicate
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.id)).toEqual(["movie-1", "movie-2"]);
  });

  it("caps results at the limit even when more unique movies exist", async () => {
    const MANY_ROWS = Array.from({ length: 10 }, (_, i) => ({
      movies: {
        id: `movie-${i}`,
        title: `Movie ${i}`,
        poster_url: `/p${i}.jpg`,
        year: 2020 + i,
        rating: 7.0 + i * 0.1,
        movie_genres: [],
      },
    }));

    buildSimilarChain({ data: MANY_ROWS, error: null });

    const { getSimilarMovies } = await import("./movieData");
    const result = await getSimilarMovies(["genre-1"], "exclude-id", 3);

    expect(result).toHaveLength(3);
  });

  it("returns [] when Supabase returns an error", async () => {
    buildSimilarChain({ data: null, error: { message: "DB error" } });

    const { getSimilarMovies } = await import("./movieData");
    const result = await getSimilarMovies(["genre-1"], "exclude-id");

    expect(result).toEqual([]);
  });
});
