import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vite-plus/test";

// Coverage stays at 100%. These tests make every way around that gate show up
// in review: a lower threshold, a narrower include, a new exclude, or an inline ignore comment.

const ROOT = path.resolve(__dirname, "../../..");

type Coverage = { thresholds?: unknown; include?: string[]; exclude?: string[] };

const loadCoverage = async (): Promise<Coverage> => {
  // a runtime path, so this test does not import the root config across a zone boundary
  const configPath = path.join(ROOT, "vitest.config.ts");
  const { default: config } = (await import(configPath)) as {
    default: { test?: { coverage?: Coverage } };
  };
  return config.test?.coverage ?? {};
};

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const file = path.join(dir, entry);
    return statSync(file).isDirectory()
      ? walk(file)
      : /\.(ts|tsx|js|jsx)$/.test(entry)
        ? [file]
        : [];
  });

// this file is scanned too; its source holds `\s+` where the pattern needs real whitespace
const IGNORE_COMMENT = new RegExp(`\\b(v8|c8|istanbul)\\s+ignore\\b`);

describe("coverage gate", () => {
  it("requires 100% on every metric, for every file", async () => {
    expect((await loadCoverage()).thresholds).toEqual({ 100: true });
  });

  it("measures all source files", async () => {
    expect((await loadCoverage()).include).toEqual(["src/**/*.{ts,tsx}"]);
  });

  it("excludes only tests, type declarations and vendored UI", async () => {
    expect((await loadCoverage()).exclude).toEqual([
      "**/*.test.*",
      "**/*.d.ts",
      "src/components/ui/**",
    ]);
  });

  it("has no inline coverage-ignore comments in app code", () => {
    const files = walk(path.join(ROOT, "src"));
    const hits = files
      .filter((file) => IGNORE_COMMENT.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(ROOT, file));

    expect(files.length).toBeGreaterThan(20);
    expect(hits).toEqual([]);
  });
});
