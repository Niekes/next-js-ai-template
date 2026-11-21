import { DrizzleQueryError } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { onRequestError } from "./instrumentation";

const log = vi.spyOn(console, "error").mockImplementation(() => {});

const fail = (error: unknown) =>
  onRequestError(
    error,
    { path: "/api/notes?token=secret", method: "POST", headers: { cookie: "secret" } },
    {
      routerKind: "App Router",
      routePath: "/api/notes",
      routeType: "route",
      revalidateReason: undefined,
    },
  );

afterEach(() => {
  log.mockClear();
});

describe("onRequestError", () => {
  it("logs the failing route without query string or headers", async () => {
    await fail(new Error("db down"));

    expect(log).toHaveBeenCalledWith(
      "Request failed",
      expect.objectContaining({
        method: "POST",
        path: "/api/notes",
        route: "/api/notes",
        message: "db down",
      }),
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain("secret");
  });

  it("keeps the failed query but drops its values, which hold user data", async () => {
    const cause = new Error("duplicate key, Key (email)=(ada@example.com)");
    await fail(
      new DrizzleQueryError(
        'insert into "notes" values ($1, $2)',
        ["u1", "my private note"],
        cause,
      ),
    );

    const logged = JSON.stringify(log.mock.calls);
    expect(logged).toContain('Failed query: insert into \\"notes\\"');
    expect(logged).not.toContain("my private note");
    expect(logged).not.toContain("ada@example.com");
  });

  it("logs the digest Next.js shows on the error page", async () => {
    await fail(Object.assign(new Error("render failed"), { digest: "123" }));

    expect(log).toHaveBeenCalledWith("Request failed", expect.objectContaining({ digest: "123" }));
  });

  it("logs a thrown value that is not an Error", async () => {
    await fail("boom");

    expect(log).toHaveBeenCalledWith(
      "Request failed",
      expect.objectContaining({ message: "boom" }),
    );
  });
});
