import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import SearchPage from "./page";
import type { MovieSummary } from "@/types";

// Mock next/navigation
const mockReplace = vi.fn();
let mockSearchParamsQ = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => ({
    get: (key: string) => (key === "q" ? mockSearchParamsQ : null),
  }),
}));

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
    rating: 7.0,
    genres: ["Action"],
  }));

describe("SearchPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    mockSearchParamsQ = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows empty state message when no query", () => {
    render(<SearchPage />);
    expect(
      screen.getByText("Nhập tên phim để tìm kiếm")
    ).toBeInTheDocument();
  });

  it("pre-fills input and fetches when ?q= is present in URL", async () => {
    mockSearchParamsQ = "phim";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: makeMovies(3) }),
    } as Response);

    render(<SearchPage />);

    const input = screen.getByRole("searchbox");
    expect(input).toHaveValue("phim");

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("q=phim")
      );
    });
  });

  it("renders MovieCard results when fetch succeeds", async () => {
    mockSearchParamsQ = "action";
    const movies = makeMovies(3);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: movies }),
    } as Response);

    render(<SearchPage />);

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getAllByRole("link")).toHaveLength(3);
    });
  });

  it("shows no-results message when fetch returns empty array", async () => {
    mockSearchParamsQ = "xyz123notfound";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    render(<SearchPage />);

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(
        screen.getByText("Chưa có phim nào. Hãy khám phá thêm →")
      ).toBeInTheDocument();
    });
  });

  it("shows error message and retry button when fetch fails", async () => {
    mockSearchParamsQ = "phim";
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<SearchPage />);

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByText("Không tải được. Thử lại.")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("retries fetch when retry button is clicked", async () => {
    mockSearchParamsQ = "phim";
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: makeMovies(2) }),
      } as Response);

    render(<SearchPage />);

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByText("Không tải được. Thử lại.")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getAllByRole("link")).toHaveLength(2);
    });
  });

  it("syncs URL when user types in the search input", async () => {
    render(<SearchPage />);

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "action" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining("q=action"),
        { scroll: false }
      );
    });
  });

  it("shows loading skeletons on initial render when ?q= param is present", () => {
    mockSearchParamsQ = "action";
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

    const { container } = render(<SearchPage />);

    // Synchronous — no timers advanced — isLoading must be true from initialization
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
    expect(
      screen.queryByText("Chưa có phim nào. Hãy khám phá thêm →")
    ).not.toBeInTheDocument();
  });

  it("shows loading skeletons while fetching", async () => {
    mockSearchParamsQ = "action";

    let resolvePromise!: (value: unknown) => void;
    const slowFetch = new Promise((res) => {
      resolvePromise = res;
    });
    global.fetch = vi.fn().mockReturnValue(slowFetch);

    const { container } = render(<SearchPage />);

    await act(async () => {
      vi.advanceTimersByTime(300);
      // Don't resolve — stay in loading state
    });

    // During loading, skeletons should be visible
    await waitFor(() => {
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    // Resolve to avoid unhandled promise
    resolvePromise({
      ok: true,
      json: async () => ({ data: [] }),
    });
  });
});
