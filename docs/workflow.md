# Workflow

## Before committing

```bash
pnpm verify
```

`verify` is the one gate: typecheck, lint, tests with coverage thresholds,
the changed-file Fallow audit, dead code, the security gate and the build.
CI runs the same scripts. Fix any finding before committing.

Hooks run the fast part locally: pre-commit runs `vp staged`, typecheck and
`fallow:check`; pre-push runs `pnpm test --coverage`, `pnpm fallow` and
`pnpm security`. The audit compares against the merge-base with
`origin/main`, so run `git fetch origin main` if it reports a stale base.

## From idea to code

1. **Stress-test** the idea with `/grilling`, or `/grill-with-docs` when
   domain terms matter (it records terms in `GLOSSARY.md` and decisions in
   `docs/adr/`).
2. **Scaffold** with `pnpm gen component <name>` or `pnpm gen feature <name>`.
3. **Build test-first** with `/tdd`.
4. **Review** with `/code-review` or `/fallow-review`, then `pnpm verify`.

## Commits

Conventional Commits:

```
fix(notes): reject empty note text
feat(auth): add passkey sign-in

Body explains what and why, wrapped at 72 chars.
```

Imperative mood, max 50-char subject, no trailing period. `BREAKING CHANGE:`
footer for breaking changes.

## Pull requests

Keep PRs focused on one change. Ensure `pnpm verify` is green before opening.
Describe the motivation, the approach, and any migration or env-var impact.
Use `.github/pull_request_template.md`.
