import { describe, expect, it, vi } from "vite-plus/test";

const { mockHandler } = vi.hoisted(() => ({
  mockHandler: vi.fn<(request: Request) => Promise<Response>>(() =>
    Promise.resolve(Response.json({})),
  ),
}));
vi.mock("@/lib/auth", () => ({ auth: { handler: mockHandler } }));

const { GET, POST } = await import("@/app/api/auth/[...all]/route");

describe("/api/auth/*", () => {
  it("hands GET and POST to Better Auth", async () => {
    const request = new Request("http://localhost/api/auth/get-session");

    await GET(request);
    await POST(request);

    expect(mockHandler).toHaveBeenCalledTimes(2);
  });
});
