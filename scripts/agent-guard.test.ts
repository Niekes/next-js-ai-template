import { describe, expect, it } from "vite-plus/test";

import { blockReason, GUARDED } from "./agent-guard";

describe("agent shell guard", () => {
  it.each(GUARDED)("blocks a redirect into %s", (pattern) => {
    const file = pattern.replace("/**", "/x.ts").replace("*", "tsconfig");
    expect(blockReason(`echo x >> ${file}`)).toBeDefined();
  });

  it("blocks a redirect into a gate file and lets a read through", () => {
    expect(blockReason("echo x > .github/workflows/ci.yml")).toMatch(/ci\.yml/);
    expect(blockReason("cat .github/workflows/ci.yml")).toBeUndefined();
  });

  it("blocks write commands that name a protected path, also absolute or quoted", () => {
    expect(blockReason("sed -i '' 's/a/b/' vitest.config.ts")).toMatch(/vitest/);
    expect(blockReason('rm "src/components/ui/button.tsx"')).toMatch(/button/);
    expect(blockReason("mv x /repo/.husky/pre-push", "/repo")).toMatch(/pre-push/);
    expect(blockReason("git checkout -- pnpm-lock.yaml")).toMatch(/lock/);
    expect(blockReason("echo x | tee -a src/lib/architecture/a.test.ts")).toMatch(/architecture/);
  });

  it("lets ordinary writes and build-output cleanup through", () => {
    expect(blockReason("sed -i '' 's/a/b/' src/app/page.tsx")).toBeUndefined();
    expect(blockReason("rm -rf .next node_modules coverage")).toBeUndefined();
    expect(blockReason("git checkout -b feat/x && git add .claude/settings.json")).toBeUndefined();
    expect(blockReason("cp .env.example env.txt")).toBeUndefined();
    expect(blockReason("sed -n 1,20p vitest.config.ts")).toBeUndefined();
    expect(blockReason("perl -ne 'print if /x/' vitest.config.ts")).toBeUndefined();
    expect(blockReason("git commit -m 'fix: x'")).toBeUndefined();
  });

  it.each([
    "sed -Ei 's/a/b/' vitest.config.ts",
    "sed -i.bak 's/a/b/' vitest.config.ts",
    "sed -e 's/a/b/' -i vitest.config.ts",
    "sed --in-place 's/a/b/' vitest.config.ts",
    "perl -pi -e 's/a/b/' vitest.config.ts",
    "echo x >| vitest.config.ts",
    "touch vitest.config.ts",
    "chmod +x .husky/pre-push",
    "patch vitest.config.ts fix.diff",
    "git apply fix.diff -- vitest.config.ts",
  ])("blocks in-place edits, >| and other writes: %s", (command) => {
    expect(blockReason(command)).toBeDefined();
  });

  it("blocks skipping the git hooks and touching .env", () => {
    expect(blockReason("git commit -n -m x")).toMatch(/hooks/);
    expect(blockReason("git -c core.hooksPath=/dev/null commit -m x")).toMatch(/hooks/);
    expect(blockReason("git commit --no-verify -m x")).toMatch(/hooks/);
    expect(blockReason("HUSKY=0 git push")).toMatch(/hooks/);
    expect(blockReason("cat .env")).toMatch(/\.env/);
  });
});
