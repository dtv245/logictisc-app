import { describe, expect, it } from "vitest";
import { enMessages, viMessages, jaMessages } from "@/locales";
function paths(value: unknown, parent = ""): string[] {
  return typeof value === "object" && value !== null ? Object.entries(value).flatMap(([key, child]) => paths(child, parent ? `${parent}.${key}` : key)) : typeof value === "string" ? [parent] : [];
}
describe("fleet translations", () => {
  it("provides reporting scope, actual metric/reason codes and errors in all three locales", () => {
    const keys = paths(enMessages.fleet).sort(); expect(paths(viMessages.fleet).sort()).toEqual(keys); expect(paths(jaMessages.fleet).sort()).toEqual(keys);
    expect(keys).toContain("metrics.FLEET_UTILIZATION_PERCENT"); expect(keys).toContain("errors.INVALID_FLEET_REPORT_PERIOD"); expect(keys).toContain("reasons.ACTUAL_MILEAGE_HISTORY_UNAVAILABLE");
  });
});
