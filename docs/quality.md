# Quality

## Commands

| Command             | When         | What it does                                                                                                                                                |
| ------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`         | Every change | Oxfmt + Oxlint + typecheck (`vp check`)                                                                                                                     |
| `pnpm typecheck`    | Every change | `tsc --noEmit` (strict + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`) |
| `pnpm test`         | Every change | Vitest suite (`test:watch` for watch mode)                                                                                                                  |
| `pnpm verify`       | Before a PR  | The full gate; CI also runs `pnpm audit` and zizmor (network-bound)                                                                                         |
| `pnpm fallow:check` | Every commit | Fallow dead-code + duplication gate (dead code, boundaries, duplicate exports, circular deps, clones)                                                       |
| `pnpm fallow`       | Before push  | Changed-file audit + health-score ratchet (needs `pnpm test --coverage` first)                                                                              |
| `pnpm fallow:full`  | Occasional   | Full scan: dead-code + health (with coverage) + dupes                                                                                                       |
| `pnpm security`     | Before push  | `fallow security` gate: every candidate must be accepted in `security-accepted.json`                                                                        |
| `pnpm gen`          | New code     | Plop generators (`component`, `feature`)                                                                                                                    |
| `pnpm size:scan`    | Occasional   | Lists functions in the 31–60 line band                                                                                                                      |

**Runners**: `pnpm` is the canonical interface for every gate above — the
husky hooks, CI, and this doc all reference the package.json scripts. Reach
for bare `vp` only for scoped work the scripts don't expose:
`vp check --fix [paths]`, `vp check <file>`, `vp test <file>`, `vp staged`.
Never `vp install` / `vp dev` / `vp build` — the lockfile and `catalog:` are
pnpm's. `pnpm lint` fails on warnings as well: every rule is an error and
`lint.options.denyWarnings` is set in `vite.config.ts`.

CI (`.github/workflows/ci.yml`) runs the same scripts on every push and pull
request, with placeholder env values for the build, plus `pnpm audit` and
zizmor, which need the network. On pushes to `main` the test job
regenerates the README badges (`.github/badges/`), and a separate job that
installs nothing commits them with `[skip ci]`, so no dependency code runs
next to the write token. The build job also runs `docker build .`.

## Tests and coverage

`vitest.config.ts` runs `src/**` and `scripts/**` tests in Node; component
tests opt into jsdom with `// @vitest-environment jsdom` on their first line.

Coverage is 100% on lines, branches, functions and statements
(`thresholds: { 100: true }`), so any uncovered line fails
`pnpm test --coverage`, the pre-push hook and CI. Cover new code with a test
that asserts an observable outcome (a return value, rendered text, a status
and body, a call to a mocked boundary); a test that only renders does not count.

The only excludes are tests, type declarations and vendored
`src/components/ui/**`. Code that can never run is deleted, not excluded.
`src/lib/architecture/coverage-gate.test.ts` fails if the thresholds or the
exclude list change, or if an inline `v8`/`istanbul` ignore comment appears,
and `vitest.config.ts` needs human approval to edit.

## Linting & formatting

Vite+ runs Oxlint (type-aware) and Oxfmt through one `vp check`
(`vite.config.ts`). Oxlint applies its type-aware correctness rules
(`no-floating-promises`, `no-unsafe-*`, `react/*`) plus the
`@tanstack/query` and `vite-plus` JS plugins. Formatting is Oxfmt.

**Function style**: `func-style` bans `function` declarations — every
function is a `const` arrow. `local/no-restricted-syntax` additionally bans
`export default function` and `const f = function () {}`.

**Restricted syntax**: Oxlint has no `no-restricted-syntax`, so
`scripts/lint-plugin.mjs` provides `local/no-restricted-syntax` with ESLint's
options (esquery selectors). `RESTRICTED_SYNTAX` there bans enum
declarations, the two function forms above, `navigator.clipboard`,
`rejectUnauthorized: false` and the `"use server"` directive. Add a ban as one `{ selector, message }` entry.

**Tailwind classes**: `tailwindcss/no-custom-classname` rejects any class
Tailwind does not know. Theme colours are the shadcn tokens in
`src/app/globals.css`.

**Function size**: `max-lines-per-function` (60, blank lines and comments
excluded) applies everywhere, tests included. Split an oversized `describe`
into focused blocks, or extract a hook or subcomponent. `complexity` (25) and
`max-depth` (5) are errors too.

**Accessibility**: `jsx-a11y` runs on all JSX; icon-only controls must carry
an `aria-label`.

**Shared components**: `src/components/conventions.test.ts` asserts that every
`app-*.tsx` exports its matching `App*` component and imports only through
the `@/` alias. `src/app/conventions.test.ts` asserts that every page has a
default export and a colocated `page.test.tsx`.

