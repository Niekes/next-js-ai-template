import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vite-plus/test";

// The security gates hold only while they are wired in. These tests make every way
// around them show up in review: a script dropped from verify, pre-push or CI, a guardrail
// file without an approval prompt, a file exempt from the TLS ban, or a lint
// ignore pattern that hides a file from the ban altogether.

const ROOT = path.resolve(__dirname, "../../..");
const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");

type Rule = [string, ...{ selector: string }[]];
type LintConfig = {
  ignorePatterns: string[];
  rules: Record<string, Rule>;
  overrides: { files: string[]; rules?: Record<string, Rule> }[];
};

const loadLint = async () => {
  // a runtime path, so this test does not import the root config across a zone boundary
  const { default: config } = (await import(path.join(ROOT, "vite.config.ts"))) as {
    default: { lint: LintConfig };
  };
  return config.lint;
};

const selectors = (rule: Rule | undefined) => {
  if (!rule) return undefined;
  const [, ...entries] = rule;
  return entries.map((entry) => entry.selector);
};

// Pinned here, not imported from scripts/lint-plugin.mjs: that file needs no approval,
// so a weakened selector there must fail this test
const TLS_SELECTOR =
  "Property[value.value=false]:matches([key.name='rejectUnauthorized'], [key.value='rejectUnauthorized'])";

// vite.config.ts needs no approval either, so the files the linter skips are pinned too
const LINT_IGNORES = [
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
  ".agents/**",
  ".claude/skills/**",
  "src/components/ui/**",
  "src/lib/db/migrations/**",
];

const GUARDRAIL_FILES = [
  ".claude/settings.json",
  "opencode.json",
  ".mcp.json",
  "src/lib/architecture/**",
  "security-accepted.json",
  "scripts/security-gate.ts",
];

describe("security gate wiring", () => {
  it("runs the security gate in verify, pre-push and the CI static job", () => {
    const { scripts } = JSON.parse(read("package.json")) as { scripts: Record<string, string> };

    expect(scripts.security).toBe("tsx scripts/security-gate.ts");
    expect(scripts.verify).toContain("pnpm security");
    expect(read(".husky/pre-push").split("\n")).toContain("pnpm security");
    // the static job runs up to the next top-level job key
    const staticJob = /\n {2}static:\n([\s\S]*?)\n {2}\w+:\n/.exec(
      read(".github/workflows/ci.yml"),
    );
    expect(staticJob?.[1]).toContain("- run: pnpm security\n");
  });

  it("asks a human before an agent edits a guardrail file", () => {
    const claude = JSON.parse(read(".claude/settings.json")) as { permissions: { ask: string[] } };
    const opencode = JSON.parse(read("opencode.json")) as {
      permission: { edit: Record<string, string> };
    };

    for (const file of GUARDRAIL_FILES) {
      expect(claude.permissions.ask).toContain(`Edit(/${file})`);
      expect(opencode.permission.edit[file]).toBe("ask");
    }
  });

  it("bans disabled TLS checks everywhere, with no file exempt", async () => {
    const lint = await loadLint();
    const exempt = lint.overrides
      .filter((o) => o.rules?.["local/no-restricted-syntax"])
      .filter((o) => !selectors(o.rules?.["local/no-restricted-syntax"])?.includes(TLS_SELECTOR))
      .flatMap((o) => o.files);

    expect(selectors(lint.rules["local/no-restricted-syntax"])).toContain(TLS_SELECTOR);
    expect(exempt).toEqual([]);
    expect(lint.ignorePatterns).toEqual(LINT_IGNORES);
  });
});
