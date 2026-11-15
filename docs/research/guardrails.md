# Guardrails research: tool-enforced gaps

Date: 2026-11-15. Scope: guardrails this repo does not have yet, checked against
what is already wired (`pnpm verify`, `.github/workflows/ci.yml`, `.husky/*`,
`src/lib/architecture/*.test.ts`, `.claude/settings.json`, `opencode.json`,
`scripts/security-gate.ts`). Every claim about a tool cites a primary source.

## Summary

The code-level gates are strict already. The real gaps are around the code:
the CI pipeline itself (unpinned actions, default token permissions), the
supply chain (no update bot, no advisory check, `pnpm-workspace.yaml` is
unprotected), the shell hole in agent permissions that ADR 0001 admits, and a
few runtime defaults (env validation that never throws, no security headers,
in-memory auth rate limits). Server Actions also fall outside
`route-auth.test.ts`. Most fixes are small and fit the existing pattern:
config, plus a pin in `security-wiring.test.ts` so the gate cannot be
quietly loosened.

## Ranked recommendations

| #   | Guardrail                                                                                                      | Gap in this repo                                                                                                                                                                | Tool                                                                  | Effort       | Verdict                           |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------ | --------------------------------- |
| 1   | Ban or auth-check Server Actions                                                                               | `route-auth.test.ts` scans only `src/app/api/**/route.*`. A `"use server"` file (none exist yet) would be a public POST endpoint with no check.                                 | `local/no-restricted-syntax` entry in `scripts/lint-plugin.mjs`       | S            | adopt                             |
| 2   | Harden GitHub Actions                                                                                          | `ci.yml` and `.github/actions/setup/action.yml` pin by tag (`actions/checkout@v5`, `pnpm/action-setup@v5`, ...). No top-level `permissions:`. `checkout` keeps its credentials. | zizmor, SHA pins or `actions.lock`, `permissions: contents: read`     | S            | adopt                             |
| 3   | Supply-chain settings, pinned                                                                                  | `pnpm-workspace.yaml` has `allowBuilds` but no `trustPolicy`, relies on the implicit non-strict `minimumReleaseAge`, and needs no approval to edit.                             | pnpm settings + `security-wiring.test.ts`                             | S            | adopt                             |
| 4   | Dependency updates and advisories                                                                              | No `.github/dependabot.yml`. No `pnpm audit` anywhere.                                                                                                                          | Dependabot (npm/pnpm + github-actions, cooldown), `pnpm audit --prod` | S            | adopt                             |
| 5   | Agent shell guard                                                                                              | AGENTS.md / ADR 0001 amendment: `sed -i`, `cat >` and scripts bypass the protected-path rules.                                                                                  | Claude Code `PreToolUse` hook on `Bash` (+ opencode plugin)           | M            | adopt                             |
| 6   | Fail fast on bad env at boot                                                                                   | `src/lib/env.ts` falls back to raw `process.env` on invalid values (its own `shortcut:` comment).                                                                               | `src/instrumentation.ts` `register()`                                 | S            | adopt                             |
| 7   | Migration drift + consistency                                                                                  | Nothing checks that `src/lib/db/migrations/` matches `src/lib/db/schema/`, or that migration history is consistent.                                                             | `drizzle-kit generate` + `git diff --exit-code`, `drizzle-kit check`  | S            | adopt                             |
| 8   | Security headers                                                                                               | `next.config.ts` has no `headers()`; `x-powered-by` is on by default.                                                                                                           | `next.config.ts` `headers()`, `poweredByHeader: false` + test         | S            | adopt                             |
| 9   | Shared auth rate-limit storage                                                                                 | `src/lib/auth.ts` sets no `rateLimit`, so it uses in-memory storage, which is per process (`output: "standalone"`, any replica count).                                          | Better Auth `rateLimit.storage: "database"`                           | S            | adopt                             |
| 10  | Secret scanning beyond `src/`                                                                                  | `fallow security` `hardcoded-secret` reads source files. YAML, `.env.example`, docs and git history are not checked.                                                            | GitHub secret scanning + push protection                              | S (settings) | adopt (settings); gitleaks: maybe |
| 11  | Destructive-migration lint                                                                                     | Nothing flags `DROP COLUMN`, locking `ALTER`s or non-concurrent indexes in generated SQL.                                                                                       | squawk (`squawk-cli` on npm)                                          | M            | maybe                             |
| 12  | Cross-file SAST                                                                                                | Engages ADR 0002: Fallow has blind spots, and Semgrep CE is single-file.                                                                                                        | CodeQL default setup                                                  | S (settings) | maybe                             |
| 13  | Mutation testing                                                                                               | docs/quality.md: "a test that only renders does not count" is prose. 100 % coverage can be met by assertion-free tests.                                                         | StrykerJS + vitest runner, scheduled                                  | M–L          | maybe                             |
| 14  | Strict CSP (nonce)                                                                                             | Follows #8. Needs dynamic rendering everywhere.                                                                                                                                 | `src/proxy.ts` nonce CSP                                              | M            | maybe                             |
| —   | Branch-protection check, OSV-Scanner, trufflehog, Semgrep, bundle budgets, extra tsconfig flags, lockfile-lint | see "Skipped and why"                                                                                                                                                           | —                                                                     | —            | skip                              |

