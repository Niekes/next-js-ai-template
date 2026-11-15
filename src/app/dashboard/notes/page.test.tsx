// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("@/features/notes/components/notes-panel", () => ({
  NotesPanel: () => <p>notes panel</p>,
}));

const { default: NotesPage } = await import("@/app/dashboard/notes/page");

describe("NotesPage", () => {
  it("frames the notes panel under its title", () => {
    render(<NotesPage />);

    expect(screen.getByRole("heading", { name: "Notes" })).toBeTruthy();
    expect(screen.getByText("notes panel")).toBeTruthy();
  });
});
