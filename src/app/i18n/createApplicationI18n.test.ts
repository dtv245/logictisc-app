/**
 * Verifies app/shared composition, runtime locale switching and key parity.
 */

import { sharedI18nResources } from "@shared/i18n";
import { describe, expect, it } from "vitest";

import { createApplicationI18n } from "./createApplicationI18n";
import { enAppMessages } from "./locales/en";
import { viAppMessages } from "./locales/vi";

const collectLeafPaths = (
  value: object,
  prefix = "",
): string[] =>
  Object.entries(value).flatMap(([key, child]) => {
    const path = prefix.length > 0 ? `${prefix}.${key}` : key;
    return typeof child === "object" && child !== null
      ? collectLeafPaths(child, path)
      : [path];
  });

describe("application i18n", () => {
  it("composes Vietnamese app and shared namespaces", async () => {
    const i18n = await createApplicationI18n({ locale: "vi" });

    expect(i18n.t("bootstrap.unreachable.title", { ns: "app" })).toBe(
      viAppMessages.bootstrap.unreachable.title,
    );
    expect(i18n.t("actions.retry", { ns: "shared" })).toBe(
      sharedI18nResources.vi.shared.actions.retry,
    );
  });

  it("switches both namespaces at runtime", async () => {
    const i18n = await createApplicationI18n({ locale: "vi" });

    await i18n.changeLanguage("en");

    expect(i18n.t("diagnostics.title", { ns: "app" })).toBe(
      enAppMessages.diagnostics.title,
    );
    expect(i18n.t("actions.retry", { ns: "shared" })).toBe(
      sharedI18nResources.en.shared.actions.retry,
    );
  });

  it("keeps English and Vietnamese app keys aligned", () => {
    expect(collectLeafPaths(viAppMessages).sort()).toEqual(
      collectLeafPaths(enAppMessages).sort(),
    );
  });
});
