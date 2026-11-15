// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

const { push, signOut } = vi.hoisted(() => ({
  push: vi.fn<(path: string) => void>(),
  signOut: vi.fn<() => Promise<unknown>>(() => Promise.resolve({})),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signOut } }));

const { SignOutButton } = await import("@/app/dashboard/sign-out-button");

describe("SignOutButton", () => {
  it("signs out and goes home", async () => {
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/");
    });
    expect(signOut).toHaveBeenCalledOnce();
  });
});
