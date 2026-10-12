/**
 * Declares backend-confirmed JSON request fields for generic Refine forms.
 * Documents are excluded because their create contract is multipart, while
 * notifications do not expose generic create/update endpoints.
 */

import { translate } from "@locales/translate";

export type EditableResourceName =
  | "customers"
  | "employees"
  | "terminals"
  | "trucks"
  | "loads"
  | "trips"
  | "invoices"
  | "payments";

export type ResourceFormControl =
  | "boolean"
  | "datetime"
  | "date"
  | "email"
  | "number"
  | "relation"
  | "select"
  | "text"
  | "textarea"
  | "tripStops"
  | "uuid";

export interface RelationRecord {
  id?: string;
  name?: string;
  code?: string;
  number?: string | number;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  licensePlate?: string;
  [key: string]: unknown;
}

export type FormFieldComponent =
  | "input"
  | "select"
  | "number"
  | "switch"
  | "entityPicker"
  | "multiSelect";

export interface FieldDependsOn {
  /** Tên trường được theo dõi để quyết định hiển thị */
  field: string;
  /**
   * Giá trị kỳ vọng để hiển thị trường này.
   * Nếu không truyền `condition`, so sánh giá trị form với `value`.
   * Đối với boolean: nếu không truyền `value`, mặc định coi là `true`.
   */
  value?: unknown;
  /** Hàm điều kiện tùy biến nhận vào giá trị trường phụ thuộc và toàn bộ form */
  condition?: (value: unknown, allValues: Record<string, unknown>) => boolean;
  /** Tự động reset giá trị của trường này khi bị ẩn. Mặc định `true`. */
  resetOnHide?: boolean;
}

export interface ResourceFormField {
  control: ResourceFormControl;
  /**
   * `max` của `InputNumber`. Nhận hàm khi giá trị phụ thuộc thời điểm render
   * (ví dụ `year` không được vượt năm sau).
   */
  max?: number | (() => number);
  maxLength?: number;
  min?: number;
  stringMode?: boolean;
  name: string;
  options?: readonly string[];
  pattern?: RegExp;
  required?: boolean;
  /** Presentation-only disable; request ownership is enforced by the mutation whitelist. */
  readOnly?: boolean;
  uppercase?: boolean;
  relationResource?: string;
  relationLabelFormat?: (record: RelationRecord) => string | undefined;
  relationLabelField?: string;

  /** Số cột chiếm trên lưới 2 cột: 1 (nửa hàng) hoặc 2 (toàn hàng) */
  span?: 1 | 2;
  /** Component tường minh: ghi đè cách render theo control */
  component?: FormFieldComponent;
  /** Điều kiện hiển thị phụ thuộc vào field khác */
  dependsOn?: FieldDependsOn;
  /** Đơn vị hoặc hậu tố hiển thị (ví dụ "kg", "$") */
  unit?: string;
  suffix?: string;
  /** Khóa i18n cho văn bản hướng dẫn phụ (helper/extra text) */
  helperTextKey?: string;
  /** Khóa i18n cho placeholder */
  placeholderKey?: string;
  placeholder?: string;
  /** Giá trị mặc định khi khởi tạo */
  defaultValue?: unknown;
}

export interface ResourceFormSection {
  /** Định danh duy nhất của section */
  key: string;
  /** Khóa i18n tiêu đề section */
  titleKey: string;
  /** Khóa i18n mô tả phụ của section */
  descriptionKey?: string;
  /** Cho phép đóng/mở section */
  collapsible?: boolean;
  /** Trạng thái thu gọn mặc định */
  defaultCollapsed?: boolean;
  /** Danh sách các field thuộc section này */
  fields: readonly ResourceFormField[];
}

export interface ResourceFormDefinition {
  fields: readonly ResourceFormField[];
  sections?: readonly ResourceFormSection[];
}

export function findSectionKeyForField(
  definition: ResourceFormDefinition,
  fieldName: string | readonly (string | number)[],
): string | undefined {
  if (!definition.sections) {
    return undefined;
  }
  const targetName = Array.isArray(fieldName)
    ? String(fieldName[fieldName.length - 1])
    : String(fieldName);
  for (const section of definition.sections) {
    if (section.fields.some((field) => field.name === targetName)) {
      return section.key;
    }
  }
  return undefined;
}

