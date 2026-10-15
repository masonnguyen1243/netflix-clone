import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Home from "./page";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("Landing page", () => {
  it("renders FilmVN heading", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: "FilmVN" })
    ).toBeInTheDocument();
  });

  it('renders "Đăng nhập" link pointing to /sign-in', () => {
    render(<Home />);
    const link = screen.getByRole("link", { name: "Đăng nhập" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/sign-in");
  });
});
