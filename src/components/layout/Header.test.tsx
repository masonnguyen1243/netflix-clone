import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Header from "./Header";

// Mock @clerk/nextjs
vi.mock("@clerk/nextjs", () => ({
  UserButton: () => null,
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Header", () => {
  it("renders the FilmVN logo with correct href", () => {
    render(<Header />);
    const logo = screen.getByText("FilmVN").closest("a");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("href", "/home");
  });

  it("renders the Trang chủ nav link with correct href", () => {
    render(<Header />);
    const link = screen.getByText("Trang chủ").closest("a");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/home");
  });

  it("renders the Danh sách của tôi nav link with correct href", () => {
    render(<Header />);
    const link = screen.getByText("Danh sách của tôi").closest("a");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/my-list");
  });

  it("renders the Lịch sử nav link with correct href", () => {
    render(<Header />);
    const link = screen.getByText("Lịch sử").closest("a");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/history");
  });

  it("renders the search input with disabled attribute", () => {
    render(<Header />);
    const searchInput = screen.getByPlaceholderText("Tìm kiếm phim...");
    expect(searchInput).toBeDisabled();
  });
});
