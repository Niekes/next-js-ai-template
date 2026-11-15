import { describe, expect, it } from "vite-plus/test";

import { formText, returnPath } from "./forms";

describe("formText", () => {
  it("reads text fields and treats missing fields and files as empty", () => {
    const form = new FormData();
    form.set("email", "a@example.com");
    form.set("avatar", new Blob(["x"]));

    expect(formText(form, "email")).toBe("a@example.com");
    expect(formText(form, "avatar")).toBe("");
    expect(formText(form, "missing")).toBe("");
  });
});

describe("returnPath", () => {
  it("keeps a same-site path", () => {
    expect(returnPath("?next=/dashboard/notes?x=1")).toBe("/dashboard/notes?x=1");
  });

  it.each(["", "?next=https://evil.example", "?next=//evil.example", "?next=/\\evil.example"])(
    "falls back to the notes page for %j",
    (search) => {
      expect(returnPath(search)).toBe("/dashboard/notes");
    },
  );
});
