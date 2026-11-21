# Next.js AI Template

A Next.js 16 App Router starter whose architecture, conventions and security
rules are enforced by tools, not by prose. Better Auth (email + password,
admin plugin), Drizzle + Postgres, TanStack Query, shadcn on Tailwind 4.

`pnpm` is the package manager. Run `make setup` (install, `.env` with a
generated `BETTER_AUTH_SECRET`, Postgres, migrations), then `make start`;
`make stop` stops Postgres and `make` lists every target. The `Makefile` only
wraps the pnpm scripts and `docker compose`; without `make`, run those directly.

Non-standard scripts: `pnpm db:generate|migrate|setup|studio`,
`pnpm fallow|fallow:check|fallow:full`, `pnpm gen`, `pnpm security`,
`pnpm verify`, `pnpm arch:diagram`, `pnpm size:scan`. Wrappers: `lint` runs
`vp check`, `typecheck` runs `tsc --noEmit`.

Finish a code change only after `pnpm verify` passes (CI runs the same gate,
plus `pnpm audit` and zizmor, which need the network).
Use `pnpm exec vp check --fix` to auto-fix lint and format issues. Never
silence a finding (no disable comments, no config loosening); fix the code.

## Layout

App code is under `src/`, in bulletproof-react layers (imports flow
shared → features → app): **app** (`src/app/`, thin routing, pages and API
routes), **features** (`src/features/<name>/`, one zone each, never importing
each other), **shared** (`src/components/`, `src/lib/`, `src/const/`), and
**root** (`src/proxy.ts`, page protection; `src/instrumentation.ts`, error
logging). Tooling lives at the repo root and in `scripts/`. `src/features/notes` with `src/app/api/notes` and
`src/app/dashboard/notes` is a worked example that crosses every zone.

## Protected paths

Never edit by hand: generated, vendored, CI-owned, or secret files. Use the
owning tool instead (`pnpm db:generate`, `pnpm install`, `pnpm dlx shadcn add`, CI).

- `src/lib/db/migrations/**` (use `pnpm db:generate`)
- `pnpm-lock.yaml`, `next-env.d.ts`, `*.tsbuildinfo`
- `.agents/**`, `skills-lock.json` (vendored skills)
- `src/components/ui/**` (vendored shadcn)
- `.github/badges/**` (written by CI)
- `.env` (no reads either), plus build output and caches

Edit only with human approval: `.fallowrc.json`, `.husky/**`,
`.github/workflows/**`, `.github/actions/**`, `.github/CODEOWNERS`,
`drizzle.config.ts`, `vitest.config.ts` (coverage gate), `security-accepted.json`,
`scripts/security-gate.ts`, `scripts/agent-guard.ts`, `src/lib/architecture/**`,
`.claude/settings.json`, `.mcp.json`, `pnpm-workspace.yaml` (supply-chain settings).

`.claude/settings.json` applies these rules to the file-editing tools;
`security-wiring.test.ts` checks that it asks before gate edits. Its
`PreToolUse` hook (`scripts/agent-guard.ts`) blocks shell commands that write
to a protected path (`sed -i`, `>`, `mv`, `rm` …) or skip the git hooks
(`--no-verify`, `HUSKY=0`). It matches the command text, so a script or
`node -e` still gets past it: editing a protected file that way breaks the
same rule. The backstops are the gate tests and CI, which
fail when a gate is weakened, and review: `.github/CODEOWNERS` names a human
owner for every file in this list (`security-wiring.test.ts` checks that too).

## Docs

Read the relevant file before working in that area:

- [docs/architecture.md](docs/architecture.md) — zones, boundaries, where new code goes
- [docs/conventions.md](docs/conventions.md) — coding conventions
- [docs/database.md](docs/database.md) — Drizzle schema and migrations
- [docs/quality.md](docs/quality.md) — lint, tests, Fallow and security gates
- [docs/workflow.md](docs/workflow.md) — from idea to commit and PR

## Domain docs

Single-context layout: the root [GLOSSARY.md](GLOSSARY.md) holds the domain
language, and decisions live in `docs/adr/`. Read both before working in an
area. Use the `domain-modeling` skill (via `/grill-with-docs`) to add terms
and ADRs as they are resolved.

## Skills

Vendored in `.agents/skills/` (linked from `.claude/skills/`): `grilling`,
`grill-with-docs`, `domain-modeling`, `codebase-design`, `tdd`,
`diagnosing-bugs`, `prototype`, `research`, `code-review`, `fallow`,
`fallow-review`, `security-audit`, `setup-matt-pocock-skills`, `to-spec`,
`to-tickets`, `implement`, `ponytail`, `ponytail-review`, `ponytail-audit`,
`ponytail-debt`, `modern-web-guidance`. The idea-to-code flow (grill, spec,
tickets, implement) is in [docs/workflow.md](docs/workflow.md#flow).

First-party, in `.claude/skills/` (not vendored, edit freely):
`customize-template`, which turns this template into the user's own project
by following the README's "Make it yours" list.

Apply the `ponytail` skill to every code change. Use `modern-web-guidance`
before writing HTML, CSS or client-side JS.

This project's Baseline target is Baseline Widely available.

## Agent skills

### Issue tracker

GitHub Issues, via `gh`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: root `GLOSSARY.md` plus `docs/adr/`. See `docs/agents/domain.md`.
