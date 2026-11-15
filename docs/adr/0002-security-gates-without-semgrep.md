# 0002 — Security gates without Semgrep

- Status: accepted
- Date: 2026-11-15 (adopted from the project this template was extracted from)

## Context

AI agents write much of the code. They tend to add a route without an auth
check, turn off a check to get past an error, or quiet a finding instead of
fixing it. Semgrep Community Edition (CE) was evaluated as a security gate on
the project this template comes from. CE's taint analysis stays inside one
file, while a URL typically arrives in a route handler and is requested in a
`src/lib/` module, so it could not catch SSRF there. Fallow, already in use,
ships `fallow security`, which follows the import graph across files for
SSRF, open redirects, raw HTML and SQL, PII in logs, server env leaking into
client code, and hardcoded secrets.

## Decision

No Semgrep. Each kind of rule goes to the tool that already fits it:

- Risky sinks: `fallow security` with every category on, gated by
  `pnpm security` (`scripts/security-gate.ts`). Inline suppressions are
  banned, so accepted candidates live in `security-accepted.json`, counted
  per file and category, each with a reason.
- Single-node syntax bans: `local/no-restricted-syntax` in Oxlint, such as
  `rejectUnauthorized: false`.
- Project invariants: architecture tests in `src/lib/architecture/`, such as
  "every API route handler is wrapped in `withAdmin*` or checks `getUser()`
  first".

Agents get an approval prompt before editing the gate files, the accepted
list, the architecture tests and the agent configs themselves.

## Consequences

- One toolchain stays Node-only; no Python in CI.
- No file is exempt from the TLS ban; an exemption is a file override in
  `vite.config.ts`, and `security-wiring.test.ts` fails until it is pinned there.
- Fallow reports candidates, not proof, and has blind spots (for example a
  `fetch` reached through an alias). Its findings need triage.
- Revisit Semgrep when a rule needs context that neither Oxlint nor an
  architecture test can express, or when cross-file taint (Semgrep Pro or
  similar) becomes worth paying for.
