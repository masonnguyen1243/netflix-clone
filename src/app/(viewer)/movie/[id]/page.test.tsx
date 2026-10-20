import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import type { Movie, MovieSummary } from "@/types";

// ---- hoisted mocks ----
const { mockGetMovieById, mockGetSimilarMovies, mockNotFound } = vi.hoisted(() => {
  const mockGetMovieById = vi.fn();
  const mockGetSimilarMovies = vi.fn();
  const mockNotFound = vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); });
  return { mockGetMovieById, mockGetSimilarMovies, mockNotFound };
});

vi.mock("@/lib/movieData", () => ({
  getMovieById: mockGetMovieById,
  getSimilarMovies: mockGetSimilarMovies,
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock("@/components/movie/MovieCard", () => ({
  MovieCard: ({ movie }: { movie: MovieSummary }) => <div data-testid="movie-card">{movie.title}</div>,
}));

vi.mock("@/components/movie/WatchlistButton", () => ({
  WatchlistButton: () => <button disabled>Thêm vào danh sách</button>,
}));

import MovieDetailPage from "./page";

const MOVIE: Movie = {
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

const SIMILAR: MovieSummary[] = [
  { id: "uuid-2", title: "Interstellar", poster_url: "/p2.jpg", year: 2014, rating: 8.6, genres: ["Sci-Fi"] },
];

describe("MovieDetailPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetSimilarMovies.mockResolvedValue([]);
  });

  it("calls notFound() when movie does not exist", async () => {
    mockGetMovieById.mockResolvedValue(null);

    await expect(
      MovieDetailPage({ params: { id: "nonexistent" } })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalledOnce();
  });

  it("renders title, description, year, director, rating, genres, cast when movie exists", async () => {
    mockGetMovieById.mockResolvedValue(MOVIE);
    mockGetSimilarMovies.mockResolvedValue([]);

    render(await MovieDetailPage({ params: { id: "uuid-1" } }));

    expect(screen.getByRole("heading", { name: "Inception" })).toBeInTheDocument();
    expect(screen.getByText(/A thief who steals corporate secrets/)).toBeInTheDocument();
    expect(screen.getByText(/2010/)).toBeInTheDocument();
    expect(screen.getByText(/Christopher Nolan/)).toBeInTheDocument();
    expect(screen.getByText(/8.8/)).toBeInTheDocument();
    expect(screen.getByText("Sci-Fi")).toBeInTheDocument();
    expect(screen.getByText(/Leonardo DiCaprio/)).toBeInTheDocument();
  });

  it("renders 'Xem ngay' link pointing to /watch/[id]", async () => {
    mockGetMovieById.mockResolvedValue(MOVIE);

    render(await MovieDetailPage({ params: { id: "uuid-1" } }));

    const link = screen.getByRole("link", { name: /Xem ngay/i });
    expect(link).toHaveAttribute("href", "/watch/uuid-1");
  });

  it("renders trailer iframe when trailer_url exists", async () => {
    mockGetMovieById.mockResolvedValue(MOVIE);

    render(await MovieDetailPage({ params: { id: "uuid-1" } }));

    const iframe = screen.getByTitle(/Inception trailer/i);
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "https://youtube.com/embed/abc");
  });

  it("renders 'Phim tương tự' section when similar movies exist", async () => {
    mockGetMovieById.mockResolvedValue(MOVIE);
    mockGetSimilarMovies.mockResolvedValue(SIMILAR);

    render(await MovieDetailPage({ params: { id: "uuid-1" } }));

    expect(screen.getByText("Phim tương tự")).toBeInTheDocument();
    expect(screen.getByTestId("movie-card")).toBeInTheDocument();
  });

  it("does not render 'Phim tương tự' section when no similar movies", async () => {
    mockGetMovieById.mockResolvedValue(MOVIE);
    mockGetSimilarMovies.mockResolvedValue([]);

    render(await MovieDetailPage({ params: { id: "uuid-1" } }));

    expect(screen.queryByText("Phim tương tự")).not.toBeInTheDocument();
  });
});
