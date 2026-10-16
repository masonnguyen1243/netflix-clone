import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import type { MovieSummary, Genre } from "@/types";

vi.mock("@/lib/movieData", () => ({
  getMovieList: vi.fn(),
  getGenreList: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// MovieRow and MovieCard are client components — mock MovieRow to simplify
vi.mock("@/components/movie/MovieRow", () => ({
  MovieRow: ({ title, movies }: { title: string; movies: MovieSummary[] }) =>
    movies.length > 0 ? (
      <section aria-label={title}>
        <h2>{title}</h2>
        {movies.map((m) => (
          <div key={m.id}>{m.title}</div>
        ))}
      </section>
    ) : null,
}));

vi.mock("@/components/movie/HeroBanner", () => ({
  HeroBanner: ({ movie }: { movie: MovieSummary }) => (
    <div data-testid="hero-banner">{movie.title}</div>
  ),
}));

import { getMovieList, getGenreList } from "@/lib/movieData";
import HomePage from "./page";

const mockMovies: MovieSummary[] = [
  { id: "1", title: "Phim Hành Động", poster_url: "/p1.jpg", year: 2023, rating: 8.0, genres: ["Hành động"] },
  { id: "2", title: "Phim Kinh Dị", poster_url: "/p2.jpg", year: 2023, rating: 7.5, genres: ["Kinh dị"] },
  { id: "3", title: "Phim Không Genre", poster_url: "/p3.jpg", year: 2022, rating: 6.0, genres: [] },
];

const mockGenres: Genre[] = [
  { id: "g1", name: "Hành động" },
  { id: "g2", name: "Kinh dị" },
  { id: "g3", name: "Tình cảm" },
];

beforeEach(() => {
  vi.mocked(getMovieList).mockResolvedValue(mockMovies);
  vi.mocked(getGenreList).mockResolvedValue(mockGenres);
});

describe("HomePage", () => {
  it("renders HeroBanner with the first movie", async () => {
    render(await HomePage());
    const banner = screen.getByTestId("hero-banner");
    expect(banner).toHaveTextContent("Phim Hành Động");
  });

  it("renders a MovieRow for each genre that has movies", async () => {
    render(await HomePage());
    expect(screen.getByRole("region", { name: "Hành động" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Kinh dị" })).toBeInTheDocument();
  });

  it("does not render a row for a genre with no movies", async () => {
    render(await HomePage());
    expect(screen.queryByRole("region", { name: "Tình cảm" })).not.toBeInTheDocument();
  });

  it("renders 'Tất cả phim' row for movies with no genre", async () => {
    render(await HomePage());
    expect(screen.getByRole("region", { name: "Tất cả phim" })).toBeInTheDocument();
    expect(screen.getByText("Phim Không Genre")).toBeInTheDocument();
  });

  it("does not render 'Tiếp tục xem' row", async () => {
    render(await HomePage());
    expect(screen.queryByText(/Tiếp tục xem/i)).not.toBeInTheDocument();
  });

  it("renders empty state when no movies", async () => {
    vi.mocked(getMovieList).mockResolvedValue([]);
    render(await HomePage());
    expect(screen.getByText(/Chưa có phim nào/i)).toBeInTheDocument();
    expect(screen.queryByTestId("hero-banner")).not.toBeInTheDocument();
  });
});
