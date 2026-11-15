// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mutate, notes } = vi.hoisted(() => ({
  mutate: vi.fn<(input: { text: string }) => void>(),
  notes: { data: undefined as { id: number; text: string }[] | undefined, isError: false },
}));
vi.mock("@/lib/hooks/use-notes", () => ({
  useNotes: () => notes,
  useCreateNote: () => ({ mutate, isPending: false }),
}));

const { default: NotesPage } = await import("@/app/dashboard/notes/page");

beforeEach(() => {
  vi.clearAllMocks();
  notes.data = [{ id: 1, text: "Buy milk" }];
  notes.isError = false;
});

describe("NotesPage", () => {
  it("lists the user's notes", () => {
    render(<NotesPage />);

    expect(screen.getByRole("listitem").textContent).toBe("Buy milk");
  });

  it("creates a note from the form", () => {
    render(<NotesPage />);

    fireEvent.change(screen.getByLabelText("New note"), { target: { value: "Call Ada" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(mutate).toHaveBeenCalledWith({ text: "Call Ada" });
  });

  it("says so when the notes cannot load", () => {
    notes.data = undefined;
    notes.isError = true;
    render(<NotesPage />);

    expect(screen.getByRole("alert").textContent).toBe("Could not load notes.");
    expect(screen.queryByRole("listitem")).toBeNull();
  });
});
