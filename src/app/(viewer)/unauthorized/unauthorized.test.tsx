import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import UnauthorizedPage from "./page";

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

describe("Unauthorized page", () => {
  it('renders "Bạn không có quyền truy cập"', () => {
    render(<UnauthorizedPage />);
    expect(
      screen.getByText("Bạn không có quyền truy cập")
    ).toBeInTheDocument();
  });

  it('renders link to /home with text "Về trang chủ"', () => {
    render(<UnauthorizedPage />);
    const link = screen.getByRole("link", { name: "Về trang chủ" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/home");
  });
});
