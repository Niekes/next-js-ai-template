---
name: customize-template
description: Turn this Next.js AI Template into the user's own project - rename it, make them the owner, remove the template's star and sponsor promotion, optionally delete the notes example. Run by the user as /customize-template.
disable-model-invocation: true
---

# Customize the template

The checklist is the **"Make it yours"** section of `README.md`. Read it
first and follow it in order. Do not keep your own copy of the steps: if the
code and the list disagree, fix the list in the same change.

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

Work through "Make it yours", with these rules per step:

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
