import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MovieCard } from "./MovieCard";
import type { MovieSummary } from "@/types";

// Captured callbacks so tests can fire them manually.
let capturedOnLoad: (() => void) | undefined;
let capturedOnError: (() => void) | undefined;

// Mock next/image — captures onLoad/onError instead of dropping them.
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    onLoad,
    onError,
    ...props
  }: {
    src: string;
    alt: string;
    onLoad?: () => void;
    onError?: () => void;
    [key: string]: unknown;
  }) => {
    capturedOnLoad = onLoad;
    capturedOnError = onError;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

const baseMovie: MovieSummary = {
  id: "movie-1",
  title: "Test Movie",
  poster_url: "/test-poster.jpg",
  year: 2024,
  rating: 8.5,
  genres: ["Action", "Drama"],
};

describe("MovieCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnLoad = undefined;
    capturedOnError = undefined;
  });

  it("renders a link with the correct href", () => {
    render(<MovieCard movie={baseMovie} />);
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/movie/movie-1");
  });

  it("renders an image with the correct alt text", () => {
    render(<MovieCard movie={baseMovie} />);
    const img = screen.getByAltText("Test Movie poster");
    expect(img).toBeInTheDocument();
  });

  it("renders genre badge with genres[0] when genres are present", () => {
    render(<MovieCard movie={baseMovie} />);
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("does not render genre badge when genres are empty", () => {
    const movie = { ...baseMovie, genres: [] };
    render(<MovieCard movie={movie} />);
    expect(screen.queryByText("Action")).not.toBeInTheDocument();
  });

  it("still renders title and rating when genres are empty", () => {
    const movie = { ...baseMovie, genres: [] };
    render(<MovieCard movie={movie} />);
    expect(screen.getByText("Test Movie")).toBeInTheDocument();
    expect(screen.getByText("8.5")).toBeInTheDocument();
  });

  it("renders bookmark SVG in the DOM with aria-hidden", () => {
    const { container } = render(<MovieCard movie={baseMovie} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("renders skeleton when image has not loaded", () => {
    // Image onLoad is never called so imageLoaded stays false
    const { container } = render(<MovieCard movie={baseMovie} />);
    // MovieCardSkeleton renders a div with animate-pulse
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("formats rating to one decimal place (8.0 renders as '8.0', not '8')", () => {
    const movie = { ...baseMovie, rating: 8.0 };
    render(<MovieCard movie={movie} />);
    expect(screen.getByText("8.0")).toBeInTheDocument();
  });

  it("dismisses skeleton after onLoad fires", async () => {
    const { container } = render(<MovieCard movie={baseMovie} />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();

    await act(async () => {
      capturedOnLoad?.();
    });

    expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });

  it("dismisses skeleton after onError fires (broken poster)", async () => {
    const { container } = render(<MovieCard movie={baseMovie} />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();

    await act(async () => {
      capturedOnError?.();
    });

    expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });
});
