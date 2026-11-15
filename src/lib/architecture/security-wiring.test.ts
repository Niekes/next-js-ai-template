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
// Server Actions are public POST endpoints that route-auth.test.ts does not see
const SERVER_ACTION_SELECTOR = "ExpressionStatement[directive='use server']";

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

// The "Edit only with human approval" list in AGENTS.md
const GUARDRAIL_FILES = [
  ".fallowrc.json",
  ".husky/**",
  ".github/workflows/**",
  ".github/actions/**",
  ".github/CODEOWNERS",
  "drizzle.config.ts",
  "vitest.config.ts",
  ".claude/settings.json",
  ".mcp.json",
  "src/lib/architecture/**",
  "security-accepted.json",
  "scripts/security-gate.ts",
  "scripts/agent-guard.ts",
  "pnpm-workspace.yaml",
];

// The "Never edit by hand" list in AGENTS.md, minus build output and caches
const PROTECTED_FILES = [
  "src/lib/db/migrations/**",
  "pnpm-lock.yaml",
  "next-env.d.ts",
  "*.tsbuildinfo",
  ".agents/**",
  "skills-lock.json",
  "src/components/ui/**",
  ".github/badges/**",
  ".env",
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

    for (const file of GUARDRAIL_FILES) {
      expect(claude.permissions.ask).toContain(`Edit(/${file})`);
    }
  });

  // Agent rules miss shell writes, so pull-request review is the backstop
  it("gives every guardrail file a code owner", () => {
    const owned = read(".github/CODEOWNERS")
      .split("\n")
      .filter((line) => line.startsWith("/"))
      .map((line) => line.split(/\s+/)[0]);

    expect(owned).toEqual(GUARDRAIL_FILES.map((file) => `/${file}`));
  });

  it.each([
    ["disabled TLS checks", TLS_SELECTOR],
    ["Server Actions", SERVER_ACTION_SELECTOR],
  ])("bans %s everywhere, with no file exempt", async (_, selector) => {
    const lint = await loadLint();
    const exempt = lint.overrides
      .filter((o) => o.rules?.["local/no-restricted-syntax"])
      .filter((o) => !selectors(o.rules?.["local/no-restricted-syntax"])?.includes(selector))
      .flatMap((o) => o.files);

    expect(selectors(lint.rules["local/no-restricted-syntax"])).toContain(selector);
    expect(exempt).toEqual([]);
    expect(lint.ignorePatterns).toEqual(LINT_IGNORES);
  });
});

describe("agent, CI and supply-chain wiring", () => {
  it("runs the shell guard on every Bash call, covering every protected and guardrail file", async () => {
    const claude = JSON.parse(read(".claude/settings.json")) as {
      hooks: { PreToolUse: { matcher: string; hooks: { command: string }[] }[] };
    };
    // a runtime path, so this test does not import scripts/ across a zone boundary
    const { GUARDED } = (await import(path.join(ROOT, "scripts/agent-guard.ts"))) as {
      GUARDED: string[];
    };

    expect(claude.hooks.PreToolUse).toEqual([
      {
        matcher: "Bash",
        hooks: [
          {
            type: "command",
            command: 'node --no-warnings "$CLAUDE_PROJECT_DIR/scripts/agent-guard.ts"',
          },
        ],
      },
    ]);
    expect([...GUARDED].sort()).toEqual([...PROTECTED_FILES, ...GUARDRAIL_FILES].sort());
  });

  it("pins every action to a commit SHA and gives CI a read-only token by default", () => {
    const files = [".github/workflows/ci.yml", ".github/actions/setup/action.yml"];
    const refs = files.flatMap((file) =>
      [...read(file).matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]),
    );
    const ci = read(".github/workflows/ci.yml");

    expect(refs.filter((ref) => !/^\$\/|@[0-9a-f]{40}$/.test(ref ?? ""))).toEqual([]);
    expect(ci).toMatch(/\npermissions:\n {2}contents: read\n/);
    expect(ci).toContain("zizmorcore/zizmor-action@");
    expect(ci).toContain("- run: pnpm audit --prod --audit-level high\n");
  });

  it("keeps the pnpm supply-chain settings and Dependabot on", () => {
    const workspace = read("pnpm-workspace.yaml").split("\n");
    const dependabot = read(".github/dependabot.yml");

    expect(workspace).toContain("minimumReleaseAge: 1440");
    expect(workspace).toContain("trustPolicy: no-downgrade");
    expect(dependabot).toContain("package-ecosystem: npm\n");
    expect(dependabot).toContain("package-ecosystem: github-actions\n");
  });
});
