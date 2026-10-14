import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import BottomNav from "./BottomNav";

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
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

describe("BottomNav", () => {
  it("renders all 4 tabs with correct labels", () => {
    mockUsePathname.mockReturnValue("/home");
    render(<BottomNav />);

    expect(screen.getByText("Trang chủ")).toBeInTheDocument();
    expect(screen.getByText("Tìm kiếm")).toBeInTheDocument();
    expect(screen.getByText("Danh sách")).toBeInTheDocument();
    expect(screen.getByText("Tài khoản")).toBeInTheDocument();
  });

  it("sets aria-current=page on Trang chủ when pathname is /home", () => {
    mockUsePathname.mockReturnValue("/home");
    render(<BottomNav />);

    const activeTab = screen.getByText("Trang chủ").closest("a");
    expect(activeTab).toHaveAttribute("aria-current", "page");
  });

  it("does not set aria-current on inactive tabs when pathname is /home", () => {
    mockUsePathname.mockReturnValue("/home");
    render(<BottomNav />);

    const searchTab = screen.getByText("Tìm kiếm").closest("a");
    const myListTab = screen.getByText("Danh sách").closest("a");
    const profileTab = screen.getByText("Tài khoản").closest("a");

    expect(searchTab).not.toHaveAttribute("aria-current");
    expect(myListTab).not.toHaveAttribute("aria-current");
    expect(profileTab).not.toHaveAttribute("aria-current");
  });

  it("sets aria-current=page on Tìm kiếm when pathname is /search", () => {
    mockUsePathname.mockReturnValue("/search");
    render(<BottomNav />);

    const activeTab = screen.getByText("Tìm kiếm").closest("a");
    expect(activeTab).toHaveAttribute("aria-current", "page");

    const homeTab = screen.getByText("Trang chủ").closest("a");
    expect(homeTab).not.toHaveAttribute("aria-current");
  });

  it("sets aria-current=page on Danh sách when pathname is /my-list", () => {
    mockUsePathname.mockReturnValue("/my-list");
    render(<BottomNav />);

    const activeTab = screen.getByText("Danh sách").closest("a");
    expect(activeTab).toHaveAttribute("aria-current", "page");
  });

  it("sets aria-current=page on Tài khoản when pathname is /profile", () => {
    mockUsePathname.mockReturnValue("/profile");
    render(<BottomNav />);

    const activeTab = screen.getByText("Tài khoản").closest("a");
    expect(activeTab).toHaveAttribute("aria-current", "page");
  });
});
