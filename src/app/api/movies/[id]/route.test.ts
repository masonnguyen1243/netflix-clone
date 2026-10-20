import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- hoisted mocks ----
const { mockGetMovieById } = vi.hoisted(() => {
  const mockGetMovieById = vi.fn();
  return { mockGetMovieById };
});

vi.mock("@/lib/movieData", () => ({
  getMovieById: mockGetMovieById,
}));

const MOVIE: Record<string, unknown> = {
  id: "uuid-1",
  title: "Inception",
  description: "A thief who steals corporate secrets.",
  poster_url: "https://example.com/poster.jpg",
  backdrop_url: "https://example.com/backdrop.jpg",
  trailer_url: "https://youtube.com/embed/abc",
  video_url: "https://example.com/video.mp4",
  year: 2010,
  rating: 8.8,
  cast: "Leonardo DiCaprio",
  director: "Christopher Nolan",
  genres: [{ id: "g1", name: "Sci-Fi" }],
};

describe("GET /api/movies/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns HTTP 200 with { data: Movie } when movie exists", async () => {
    mockGetMovieById.mockResolvedValue(MOVIE);

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/movies/uuid-1"), {
      params: { id: "uuid-1" },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body.data).toMatchObject({
      id: "uuid-1",
      title: "Inception",
      genres: [{ id: "g1", name: "Sci-Fi" }],
    });
  });

  it("returns HTTP 404 with { error, code: 'NOT_FOUND' } when movie does not exist", async () => {
    mockGetMovieById.mockResolvedValue(null);

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/movies/nonexistent"), {
      params: { id: "nonexistent" },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "Không tìm thấy phim",
      code: "NOT_FOUND",
    });
  });

  it("returns HTTP 500 with { code: 'INTERNAL_ERROR' } when getMovieById throws", async () => {
    mockGetMovieById.mockRejectedValue(new Error("DB connection failed"));

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/movies/uuid-1"), {
      params: { id: "uuid-1" },
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({ code: "INTERNAL_ERROR" });
  });
});
