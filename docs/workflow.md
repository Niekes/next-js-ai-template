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

## Setup

The idea-to-code flow uses [Matt Pocock's skills](https://github.com/mattpocock/skills),
plus [ponytail](https://github.com/DietrichGebert/ponytail) and Chrome's
[Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance),
all vendored in `.agents/skills/`, linked from `.claude/skills/` and pinned in
`skills-lock.json`. A fresh clone already has them. To add or update one,
use the owning CLI (never edit `.agents/**` by hand):

```bash
npx skills@latest add <owner/repo> -s <skill> -a codex -a claude-code -y
npx skills@latest update -p
```

`/setup-matt-pocock-skills` has already been run and its output committed:
issues live in GitHub Issues ([docs/agents/issue-tracker.md](agents/issue-tracker.md)),
and the domain docs are single-context ([docs/agents/domain.md](agents/domain.md)).
Run it again only to switch trackers. `/to-spec` and `/to-tickets` apply
the `ready-for-agent` label. A repo made from this template needs that
label once:

```bash
gh label create ready-for-agent --description "Ready for an agent to implement"
```

## Flow

1. **Grill** the idea with `/grill-with-docs`. It interviews you until the
   plan is shared, and records terms in `GLOSSARY.md` and decisions in
   `docs/adr/`.
2. **Fork** on size:
   - Fits one session: go straight to step 4.
   - Needs several: `/to-spec` turns the conversation into a spec issue,
     then `/to-tickets` slices it into vertical-slice issues, each sized
     for one context window and listing its blockers.
3. **Clear context** (`/clear`) before each ticket. A fresh window keeps
   the agent sharp.
4. **Implement** with `/implement <ticket>`. It builds test-first with
   `/tdd`, reviews in a sub-agent with `/code-review`, then commits.
   Scaffold new code with `pnpm gen component|feature <name>`, and make
   sure `pnpm verify` passes before the commit. Repeat 3 and 4 for each
   unblocked ticket.
5. **Open a PR** (see [Pull requests](#pull-requests)).

Side skills for when the main flow is not the right fit: `/grilling`
(stress-test a plan without touching docs), `/prototype` (throwaway answer
to a design question), `/research`, `/diagnosing-bugs`, `/codebase-design`
and `/security-audit`.

Three review skills, three angles: `/code-review` checks the change against
the repo's standards and the ticket, `/fallow-review` ranks it by blast
radius on the import graph, and `/ponytail-review` asks whether it is
correct under load, tested where risky, and whether every line is needed.

Recurring audits (`/security-audit`, `/ponytail-audit`, `/ponytail-debt`,
`pnpm fallow:full`) and their rhythm are listed in the
[README](../README.md#recurring-maintenance).

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
