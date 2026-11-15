import { describe, expect, it } from "vite-plus/test";

import { acceptedTotal, checkFindings, missingCategories } from "./security-gate";

const accepted = {
  "src/proxy.ts": { "open-redirect": { count: 2, reason: "same-origin targets" } },
  "src/lib/example.ts": { ssrf: { count: 1, reason: "fixed host" } },
};
const finding = (path: string, category: string) => ({ path, category });

describe("checkFindings", () => {
  it("passes when every finding is accepted, in the accepted count", () => {
    const findings = [
      finding("src/proxy.ts", "open-redirect"),
      finding("src/proxy.ts", "open-redirect"),
      finding("src/lib/example.ts", "ssrf"),
    ];

    expect(checkFindings(findings, accepted)).toEqual([]);
  });

  it("fails on a new finding, and on more findings than accepted", () => {
    const findings = [
      finding("src/proxy.ts", "open-redirect"),
      finding("src/proxy.ts", "open-redirect"),
      finding("src/proxy.ts", "open-redirect"),
      finding("src/lib/example.ts", "ssrf"),
      finding("src/app/api/x/route.ts", "sql-injection"),
    ];

    expect(checkFindings(findings, accepted)).toEqual([
      "src/proxy.ts open-redirect: 3 found, 2 accepted",
      "src/app/api/x/route.ts sql-injection: 1 found, 0 accepted",
    ]);
  });

  it("fails on a stale entry, so the accepted count stays honest", () => {
    const findings = [
      finding("src/proxy.ts", "open-redirect"),
      finding("src/proxy.ts", "open-redirect"),
    ];

    expect(checkFindings(findings, accepted)).toEqual([
      "src/lib/example.ts ssrf: 0 found, 1 accepted",
    ]);
  });

  it("fails on an accepted entry without a reason", () => {
    const blank = { "src/a.ts": { ssrf: { count: 1, reason: " " } } };

    expect(checkFindings([finding("src/a.ts", "ssrf")], blank)).toEqual([
      "src/a.ts ssrf: accepted without a reason",
    ]);
  });
});

describe("missingCategories", () => {
  it("names catalogue categories the config does not include", () => {
    expect(missingCategories(["ssrf", "xxe", "hardcoded-secret"], ["ssrf"])).toEqual([
      "xxe",
      "hardcoded-secret",
    ]);
    expect(missingCategories(["ssrf"], ["ssrf"])).toEqual([]);
  });
});

describe("acceptedTotal", () => {
  it("sums the accepted counts", () => {
    expect(acceptedTotal(accepted)).toBe(3);
  });
});
