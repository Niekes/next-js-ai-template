---
name: customize-template
description: Turn this Next.js AI Template into the user's own project - rename it, make them the owner, remove the template's star and sponsor promotion, optionally delete the notes example. Run by the user as /customize-template.
disable-model-invocation: true
---

# Customize the template

The checklist is the **Steps** section below, and it is the only copy. If
the code and the list disagree, fix the list in the same change.

This skill only makes the template the user's own. It does not scaffold
features; point the user at `pnpm gen` and `/grill-with-docs` for that.

## 1. Interview

Ask everything in one round, each with a suggested answer:

1. Project name (kebab-case for `package.json`) and display title.
2. One-sentence description.
3. GitHub owner (user or org) and repository name.
4. Funding: own GitHub Sponsors account for `.github/FUNDING.yml`, or delete it?
5. Keep the notes example as a reference for now, or delete it?

Wait for the answers. Do not guess them from git config or the remote.

## 2. Apply the list

Work through the [Steps](#steps) in order, with these rules per step:

- **Use this template**: already done if you are running here. Skip it.
- **Remove the template's promotion**: also drop the top-of-README nav links
  to removed sections. Point every remaining `next-js-ai-template` GitHub URL
  of the template owner (match case-insensitively) at the user's repo.
- **Glossary**: do not invent domain terms. Remove **Note** only if the notes
  example is deleted, then tell the user to run `/grill-with-docs` on their
  first feature to fill `GLOSSARY.md`.
- **CODEOWNERS and ruleset**: never create the GitHub ruleset yourself; print
  the steps (or the `gh api` command) for the user to run.
- **Notes example**: only if the user asked to delete it. Generate the
  migration with `pnpm db:generate`; never hand-edit `src/lib/db/migrations/**`.

Before writing any file on the "Edit only with human approval" list in
`AGENTS.md` (`.github/CODEOWNERS`, `.github/workflows/**` …), show the exact
diff and wait for an explicit yes. Never touch the "Never edit by hand" paths
or `.env`.

## 3. Finish

Run `pnpm verify` and fix what fails. Then report: what changed, what the
user still has to do by hand (ruleset, GitHub Sponsors profile), and that
this skill can be deleted (`.claude/skills/customize-template/` and its line
in `AGENTS.md`, plus the `/customize-template` mentions in `README.md` and
`docs/workflow.md`).

## Steps

1. Click **Use this template** on GitHub (or `pnpm create next-app -e <repo-url>`).
2. Rename the package in `package.json`, the title and description in
   `src/app/layout.tsx`, the heading in `src/app/page.tsx` (and in
   `src/app/page.test.tsx`), and the title and description at the top of
   `README.md` and `AGENTS.md`.
3. Remove the template's promotion: the star and sponsor line in
   `src/app/page.tsx` (and its test), and in the README the sponsor badges,
   the star badge, the "kept alive by … sponsor" line, the Sponsor nav link,
   the Sponsor and Sponsors sections and Star History. Point
   `.github/FUNDING.yml` at your own account or delete it, and point the CI
   badge URL at your repository.
4. Replace the terms in `GLOSSARY.md` with your domain's.
5. Put your GitHub user or team in `.github/CODEOWNERS`, then protect `main`
   with a ruleset that requires a pull request with code-owner review, so gate
   changes need a human. Add "GitHub Actions" to the ruleset's bypass list,
   or the CI job that commits the README badges to `main` cannot push.
6. Keep the notes example as a reference until your first feature exists, then
   delete it (`src/features/notes/`, `src/lib/db/schema/notes.ts`,
   `src/app/api/notes/`, `src/app/dashboard/notes/`). Also remove what shared
   code keeps for it: the `./notes` export in `src/lib/db/schema/index.ts`, the
   `notes` key in `src/lib/query-keys.ts`, and `ROUTES.notes` in
   `src/const/routes.ts`, whose users (the home page link and the after-sign-in
   default in `src/lib/forms.ts`) should point at your feature instead. Update
   the tests that name notes (`src/lib/forms.test.ts`,
   `src/lib/db/drizzle.test.ts`, `src/lib/db/schema/schema.test.ts`). Then run
   `pnpm db:generate` and `pnpm verify`.