/**
 * Control nào chiếm cả chiều ngang, kể cả khi form xếp nhiều cột.
 *
 * Suy ra từ `control` chứ không bắt từng định nghĩa tự khai: đây là thuộc tính của
 * *loại control*, nên để nơi khai field tự nhớ là kiểu gì cũng có field bị bỏ sót, và
 * triệu chứng chỉ hiện ra khi nhìn — một `textarea` cao 3 dòng bị kẹp trong nửa cột.
 *
 * Khai bằng `Record` đủ khoá nên thêm control mới vào `ResourceFormControl` là **lỗi
 * biên dịch** ngay tại đây, buộc phải quyết định nó rộng hay hẹp.
 */
const FULL_WIDTH_BY_CONTROL: Record<ResourceFormControl, boolean> = {
  boolean: false,
  datetime: false,
  date: false,
  email: false,
  number: false,
  relation: false,
  select: false,
  text: false,
  textarea: true,
  tripStops: true,
  uuid: false,
};

export const isFullWidthControl = (field: ResourceFormField): boolean =>
  field.span === 2 || FULL_WIDTH_BY_CONTROL[field.control];

const text = (name: string, required = false): ResourceFormField => ({
  control: "text",
  name,
  required,
});
const uuid = (name: string, required = false): ResourceFormField => ({
  control: "uuid",
  name,
  required,
});
const relation = (
  name: string,
  relationResource: string,
  required = false,
  relationLabelFormat?: (record: RelationRecord) => string | undefined,
  relationLabelField?: string,
): ResourceFormField => ({
  control: "relation",
  name,
  required,
  relationResource,
  relationLabelFormat,
  relationLabelField,
});
const number = (
  name: string,
  required = false,
  min?: number,
  max?: number | (() => number),
): ResourceFormField => ({
  control: "number",
  name,
  required,
  ...(min === undefined ? {} : { min }),
  ...(max === undefined ? {} : { max }),
});
/** Năm sau — `year` của xe không được vượt mốc này. */
const nextYear = () => new Date().getFullYear() + 1;
/**
 * Trường server sở hữu: hiển thị nhưng không cho sửa. Xem `ResourceFormField.readOnly`.
 * `required` bị xoá vì trường không nhập được thì không thể bắt buộc nhập.
 */
const boolean = (name: string): ResourceFormField => ({
  control: "boolean",
  name,
  required: true,
});
const textarea = (name: string): ResourceFormField => ({
  control: "textarea",
  name,
});
const datetime = (name: string, required = false): ResourceFormField => ({
  control: "datetime",
  name,
  required,
});

const optionalAddress = [
  text("addressLine1"),
  text("addressLine2"),
  text("addressCity"),
  text("addressState"),
  text("addressZipCode"),
  text("addressCountry"),
] as const;

const requiredAddress = [
  text("addressLine1", true),
  text("addressLine2"),
  text("addressCity", true),
  text("addressState", true),
  text("addressZipCode", true),
  text("addressCountry", true),
] as const;

export const TRUCK_TYPES = [
  "SEMI_TRUCK",
  "FLATBED",
  "BOX_TRUCK",
  "TANKER",
  "REEFER",
] as const;

export const TRUCK_STATUSES = [
  "available",
  "in_use",
  "maintenance",
  "out_of_service",
] as const;

export const ADR_CLASSES = [
  "CLASS_1",
  "CLASS_2",
  "CLASS_3",
  "CLASS_4",
  "CLASS_5",
  "CLASS_6",
  "CLASS_7",
  "CLASS_8",
  "CLASS_9",
] as const;

