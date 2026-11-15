// Parses the subset of PlantUML that docs/architecture.puml uses:
// `component [x]` declarations and `[a] --> [b]` edges. Upgrade to a real
// parser if the diagram grows.

export type PumlEdge = { from: string; to: string };

export type PumlDiagram = { nodes: string[]; edges: PumlEdge[] };

export const parsePuml = (puml: string): PumlDiagram => {
  const nodes: string[] = [];
  const edges: PumlEdge[] = [];
  for (const raw of puml.split("\n")) {
    const line = raw.trim();
    const node = line.match(/^component \[(.+)\]$/);
    if (node?.[1]) {
      nodes.push(node[1]);
      continue;
    }
    const edge = line.match(/^\[(.+)\] --> \[(.+)\]$/);
    const from = edge?.[1];
    const to = edge?.[2];
    if (from && to) {
      edges.push({ from, to });
    }
  }
  return { nodes, edges };
};

// Node pairs the diagram does not draw. archunit's adhereToDiagramInFile
// forbids exactly these, so they render as dashed edges.
const forbiddenEdges = ({ nodes, edges }: PumlDiagram): PumlEdge[] =>
  nodes.flatMap((from) =>
    nodes
      .filter((to) => to !== from && !edges.some((edge) => edge.from === from && edge.to === to))
      .map((to) => ({ from, to })),
  );

export const pumlToMermaid = (puml: string): string => {
  const { nodes, edges } = parsePuml(puml);
  return [
    "flowchart LR",
    ...nodes.map((node) => `  ${node}`),
    ...edges.map((edge) => `  ${edge.from} --> ${edge.to}`),
    ...forbiddenEdges({ nodes, edges }).map((edge) => `  ${edge.from} -.->|forbidden| ${edge.to}`),
  ].join("\n");
};
