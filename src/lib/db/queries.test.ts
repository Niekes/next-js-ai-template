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

const { getUser, listUsers } = await import("./queries");

const methods = () => mocks.calls.map((call) => call.method);

beforeEach(() => {
  mockGetSession.mockReset();
  mocks.reset();
});

describe("getUser", () => {
  it("returns null without a session and skips the database", async () => {
    mockGetSession.mockResolvedValue(null);

    expect(await getUser()).toBeNull();
    expect(mocks.calls).toEqual([]);
  });

  it("returns the session user's row", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    mocks.results.push([{ id: "u1", role: "member" }]);

    expect(await getUser()).toEqual({ id: "u1", role: "member" });
    expect(methods()).toEqual(["select", "from", "where", "limit"]);
  });

  it("returns null when the session user has no row", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "gone" } });
    mocks.results.push([]);

    expect(await getUser()).toBeNull();
  });
});

describe("listUsers", () => {
  it("lists users ordered by email", async () => {
    mocks.results.push([{ id: "u1", email: "a@example.com" }]);

    expect(await listUsers()).toEqual([{ id: "u1", email: "a@example.com" }]);
    expect(methods()).toEqual(["select", "from", "orderBy"]);
  });
});
