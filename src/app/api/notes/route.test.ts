import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockGetUser, mockListNotes, mockCreateNote } = vi.hoisted(() => ({
  mockGetUser: vi.fn<() => Promise<unknown>>(),
  mockListNotes: vi.fn<(userId: string) => Promise<unknown>>(),
  mockCreateNote: vi.fn<(userId: string, text: string) => Promise<unknown>>(),
}));
vi.mock("@/lib/db/queries", () => ({
  getUser: mockGetUser,
  listNotes: mockListNotes,
  createNote: mockCreateNote,
}));

const { GET, POST } = await import("@/app/api/notes/route");

const post = (body: unknown) =>
  new Request("http://localhost/api/notes", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ id: "u1" });
});

describe("GET /api/notes", () => {
  it("rejects a visitor", async () => {
    mockGetUser.mockResolvedValue(null);

    expect((await GET()).status).toBe(401);
  });

  it("returns the user's notes", async () => {
    mockListNotes.mockResolvedValue([{ id: 1 }]);

    expect(await (await GET()).json()).toEqual([{ id: 1 }]);
    expect(mockListNotes).toHaveBeenCalledWith("u1");
  });
});

describe("POST /api/notes", () => {
  it("rejects a visitor", async () => {
    mockGetUser.mockResolvedValue(null);

    expect((await POST(post({ text: "hi" }))).status).toBe(401);
  });

  it("rejects an empty note", async () => {
    expect((await POST(post({ text: " " }))).status).toBe(400);
    expect(mockCreateNote).not.toHaveBeenCalled();
  });

  it("creates the note for the user", async () => {
    mockCreateNote.mockResolvedValue({ id: 2, text: "hi" });

    const res = await POST(post({ text: " hi " }));

    expect(res.status).toBe(201);
    expect(mockCreateNote).toHaveBeenCalledWith("u1", "hi");
  });
});
