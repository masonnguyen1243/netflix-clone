import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProfilePage from "./page";

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn().mockResolvedValue({
    fullName: "Nguyễn Test",
    primaryEmailAddress: { emailAddress: "test@example.com" },
    imageUrl: "https://example.com/avatar.jpg",
  }),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    width,
    height,
    alt,
    className,
  }: {
    src: string;
    width: number;
    height: number;
    alt: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={width} height={height} alt={alt} className={className} />
  ),
}));

describe("Profile page", () => {
  it("renders the account heading", async () => {
    render(await ProfilePage());
    expect(
      screen.getByRole("heading", { name: "Tài khoản" })
    ).toBeInTheDocument();
  });

  it("renders user full name", async () => {
    render(await ProfilePage());
    expect(screen.getByText("Nguyễn Test")).toBeInTheDocument();
  });

  it("renders user email", async () => {
    render(await ProfilePage());
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("renders avatar image", async () => {
    render(await ProfilePage());
    const img = screen.getByRole("img", { name: "Avatar" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });
});
