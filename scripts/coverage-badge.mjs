import fs from "node:fs";
import { makeBadge } from "badge-maker";

const summaryPath = "coverage/coverage-summary.json";

if (!fs.existsSync(summaryPath)) {
  console.error(`Missing ${summaryPath} — run: pnpm test --coverage`);
  process.exit(1);
}

const { lines } = JSON.parse(fs.readFileSync(summaryPath, "utf8")).total;
const color =
  lines.pct >= 90
    ? "brightgreen"
    : lines.pct >= 80
      ? "green"
      : lines.pct >= 70
        ? "yellowgreen"
        : lines.pct >= 60
          ? "yellow"
          : lines.pct >= 50
            ? "orange"
            : "red";

fs.mkdirSync(".github/badges", { recursive: true });
fs.writeFileSync(
  ".github/badges/coverage.svg",
  makeBadge({ label: "coverage", message: `${lines.pct}%`, color }) + "\n",
);
console.log(`coverage badge: ${lines.pct}% (${lines.covered}/${lines.total} lines)`);
