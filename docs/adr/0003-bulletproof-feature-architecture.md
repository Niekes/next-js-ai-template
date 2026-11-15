# 0003 — Bulletproof feature architecture

- Status: accepted
- Date: 2026-11-15

## Context

The template started with three zones: `app`, `shared` and `root`. A feature
spread across `app/`, `lib/db/`, `lib/hooks/` and `lib/`, so nothing kept
features apart, and `lib/` grew into a place for everything. Projects built
from the template had the bulletproof-react docs as an MCP server, but no tool
checked the structure, so the code did not follow it (see ADR 0001: written
rules hold only some of the time).

## Decision

Adopt the bulletproof-react layering, enforced by tools:

- Imports flow one way: **shared → features → app**. Fallow's `autoDiscover`
  gives each folder under `src/features/` its own zone, so features cannot
  import each other. Features are composed only in `app/`.
- A feature holds only `api/`, `components/`, `hooks/`, `server/`, `types/`
  and `utils/`, has no barrel files, and its client code never imports its
  `server/`. `src/lib/architecture/features.test.ts` checks all three.
- `app/` stays thin: pages frame feature components, route handlers check auth
  and call the feature's `server/`.
- Two parts stay shared on purpose: the Drizzle schema in `src/lib/db/schema/`
  (drizzle-kit generates migrations from one schema) and the `queryKeys` store
  in `src/lib/query-keys.ts` (one place lists every cache key).

The MCP servers both agents use are now pinned in `.mcp.json` and
`opencode.json`, and `mcp-wiring.test.ts` fails if the two lists differ. This
gates the configuration only: whether an agent calls a server stays advisory,
as ADR 0001 says.

## Consequences

- A feature that needs another feature's code forces a decision: move the code
  to shared, or compose both in `app/`.
- `server/` is kept out of client code by a path check, not by the
  `server-only` package, which would need a test-environment alias.
- Moving back to a flat layout means undoing the zones, the tests and every
  feature folder, so this is costly to reverse.
