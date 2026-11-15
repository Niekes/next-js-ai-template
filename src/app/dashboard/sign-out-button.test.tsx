// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  it("signs out, drops the cached data and goes home", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["notes", "list"], [{ id: 1, text: "private" }]);
    render(
      <QueryClientProvider client={queryClient}>
        <SignOutButton />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/");
    });
    expect(signOut).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(["notes", "list"])).toBeUndefined();
  });
});
