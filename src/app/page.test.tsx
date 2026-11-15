// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("links to the notes example", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading").textContent).toBe("Next.js AI Template");
    expect(screen.getByRole("link").getAttribute("href")).toBe("/dashboard/notes");
  });
});
