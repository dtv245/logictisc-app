/**
 * Khai báo filter cho `FilterBar`.
 *
 * Hai nguồn sự thật được **nối** ở đây, không chép lại giá trị nào:
 *
 * - **Field nào được lọc** — `allowedFilterFields` trong `resourceRegistry.ts`.
 *   `serializeFilters` ném `FILTER_FIELD_NOT_ALLOWED` khi gặp field ngoài allowlist
 *   (`providers/api/querySerializer.ts:96`), nên đây không phải chuyện gọn gàng mà là
 *   điều kiện để list tải được: một filter sai làm hỏng cả query, không chỉ filter đó.
 *   Test `resourceFilterControls.test.ts` khoá bất biến này.
 * - **Field đó là loại gì** — `resourceFormDefinitions`. `select` mượn `options`,
 *   `relation` mượn `relationResource`. Nhờ vậy enum của filter **không thể lệch** với
 *   enum của form, và test neo enum (`resourceFormEnums.test.ts`) bảo vệ luôn filter.
 *   Đây đúng là lớp lỗi đã xảy ra thật ở `loads.status`/`trips.status`.
 *
 * `formField` tồn tại vì query param của backend không luôn trùng tên field trong DTO:
 * `loads` lọc bằng `truckId` nhưng form khai `assignedTruckId`.
 *
 * Field nào không biểu diễn được (control `text`/`number`/`datetime` trong form, hoặc
 * resource không có form) thì **không được khai** — thà thiếu một ô lọc còn hơn hiện
 * một ô gửi lên giá trị mà contract không nhận.
 */

import {
  isEditableResourceName,
  resourceFormDefinitions,
  type ResourceFormField,
} from "./resourceForms";

export type ResourceFilterKind = "search" | "select" | "relation";

export interface ResourceFilterControl {
  /** Query param gửi lên backend; luôn nằm trong `allowedFilterFields`. */
  field: string;
  kind: ResourceFilterKind;
  /** Khoá locale nhãn — dùng chung `forms.fields.*` với form, nên không sinh khoá mới. */
  labelKey: string;
  /** Chỉ có ở `kind: "select"`; giá trị enum, dịch qua `forms.options.*`. */
  options?: readonly string[];
  /** Chỉ có ở `kind: "relation"`; resource để `EntityPicker` nạp options. */
  relationResource?: string;
}

interface FilterDeclaration {
  /** Query param. */
  field: string;
  /** Field trong `resourceFormDefinitions` để mượn control; bỏ trống khi trùng tên. */
  formField?: string;
}

const filterDeclarations: Readonly<
  Record<string, readonly FilterDeclaration[]>
> = {
  customers: [{ field: "search" }, { field: "status" }],
  employees: [{ field: "search" }, { field: "status" }, { field: "roleId" }],
  terminals: [{ field: "search" }, { field: "type" }],
  trucks: [{ field: "search" }, { field: "status" }, { field: "type" }],
  loads: [
    { field: "search" },
    { field: "status" },
    { field: "customerId" },
    { field: "truckId", formField: "assignedTruckId" },
    { field: "dispatcherId", formField: "assignedDispatcherId" },
  ],
  trips: [{ field: "search" }, { field: "status" }, { field: "truckId" }],
  invoices: [
    { field: "status" },
    { field: "type" },
    { field: "customerId" },
    { field: "employeeId" },
  ],
  payments: [{ field: "status" }, { field: "invoiceId" }],
};

const findField = (
  fields: readonly ResourceFormField[],
  name: string,
): ResourceFormField | undefined =>
  fields.find((field) => field.name === name);

const toControl = (
  field: string,
  descriptor: ResourceFormField,
): ResourceFilterControl | undefined => {
  const labelKey = `forms.fields.${descriptor.name}`;

  if (descriptor.control === "select" && descriptor.options) {
    return { field, kind: "select", labelKey, options: descriptor.options };
  }

  if (descriptor.control === "relation" && descriptor.relationResource) {
    return {
      field,
      kind: "relation",
      labelKey,
      relationResource: descriptor.relationResource,
    };
  }

  return undefined;
};

/**
 * Trả về các control lọc của một resource, đã sẵn sàng để render.
 *
 * Resource không có trong bảng khai báo trả về mảng rỗng — `FilterBar` khi đó không
 * render gì, thay vì đoán ra một bộ lọc.
 */
export const resolveFilterControls = (
  resource: string,
): readonly ResourceFilterControl[] => {
  const declared = filterDeclarations[resource];
  if (!declared) {
    return [];
  }

  const fields = isEditableResourceName(resource)
    ? resourceFormDefinitions[resource].fields
    : [];

  const controls: ResourceFilterControl[] = [];

  for (const { field, formField } of declared) {
    if (field === "search") {
      controls.push({ field, kind: "search", labelKey: "filters.search" });
      continue;
    }

    const descriptor = findField(fields, formField ?? field);
    const control = descriptor && toControl(field, descriptor);
    if (control) {
      controls.push(control);
    }
  }

  return controls;
};

/** Tên field đã khai cho một resource — dùng cho test bất biến với allowlist. */
export const declaredFilterFields = (resource: string): readonly string[] =>
  (filterDeclarations[resource] ?? []).map(({ field }) => field);

/** Danh sách resource có khai báo filter — test dùng để phủ hết, không bỏ sót. */
export const declaredFilterResources = (): readonly string[] =>
  Object.keys(filterDeclarations);
