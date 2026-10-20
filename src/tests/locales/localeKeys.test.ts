/**
 * Hợp đồng khoá locale.
 *
 * Hai lỗi mà test này chặn:
 * 1. `vi` và `en` lệch khoá — đổi ngôn ngữ sẽ thấy khoá thô hoặc chữ của ngôn ngữ kia.
 * 2. Code gọi `t("...")` / `titleKey: "..."` cho khoá không tồn tại — i18next trả về
 *    chính khoá đó, người dùng thấy `columns.loads.number` trên màn hình.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { enMessages, jaMessages, viMessages } from "@locales";
import { describe, expect, it } from "vitest";

type Messages = Record<string, unknown>;

/** Duỗi object lồng nhau thành tập đường dẫn khoá phẳng. */
const flatten = (value: unknown, prefix = ""): string[] => {
  if (typeof value !== "object" || value === null) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Messages).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
};

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === "tests" ? [] : sourceFiles(full);
    }
    return /\.tsx?$/u.test(entry) ? [full] : [];
  });

/** Khoá tĩnh mà code tham chiếu; khoá dựng động bằng template literal bị bỏ qua. */
const referencedKeys = (): Map<string, string> => {
  const found = new Map<string, string>();
  const patterns = [
    /titleKey:\s*"([^"]+)"/gu,
    /\bt\(\s*"([^"]+)"/gu,
    /\btranslate\(\s*"([^"]+)"/gu,
  ];

  for (const file of sourceFiles("src")) {
    if (file.startsWith("src/locales/")) continue;

    const content = readFileSync(file, "utf8");
    for (const pattern of patterns) {
      for (const match of content.matchAll(pattern)) {
        found.set(match[1], file);
      }
    }
  }

  return found;
};

describe("hợp đồng khoá locale", () => {
  it("vi và en có cùng tập khoá", () => {
    const vi = new Set(flatten(viMessages));
    const en = new Set(flatten(enMessages));

    const onlyVi = [...vi].filter((key) => !en.has(key)).sort();
    const onlyEn = [...en].filter((key) => !vi.has(key)).sort();

    expect({ onlyEn, onlyVi }).toEqual({ onlyEn: [], onlyVi: [] });
  });

  it("mọi khoá code tham chiếu đều tồn tại trong vi và en", () => {
    const vi = new Set(flatten(viMessages));
    const en = new Set(flatten(enMessages));

    const missing = [...referencedKeys()]
      .filter(([key]) => !vi.has(key) || !en.has(key))
      .map(([key, file]) => `${key} (${file})`)
      .sort();

    expect(missing).toEqual([]);
  });

  it("các key Operations panels và copy Load/AI mới có parity ở cả ba locale", () => {
    const panelPaths = [enMessages, viMessages, jaMessages].map((messages) => flatten(messages.dashboard.opsView.panels).sort());
    const loadKeys = ["aiAnalysisLabel", "gapsTitle", "gapCount", "accurate", "loadInformationComplete", "required", "fillOnForm", "supplement", "dismiss", "dismissReason", "loadEditingUnavailable", "sourceLabel", "customerFallback", "back", "breadcrumb", "loadLabel", "callDriver", "truckAlt", "riskCount"];
    const loadValues = [enMessages, viMessages, jaMessages].map((messages) => loadKeys.map((key) => (messages.loads.redesign as Record<string, unknown>)[key]));
    const aiHelp = [enMessages, viMessages, jaMessages].map((messages) => messages.aiDispatch.customProviderApiKeyHelp);
    const aiPlaceholder = [enMessages, viMessages, jaMessages].map((messages) => messages.aiDispatch.apiKeyOptionalPlaceholder);
    const timelineFallback = [enMessages, viMessages, jaMessages].map((messages) => messages.loads.timeline.localTimezone);

    expect(panelPaths[1]).toEqual(panelPaths[0]);
    expect(panelPaths[2]).toEqual(panelPaths[0]);
    expect(loadValues.every((values) => values.every((value) => typeof value === "string" && value.length > 0))).toBe(true);
    expect(aiHelp.every((value) => typeof value === "string" && value.length > 0)).toBe(true);
    expect(aiPlaceholder.every((value) => typeof value === "string" && value.length > 0)).toBe(true);
    expect(timelineFallback.every((value) => typeof value === "string" && value.length > 0)).toBe(true);
  });
});