## Adopt

### 1. Server Actions cannot slip past the auth gate

Next.js: an exported Server Action "is reachable via a direct POST request,
not just through your application's UI", and "a page-level authentication
check does not extend to the Server Actions defined within it" [nextjs-data].
`route-auth.test.ts` only parses `route.*` files, and `src/proxy.ts` only
matches `/dashboard/:path*`.

Cheapest gate: one `RESTRICTED_SYNTAX` entry in `scripts/lint-plugin.mjs`
that bans the directive (`ExpressionStatement[directive='use server']`, which
matches both file-level and inline directives), with a message pointing to
API routes + `withAdmin*`/`getUser()`. Pin the selector in
`security-wiring.test.ts` the way `TLS_SELECTOR` is pinned, because
`lint-plugin.mjs` needs no approval. If Server Actions are wanted later,
replace the ban with a `route-auth`-style test over `"use server"` modules.
This runs in `pnpm lint`, so it is already in verify, pre-commit and CI.

### 2. GitHub Actions hardening

- GitHub recommends pinning actions to a full commit SHA, because tags can be
  moved, and setting `GITHUB_TOKEN` to read-only by default, then raising it
  per job [gh-secure-use]. Today `ci.yml` has no top-level `permissions:`,
  and only `badges` declares `contents: write`.
- A repo-level Actions policy can require SHA pinning: unpinned actions then
  fail [gh-sha-policy]. Alternatively, a workflow lockfile at
  `.github/workflows/actions.lock` (from the `gh actions-lock` extension)
  locks transitive action dependencies too, and GitHub calls it the strongest
  protection, superseding SHA pinning [gh-actions-lock]. It does not cover
  reusable-workflow calls [gh-actions-lock].
- zizmor statically audits workflows. Its audits include `unpinned-uses`,
  `excessive-permissions`, `artipacked` (checkout credentials persisted to
  disk), `cache-poisoning` and `template-injection` [zizmor-audits]. The
  official action is `zizmorcore/zizmor-action`, and `--format=github`
  works without SARIF/Advanced Security [zizmor-integrations]. zizmor ships
  via PyPI/cargo/brew/Docker, not npm [zizmor-install]. So it runs only in CI
  (as an action), not in `pnpm verify`. That fits ADR 0002's "no Python in
  CI", since the action runs the binary.

