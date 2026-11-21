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
  vi.restoreAllMocks();
});

describe("env", () => {
  it("returns only the parsed variables when the environment is valid", async () => {
    expect(await loadEnv(VALID)).toEqual(VALID);
  });

  it("falls back to the raw environment, silently outside next dev, when a variable is invalid", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const env = await loadEnv({ ...VALID, BETTER_AUTH_SECRET: "short" });

    expect(env.BETTER_AUTH_SECRET).toBe("short");
    expect(warn).not.toHaveBeenCalled();
  });

  it("names the invalid variable during next dev, so a missing .env is not a mystery", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await loadEnv({ ...VALID, POSTGRES_URL: undefined, NODE_ENV: "development" });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("POSTGRES_URL"));
  });
});
