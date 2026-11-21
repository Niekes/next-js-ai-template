import { describe, expect, it, vi } from "vite-plus/test";

import { onRequestError } from "./instrumentation";

describe("onRequestError", () => {
  it("logs the failing route without query string or headers", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("db down");

    await onRequestError(
      error,
      { path: "/api/notes?token=secret", method: "GET", headers: { cookie: "secret" } },
      {
        routerKind: "App Router",
        routePath: "/api/notes",
        routeType: "route",
        revalidateReason: undefined,
      },
    );

    expect(log).toHaveBeenCalledWith("Request failed", {
      method: "GET",
      path: "/api/notes",
      route: "/api/notes",
      error,
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain("secret");
    log.mockRestore();
  });
});
