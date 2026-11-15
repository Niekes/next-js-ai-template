import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vite-plus/test";

const COMPONENTS_DIR = import.meta.dirname;

const toPascalCase = (kebab: string): string =>
  kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const appComponentFiles = readdirSync(COMPONENTS_DIR)
  .filter((file) => /^app-[a-z][a-z-]*\.tsx$/.test(file))
  .filter((file) => !file.endsWith(".test.tsx"));

describe("src/components conventions", () => {
  it("discovers the app-* components", () => {
    expect(appComponentFiles.length).toBeGreaterThan(0);
  });

  for (const file of appComponentFiles) {
    const expectedExport = `App${toPascalCase(file.slice("app-".length, -".tsx".length))}`;
    const source = readFileSync(join(COMPONENTS_DIR, file), "utf8");

    it(`${file} exports ${expectedExport}`, () => {
      const declaresComponent = new RegExp(`\\b(const|let|var) ${expectedExport}\\b`).test(source);
      const exportsComponent =
        new RegExp(`export (const|let|var) ${expectedExport}\\b`).test(source) ||
        new RegExp(`export \\{[^}]*\\b${expectedExport}\\b`).test(source);
      expect(declaresComponent && exportsComponent).toBe(true);
    });

    it(`${file} imports only through the @/ alias`, () => {
      expect(source).not.toMatch(/from "\.\//);
    });
  }
});