Plug-in: add `permissions: contents: read` at the top of `ci.yml`, add
`persist-credentials: false` to the checkouts that do not push, pin SHAs (or
adopt `actions.lock`), add a `zizmor` job, and turn on the SHA-pinning policy
in repo settings. Extend `security-wiring.test.ts` to assert that every
`uses:` in `.github/**` matches `@[0-9a-f]{40}` and that `ci.yml` declares
top-level `permissions`. That makes it a `pnpm test` gate too. Files are on
the approval list, so a human applies this.

### 3. Supply-chain settings in `pnpm-workspace.yaml`, pinned by a test

pnpm (this repo: 12.14.0) defaults, per [pnpm-resolution] and [pnpm-build]:

- `minimumReleaseAge` defaults to 1440 minutes, but the built-in default is
  **non-strict**: pnpm falls back to a too-new version when nothing older
  matches. Setting the value explicitly makes it strict by default
  (`minimumReleaseAgeStrict`).
- `trustPolicy` defaults to `off`. `no-downgrade` fails an install when a
  package's trust evidence drops (for example, trusted publisher → none),
  the pattern of a hijacked maintainer account.
- `blockExoticSubdeps` (default `true`) and `strictDepBuilds` (default
  `true`, so any package with unreviewed build scripts fails install) are
  already on. `allowBuilds` is already used.

Plug-in: add `minimumReleaseAge: 1440` (or higher) and
`trustPolicy: no-downgrade` to `pnpm-workspace.yaml`. Then close the real
hole: `pnpm-workspace.yaml` (where `allowBuilds`, `overrides` and these
settings live) is not on the AGENTS.md approval list, not in
`.claude/settings.json` / `opencode.json` `ask`, and not in CODEOWNERS. Add it
to all four (`security-wiring.test.ts` already checks that the lists agree),
and assert the two settings in `security-wiring.test.ts`. CI's
`pnpm install --frozen-lockfile` then enforces them.

### 4. Dependabot + `pnpm audit`

- Dependabot supports pnpm v7–v12 under `package-ecosystem: npm`, for both
  version and security updates [dependabot-ecosystems]. It also supports
  `github-actions`, which keeps the SHA pins from #2 current. `cooldown`
  delays version updates (default 3 days, per-semver keys). It does not apply
  to security updates [dependabot-options]. When it bumps an action, it also
  regenerates the `actions.lock` entry [gh-actions-lock].
- `pnpm audit` queries the registry's bulk advisory endpoint and exits 1 at
  or above `--audit-level`. `--prod` limits it to runtime deps, ignores go in
  `audit.ignore` (GHSA IDs) in `pnpm-workspace.yaml`, and
  `--ignore-registry-errors` avoids failing on registry outages [pnpm-audit].

