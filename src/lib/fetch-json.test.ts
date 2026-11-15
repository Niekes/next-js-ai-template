import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { fetchJson } from "./fetch-json";

const respond = (body: string, status = 200) => {
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(() => Promise.resolve(new Response(body, { status }))),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("returns the parsed body", async () => {
    respond('{"ok":true}');

    expect(await fetchJson("/api/x")).toEqual({ ok: true });
  });

  it("throws the server's error message", async () => {
    respond('{"error":"Unauthorized"}', 401);

    await expect(fetchJson("/api/x")).rejects.toThrow("Unauthorized");
  });

  it.each(['{"error":["bad"]}', "not json"])("throws a generic message for %j", async (body) => {
    respond(body, 500);

    await expect(fetchJson("/api/x")).rejects.toThrow("Request failed");
  });
});