## Generators

`pnpm gen` scaffolds convention-correct code: `component` creates an `app-*`
wrapper in `src/components/` with a colocated jsdom test, `feature` creates a
signed-in page under `src/app/dashboard/` with a colocated test. Templates
live in `plop-templates/`; after changing lint rules, generate one of each
and re-run the gates on the output.

## Fallow

Fallow enforces architecture boundaries and flags dead code, complexity
hotspots, duplication, and security candidates. The pre-commit hook runs
`vp staged`, `pnpm typecheck` and `pnpm fallow:check` and blocks the commit
while it reports any issue. Every Fallow rule that defaults to `warn` is set
to `error` in `.fallowrc.json`.

**Duplication**: `duplicates.threshold` is `0.01` %, below the smallest
possible clone, so any clone group fails `fallow dupes`. Extract the shared code.

**Health score**: after the audit, `pnpm fallow` runs `fallow health` twice:
plain (any above-threshold finding fails) and with `--min-score`. The score
floor only moves up: when `fallow health --score --format json` reports a
higher `score`, raise `--min-score` in `package.json` to its integer part.
Never lower it.

Coverage is passed per command (`--coverage coverage/coverage-final.json`),
never set in `.fallowrc.json`: that file only exists after
`pnpm test --coverage`, and a configured path that is missing aborts
`fallow health`.

**Never edit `.fallowrc.json` to silence a finding.** Fix the code, using
Fallow's own tools to ground the change:

- `fallow guard <file>` (MCP `guard`) — rules that apply before editing.
- Boundary violation → reroute the import; do not add an exception.
- Dead code → confirm with `fallow dead-code --trace <file>:<export>` and delete.
- Duplication → `fallow dupes --trace <file>:<line>`.
- Complexity → `fallow health --complexity-breakdown`.
- Unclear finding → `fallow explain <issue-type>`.

## Security gates

Three tools, one kind of rule each ([ADR 0002](adr/0002-security-gates-without-semgrep.md)):

- **Risky sinks** (SSRF, open redirect, raw HTML or SQL, PII in logs, server env
  in client code, hardcoded secrets): `pnpm security` runs `fallow security`
  with every category enabled and compares the candidates, per file and
  category, with `security-accepted.json`. A new candidate fails; so does a
  stale entry. Fix the code. Accepting a risk means a human adds or raises an
  entry with a reason.
- **Syntax bans**: `local/no-restricted-syntax`, such as `rejectUnauthorized: false`
  and `"use server"` (a Server Action is a public POST endpoint that
  `route-auth.test.ts` cannot see; write an API route instead).
- **Project invariants**: architecture tests. `route-auth.test.ts` fails on any
  API route handler that is neither wrapped in `withAdmin*` nor opens with
  `const user = await getUser(); if (!user) return ...`.
  `security-wiring.test.ts` pins the gate wiring, the approval prompts, the
  lint ignore list, the agent shell hook, the action SHA pins and read-only
  CI token, the pnpm supply-chain settings and Dependabot.

Around the code:

- **Supply chain**: `pnpm-workspace.yaml` sets `minimumReleaseAge` (strict)
  and `trustPolicy: no-downgrade`, so `pnpm install` rejects too-new versions
  and packages that lost publisher trust. Dependabot (`.github/dependabot.yml`)
  opens weekly updates after a 7-day cooldown.
- **CI only** (network-bound, so not in `verify`): `pnpm audit --prod
  --audit-level high` and zizmor on the workflows. Every action is pinned to a
  commit SHA (`$/` for local ones).
- **Vendored skills**: pinned to a commit in `skills-lock.json`. One
  exception: `modern-web-guidance` calls `npx modern-web-guidance@latest` at
  run time, outside `minimumReleaseAge` and the lockfile. Accepted because it
  only returns advisory guides to the agent; every gate stays deterministic
  ([ADR 0001](adr/0001-deterministic-gates-advisory-ai-layer.md)).
- **Agent shell guard**: a Claude Code `PreToolUse` hook
  (`scripts/agent-guard.ts`) blocks Bash commands that write to a protected
  path or skip the git hooks. Best-effort: it reads the command text.

## Suppressions

Tool-disable comments are forbidden, and two gates enforce it.
`no-warning-comments` rejects any comment containing `fallow-ignore`,
`oxlint-disable`, `eslint-disable`, or `prettier-ignore`. Because a file-wide
directive switches off every rule including that guard,
`scripts/lint-directives.test.ts` fails `pnpm test` on any such directive in
`src/`, `scripts/` and the root config files. Fix the finding instead of
silencing it.
