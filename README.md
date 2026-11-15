# Next.js AI Template

![coverage](.github/badges/coverage.svg) ![fallow health](.github/badges/fallow-health.svg) ![accepted security risks](.github/badges/security-accepted.svg)

A Next.js starter built for AI coding agents. Its architecture, conventions
and security rules are not just written down: they are enforced by tools that
fail the build, so an agent that skips the docs still cannot merge code that
breaks them ([ADR 0001](docs/adr/0001-deterministic-gates-advisory-ai-layer.md)).

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript (strict) ·
Tailwind 4 + shadcn · TanStack Query · zod · Drizzle + Postgres · Better Auth
(email + password, admin role) · Vite+ (Oxlint, Oxfmt, Vitest) · Fallow.

## Quick start

```bash
pnpm install
docker compose up -d                 # Postgres on :54322
cp .env.example .env                 # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm db:migrate
pnpm dev
```

Open <http://localhost:3000>, create an account, and add a note. To make
yourself admin, set your `role` to `admin` in `pnpm db:studio`.

## What keeps the code in shape

| Guardrail          | Tool                                                        | Fails when                                                                 |
| ------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| Architecture zones | Fallow boundaries + ArchUnit diagram test                   | an import crosses a forbidden edge (`docs/architecture.puml`)              |
| Types              | `tsc` strict + `noUncheckedIndexedAccess` and friends       | any type error                                                             |
| Lint               | Oxlint, type-aware, every rule an error, no warnings        | unsafe `any`, floating promises, a11y, raw browser APIs, enums …           |
| Coverage           | Vitest, 100 % on every metric                               | any uncovered line or branch                                               |
| Dead code & clones | Fallow                                                      | an unused export, file or dependency, any duplicated block                 |
| Health             | Fallow health score, ratchet only goes up                   | complexity or CRAP above threshold, score below the floor                  |
| Security           | `fallow security` + `security-accepted.json`                | a new risky sink without a human-approved reason                           |
| Auth on API routes | `route-auth.test.ts`                                        | a handler without `withAdmin*` or an opening `getUser()` check             |
| Gate integrity     | `coverage-gate`, `security-wiring`, `lint-directives` tests | a threshold, ignore list or hook is weakened, or a disable comment appears |
| Agent permissions  | `.claude/settings.json`, `opencode.json`                    | an agent's edit tool touches generated files (denied) or gate files (asks) |
| Gate ownership     | `.github/CODEOWNERS` (pinned by `security-wiring` test)     | a pull request changes a gate file without a human approval                |

All of it runs in one command, `pnpm verify`, which is also what CI runs.
Husky runs the fast part on commit and push.

## For AI agents

- [AGENTS.md](AGENTS.md) (also loaded as `CLAUDE.md`) — commands, layout, protected paths
- [docs/](docs/) — architecture, conventions, database, quality gates, workflow
- [GLOSSARY.md](GLOSSARY.md) and [docs/adr/](docs/adr/) — domain language and decisions
- `.agents/skills/` — vendored skills (grilling, domain modeling, TDD, review, Fallow, security audit)
- `pnpm gen component <name>` / `pnpm gen feature <name>` — scaffold convention-correct code with a test

## Make it yours

1. Click **Use this template** on GitHub (or `pnpm create next-app -e <repo-url>`).
2. Rename the package in `package.json`, the title in `src/app/layout.tsx` and
   the heading in `src/app/page.tsx`.
3. Replace the terms in `GLOSSARY.md` with your domain's.
4. Put your GitHub user or team in `.github/CODEOWNERS`, then protect `main`
   with a ruleset that requires a pull request with code-owner review, so gate
   changes need a human. Add "GitHub Actions" to the ruleset's bypass list,
   or the CI job that commits the README badges to `main` cannot push.
5. Keep the notes example as a reference until your first feature exists, then
   delete it (`src/features/notes/`, `src/lib/db/schema/notes.ts`,
   `src/app/api/notes/`, `src/app/dashboard/notes/`)
   and run `pnpm db:generate`.

## Deploy

`Dockerfile` builds a standalone Next.js server. Set `POSTGRES_URL`,
`BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`, and run `pnpm db:migrate` against
the production database before starting a new version.

## License

[MIT](LICENSE)
