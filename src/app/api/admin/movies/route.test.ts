import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- hoisted mocks ----
const { mockAuth, mockRevalidateTag, mockInsert, mockSelect, mockSingle, mockFrom, mockDelete, mockEq, mockIn } =
  vi.hoisted(() => {
    const mockSingle = vi.fn();
    const mockSelect = vi.fn();
    const mockInsert = vi.fn();
    const mockEq = vi.fn();
    const mockIn = vi.fn();
    const mockDelete = vi.fn();
    const mockFrom = vi.fn();
    const mockAuth = vi.fn();
    const mockRevalidateTag = vi.fn();
    return { mockAuth, mockRevalidateTag, mockInsert, mockSelect, mockSingle, mockFrom, mockDelete, mockEq, mockIn };
  });

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("next/cache", () => ({
  revalidateTag: mockRevalidateTag,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

const INSERTED_MOVIE = {
  id: "movie-uuid-1",
  title: "Test Movie",
  description: "A test movie",
  poster_url: "https://example.com/poster.jpg",
  backdrop_url: "",
  trailer_url: "",
  video_url: "",
  year: 2024,
  rating: 8.0,
  cast: "",
  director: "Test Director",
};

const VALID_BODY = {
  title: "Test Movie",
  description: "A test movie",
  poster_url: "https://example.com/poster.jpg",
  year: 2024,
  rating: 8.0,
  director: "Test Director",
  genre_ids: [],
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/movies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function setupAdminAuth() {
  mockAuth.mockResolvedValue({
    sessionClaims: { publicMetadata: { role: "admin" } },
  });
}

function setupNonAdminAuth(role?: string) {
  mockAuth.mockResolvedValue({
    sessionClaims: { publicMetadata: role ? { role } : {} },
  });
}

function setupSuccessfulMovieInsert() {
  mockSingle.mockResolvedValue({ data: INSERTED_MOVIE, error: null });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockInsert.mockReturnValue({ select: mockSelect });
  // genre insert — returns ok
  const mgInsert = vi.fn().mockResolvedValue({ data: null, error: null });
  // genres select (for in)
  const inFn = vi.fn().mockResolvedValue({ data: [], error: null });
  mockIn.mockImplementation(inFn);

  mockFrom.mockImplementation((table: string) => {
    if (table === "movies") {
      return { insert: mockInsert, delete: mockDelete };
    }
    if (table === "movie_genres") {
      return { insert: mgInsert };
    }
    if (table === "genres") {
      return { select: () => ({ in: inFn }) };
    }
    return {};
  });
}

describe("POST /api/admin/movies", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  });

  it("returns { data: Movie } HTTP 201 and calls revalidateTag for valid admin (matrix row 5)", async () => {
    setupAdminAuth();
    setupSuccessfulMovieInsert();

    const { POST } = await import("./route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body.data).toMatchObject({
      id: "movie-uuid-1",
      title: "Test Movie",
    });
    expect(mockRevalidateTag).toHaveBeenCalledWith("movies", { expire: 0 });
  });

  it("returns { error: 'Unauthorized' } HTTP 401 when no auth (matrix row 6)", async () => {
    mockAuth.mockResolvedValue({ sessionClaims: null });

    const { POST } = await import("./route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("returns { error: 'Unauthorized' } HTTP 401 when role is not admin (matrix row 7)", async () => {
    setupNonAdminAuth("viewer");

    const { POST } = await import("./route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns HTTP 400 when required fields are missing", async () => {
    setupAdminAuth();

    const { POST } = await import("./route");
    const res = await POST(makeRequest({ title: "Only Title" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("defaults backdrop_url, trailer_url, video_url, cast to empty string when not provided", async () => {
    setupAdminAuth();
    setupSuccessfulMovieInsert();

    const { POST } = await import("./route");
    await POST(makeRequest(VALID_BODY)); // no backdrop_url etc.

    // Check that insert was called with empty strings for NOT NULL fields
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        backdrop_url: "",
        trailer_url: "",
        video_url: "",
        cast: "",
      })
    );
  });

  it("inserts movie_genres and returns genres when genre_ids is non-empty", async () => {
    setupAdminAuth();

    const GENRE_OBJ = { id: "g1", name: "Action" };

    mockSingle.mockResolvedValue({ data: INSERTED_MOVIE, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const mgInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    const inFn = vi.fn().mockResolvedValue({ data: [GENRE_OBJ], error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "movies") {
        return { insert: mockInsert, delete: mockDelete };
      }
      if (table === "movie_genres") {
        return { insert: mgInsert };
      }
      if (table === "genres") {
        return { select: () => ({ in: inFn }) };
      }
      return {};
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest({ ...VALID_BODY, genre_ids: ["g1"] }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.genres).toMatchObject([GENRE_OBJ]);
    expect(mgInsert).toHaveBeenCalledWith([{ movie_id: "movie-uuid-1", genre_id: "g1" }]);
  });

  it("deletes orphaned movie and returns 500 when movie_genres insert fails", async () => {
    setupAdminAuth();

    mockSingle.mockResolvedValue({ data: INSERTED_MOVIE, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    // movie_genres insert fails
    const mgInsert = vi.fn().mockResolvedValue({ data: null, error: { message: "FK violation" } });
    const mockDeleteEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const deleteChain = { eq: mockDeleteEq };

    mockFrom.mockImplementation((table: string) => {
      if (table === "movies") {
        return { insert: mockInsert, delete: vi.fn().mockReturnValue(deleteChain) };
      }
      if (table === "movie_genres") {
        return { insert: mgInsert };
      }
      return {};
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest({ ...VALID_BODY, genre_ids: ["g1"] }));

    expect(res.status).toBe(500);
    // The delete rollback should have been called
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "movie-uuid-1");
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });
});
