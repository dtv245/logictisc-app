/**
 * Verifies shared locale initialization and catalogue parity.
 */
import { describe, expect, it } from "vitest";

import { createAppI18n } from "./createI18n";
import { enSharedMessages } from "./locales/en";
import { viSharedMessages } from "./locales/vi";

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

describe("shared i18n", () => {
  it("initializes an isolated Vietnamese translator", async () => {
    const i18n = await createAppI18n({ locale: "vi" });

    expect(i18n.t("actions.retry", { ns: "shared" })).toBe(
      viSharedMessages.actions.retry,
    );
  });

  it("keeps English and Vietnamese catalogue keys aligned", () => {
    expect(collectLeafPaths(viSharedMessages).sort()).toEqual(
      collectLeafPaths(enSharedMessages).sort(),
    );
  });
});
