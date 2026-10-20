import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("scoped source contrast audit", () => {
  it("calculates paired hard-coded/token colors and records unresolved background contexts", () => {
    const output = execFileSync(process.execPath, [
      "scripts/audit-ux-contrast-scope.mjs",
      "--no-write",
      "--summary-json",
    ], { encoding: "utf8" }).trim();
    const counts = JSON.parse(output.split("\n")[0] ?? "{}") as {
      files: number;
      paired: number;
      failures: number;
      unresolved: number;
    };

    expect(counts.files).toBeGreaterThan(0);
    expect(counts.paired).toBeGreaterThan(0);
    expect(counts.failures).toBe(0);
    expect(counts.unresolved).toBeGreaterThan(0);
  });
});
