import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vite-plus/test";

import { parsePuml, pumlToMermaid } from "./puml";

// docs/architecture.puml is the single source of truth for the zone matrix.
// These tests keep the two derived copies honest: the mermaid block in
// docs/architecture.md and the zones/rules in .fallowrc.json. Edit the puml
// first; the failures below then name exactly what needs updating.

const ROOT = path.resolve(__dirname, "../../..");
const PUML = readFileSync(path.join(ROOT, "docs/architecture.puml"), "utf8");
const DOC = readFileSync(path.join(ROOT, "docs/architecture.md"), "utf8");

type Zone = { name: string; patterns: string[]; root: string };
type Rule = { from: string; allow: string[] };
type FallowConfig = {
  boundaries: { zones: Zone[]; rules: Rule[] };
};

const fallow = JSON.parse(readFileSync(path.join(ROOT, ".fallowrc.json"), "utf8")) as FallowConfig;

// Zone patterns that are diagram slices: `src/<segment>/**` maps to the puml
// node of the same name. The patterns below are the documented exceptions:
// root entry points, which the diagram test does not cover, and only in
// the zone named for them.
const patternToNode = (pattern: string): string | undefined =>
  pattern.match(/^src\/([^/*]+)\/\*\*$/)?.[1];

const NON_SLICE_PATTERNS: Record<string, string> = {
  "src/proxy.ts": "root",
  "src/instrumentation.ts": "root",
};

const diagram = parsePuml(PUML);

const mermaidBlock = (doc: string): string => doc.match(/```mermaid\n([\s\S]*?)\n```/)?.[1] ?? "";

const roots = [...new Set(fallow.boundaries.zones.map((zone) => zone.root))];

const membershipsFor = (root: string): Array<{ zone: string; node: string | undefined }> =>
  fallow.boundaries.zones
    .filter((zone) => zone.root === root)
    .flatMap((zone) =>
      zone.patterns.map((pattern) => ({ zone: zone.name, node: patternToNode(pattern) })),
    );

const zoneByNode = (root: string): Map<string, string> =>
  new Map(
    membershipsFor(root)
      .filter((entry): entry is { zone: string; node: string } => Boolean(entry.node))
      .map((entry) => [entry.node, entry.zone]),
  );

const allows = (from: string, to: string): boolean =>
  fallow.boundaries.rules.find((rule) => rule.from === from)?.allow.includes(to) ?? false;

describe("zone matrix sync", () => {
  it("the mermaid block in docs/architecture.md is the generated diagram", () => {
    expect(
      mermaidBlock(DOC),
      "docs/architecture.md must carry the mermaid generated from docs/architecture.puml — paste the expected value below into the doc",
    ).toBe(pumlToMermaid(PUML));
  });

  it("every fallow zone pattern is a diagram slice or a zone-scoped exception", () => {
    const offenders = fallow.boundaries.zones.flatMap((zone) =>
      zone.patterns
        .filter((pattern) => !patternToNode(pattern) && NON_SLICE_PATTERNS[pattern] !== zone.name)
        .map((pattern) => `${zone.name}: ${pattern}`),
    );
    expect(offenders).toEqual([]);
  });

  it("every diagram node is claimed by exactly one zone per fallow root", () => {
    const offenders: string[] = [];
    for (const root of roots) {
      const memberships = membershipsFor(root);
      for (const node of diagram.nodes) {
        const owners = memberships.filter((entry) => entry.node === node);
        if (owners.length !== 1) {
          offenders.push(`${root}: ${node} is claimed by ${String(owners.length)} zones`);
        }
      }
      for (const entry of memberships) {
        if (entry.node && !diagram.nodes.includes(entry.node)) {
          offenders.push(`${root}: zone ${entry.zone} covers undeclared slice ${entry.node}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("every edge in the diagram is allowed by the fallow rules", () => {
    const offenders: string[] = [];
    for (const root of roots) {
      const zones = zoneByNode(root);
      for (const { from, to } of diagram.edges) {
        const fromZone = zones.get(from);
        const toZone = zones.get(to);
        if (!fromZone || !toZone) {
          offenders.push(`${root}: ${from} --> ${to} touches an unclaimed slice`);
        } else if (fromZone !== toZone && !allows(fromZone, toZone)) {
          offenders.push(`${root}: ${from} --> ${to} is not allowed`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
