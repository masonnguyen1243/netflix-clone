import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import type { Movie } from "@/types";

const { mockAuth, mockMaybySingle, mockGetMovieById, mockNotFound } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockMaybySingle: vi.fn(),
  mockGetMovieById: vi.fn(),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("@/lib/movieData", () => ({ getMovieById: mockGetMovieById }));
vi.mock("next/navigation", () => ({ notFound: mockNotFound }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: mockMaybySingle })),
        })),
      })),
    })),
  })),
}));

let capturedMovieProp: (Movie & { progress_seconds: number }) | null = null;
vi.mock("./WatchPageClient", () => ({
  default: (props: { movie: Movie & { progress_seconds: number } }) => {
    capturedMovieProp = props.movie;
    return <div data-testid="watch-page-client" />;
  },
}));

import WatchPage from "./page";

const MOVIE: Movie = {
  id: "movie-1",
  title: "Test Film",
  description: "A movie",
  poster_url: "/poster.jpg",
  backdrop_url: "/backdrop.jpg",
  trailer_url: null,
  video_url: "https://youtube.com/watch?v=abc",
  year: 2024,
  rating: 7.5,
  cast: "Actor",
  director: "Director",
  genres: [],
};

describe("WatchPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    capturedMovieProp = null;
  });

  it("passes progress_seconds: 0 when user is not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null, getToken: vi.fn() });
    mockGetMovieById.mockResolvedValue(MOVIE);

    render(await WatchPage({ params: { id: "movie-1" } }));

    expect(capturedMovieProp).toMatchObject({ id: "movie-1", progress_seconds: 0 });
  });

  it("passes progress_seconds from watch_history when authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", getToken: vi.fn().mockResolvedValue("jwt") });
    mockGetMovieById.mockResolvedValue(MOVIE);
    mockMaybySingle.mockResolvedValue({ data: { progress_seconds: 180 } });

    render(await WatchPage({ params: { id: "movie-1" } }));

    expect(capturedMovieProp).toMatchObject({ id: "movie-1", progress_seconds: 180 });
  });

  it("defaults to progress_seconds: 0 when watch_history has no row", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", getToken: vi.fn().mockResolvedValue("jwt") });
    mockGetMovieById.mockResolvedValue(MOVIE);
    mockMaybySingle.mockResolvedValue({ data: null });

    render(await WatchPage({ params: { id: "movie-1" } }));

    expect(capturedMovieProp).toMatchObject({ id: "movie-1", progress_seconds: 0 });
  });

  it("calls notFound() when movie does not exist", async () => {
    mockAuth.mockResolvedValue({ userId: null, getToken: vi.fn() });
    mockGetMovieById.mockResolvedValue(null);

    await expect(WatchPage({ params: { id: "nonexistent" } })).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(mockNotFound).toHaveBeenCalledOnce();
  });
});
