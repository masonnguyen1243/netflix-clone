import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SignInPage from "./page";

vi.mock("@clerk/nextjs", () => ({
  SignIn: ({ fallbackRedirectUrl }: { fallbackRedirectUrl?: string }) => (
    <div data-testid="clerk-sign-in" data-fallback-redirect-url={fallbackRedirectUrl} />
  ),
}));

describe("SignInPage", () => {
  it('renders the SignIn component with fallbackRedirectUrl="/home"', () => {
    render(<SignInPage />);
    const el = screen.getByTestId("clerk-sign-in");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("data-fallback-redirect-url", "/home");
  });
});
