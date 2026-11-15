import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("@/lib/db/drizzle", () => ({ db: {} }));
vi.mock("@/lib/env", () => ({
  env: { BETTER_AUTH_URL: "http://localhost:3000", BETTER_AUTH_SECRET: "x".repeat(32) },
}));

const { auth } = await import("./auth");
const { authClient } = await import("./auth-client");

describe("auth", () => {
  it("signs in with email and password and loads the admin plugin", () => {
    expect(auth.options.emailAndPassword).toEqual({ enabled: true });
    expect(auth.options.plugins.map((plugin) => plugin.id)).toEqual(["admin", "next-cookies"]);
  });

  it("gives the client the admin plugin's actions", () => {
    expect(typeof authClient.admin.listUsers).toBe("function");
  });
});
