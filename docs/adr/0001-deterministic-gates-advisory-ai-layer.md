# 0001 — Deterministic gates, advisory AI layer

- Status: accepted
- Date: 2026-11-15

## Context

AI agents write much of the code in projects built from this template. Agents
follow written rules most of the time, not all of the time: they skip a doc,
quiet a finding to get past it, or loosen a config. A rule that exists only in
`AGENTS.md`, a skill or an MCP prompt therefore holds only as often as the
agent happens to read and obey it.

## Decision

Every rule that matters is enforced by a tool that fails the build: the type
checker, Oxlint (with a local plugin for syntax bans), Vitest (including
architecture tests that read the source and config files), Fallow, the
security gate, husky hooks and CI. All of them run in one command,
`pnpm verify`.

The AI layer — `AGENTS.md`, `docs/`, vendored skills, MCP servers — is
advisory: it explains the rules and points to the tools, but it does not
replace them. The one exception is the agent permission config
(`.claude/settings.json`), which denies edits to generated
files and asks a human before an agent edits a gate (see the amendment below).

The gates start at full strictness on day one (100 % coverage, no warnings,
no suppressions, any clone fails), because an empty project is the cheapest
point to be strict and loosening later is easier than tightening.

## Consequences

- Each new convention needs a gate, not just a sentence in the docs. A doc
  claim without a gate is a bug.
- Gates guard each other: `coverage-gate.test.ts`, `security-wiring.test.ts`
  and `lint-directives.test.ts` fail when a gate is weakened, and the files
  that define the gates need human approval to edit.
- Strict gates make small changes slower: every line needs a test, every
  clone needs extracting. That cost is deliberate.

## Amendment (2026-11-15)

The permission config is not an exception after all: its rules cover only
the file-editing tools, and a shell command (`sed -i`, `cat >`, a script)
writes past them. It is advisory like the rest of the AI layer. The backstops
for a weakened gate are the gate tests and CI, and pull-request review:
`.github/CODEOWNERS` names a human owner for every file on the
human-approval list in `AGENTS.md`, and `security-wiring.test.ts` fails when
the two lists drift apart. Review only blocks a merge once `main` requires
code-owner review (see the README).

## Amendment (2026-11-15, shell guard)

A Claude Code `PreToolUse` hook (`scripts/agent-guard.ts`) now blocks shell
commands that write to a protected path or skip the git hooks. It matches the
command text, so it turns accidental bypasses into blocks but does not stop a
determined one (`node -e`, a generated script). The backstops above still
stand. opencode support was dropped, so `.claude/settings.json` is the only
agent permission config.
