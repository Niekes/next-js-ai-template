// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { queryKeys } from "@/lib/query-keys";

const { push, signOut } = vi.hoisted(() => ({
  push: vi.fn<(path: string) => void>(),
  signOut: vi.fn<() => Promise<unknown>>(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signOut } }));

const { SignOutButton } = await import("@/app/dashboard/sign-out-button");

const clickSignOutWithCachedNotes = () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(queryKeys.notes.list.queryKey, [{ id: 1, text: "private" }]);
  render(
    <QueryClientProvider client={queryClient}>
      <SignOutButton />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  return queryClient;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SignOutButton", () => {
  it("signs out, drops the cached data and goes home", async () => {
    signOut.mockResolvedValue({ data: { success: true }, error: null });

    const queryClient = clickSignOutWithCachedNotes();

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/");
    });
    expect(signOut).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(queryKeys.notes.list.queryKey)).toBeUndefined();
  });

  it.each([
    ["the server answers with an error", () => Promise.resolve({ data: null, error: {} })],
    ["the network is down", () => Promise.reject(new TypeError("Failed to fetch"))],
  ])("stays put and says so when %s", async (_case, failure) => {
    signOut.mockImplementation(failure);

    const queryClient = clickSignOutWithCachedNotes();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Sign-out failed. You are still signed in.",
    );
    expect(push).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(queryKeys.notes.list.queryKey)).toHaveLength(1);
  });
});
