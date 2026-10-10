import { describe, expect, it } from "vitest";
import { enMessages, viMessages, jaMessages } from "@/locales";
function paths(value: unknown, parent = ""): string[] {
  return typeof value === "object" && value !== null ? Object.entries(value).flatMap(([key, child]) => paths(child, parent ? `${parent}.${key}` : key)) : typeof value === "string" ? [parent] : [];
}
describe("optimization translations", () => {
  it("provides labels and actionable conflicts in vi/en/ja", () => {
    const keys = paths(enMessages.optimization).sort(); expect(paths(viMessages.optimization).sort()).toEqual(keys); expect(paths(jaMessages.optimization).sort()).toEqual(keys);
    for (const key of ["errors.OPTIMIZATION_CANDIDATE_STALE", "errors.HOS_CYCLE_LIMIT_EXCEEDED", "errors.OPTIMIZATION_ALREADY_ACCEPTED", "contribution", "acceptConfirm"]) expect(keys).toContain(key);
  });
});
