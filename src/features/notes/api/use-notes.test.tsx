// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { useCreateNote, useNotes } from "./use-notes";

const NOTE = { id: 1, userId: "u1", text: "hi", createdAt: "2026-11-15T00:00:00.000Z" };

const fetchMock = vi.fn<typeof fetch>((_input, init) =>
  Promise.resolve(Response.json(init?.method === "POST" ? NOTE : [NOTE])),
);

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
  fetchMock.mockClear();
});

describe("useNotes", () => {
  it("loads the signed-in user's notes", async () => {
    const { result } = renderHook(useNotes, { wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual([NOTE]);
    });
  });
});

describe("useCreateNote", () => {
  it("posts the note and refetches the list", async () => {
    const { result } = renderHook(() => ({ list: useNotes(), create: useCreateNote() }), {
      wrapper,
    });
    await waitFor(() => {
      expect(result.current.list.isSuccess).toBe(true);
    });

    await result.current.create.mutateAsync({ text: "hi" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/notes",
      expect.objectContaining({ method: "POST" }),
    );
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
