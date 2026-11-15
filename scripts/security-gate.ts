// Gates `fallow security`: every candidate must be accepted in security-accepted.json,
// counted per file and category so moved lines do not churn the list. Fallow has no
// per-finding config suppression, and lint bans inline suppression comments.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { makeBadge } from "badge-maker";

type Finding = { path: string; category: string };
// reason is optional here because the JSON is hand-edited; checkFindings rejects a missing one
type Entry = { count: number; reason?: string };
type Accepted = Record<string, Record<string, Entry>>;

const ACCEPTED_PATH = "security-accepted.json";
const BADGE_PATH = ".github/badges/security-accepted.svg";

const keyOf = (path: string, category: string) => `${path} ${category}`;

const entriesOf = (accepted: Accepted) =>
  Object.entries(accepted).flatMap(([path, categories]) =>
    Object.entries(categories).map(([category, entry]) => ({
      key: keyOf(path, category),
      ...entry,
    })),
  );

export const checkFindings = (findings: Finding[], accepted: Accepted): string[] => {
  const found = new Map<string, number>();
  for (const { path, category } of findings) {
    const key = keyOf(path, category);
    found.set(key, (found.get(key) ?? 0) + 1);
  }
  const entries = entriesOf(accepted);
  const allowed = new Map<string, number>(entries.map(({ key, count }) => [key, count]));
  const unexplained = entries
    .filter(({ reason }) => !reason?.trim())
    .map(({ key }) => `${key}: accepted without a reason`);
  return [...new Set([...allowed.keys(), ...found.keys()])]
    .filter((key) => found.get(key) !== allowed.get(key))
    .map(
      (key) =>
        `${key}: ${String(found.get(key) ?? 0)} found, ${String(allowed.get(key) ?? 0)} accepted`,
    )
    .concat(unexplained);
};

// The include list is a whitelist (needed to switch on hardcoded-secret), so a category
// a fallow upgrade adds would stay off without this check
export const missingCategories = (catalogue: string[], included: string[]) =>
  catalogue.filter((id) => !included.includes(id));

export const acceptedTotal = (accepted: Accepted) =>
  entriesOf(accepted).reduce((sum, { count }) => sum + count, 0);

const run = () => {
  const accepted = JSON.parse(readFileSync(ACCEPTED_PATH, "utf8")) as Accepted;
  if (process.argv.includes("--badge")) {
    const total = String(acceptedTotal(accepted));
    writeFileSync(BADGE_PATH, makeBadge({ label: "accepted risks", message: total }) + "\n");
    return;
  }
  const fallow = (args: string[]): unknown =>
    JSON.parse(execFileSync("fallow", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  const { security_findings } = fallow(["security", "--format", "json", "--quiet"]) as {
    security_findings: Finding[];
  };
  const { security_categories } = fallow(["schema"]) as {
    security_categories: { categories: { id: string }[] };
  };
  const config = JSON.parse(readFileSync(".fallowrc.json", "utf8")) as {
    security: { categories: { include: string[] } };
  };
  const missing = missingCategories(
    security_categories.categories.map(({ id }) => id),
    config.security.categories.include,
  );
  const errors = [
    ...missing.map((id) => `.fallowrc.json security.categories.include lacks ${id}`),
    ...checkFindings(security_findings, accepted),
  ];
  if (errors.length === 0) return;
  console.error(
    `Security gate failed. Fix the code; accepting a risk in ${ACCEPTED_PATH} needs human approval.\n` +
      errors.join("\n"),
  );
  process.exit(1);
};

// "".concat: vite-plus passes a non-string import.meta.url at runtime
if (process.argv[1] === fileURLToPath("".concat(import.meta.url))) run();