export const truckSections: readonly ResourceFormSection[] = [
  {
    key: "identification",
    titleKey: "forms.sections.trucks.identification",
    descriptionKey: "forms.sections.trucks.identificationDesc",
    collapsible: false,
    fields: [
      {
        control: "text",
        name: "number",
        required: true,
        span: 2,
        component: "input",
        placeholderKey: "forms.placeholders.truckNumber",
      },
      {
        control: "text",
        name: "licensePlate",
        span: 1,
        component: "input",
        placeholderKey: "forms.placeholders.licensePlate",
      },
      {
        control: "text",
        name: "licensePlateState",
        span: 1,
        component: "input",
        placeholderKey: "forms.placeholders.licensePlateState",
      },
      {
        control: "text",
        name: "vin",
        span: 2,
        uppercase: true,
        maxLength: 17,
        component: "input",
        helperTextKey: "forms.helper.vin",
        placeholderKey: "forms.placeholders.vin",
      },
    ],
  },
  {
    key: "specs",
    titleKey: "forms.sections.trucks.specs",
    descriptionKey: "forms.sections.trucks.specsDesc",
    collapsible: false,
    fields: [
      {
        control: "select",
        name: "type",
        required: true,
        span: 1,
        component: "select",
        options: TRUCK_TYPES,
        defaultValue: "SEMI_TRUCK",
      },
      {
        control: "select",
        name: "status",
        required: true,
        span: 1,
        component: "select",
        options: TRUCK_STATUSES,
        defaultValue: "available",
      },
      {
        control: "number",
        name: "vehicleCapacity",
        required: true,
        min: 0,
        span: 1,
        component: "number",
        unit: "kg",
        placeholderKey: "forms.placeholders.vehicleCapacity",
      },
      {
        control: "number",
        name: "year",
        min: 1900,
        max: nextYear,
        span: 1,
        component: "number",
        placeholderKey: "forms.placeholders.year",
      },
      {
        control: "text",
        name: "make",
        span: 1,
        component: "input",
        placeholderKey: "forms.placeholders.make",
      },
      {
        control: "text",
        name: "model",
        span: 1,
        component: "input",
        placeholderKey: "forms.placeholders.model",
      },
    ],
  },
  {
    key: "drivers",
    titleKey: "forms.sections.trucks.drivers",
    descriptionKey: "forms.sections.trucks.driversDesc",
    collapsible: false,
    fields: [
      {
        control: "relation",
        name: "mainDriverId",
        relationResource: "drivers",
        span: 2,
        component: "entityPicker",
        relationLabelFormat: (r) =>
          r.firstName ? `${r.firstName} ${r.lastName ?? ""} (${r.email ?? r.id})` : (r.email || r.id),
      },
      {
        control: "relation",
        name: "secondaryDriverId",
        relationResource: "drivers",
        span: 2,
        component: "entityPicker",
        relationLabelFormat: (r) =>
          r.firstName ? `${r.firstName} ${r.lastName ?? ""} (${r.email ?? r.id})` : (r.email || r.id),
      },
    ],
  },
  {
    key: "hazmatAdr",
    titleKey: "forms.sections.trucks.hazmatAdr",
    descriptionKey: "forms.sections.trucks.hazmatAdrDesc",
    collapsible: true,
    defaultCollapsed: true,
    fields: [
      {
        control: "boolean",
        name: "isHazmatPlacarded",
        span: 1,
        component: "switch",
        helperTextKey: "forms.helper.isHazmatPlacarded",
      },
      {
        control: "boolean",
        name: "adrEquipmentIsAdrCertified",
        span: 1,
        component: "switch",
        helperTextKey: "forms.helper.adrEquipmentIsAdrCertified",
      },
      {
        control: "text",
        name: "adrEquipmentAllowedClasses",
        span: 2,
        component: "multiSelect",
        options: ADR_CLASSES,
        helperTextKey: "forms.helper.adrEquipmentAllowedClasses",
        dependsOn: {
          field: "adrEquipmentIsAdrCertified",
          value: true,
          resetOnHide: true,
        },
      },
      {
        control: "text",
        name: "adrEquipmentOrangePlateNumber",
        span: 2,
        component: "input",
        helperTextKey: "forms.helper.adrEquipmentOrangePlateNumber",
        placeholderKey: "forms.placeholders.adrEquipmentOrangePlateNumber",
        dependsOn: {
          field: "adrEquipmentIsAdrCertified",
          value: true,
          resetOnHide: true,
        },
      },
    ],
  },
];

export const resourceFormDefinitions: Readonly<
  Record<EditableResourceName, ResourceFormDefinition>
