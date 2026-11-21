# 0004 — Typed errors without Effect

- Status: accepted
- Date: 2026-11-21

## Context

Effect (effect.ts) was considered for typed errors. It also brings dependency
injection, retries, concurrency and its own schema library, none of which a
route that makes one database call needs. Adopting it changes every function
signature, needs an adapter at every Next.js and TanStack Query boundary, and
AI agents write it far less reliably than plain TypeScript. Half-adopting it
does not work.

## Decision

No Effect. Errors the caller is meant to handle (validation, auth, domain
rules) are returned as a discriminated union (`{ ok: true, … } | { ok: false, … }`),
as `parseBody` does. Unexpected failures (database down, bugs) are thrown
and logged in one place (`onRequestError`). No route catches them. No Result library.

## Consequences

- Revisit when a feature really needs what Effect is built for: many
  dependent I/O steps with retries, timeouts or cancellation.