Plug-in: `.github/dependabot.yml` with `npm` + `github-actions` (+ `docker`
for the `Dockerfile` base image), weekly, grouped, with a cooldown that is at
least `minimumReleaseAge`. Add a CI step `pnpm audit --prod --audit-level high`.
Keep it out of `pnpm verify` and the hooks: it needs the network and fails on
advisories that have nothing to do with the change, which would block
unrelated commits. Any `audit.ignore` entry goes through the same human
approval as `security-accepted.json` (#3 covers the file).

### 5. Agent shell guard (Claude Code hook + opencode plugin)

Claude Code `PreToolUse` hooks with `matcher: "Bash"` receive
`tool_input.command` on stdin, and exiting 2 blocks the call with stderr as
the reason. Alternatively, print `permissionDecision: "deny"`. A hook can deny
but cannot approve by staying silent [cc-hooks]. Note: `PostToolUse` on
`Edit|Write` does not fire when Bash rewrites a file [cc-hooks], which is
exactly the gap.

Plug-in: `scripts/agent-guard.ts` (with a colocated test, so it falls under
the coverage gate) reads the command and blocks writes that name a protected
or approval-list path: redirection (`>`, `>>`, `tee`), `sed -i`, `mv`/`cp`/`rm`
onto them, `git checkout --`/`git restore` on them, `--no-verify`, and
`HUSKY=0`. Path lists are imported from one place and checked against the
AGENTS.md list by `security-wiring.test.ts`. Register it in
`.claude/settings.json` under `hooks.PreToolUse`. opencode has project plugins
in `.opencode/plugins/` [opencode-plugins]. A `tool.execute.before` hook that
throws to block a shell call appears in community plugins, but I could not
confirm it in opencode's primary docs (see "Unverified").

Be honest about the limit. Matching on the command string is best-effort:
`node -e`, a generated script or base64 gets past it. It turns accidental
bypasses into blocks. It does not stop a determined agent. CODEOWNERS review
and CI stay the backstop, as ADR 0001 says. Amend ADR 0001 rather than claim
more. A `Stop` hook can block the agent from finishing (`decision: "block"`)
[cc-hooks], so it could run `pnpm typecheck && pnpm lint` before an agent
ends a turn. Keep that optional: full `verify` is too slow for every stop.

### 6. Env validation that throws at boot

`register()` in `src/instrumentation.ts` is called once when a server instance
starts, and must finish before requests are served [nextjs-instrumentation].
It is a server-start hook, so `next build` with placeholder env is unaffected.

Plug-in: in `register()`, when `NEXT_RUNTIME === "nodejs"`, parse
`process.env` with the existing `envSchema` (export it from `src/lib/env.ts`)
and throw on failure. That resolves the `shortcut:` in `env.ts` without
breaking builds or tests. Add one test for throw/no-throw. Whether the
fallback in `env.ts` can then be deleted depends on build-time imports; I did
not verify that.

### 7. Migration drift and history check

`drizzle-kit generate` diffs the schema against the last JSON snapshot in the
migrations folder, with no DB connection [drizzle-generate]. `drizzle-kit
check` checks the consistency of the generated migration history, aimed at
schema changes on parallel branches [drizzle-check].

Plug-in: CI step `pnpm db:generate && git diff --exit-code src/lib/db/migrations`
(fails when someone edited the schema without generating, or hand-edited
SQL), plus `pnpm exec drizzle-kit check`. `drizzle.config.ts` throws without
`POSTGRES_URL`, so give the step the same placeholder the `build` job uses.
`generate` can prompt on renames [drizzle-generate]. With no schema change it
has nothing to ask, but an un-generated rename would hang CI until the job
timeout (10 min). Either way that is a failure. Can go in `pnpm verify` too:
both are offline and fast.

### 8. Baseline security headers

Next.js serves `x-powered-by` unless `poweredByHeader: false`
[nextjs-poweredby]. Static headers go in `next.config.ts` `headers()`, which
is also the documented place for a CSP without nonces [nextjs-csp].

Plug-in: `poweredByHeader: false` plus `headers()` for `source: "/(.*)"` with
`X-Content-Type-Options: nosniff`, `Referrer-Policy`,
`Frame-Options`/`frame-ancestors 'none'`, `Strict-Transport-Security`, and the
docs' non-nonce CSP (`object-src 'none'; base-uri 'self'; form-action 'self';
frame-ancestors 'none'`). Add a test that imports `next.config.ts`, calls
`headers()` and asserts each header. That is a `pnpm test` gate, the same
pattern `security-wiring.test.ts` uses for `vite.config.ts`.

### 9. Auth rate limits that survive more than one process

Better Auth enables rate limiting in production only (default 100 requests
per 10 s, `/sign-in/email` 3 per 10 s). Default storage is memory, which the
docs flag as unsuitable for many uses, especially serverless. `storage:
"database"` uses a `rateLimit` table [better-auth-rate-limit].

Plug-in: `rateLimit: { storage: "database" }` in `src/lib/auth.ts`, add the
table to `src/lib/db/schema/auth.ts`, run `pnpm db:generate`, and assert the
option in `src/lib/auth.test.ts`. The limiter applies to Better Auth's own
endpoints. `/api/notes` and `/api/admin/users` get no limit from it (that is
my reading of the docs, not a stated guarantee).

### 10. Secret scanning (GitHub settings)

User-level push protection is on by default and stops pushes of secrets to
public repos. Repository-level push protection is off by default, and private
repos need GitHub Secret Protection [gh-push-protection]. This is settings,
not code. Add it to README step 4 next to the ruleset instruction.

gitleaks: MIT, but a Go binary with no npm package. `gitleaks-action` needs a
(free) license key for organisations. The author calls gitleaks "feature
complete", with security patches only from now on [gitleaks], [gitleaks-action].
It breaks the Node-only toolchain of ADR 0002 for the pre-commit hook. Verdict:
maybe, as a CI-only Docker step if the repo is private without Secret
Protection.

## Maybe

### 11. squawk on generated SQL

squawk lints Postgres migrations (rules such as `ban-drop-column`,
`adding-not-nullable-field`, `require-concurrent-index-creation`). It ships
on npm as `squawk-cli`, and also as Docker and an action [squawk]. It stays in
the Node toolchain. Run it only on migrations added since the merge base
(`git diff --name-only origin/main -- src/lib/db/migrations/*.sql`), or old
migrations fail forever. Worth it once the template backs a deployed DB.
Until then most findings are noise on an empty schema. Not verified: how
squawk handles drizzle's `--> statement-breakpoint` comments.

### 12. CodeQL default setup (engaging ADR 0002)

ADR 0002 rejected Semgrep CE because its taint stays inside one file, and it
says to revisit "when cross-file taint ... becomes worth paying for". CodeQL's
global data flow follows values "between functions and through object
properties" across the program [codeql-dataflow]. Default setup needs no
config for JavaScript/TypeScript and is available for public repos, or with
GitHub Code Security on private ones [codeql-default]. It runs in GitHub, not
in `pnpm verify`, so it adds no toolchain, but it also is not part of the
"one command" gate: it is a second opinion next to `fallow security`, not a
replacement. Adopt if the repo is public (no cost). Skip on private repos
unless Code Security is already paid for. Record it as an ADR 0002 amendment
either way.

### 13. Mutation testing (StrykerJS)

`@stryker-mutator/vitest-runner` runs Vitest with per-test coverage and
supports incremental mode [stryker-vitest]. `thresholds.break` makes Stryker
exit 1 below a score, and incremental results go to
`reports/stryker-incremental.json` [stryker-config]. This is the only tool
that enforces "a test must assert an observable outcome". Run it on a
schedule or for changed files only. A full run on every push is too slow.
Not verified: whether it works through `vp test` / `vite-plus`'s Vitest
wrapper (`vitest.config.ts` uses `defineConfig` from `vite-plus`). Prototype
before adopting.

### 14. Nonce-based strict CSP

Nonce CSP is generated in `proxy.ts`, requires dynamic rendering for all
pages, disables static optimisation/ISR, and is incompatible with PPR.
Experimental SRI is the static alternative [nextjs-csp]. The repo's
`src/proxy.ts` matcher would have to widen from `/dashboard/:path*` to all
pages. Do #8 first. Take this only if the app handles sensitive data.

## Skipped and why

- **Semgrep**: ADR 0002 rejected it for single-file taint. Nothing here
  changes that reasoning. CodeQL (#12) is the cross-file option the ADR
  anticipated.
- **Branch protection as a test**: rulesets (required checks, code-owner
  review, block force pushes) [gh-rulesets] are repo settings. Checking them
  from CI needs an admin-scoped token, which a template should not ship. Keep
  README step 4. Note: the rulesets page says they are available on GitHub
  Team/Enterprise [gh-rulesets-about]; I could not confirm Free-plan public-repo
  support from that page.
- **OSV-Scanner**: reads `pnpm-lock.yaml` [osv-lockfiles], but it is a Go
  binary overlapping `pnpm audit` + Dependabot alerts (#4).
- **trufflehog**: Go binary, same role as #10.
- **lockfile-lint**: `--frozen-lockfile` in CI, `blockExoticSubdeps` (default
  on) and `trustPolicy` (#3) cover it [pnpm-resolution].
- **Bundle-size budgets**: almost no client code yet. Next.js has no built-in
  budget, so it would be a new dependency guarding nothing.
- **More tsconfig flags**: TypeScript 6 already defaults `strict` and
  `noUncheckedSideEffectImports` to true [ts6], and `tsconfig.json` adds
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and more. What is
  left (`noPropertyAccessFromIndexSignature` [ts-npafis]) is style, not
  safety.
- **PostToolUse format-on-edit hook**: `vp staged` in pre-commit already
  formats. A hook adds latency for no new guarantee.

## Unverified

- opencode `tool.execute.before` blocking semantics: only community sources,
  not opencode's primary docs.
- Whether `drizzle-kit check` needs a DB connection (docs silent).
  `drizzle.config.ts` needs `POSTGRES_URL` set regardless.
- Stryker compatibility with `vite-plus`'s Vitest wrapper.
- squawk parsing of drizzle `statement-breakpoint` comments.
- Rulesets on GitHub Free for public repos (fetched page named only
  Team/Enterprise).
- Whether Better Auth's limiter covers non-auth routes (docs describe its own
  endpoints only).

## Sources

- [nextjs-data] https://nextjs.org/docs/app/guides/data-security
- [nextjs-csp] https://nextjs.org/docs/app/guides/content-security-policy
- [nextjs-poweredby] https://nextjs.org/docs/app/api-reference/config/next-config-js/poweredByHeader
- [nextjs-instrumentation] https://nextjs.org/docs/app/guides/instrumentation
- [gh-secure-use] https://docs.github.com/en/actions/reference/security/secure-use
- [gh-sha-policy] https://github.blog/changelog/2025-08-15-github-actions-policy-now-supports-blocking-and-sha-pinning-actions/
- [gh-actions-lock] https://docs.github.com/en/actions/concepts/security/workflow-dependency-lockfiles
- [gh-push-protection] https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection
- [gh-rulesets] https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- [gh-rulesets-about] https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- [dependabot-ecosystems] https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories
- [dependabot-options] https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference
- [codeql-default] https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning
- [codeql-dataflow] https://codeql.github.com/docs/writing-codeql-queries/about-data-flow-analysis/
- [zizmor-audits] https://docs.zizmor.sh/audits/
- [zizmor-integrations] https://docs.zizmor.sh/integrations/
- [zizmor-install] https://docs.zizmor.sh/installation/
- [pnpm-resolution] https://pnpm.io/settings/dependency-resolution
- [pnpm-build] https://pnpm.io/settings/build
- [pnpm-audit] https://pnpm.io/cli/audit
- [cc-hooks] https://code.claude.com/docs/en/hooks
- [opencode-plugins] https://opencode.ai/docs/plugins/
- [better-auth-rate-limit] https://www.better-auth.com/docs/concepts/rate-limit
- [drizzle-generate] https://orm.drizzle.team/docs/drizzle-kit-generate
- [drizzle-check] https://orm.drizzle.team/docs/drizzle-kit-check
- [squawk] https://squawkhq.com/docs/
- [gitleaks] https://github.com/gitleaks/gitleaks
- [gitleaks-action] https://github.com/gitleaks/gitleaks-action
- [osv-lockfiles] https://google.github.io/osv-scanner/supported-languages-and-lockfiles/
- [stryker-vitest] https://stryker-mutator.io/docs/stryker-js/vitest-runner/
- [stryker-config] https://stryker-mutator.io/docs/stryker-js/configuration/
- [ts6] https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
- [ts-npafis] https://www.typescriptlang.org/tsconfig/#noPropertyAccessFromIndexSignature
