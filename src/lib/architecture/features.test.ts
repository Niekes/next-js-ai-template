import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vite-plus/test";

// The inside of a feature (docs/adr/0003-bulletproof-feature-architecture.md).
// Fallow keeps features from importing each other; this test keeps each one in shape:
// only the agreed folders, no barrel files, and no client code reaching into server/.

const ROOT = path.resolve(__dirname, "../../..");
const FEATURES = path.join(ROOT, "src/features");
const FOLDERS = ["api", "components", "hooks", "server", "types", "utils"];

// src/features is gone after the notes example is deleted and before the next feature
const files = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { recursive: true, encoding: "utf8" })
        .map((file) => path.join(dir, file))
        .filter((file) => statSync(file).isFile())
    : [];

// Static, side-effect and dynamic imports. Relative and @/ specifiers only, so
// `next/server` is not mistaken for a feature's server/
const SERVER_IMPORT = /(from|import)\s*\(?\s*"(\.{1,2}|@)\/[^"]*\bserver(\/[^"]*)?"/;
const importsServer = (code: string) => SERVER_IMPORT.test(code);

const features = existsSync(FEATURES) ? readdirSync(FEATURES) : [];
const rel = (file: string) => path.relative(ROOT, file);

describe("feature structure", () => {
  it("detects server imports by path, not by name", () => {
    expect(importsServer('import { x } from "../server/notes";')).toBe(true);
    expect(importsServer('import { x } from "@/features/notes/server/notes";')).toBe(true);
    expect(importsServer('import "../server/setup";')).toBe(true);
    expect(importsServer('const m = await import("@/features/notes/server/notes");')).toBe(true);
    expect(importsServer('import { NextResponse } from "next/server";')).toBe(false);
    expect(importsServer('import { x } from "@/lib/observer";')).toBe(false);
  });

  it("holds only the agreed folders in each feature", () => {
    const offenders = features.flatMap((feature) =>
      readdirSync(path.join(FEATURES, feature))
        .filter((entry) => !FOLDERS.includes(entry))
        .map((entry) => `src/features/${feature}/${entry}`),
    );
    expect(offenders).toEqual([]);
  });

  it("has no barrel files", () => {
    expect(
      files(FEATURES)
        .filter((file) => /^index\.[jt]sx?$/.test(path.basename(file)))
        .map(rel),
    ).toEqual([]);
  });

  it("keeps server/ out of client code", () => {
    const clientFiles = files(FEATURES).filter(
      (file) => !rel(file).split(path.sep).includes("server"),
    );
    expect(
      clientFiles.filter((file) => importsServer(readFileSync(file, "utf8"))).map(rel),
    ).toEqual([]);
  });
});
