import { describe, expect, it } from "vite-plus/test";

import { pumlToMermaid } from "./puml";

describe("pumlToMermaid", () => {
  it("converts the drawn components and edges and marks undrawn pairs as forbidden", () => {
    const puml = [
      "@startuml",
      "component [app]",
      "component [lib]",
      "",
      "[app] --> [lib]",
      "@enduml",
    ].join("\n");

    expect(pumlToMermaid(puml)).toBe(
      ["flowchart LR", "  app", "  lib", "  app --> lib", "  lib -.->|forbidden| app"].join("\n"),
    );
  });

  it("renders an empty flowchart for a diagram without components", () => {
    const puml = ["@startuml", "note right of [app]", "  zones", "end note", "@enduml"].join("\n");

    expect(pumlToMermaid(puml)).toBe("flowchart LR");
  });
});
