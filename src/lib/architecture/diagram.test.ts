import { projectSlices } from "archunit";
import { describe, expect, it } from "vite-plus/test";

// Executable form of the zone matrix in docs/architecture.md.
// The diagram lives in docs/architecture.puml; the fallow zones in
// .fallowrc.json assert the same edges — sync.test.ts enforces that the
// three stay aligned, with the puml as the source of truth.
describe("architecture", () => {
  // 30s budget: archunit rebuilds a full TypeScript program from tsconfig.json on every run,
  // which exceeds Vitest's 5s default on shared CI runners.
  it("code adheres to the documented zone diagram", async () => {
    const violations = await projectSlices()
      .definedBy("src/(**)/")
      .should()
      .adhereToDiagramInFile("docs/architecture.puml")
      .check();

    expect(violations).toEqual([]);
  }, 30_000);
});
