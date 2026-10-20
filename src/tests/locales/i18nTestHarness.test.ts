import i18n from "i18next";
import { describe, expect, it } from "vitest";

describe("shared i18n test harness", () => {
  it("fails on a missing key instead of rendering the key name", () => {
    expect(() => i18n.t("testHarness.missingTranslation")).toThrow(
      "[i18n] Missing translation key: testHarness.missingTranslation",
    );
    expect(() => i18n.t("testHarness.untranslatedFallback", {
      defaultValue: "testHarness.untranslatedFallback",
    })).toThrow("[i18n] Missing translation key: testHarness.untranslatedFallback");
    expect(i18n.t("testHarness.explicitFallback", {
      defaultValue: "Readable fallback",
    })).toBe("Readable fallback");
  });
});
