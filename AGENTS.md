# Next.js AI Template

A Next.js 16 App Router starter whose architecture, conventions and security
rules are enforced by tools, not by prose. Better Auth (email + password,
admin plugin), Drizzle + Postgres, TanStack Query, shadcn on Tailwind 4.

`pnpm` is the package manager. Run `pnpm install`, `docker compose up -d`,
`cp .env.example .env` (fill in `BETTER_AUTH_SECRET`), `pnpm db:migrate`,
then `pnpm dev`.

Non-standard scripts: `pnpm db:generate|migrate|setup|studio`,
`pnpm fallow|fallow:check|fallow:full`, `pnpm gen`, `pnpm security`,
`pnpm verify`, `pnpm arch:diagram`, `pnpm size:scan`. Wrappers: `lint` runs
`vp check`, `typecheck` runs `tsc --noEmit`.

Finish a code change only after `pnpm verify` passes (the same gate as CI).
Use `pnpm exec vp check --fix` to auto-fix lint and format issues. Never
silence a finding (no disable comments, no config loosening); fix the code.

## Layout

App code is under `src/`, split into three zones: **app** (`src/app/`,
routing, pages and API routes), **shared** (`src/components/`, `src/lib/`,
`src/const/`), and **root** (`src/proxy.ts`, page protection). Tooling lives
at the repo root and in `scripts/`. `src/app/api/notes` and
`src/app/dashboard/notes` are a worked example that crosses every zone.

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
`.github/workflows/**`, `.github/actions/**`, `drizzle.config.ts`,
`vitest.config.ts` (coverage gate), `security-accepted.json`,
`scripts/security-gate.ts`, `src/lib/architecture/**`, `.claude/settings.json`,
`opencode.json`.

Enforced by `.claude/settings.json` (Claude Code) and `opencode.json`
(opencode). Change both together; `security-wiring.test.ts` checks that both ask before gate edits.

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
`fallow-review`, `security-audit`.
