import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";

// A file-wide disable directive — a directive with an empty rule list —
// switches off every lint rule in that file, including `no-warning-comments`,
// the rule that is supposed to fail such directives. `vp check` then passes
// the file with real violations intact (verified 2026-10-26). Directives
// scoped to a line or to a rule list stay allowed: `no-warning-comments`
// fails those inside `pnpm lint`, as long as no file-wide directive precedes
// them. This test is the second defense layer, running outside the linter
// inside `pnpm test`. import.meta.url is coerced via concat because vite-plus
// provides a non-string value at runtime, while the lint type program sees a string.
const resolveFrom = (relative: string) =>
  fileURLToPath(new URL(relative, "".concat(import.meta.url)));

// Comment-shaped and anchored: a directive counts as file-wide exactly when
// its rule list is empty — the comment ends right after the keyword, or a
// `--` introduces a plain-language description (ESLint treats that form as
// file-wide too). A rule name or `-next-line` after the keyword means scoped,
// and mentions inside string literals never match because the line does not
// start with a comment marker.
const blanketDisable =
  /^[ \t]*(?:\/\*|\/\/)[ \t]*(?:oxlint|eslint)-disable(?:[ \t]+--[^*]*)?(?:[ \t]*\*\/)?[ \t]*$/;

const lintableExtensions = /\.[cm]?[jt]sx?$/;

const walk = (dir: string): string[] =>
  readdirSync(resolveFrom(dir), { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    return entry.isDirectory() ? walk(path) : [path];
  });

// Every hand-written file the linter sees outside the walked zones: the root
// config files, plopfile and postcss config. The generated env declaration
// file is not linted, so a directive there would be dead.
const scannedFiles = ["../src", "../scripts"]
  .flatMap(walk)
  .filter((path) => lintableExtensions.test(path))
  .concat([
    "../vite.config.ts",
    "../vitest.config.ts",
    "../next.config.ts",
    "../drizzle.config.ts",
    "../plopfile.mjs",
    "../postcss.config.mjs",
  ]);

const violationsIn = (path: string): string[] =>
  readFileSync(resolveFrom(path), "utf8")
    .split("\n")
    .map((line, index) => ({ line, number: index + 1 }))
    .filter((entry) => blanketDisable.test(entry.line))
    .map((entry) => `${path.replace(/^\.\.\//, "")}:${String(entry.number)}: ${entry.line.trim()}`);

describe("file-wide lint disable directives", () => {
  it("matches directives with an empty rule list", () => {
    expect(blanketDisable.test("/* oxlint-disable */")).toBe(true);
    expect(blanketDisable.test("// eslint-disable")).toBe(true);
    expect(blanketDisable.test("/* eslint-disable */")).toBe(true);
    expect(blanketDisable.test("  // oxlint-disable  ")).toBe(true);
    expect(blanketDisable.test("// eslint-disable -- legacy code")).toBe(true);
    expect(blanketDisable.test("/* oxlint-disable -- migrated */")).toBe(true);
  });

  it("ignores scoped directives and non-comment mentions", () => {
    expect(blanketDisable.test("// oxlint-disable-next-line")).toBe(false);
    expect(blanketDisable.test("// eslint-disable-next-line")).toBe(false);
    expect(blanketDisable.test("/* eslint-disable previous-line */")).toBe(false);
    expect(blanketDisable.test("/* oxlint-disable typescript/no-explicit-any */")).toBe(false);
    expect(
      blanketDisable.test('terms: ["fallow-ignore", "oxlint-disable", "eslint-disable"],'),
    ).toBe(false);
  });

  it("leaves no scanned file with a file-wide directive", () => {
    expect(scannedFiles.flatMap(violationsIn)).toEqual([]);
  });
});
