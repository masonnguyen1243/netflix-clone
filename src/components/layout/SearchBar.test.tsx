import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SearchBar } from "./SearchBar";
import type { MovieSummary } from "@/types";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
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

const originalFetch = global.fetch;

describe("SearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
  });

  it("does not show dropdown when query is empty", () => {
    render(<SearchBar />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows dropdown with results and 'Xem tất cả' link after typing", async () => {
    const movies = makeMovies(3);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: movies }),
    } as Response);

    render(<SearchBar />);

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Movie" } });

    // Advance debounce timer and flush promises
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    expect(screen.getByText("Movie 1")).toBeInTheDocument();
    expect(screen.getByText("Movie 2")).toBeInTheDocument();
    expect(screen.getByText("Movie 3")).toBeInTheDocument();
    expect(screen.getByText("Xem tất cả")).toBeInTheDocument();
  });

  it("limits dropdown to maximum 6 results", async () => {
    const movies = makeMovies(10);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: movies }),
    } as Response);

    render(<SearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Movie" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    const options = screen.getAllByRole("option");
    // 6 movie options + 1 "Xem tất cả" option
    expect(options).toHaveLength(7);
  });

  it("closes dropdown on Escape key", async () => {
    const movies = makeMovies(3);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: movies }),
    } as Response);

    render(<SearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Movie" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes dropdown on click outside", async () => {
    const movies = makeMovies(3);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: movies }),
    } as Response);

    render(
      <div>
        <SearchBar />
        <button>Outside</button>
      </div>
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Movie" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    const outsideButton = screen.getByText("Outside");
    fireEvent.mouseDown(outsideButton);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("calls router.push with correct URL on Enter", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: makeMovies(1) }),
    } as Response);

    render(<SearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "phim hay" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockPush).toHaveBeenCalledWith(
      `/search?q=${encodeURIComponent("phim hay")}`
    );
  });

  it("does not show dropdown when query returns 0 results", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    render(<SearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "xyz123notfound" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("keeps dropdown closed when fetch rejects (network error)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network"));

    render(<SearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "phim" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes dropdown when input is cleared", async () => {
    const movies = makeMovies(3);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: movies }),
    } as Response);

    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    // Open the dropdown
    fireEvent.change(input, { target: { value: "phim" } });
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    // Clear the input — dropdown must close
    fireEvent.change(input, { target: { value: "" } });
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not call router.push when Enter is pressed on whitespace-only input", () => {
    render(<SearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("keeps dropdown closed when fetch returns non-ok HTTP status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(<SearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "phim" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
