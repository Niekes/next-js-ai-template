import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn<() => Promise<unknown>>(),
}));
const mocks = await vi.hoisted(async () => (await import("@/lib/db/test-db")).createDbMock());

vi.mock("next/headers", () => ({
  headers: vi.fn<() => Promise<Headers>>(() => Promise.resolve(new Headers())),
}));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mockGetSession } } }));
vi.mock("@/lib/db/drizzle", () => ({ db: mocks.chain }));

const { createNote, getUser, listNotes, listUsers } = await import("./queries");

const methods = () => mocks.calls.map((call) => call.method);

beforeEach(() => {
  mockGetSession.mockReset();
  mocks.reset();
});

describe("getUser", () => {
  it("returns null without a session", async () => {
    mockGetSession.mockResolvedValue(null);

    expect(await getUser()).toBeNull();
    expect(mocks.calls).toEqual([]);
  });

  it("returns the session's user, role included, without a second query", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1", role: "member" } });

    expect(await getUser()).toEqual({ id: "u1", role: "member" });
    expect(mocks.calls).toEqual([]);
  });
});

describe("notes and users", () => {
  it("lists a user's notes newest first", async () => {
    mocks.results.push([{ id: 1, text: "hi" }]);

    expect(await listNotes("u1")).toEqual([{ id: 1, text: "hi" }]);
    expect(methods()).toEqual(["select", "from", "where", "orderBy"]);
  });

  it("creates a note for the user and returns it", async () => {
    mocks.results.push([{ id: 2, userId: "u1", text: "new" }]);

    expect(await createNote("u1", "new")).toEqual({ id: 2, userId: "u1", text: "new" });
    expect(mocks.calls[1]).toEqual({ method: "values", args: [{ userId: "u1", text: "new" }] });
  });

  it("lists users ordered by email", async () => {
    mocks.results.push([{ id: "u1", email: "a@example.com" }]);

    expect(await listUsers()).toEqual([{ id: "u1", email: "a@example.com" }]);
    expect(methods()).toEqual(["select", "from", "orderBy"]);
  });
});
