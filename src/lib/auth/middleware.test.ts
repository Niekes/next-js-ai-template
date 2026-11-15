import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { z } from "zod";

const { mockGetUser } = vi.hoisted(() => ({ mockGetUser: vi.fn<() => Promise<unknown>>() }));
vi.mock("@/lib/db/queries", () => ({ getUser: mockGetUser }));

const { parseBody, withAdmin } = await import("./middleware");

const handler = withAdmin((_request, _ctx, user) =>
  Promise.resolve(NextResponse.json({ id: user.id })),
);
const call = () => handler(new Request("http://localhost/api/x"), {});

beforeEach(() => {
  mockGetUser.mockReset();
});

describe("withAdmin", () => {
  it("rejects a visitor with 401", async () => {
    mockGetUser.mockResolvedValue(null);

    expect((await call()).status).toBe(401);
  });

  it("rejects a member with 403", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "member" });

    expect((await call()).status).toBe(403);
  });

  it("passes an admin through to the handler", async () => {
    mockGetUser.mockResolvedValue({ id: "a1", role: "admin" });

    expect(await (await call()).json()).toEqual({ id: "a1" });
  });
});

describe("parseBody", () => {
  const schema = z.object({ text: z.string() });
  const post = (body: string) => new Request("http://localhost/api/x", { method: "POST", body });

  it("returns the parsed data", async () => {
    expect(await parseBody(post('{"text":"hi"}'), schema)).toEqual({
      ok: true,
      data: { text: "hi" },
    });
  });

  it.each(['{"text":1}', "not json"])("answers 400 for %j", async (body) => {
    const result = await parseBody(post(body), schema);

    expect(result.ok ? 200 : result.response.status).toBe(400);
  });
});
