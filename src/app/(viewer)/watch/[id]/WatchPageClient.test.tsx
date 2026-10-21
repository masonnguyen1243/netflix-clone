import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";
import type { Movie } from "@/types";

let capturedOnTimeUpdate: (s: number) => void = () => {};

vi.mock("@/components/player/YouTubePlayer", () => ({
  default: ({ onTimeUpdate }: { onTimeUpdate: (s: number) => void }) => {
    capturedOnTimeUpdate = onTimeUpdate;
    return <div data-testid="youtube-player" />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

import WatchPageClient from "./WatchPageClient";

const MOVIE: Movie & { progress_seconds: number } = {
  id: "movie-1",
  title: "Test Film",
  description: "desc",
  poster_url: "/poster.jpg",
  backdrop_url: "/backdrop.jpg",
  trailer_url: null,
  video_url: "https://youtube.com/watch?v=abc",
  year: 2024,
  rating: 7.5,
  cast: "Actor",
  director: "Director",
  genres: [],
  progress_seconds: 60,
};

describe("WatchPageClient — progress-save interval", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    capturedOnTimeUpdate = () => {};
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("calls fetch with correct URL, method, and body after 30s when currentTime > 0", async () => {
    render(<WatchPageClient movie={MOVIE} />);

    act(() => { capturedOnTimeUpdate(45); });

    await act(async () => { vi.advanceTimersByTime(30000); });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/history/movie-1/progress",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress_seconds: 45 }),
      })
    );
  });

  it("does not call fetch when currentTime is 0", async () => {
    render(<WatchPageClient movie={MOVIE} />);

    await act(async () => { vi.advanceTimersByTime(30000); });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("uses movie.id in the fetch URL", async () => {
    render(<WatchPageClient movie={{ ...MOVIE, id: "film-99" }} />);

    act(() => { capturedOnTimeUpdate(10); });
    await act(async () => { vi.advanceTimersByTime(30000); });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/history/film-99/progress",
      expect.anything()
    );
  });
});
