import { describe, expect, it, vi } from "vite-plus/test";

const { mockGetUser } = vi.hoisted(() => ({ mockGetUser: vi.fn<() => Promise<unknown>>() }));
vi.mock("@/lib/db/queries", () => ({
  getUser: mockGetUser,
  listUsers: () => Promise.resolve([{ id: "u1", email: "a@example.com" }]),
}));

const { GET } = await import("@/app/api/admin/users/route");

const call = () => GET(new Request("http://localhost/api/admin/users"), {});

describe("GET /api/admin/users", () => {
  it("rejects a member", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "member" });

    expect((await call()).status).toBe(403);
  });

  it("lists users for an admin", async () => {
    mockGetUser.mockResolvedValue({ id: "a1", role: "admin" });

    expect(await (await call()).json()).toEqual([{ id: "u1", email: "a@example.com" }]);
  });
});
