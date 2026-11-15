// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("@/app/dashboard/sign-out-button", () => ({
  SignOutButton: () => <button>Sign out</button>,
}));

const { default: DashboardLayout, metadata } = await import("@/app/dashboard/layout");

describe("DashboardLayout", () => {
  it("renders the page under a header with home and sign-out, hidden from search engines", () => {
    render(<DashboardLayout>page</DashboardLayout>);

    expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
    expect(screen.getByText("page")).toBeTruthy();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
