// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";

import HomePage from "@/app/page";

const href = (name: RegExp) => screen.getByRole("link", { name }).getAttribute("href");

describe("HomePage", () => {
  it("links to the notes example", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading").textContent).toBe("Next.js AI Template");
    expect(href(/notes/i)).toBe("/dashboard/notes");
  });

  it("asks for a star and a sponsorship", () => {
    render(<HomePage />);

    expect(href(/star/i)).toBe("https://github.com/Niekes/next-js-ai-template");
    expect(href(/sponsor/i)).toBe("https://github.com/sponsors/niekes");
  });
});
