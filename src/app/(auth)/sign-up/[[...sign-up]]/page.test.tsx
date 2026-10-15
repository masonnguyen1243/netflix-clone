import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SignUpPage from "./page";

vi.mock("@clerk/nextjs", () => ({
  SignUp: ({ fallbackRedirectUrl }: { fallbackRedirectUrl?: string }) => (
    <div data-testid="clerk-sign-up" data-fallback-redirect-url={fallbackRedirectUrl} />
  ),
}));

describe("SignUpPage", () => {
  it('renders the SignUp component with fallbackRedirectUrl="/home"', () => {
    render(<SignUpPage />);
    const el = screen.getByTestId("clerk-sign-up");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("data-fallback-redirect-url", "/home");
  });
});
