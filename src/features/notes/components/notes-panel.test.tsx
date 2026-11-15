// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

type MutateOptions = { onSuccess?: () => void };

const { create, notes } = vi.hoisted(() => ({
  create: {
    mutate: vi.fn<(input: { text: string }, options?: MutateOptions) => void>(),
    isPending: false,
    isError: false,
  },
  notes: { data: undefined as { id: number; text: string }[] | undefined, isError: false },
}));
vi.mock("@/features/notes/api/use-notes", () => ({
  useNotes: () => notes,
  useCreateNote: () => create,
}));

const { NotesPanel } = await import("@/features/notes/components/notes-panel");

const noteField = () => screen.getByLabelText<HTMLInputElement>("New note");

const addNote = (text: string) => {
  fireEvent.change(noteField(), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Add" }));
};

beforeEach(() => {
  create.mutate.mockReset();
  notes.data = [{ id: 1, text: "Buy milk" }];
  notes.isError = false;
  create.isError = false;
});

describe("NotesPanel", () => {
  it("lists the user's notes", () => {
    render(<NotesPanel />);

    expect(screen.getByRole("listitem").textContent).toBe("Buy milk");
  });

  it("creates a note and clears the field once it is saved", () => {
    create.mutate.mockImplementation((_input, options) => options?.onSuccess?.());
    render(<NotesPanel />);

    addNote("Call Ada");

    expect(create.mutate).toHaveBeenCalledWith({ text: "Call Ada" }, expect.anything());
    expect(noteField().value).toBe("");
  });

  it("keeps the text and says so when the note cannot be saved", () => {
    create.isError = true;
    render(<NotesPanel />);

    addNote("Call Ada");

    expect(noteField().value).toBe("Call Ada");
    expect(screen.getByRole("alert").textContent).toBe("Could not save the note.");
  });

  it("says so when the notes cannot load", () => {
    notes.data = undefined;
    notes.isError = true;
    render(<NotesPanel />);

    expect(screen.getByRole("alert").textContent).toBe("Could not load notes.");
    expect(screen.queryByRole("listitem")).toBeNull();
  });
});
