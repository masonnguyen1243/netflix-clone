import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MovieRow } from "./MovieRow";
import type { MovieSummary } from "@/types";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

const makeMovies = (count: number): MovieSummary[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `movie-${i + 1}`,
    title: `Movie ${i + 1}`,
    poster_url: `/poster-${i + 1}.jpg`,
    year: 2024,
    rating: 7.0 + i * 0.1,
    genres: ["Action"],
  }));

// IntersectionObserver mock — stored so tests can trigger callbacks manually
type IOCallback = (entries: IntersectionObserverEntry[]) => void;
let ioCallback: IOCallback | null = null;
let observedTarget: Element | null = null;

const mockDisconnect = vi.fn();

class MockIntersectionObserver {
  constructor(callback: IOCallback) {
    ioCallback = callback;
  }
  observe(el: Element) {
    observedTarget = el;
  }
  disconnect() {
    mockDisconnect();
  }
  unobserve() {}
}

describe("MovieRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ioCallback = null;
    observedTarget = null;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  it("renders an h2 with the row title", () => {
    render(<MovieRow title="Phim Hot" movies={makeMovies(3)} />);
    expect(screen.getByRole("heading", { name: "Phim Hot" })).toBeInTheDocument();
  });

  it("renders the correct number of MovieCards when not loading", () => {
    render(<MovieRow title="Row" movies={makeMovies(4)} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
  });

  it("renders 6 skeletons when isLoading is true", () => {
    const { container } = render(
      <MovieRow title="Row" movies={[]} isLoading={true} />
    );
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons).toHaveLength(6);
  });

  it("returns null when movies is empty and isLoading is false", () => {
    const { container } = render(
      <MovieRow title="Row" movies={[]} isLoading={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("calls onLoadMore when IntersectionObserver fires", () => {
    const onLoadMore = vi.fn();
    render(<MovieRow title="Row" movies={makeMovies(3)} onLoadMore={onLoadMore} />);

    // Trigger the observer callback as if sentinel entered viewport
    expect(ioCallback).not.toBeNull();
    expect(observedTarget).not.toBeNull();

    ioCallback!([
      {
        isIntersecting: true,
        target: observedTarget!,
      } as IntersectionObserverEntry,
    ]);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("does not call onLoadMore when intersection fires but isIntersecting is false", () => {
    const onLoadMore = vi.fn();
    render(<MovieRow title="Row" movies={makeMovies(3)} onLoadMore={onLoadMore} />);

    ioCallback!([
      {
        isIntersecting: false,
        target: observedTarget!,
      } as IntersectionObserverEntry,
    ]);

    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
