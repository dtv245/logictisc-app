/**
 * Hợp đồng giữa khai báo filter và allowlist của backend.
 *
 * Lỗi mà test này chặn không phải "ô lọc hiện sai" mà là **hỏng cả danh sách**:
 * `serializeFilters` (`providers/api/querySerializer.ts:96`) ném
 * `FILTER_FIELD_NOT_ALLOWED` khi gặp field ngoài `allowedFilterFields`, và lỗi đó
 * làm rơi toàn bộ query chứ không riêng filter vi phạm.
 *
 * Nhóm khẳng định thứ hai chặn một lỗi im lặng khác: nhãn lấy từ `forms.fields.*`,
 * nên một field không có khoá locale sẽ hiện nguyên chuỗi `forms.fields.xyz` trên
 * màn hình. `localeKeys.test.ts` không bắt được vì khoá dựng bằng template literal.
 */

import {
  declaredFilterFields,
  declaredFilterResources,
  resolveFilterControls,
} from "@components/resources/resourceFilterControls";
import { foundationApiResources } from "@pages/resourceRegistry";
import { initializeAppI18n } from "@locales";
import type { i18n as I18nInstance } from "i18next";
import { beforeAll, describe, expect, it } from "vitest";

let i18n: I18nInstance;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

const translations = (): Record<string, unknown> =>
  (i18n.getResourceBundle("vi", "translation") as Record<string, unknown>) ?? {};

const hasKey = (path: string): boolean =>
  path
    .split(".")
    .reduce<unknown>(
      (node, segment) =>
        typeof node === "object" && node !== null
          ? (node as Record<string, unknown>)[segment]
          : undefined,
      translations(),
    ) !== undefined;

const allowedFields = (resource: string): readonly string[] => {
  const definition =
    foundationApiResources[resource as keyof typeof foundationApiResources];
  return definition ? definition.allowedFilterFields : [];
};

describe("khai báo filter nằm trong allowlist của backend", () => {
  it("mọi resource được khai đều có contract trong foundationApiResources", () => {
    const missing = declaredFilterResources().filter(
      (resource) => !Object.hasOwn(foundationApiResources, resource),
    );

    expect(missing).toEqual([]);
  });

  it("mọi field được khai đều nằm trong allowedFilterFields", () => {
    const violations: string[] = [];

    for (const resource of declaredFilterResources()) {
      const allowed = new Set(allowedFields(resource));
      for (const field of declaredFilterFields(resource)) {
        if (!allowed.has(field)) {
          violations.push(`${resource}.${field}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

describe("control sinh ra từ khai báo", () => {
  it("mọi control đều có nhãn dịch được", () => {
    const missing: string[] = [];

    for (const resource of declaredFilterResources()) {
      for (const control of resolveFilterControls(resource)) {
        if (!hasKey(control.labelKey)) {
          missing.push(`${resource}.${control.field} → ${control.labelKey}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it("select có options, relation có resource — không có control nửa vời", () => {
    for (const resource of declaredFilterResources()) {
      for (const control of resolveFilterControls(resource)) {
        if (control.kind === "select") {
          expect(control.options, `${resource}.${control.field}`).toBeDefined();
        }
        if (control.kind === "relation") {
          expect(
            control.relationResource,
            `${resource}.${control.field}`,
          ).toBeTruthy();
        }
      }
    }
  });

  it("option của select đều dịch được qua forms.options.*", () => {
    const missing: string[] = [];

    for (const resource of declaredFilterResources()) {
      for (const control of resolveFilterControls(resource)) {
        for (const option of control.options ?? []) {
          if (!hasKey(`forms.options.${option}`)) {
            missing.push(`${resource}.${control.field} → ${option}`);
          }
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it("loads có đủ 5 filter của allowlist, kể cả hai field lệch tên với form", () => {
    // `truckId`/`dispatcherId` là tên query param; form khai `assignedTruckId`/
    // `assignedDispatcherId`. Đây đúng là chỗ dễ mất filter nhất khi refactor.
    expect(resolveFilterControls("loads").map(({ field }) => field)).toEqual([
      "search",
      "status",
      "customerId",
      "truckId",
      "dispatcherId",
    ]);
  });

  it("resource không khai báo thì không có control nào", () => {
    expect(resolveFilterControls("notifications")).toEqual([]);
    expect(resolveFilterControls("khong-ton-tai")).toEqual([]);
  });
});
