/**
 * Hợp đồng enum giữa form generic và type của backend.
 *
 * Lỗi mà test này chặn: một `select` trong `resourceForms.ts` khai **thiếu** hoặc
 * **lệch** giá trị so với union trong `src/types/*`. Khi đó bản ghi đang ở giá trị
 * bị thiếu sẽ mở form edit ra ô trống, và lần lưu kế tiếp ghi đè mất giá trị thật —
 * mất dữ liệu, không phải lỗi hiển thị.
 *
 * Đã xảy ra thật: `loads.status` thiếu `pending`/`in_transit`, `trips.status` thiếu
 * `planned`/`in_progress` (trong khi `in_progress` là trạng thái đang chạy).
 *
 * Union được đọc từ source bằng regex chứ không import, vì `src/types/*.dto.ts` chỉ
 * export type — không có mảng runtime nào để so. Cùng cách `localeKeys.test.ts` đang dùng.
 */

import { readFileSync } from "node:fs";

import {
  createResourceFormInitialValues,
  resourceFormDefinitions,
} from "@components/resources/resourceForms";
import { describe, expect, it } from "vitest";

interface EnumSource {
  file: string;
  typeName: string;
}

/**
 * Mọi `select` phải có mặt ở đây. Thiếu một khoá nghĩa là có enum mới chưa được neo
 * vào type backend — test đỏ và buộc phải khai nguồn sự thật trước khi thêm.
 */
const SELECT_ENUM_SOURCES: Readonly<Record<string, EnumSource>> = {
  "customers.status": { file: "src/types/customer.types.ts", typeName: "CustomerStatus" },
  "employees.salaryType": { file: "src/types/employee.types.ts", typeName: "SalaryType" },
  "employees.status": { file: "src/types/employee.types.ts", typeName: "EmployeeStatus" },
  "invoices.status": { file: "src/types/invoice.dto.ts", typeName: "InvoiceStatus" },
  "invoices.taxBehavior": { file: "src/types/invoice.dto.ts", typeName: "TaxBehavior" },
  "invoices.type": { file: "src/types/invoice.dto.ts", typeName: "InvoiceType" },
  "loads.source": { file: "src/types/load.dto.ts", typeName: "LoadSource" },
  "loads.status": { file: "src/types/load.dto.ts", typeName: "LoadStatus" },
  "loads.type": { file: "src/types/load.dto.ts", typeName: "LoadType" },
  "payments.status": { file: "src/types/payment.dto.ts", typeName: "PaymentStatus" },
  "terminals.type": { file: "src/types/terminal.dto.ts", typeName: "TerminalType" },
  "trips.status": { file: "src/types/trip.dto.ts", typeName: "TripStatus" },
  "trucks.status": { file: "src/types/truck.types.ts", typeName: "TruckStatus" },
  "trucks.type": { file: "src/types/truck.types.ts", typeName: "TruckType" },
};

/**
 * Lệch **đã biết** và chưa chốt được bên nào đúng. Có mặt ở đây nghĩa là "đã ghi
 * nhận", KHÔNG phải "đã đúng". Mọi khoá phải nêu lý do và phải được xoá khi backend
 * chốt vocabulary (xem `docs/frontend-management-ui-spec.md` §9 B1).
 *
 * Hiện đang rỗng: `terminals.type` từng nằm đây và đã được gỡ sau khi đối chiếu
 * `terminal/TerminalType.java` — form đúng, DTO sai, DTO đã sửa.
 */
const KNOWN_CONTRACT_CONFLICTS: Readonly<Record<string, string>> = {};

const readUnionMembers = ({ file, typeName }: EnumSource): string[] => {
  const source = readFileSync(file, "utf8");
  const declaration = new RegExp(`export type ${typeName}\\s*=([^;]*);`, "u").exec(source);
  if (!declaration) {
    throw new Error(`Không tìm thấy union ${typeName} trong ${file}`);
  }
  return [...declaration[1].matchAll(/"([^"]*)"/gu)].map((match) => match[1]);
};

interface SelectField {
  key: string;
  options: readonly string[];
}

const selectFields = (): SelectField[] =>
  Object.entries(resourceFormDefinitions).flatMap(([resource, definition]) =>
    definition.fields
      .filter((field) => field.control === "select")
      .map((field) => ({ key: `${resource}.${field.name}`, options: field.options ?? [] })),
  );

const sorted = (values: readonly string[]): string[] => [...values].sort();

describe("hợp đồng enum giữa form và type backend", () => {
  it("mọi select đều được neo vào một union trong src/types", () => {
    const unregistered = sorted(
      selectFields()
        .map(({ key }) => key)
        .filter((key) => SELECT_ENUM_SOURCES[key] === undefined),
    );

    expect(unregistered).toEqual([]);
  });

  it("giá trị của select khớp đúng union backend (trừ lệch đã ghi nhận)", () => {
    const mismatches = selectFields().flatMap(({ key, options }) => {
      const source = SELECT_ENUM_SOURCES[key];
      if (!source || KNOWN_CONTRACT_CONFLICTS[key] !== undefined) {
        return [];
      }

      const expected = sorted(readUnionMembers(source));
      const actual = sorted(options);
      if (JSON.stringify(expected) === JSON.stringify(actual)) {
        return [];
      }

      return [{ actual, expected, key, source: `${source.file}#${source.typeName}` }];
    });

    expect(mismatches).toEqual([]);
  });

  it("lệch đã ghi nhận vẫn còn lệch — không có miễn trừ mục nát", () => {
    const stale = sorted(
      Object.keys(KNOWN_CONTRACT_CONFLICTS).filter((key) => {
        const field = selectFields().find((candidate) => candidate.key === key);
        const source = SELECT_ENUM_SOURCES[key];
        if (!field || !source) {
          return true;
        }

        return (
          JSON.stringify(sorted(field.options)) ===
          JSON.stringify(sorted(readUnionMembers(source)))
        );
      }),
    );

    expect(stale).toEqual([]);
  });

  it("trường server sở hữu không được seed lúc create", () => {
    const seeded = Object.entries(resourceFormDefinitions).flatMap(
      ([, definition]) => {
        const initialValues = createResourceFormInitialValues(definition);
        return definition.fields
          .filter((field) => field.readOnly === true)
          .map((field) => field.name)
          .filter((name) => Object.hasOwn(initialValues, name));
      },
    );

    expect(seeded).toEqual([]);
  });

  it("không field nào vừa readOnly vừa required", () => {
    const contradictory = Object.entries(resourceFormDefinitions).flatMap(
      ([resource, definition]) =>
        definition.fields
          .filter((field) => field.readOnly === true && field.required === true)
          .map((field) => `${resource}.${field.name}`),
    );

    expect(contradictory).toEqual([]);
  });
});
