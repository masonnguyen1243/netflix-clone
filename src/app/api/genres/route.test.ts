import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockSelect } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();
  return { mockFrom, mockSelect };
});

vi.mock("@/lib/supabase/anon", () => ({
  createAnonClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe("GET /api/genres", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it("returns { data: Genre[] } HTTP 200", async () => {
    mockSelect.mockResolvedValue({
      data: [
        { id: "g1", name: "Action" },
        { id: "g2", name: "Drama" },
      ],
      error: null,
    });

    const { GET } = await import("./route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({ id: "g1", name: "Action" });
  });

  it("returns HTTP 500 with { error } when DB fails", async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: "DB connection failed" } });

    const { GET } = await import("./route");
    const res = await GET();

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toHaveProperty("error", "DB connection failed");
  });
});
