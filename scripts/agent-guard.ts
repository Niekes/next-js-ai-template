// Claude Code PreToolUse hook for Bash (.claude/settings.json): the permission rules
// cover only the edit tools, so this blocks shell writes to the same protected paths.
// It matches the command text, so `node -e` or a generated script still gets past it (ADR 0001).
// shortcut: deleting a parent folder (`rm -rf .github`) passes, and a guarded path used only
// as a `cp`/`ln` source is blocked; parse with a real shell tokenizer if either starts to bite.
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

// "Protected paths" and "Edit only with human approval" in AGENTS.md, minus build output
// and caches, which are fine to delete; security-wiring.test.ts checks the list
export const GUARDED = [
  "src/lib/db/migrations/**",
  "pnpm-lock.yaml",
  "next-env.d.ts",
  "*.tsbuildinfo",
  ".agents/**",
  "skills-lock.json",
  "src/components/ui/**",
  ".github/badges/**",
  ".env",
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

const matches = (file: string, pattern: string) => {
  if (pattern.endsWith("/**"))
    return file === pattern.slice(0, -3) || file.startsWith(pattern.slice(0, -2));
  if (pattern.startsWith("*")) return file.endsWith(pattern.slice(1));
  return file === pattern;
};

// Words with shell operators split off and quotes dropped; a repo-absolute or ./ path becomes repo-relative
const words = (command: string, root: string) =>
  command
    .replaceAll(/["']/g, "")
    .split(/(>>?\|?|[\s;&|()<])/)
    .filter((word) => word.trim() !== "")
    .map((word) => word.replace(`${root}/`, "").replace(/^\.\//, ""));

// Commands that write, move or delete the files they name; sed/perl only with an in-place flag
const WRITES = [
  /(?:^|[\s(])(?:mv|cp|rm|tee|truncate|ln|dd|touch|chmod|install|patch|git\s+(?:checkout|restore|rm|mv|apply))\s/,
  /(?:^|[\s(])(?:sed|perl)\b.*\s(?:-[a-zA-Z]*i|--in-place)/,
];

const SKIPS_HOOKS = /--no-verify|\bHUSKY=0\b|core\.hooksPath|\bgit\s+commit\b.*\s-n\b/;

export const blockReason = (command: string, root = process.cwd()): string | undefined => {
  if (SKIPS_HOOKS.test(command)) return "Do not skip the git hooks; fix what they report.";
  if (words(command, root).includes(".env"))
    return ".env holds secrets; agents neither read nor write it.";
  // each command of a chain or pipeline on its own, so `git checkout -b x && git add <gate>` passes;
  // the lookbehind keeps `>|` (clobbering redirect) whole
  for (const segment of command.split(/&&|\|\||(?<!>)\||[;&\n]/)) {
    const writes = WRITES.some((write) => write.test(` ${segment} `));
    const list = words(segment, root);
    const target = list.find(
      (word, i) =>
        (writes || /^>>?\|?$/.test(list[i - 1] ?? "")) && GUARDED.some((p) => matches(word, p)),
    );
    if (target) return `${target} is protected (AGENTS.md); use its owning tool or ask a human.`;
  }
  return undefined;
};

const reasonFor = (stdin: string) => {
  try {
    const input = JSON.parse(stdin) as { cwd: string; tool_input: { command: string } };
    // the project root, not the shell's cwd, so absolute paths still resolve after a `cd`
    return blockReason(input.tool_input.command, process.env.CLAUDE_PROJECT_DIR ?? input.cwd);
  } catch {
    // fail closed: an unreadable call is blocked, not waved through
    return "agent-guard could not read the hook input; command blocked.";
  }
};

const run = () => {
  const reason = reasonFor(readFileSync(0, "utf8"));
  if (!reason) return;
  console.error(reason);
  process.exit(2);
};

// "".concat: vite-plus passes a non-string import.meta.url at runtime; realpath: the
// project folder may be reached through a symlink
if (realpathSync(process.argv[1] ?? "/") === fileURLToPath("".concat(import.meta.url))) run();
