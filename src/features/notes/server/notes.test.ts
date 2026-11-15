import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const mocks = await vi.hoisted(async () => (await import("@/lib/db/test-db")).createDbMock());

vi.mock("@/lib/db/drizzle", () => ({ db: mocks.chain }));

const { createNote, listNotes } = await import("./notes");

beforeEach(() => {
  mocks.reset();
});

describe("notes", () => {
  it("lists a user's notes newest first", async () => {
    mocks.results.push([{ id: 1, text: "hi" }]);

    expect(await listNotes("u1")).toEqual([{ id: 1, text: "hi" }]);
    expect(mocks.calls.map((call) => call.method)).toEqual(["select", "from", "where", "orderBy"]);
  });

  it("creates a note for the user and returns it", async () => {
    mocks.results.push([{ id: 2, userId: "u1", text: "new" }]);

    expect(await createNote("u1", "new")).toEqual({ id: 2, userId: "u1", text: "new" });
    expect(mocks.calls[1]).toEqual({ method: "values", args: [{ userId: "u1", text: "new" }] });
  });
});
