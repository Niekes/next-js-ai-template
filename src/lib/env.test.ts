import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const VALID = {
  POSTGRES_URL: "postgres://app@localhost:5432/app",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
};

const loadEnv = async (vars: Record<string, string | undefined>) => {
  for (const [name, value] of Object.entries(vars)) vi.stubEnv(name, value);
  vi.resetModules();
  return (await import("@/lib/env")).env;
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("env", () => {
  it("returns only the parsed variables when the environment is valid", async () => {
    expect(await loadEnv(VALID)).toEqual(VALID);
  });

  it("falls back to the raw environment when a variable is invalid", async () => {
    const env = await loadEnv({ ...VALID, BETTER_AUTH_SECRET: "short" });

    expect(env.BETTER_AUTH_SECRET).toBe("short");
  });
});
