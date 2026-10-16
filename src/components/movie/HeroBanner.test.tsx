import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HeroBanner } from "./HeroBanner";
import type { MovieSummary } from "@/types";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

const movie: MovieSummary = {
  id: "1",
  title: "Phim Hay Nhất",
  poster_url: "https://example.com/poster.jpg",
  year: 2024,
  rating: 8.5,
  genres: ["Hành động"],
};

describe("HeroBanner", () => {
  it("renders the movie title", () => {
    render(<HeroBanner movie={movie} />);
    expect(screen.getByRole("heading", { name: "Phim Hay Nhất" })).toBeInTheDocument();
  });

  it("renders backdrop image with empty alt text", () => {
    const { container } = render(<HeroBanner movie={movie} />);
    const img = container.querySelector("img[alt='']");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", movie.poster_url);
  });

  it("renders 'Xem ngay' button", () => {
    render(<HeroBanner movie={movie} />);
    expect(screen.getByRole("button", { name: /Xem ngay/i })).toBeInTheDocument();
  });

  it("renders 'Thêm vào danh sách' button", () => {
    render(<HeroBanner movie={movie} />);
    expect(screen.getByRole("button", { name: /Thêm vào danh sách/i })).toBeInTheDocument();
  });

  it("renders play SVG icon inside 'Xem ngay' button", () => {
    render(<HeroBanner movie={movie} />);
    const btn = screen.getByRole("button", { name: /Xem ngay/i });
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });
});
