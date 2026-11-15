import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("@/lib/env", () => ({ env: { POSTGRES_URL: "postgres://app@localhost:5432/app" } }));

// postgres.js connects lazily, so importing the client opens no connection
const { db } = await import("./drizzle");

describe("db", () => {
  it("exposes the schema tables to relational queries", () => {
    expect(Object.keys(db.query)).toEqual(expect.arrayContaining(["users", "notes"]));
  });

  it("connects to the configured database", () => {
    expect(db.$client.options.database).toBe("app");
  });
});
