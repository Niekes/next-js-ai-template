import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("@/lib/db/drizzle", () => ({ db: {} }));
vi.mock("@/lib/env", () => ({
  env: {
    BETTER_AUTH_URL: "http://localhost:3000",
    BETTER_AUTH_SECRET: "x".repeat(32),
    TRUSTED_PROXIES: "203.0.113.0/24, 198.51.100.7,",
  },
}));

const { auth } = await import("./auth");
const { authClient } = await import("./auth-client");

describe("auth", () => {
  it("signs in with email and password and loads the admin plugin", () => {
    expect(auth.options.emailAndPassword).toEqual({ enabled: true });
    expect(auth.options.plugins.map((plugin) => plugin.id)).toEqual(["admin", "next-cookies"]);
  });

  it("keeps rate-limit counters in the database so all replicas share them", () => {
    expect(auth.options.rateLimit).toEqual({ storage: "database" });
  });

  it("reads the rate-limit client IP through the proxies named in TRUSTED_PROXIES", () => {
    expect(auth.options.advanced.ipAddress.trustedProxies).toEqual([
      "203.0.113.0/24",
      "198.51.100.7",
    ]);
  });

  it("trusts no proxy when TRUSTED_PROXIES is unset", async () => {
    vi.resetModules();
    vi.doMock("@/lib/env", () => ({
      env: { BETTER_AUTH_URL: "http://localhost:3000", BETTER_AUTH_SECRET: "x".repeat(32) },
    }));
    const fresh = await import("./auth");

    expect(fresh.auth.options.advanced.ipAddress.trustedProxies).toEqual([]);
  });

  it("gives the client the admin plugin's actions", () => {
    expect(typeof authClient.admin.listUsers).toBe("function");
  });
});