> = {
  customers: {
    fields: [
      text("name", true),
      { control: "email", name: "email" },
      text("phone"),
      text("status", true),
      textarea("notes"),
      text("taxId"),
      boolean("isVatExempt"),
      ...optionalAddress,
    ],
  },
  employees: {
    fields: [
      { control: "email", name: "email", required: true },
      text("firstName", true),
      text("lastName", true),
      text("phoneNumber"),
      text("salaryType", true),
      text("status", true),
      datetime("joinedDate", true),
      relation("roleId", "roles", false, (r) => r.displayName || r.name || r.id),
      number("salaryAmount", true, 0),
      text("salaryCurrency", true),
      ...optionalAddress,
    ],
  },
  terminals: {
    fields: [
      text("name", true),
      { ...text("code", true), pattern: /^[A-Za-z]{5}$/u, uppercase: true },
      { ...text("countryCode", true), pattern: /^[A-Za-z]{2}$/u, uppercase: true },
      text("type", true),
      textarea("notes"),
      ...requiredAddress,
    ],
  },
  trucks: {
    sections: truckSections,
    fields: truckSections.flatMap((section) => section.fields),
  },
  loads: {
    fields: [
      text("name", true),
      text("type", true),
      // Phải khớp đúng `LoadStatus` (5 giá trị). Thiếu giá trị nào thì load đang ở
      // trạng thái đó mở form edit sẽ ra ô trống và bị ghi đè khi lưu.
      //
      // Lưu ý: KHÔNG suy enum của form từ `src/types/*.dto.ts` — chính DTO từng khai thừa
      // `pending`/`in_transit`, và bản sửa theo DTO đó đã ghi đè mất trạng thái thật.
      // Nguồn sự thật là enum Java của backend; xem `resourceFormEnums.test.ts`.
      text("status", true),
      number("distance", true, 0),
      // Server công bố, không phải người dùng khai.
      boolean("isInProximity"),
      relation("customerId", "customers", true, (r) => r.name || r.id),
      relation(
        "assignedTruckId",
        "trucks",
        false,
        (r) => r.number ? `${r.number} (${r.licensePlate || "Xe"})` : r.id,
      ),
      relation(
        "assignedDispatcherId",
        "employees",
        false,
        (r) => r.firstName ? `${r.firstName} ${r.lastName}` : (r.email || r.id),
      ),
      text("source", true),
      datetime("requestedPickupDate"), datetime("requestedDeliveryDate"), textarea("notes"),
      boolean("isHazmat"), text("hazmatClass"), text("unNumber"), uuid("containerId"),
      uuid("originTerminalId"),
      uuid("destinationTerminalId"),
      text("externalSourceProvider"),
      text("externalSourceId"), text("externalBrokerReference"),
      number("deliveryCostAmount", true, 0), text("deliveryCostCurrency", true),
      text("originAddressLine1", true), text("originAddressLine2"),
      text("originAddressCity", true), text("originAddressState", true),
      text("originAddressZipCode", true), text("originAddressCountry", true),
      number("originLocationLatitude", true, -90, 90), number("originLocationLongitude", true, -180, 180),
      text("destinationAddressLine1", true), text("destinationAddressLine2"),
      text("destinationAddressCity", true), text("destinationAddressState", true),
      text("destinationAddressZipCode", true), text("destinationAddressCountry", true),
      number("destinationLocationLatitude", true, -90, 90), number("destinationLocationLongitude", true, -180, 180),
    ],
  },
  trips: {
    fields: [
      text("name", true), number("totalDistance", true, 0),
      // Phải khớp đúng `TripStatus` (4 giá trị) — `trip/TripStatus.java`.
      text("status", true),
      relation(
        "truckId",
        "trucks",
        false,
        (r) => r.number ? `${r.number} (${r.licensePlate || "Xe"})` : r.id,
      ),
    ],
  },
  invoices: {
    fields: [
      text("type", true),
      text("status", true),
      text("taxBehavior", false), textarea("notes"),
      datetime("dueDate"),
      relation("loadId", "loads", false, (r) => r.name ? `Load #${r.number ?? ""} ${r.name}` : r.id),
      relation("customerId", "customers", false, (r) => r.name || r.id),
      number("subtotalAmount", true, 0), text("subtotalCurrency", true),
      number("taxTotalAmount", true, 0), text("taxTotalCurrency", true),
      number("totalAmount", true, 0), text("totalCurrency", true),
    ],
  },
  payments: {
    // Dedicated create supplies PENDING/key; metadata editor uses a separate definition.
    fields: [
      relation("invoiceId", "invoices", true, (r) => r.number ? translate("crud.invoiceOption", { number: r.number }) : r.id),
      { ...number("amountAmount", true, 0), stringMode: true }, text("amountCurrency", true),
      textarea("description"), text("referenceNumber"),
      ...requiredAddress.map((field) => ({ ...field, name: `billing${field.name.charAt(0).toUpperCase()}${field.name.slice(1)}` })),
    ],
  },
};

export const createResourceFormInitialValues = (
  definition: ResourceFormDefinition,
): Record<string, unknown> => {
  const entries: Array<readonly [string, unknown]> = [];
  for (const field of definition.fields) {
    // Không seed trường server sở hữu: gửi `false` lúc create là client tự khẳng
    // định một sự thật của server (ví dụ `isInProximity`).
    if (field.readOnly) {
      continue;
    }
    if (field.defaultValue !== undefined) {
      entries.push([field.name, field.defaultValue]);
      continue;
    }
    if (field.control === "boolean") {
      entries.push([field.name, false]);
    }
    if (field.control === "tripStops") {
      entries.push([field.name, [{}]]);
    }
  }
  return Object.fromEntries(entries);
};

export const isEditableResourceName = (
  value: string | undefined,
): value is EditableResourceName =>
  value !== undefined && value in resourceFormDefinitions;
