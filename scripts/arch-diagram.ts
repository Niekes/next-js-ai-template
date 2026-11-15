import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { projectGraph } from "archunit";

import { pumlToMermaid } from "../src/lib/architecture/puml";

const REPORTS = "reports";
const PUML_PATH = "docs/architecture.puml";

const main = async () => {
  const graph = projectGraph().titled("Architecture").focusOn("src/**").collapseToFolderDepth(2);

  mkdirSync(REPORTS, { recursive: true });
  await graph.exportAsHTML(`${REPORTS}/dependency-graph.html`);
  await graph.exportAsDOT(`${REPORTS}/dependency-graph.dot`);

  const actual = await graph.toMermaid();
  const target = pumlToMermaid(readFileSync(PUML_PATH, "utf8"));
  writeFileSync(`${REPORTS}/dependency-graph.mmd`, actual);
  writeFileSync(`${REPORTS}/target-architecture.mmd`, target);

  const summary = [
    "## Architecture diagrams",
    "",
    "### Actual dependencies",
    "",
    "```mermaid",
    actual,
    "```",
    "",
    "### Documented target",
    "",
    "```mermaid",
    target,
    "```",
    "",
  ].join("\n");

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  } else {
    process.stdout.write(summary);
  }
};

void main();
