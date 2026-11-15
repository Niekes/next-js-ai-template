import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vite-plus/test";

const APP_DIR = import.meta.dirname;

const pages = readdirSync(APP_DIR, { recursive: true, encoding: "utf8" }).filter((file) =>
  file.endsWith("page.tsx"),
);

describe("page conventions", () => {
  it("discovers the pages", () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  for (const page of pages) {
    const source = readFileSync(join(APP_DIR, page), "utf8");

    it(`${page} has a default export at the bottom`, () => {
      expect(source).toMatch(/^export default \w+;$/m);
    });

    it(`${page} has a colocated page.test.tsx`, () => {
      expect(existsSync(join(APP_DIR, page.replace(/page\.tsx$/, "page.test.tsx")))).toBe(true);
    });
  }
});
