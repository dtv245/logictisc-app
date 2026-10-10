import { describe, expect, it } from "vitest";
import { enMessages, viMessages, jaMessages } from "@/locales";
function paths(value: unknown, parent = ""): string[] {
  return typeof value === "object" && value !== null ? Object.entries(value).flatMap(([key, child]) => paths(child, parent ? `${parent}.${key}` : key)) : typeof value === "string" ? [parent] : [];
}
describe("rating translations", () => {
  it("provides every rating label and actionable domain error in all three locales", () => {
    const keys = paths(enMessages.rating).sort(); expect(paths(viMessages.rating).sort()).toEqual(keys); expect(paths(jaMessages.rating).sort()).toEqual(keys);
    expect(keys).toContain("errors.FUEL_INDEX_STALE"); expect(keys).toContain("errors.RATING_PRICING_DATE_REQUIRED");
  });
});
