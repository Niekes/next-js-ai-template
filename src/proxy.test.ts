import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vite-plus/test";

const { mockGetSession } = vi.hoisted(() => ({ mockGetSession: vi.fn<() => Promise<unknown>>() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mockGetSession } } }));

const { config, proxy } = await import("@/proxy");

const request = (path: string) => new NextRequest(`http://localhost:3000${path}`);

describe("proxy", () => {
  it("guards only the dashboard", () => {
    expect(config.matcher).toEqual(["/dashboard/:path*"]);
  });

  it("lets a signed-in user through", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });

    const res = await proxy(request("/dashboard/notes"));

    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("sends a visitor to sign-in and remembers where they were going", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await proxy(request("/dashboard/notes?x=1"));
    const location = new URL(res.headers.get("location") ?? "");

    expect(location.pathname).toBe("/sign-in");
    expect(location.searchParams.get("next")).toBe("/dashboard/notes?x=1");
  });
});
