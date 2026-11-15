import { describe, expect, it } from "vite-plus/test";

import { noteInput } from "./note-input";

describe("noteInput", () => {
  it("trims the text", () => {
    expect(noteInput.parse({ text: "  hi  " })).toEqual({ text: "hi" });
  });

  it.each(["", "   ", "x".repeat(2001)])("rejects text of length %#", (text) => {
    expect(noteInput.safeParse({ text }).success).toBe(false);
  });
});
