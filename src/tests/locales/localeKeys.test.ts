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

import { enMessages, viMessages } from "@locales";
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
});
