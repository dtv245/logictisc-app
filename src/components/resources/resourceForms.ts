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

export interface ResourceFormField {
  control: ResourceFormControl;
  /**
   * `max` của `InputNumber`. Nhận hàm khi giá trị phụ thuộc thời điểm render
   * (ví dụ `year` không được vượt năm sau).
   */
  max?: number | (() => number);
  maxLength?: number;
  min?: number;
  name: string;
  options?: readonly string[];
  pattern?: RegExp;
  required?: boolean;
  /**
   * Trường do server sở hữu: hiển thị nhưng không cho người dùng sửa.
   *
   * Control được render `disabled`, và antd **vẫn giữ giá trị của field `disabled`
   * trong form store**, nên khi update giá trị gốc được gửi lại nguyên vẹn thay vì
   * bị xoá. Đây là chủ ý: repo chưa có `UpdateLoadRequest`/`UpdatePaymentRequest`
   * nên không xác minh được PUT là full-replace hay partial — gửi lại giá trị cũ
   * đúng trong cả hai trường hợp. Lúc create, field không có giá trị nên khoá bị bỏ
   * khỏi payload (`JSON.stringify` bỏ `undefined`) và server tự quyết định.
   */
  readOnly?: boolean;
  uppercase?: boolean;
  relationResource?: string;
  relationLabelFormat?: (record: RelationRecord) => string | undefined;
  relationLabelField?: string;
}

export interface ResourceFormDefinition {
  fields: readonly ResourceFormField[];
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
  FULL_WIDTH_BY_CONTROL[field.control];

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
const readOnly = (field: ResourceFormField): ResourceFormField => ({
  ...field,
  readOnly: true,
  required: false,
});
const boolean = (name: string): ResourceFormField => ({
  control: "boolean",
  name,
  required: true,
});
const select = (
  name: string,
  options: readonly string[],
  required = true,
): ResourceFormField => ({ control: "select", name, options, required });
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

export const resourceFormDefinitions: Readonly<
  Record<EditableResourceName, ResourceFormDefinition>
> = {
  customers: {
    fields: [
      text("name", true),
      { control: "email", name: "email" },
      text("phone"),
      select("status", ["active", "inactive", "suspended"]),
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
      select("salaryType", ["hourly", "salary", "per_mile", "per_load"]),
      select("status", ["active", "inactive", "on_leave", "terminated"]),
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
      select("type", [
        "SEA_PORT",
        "RAIL_TERMINAL",
        "INLAND_DEPOT",
        "AIR_CARGO",
        "BORDER_CROSSING",
      ]),
      textarea("notes"),
      ...requiredAddress,
    ],
  },
  trucks: {
    fields: [
      text("number", true),
      select("type", ["box_truck", "dry_van", "flatbed", "reefer", "tractor"]),
      number("vehicleCapacity", true, 0),
      select("status", ["available", "assigned", "in_transit", "maintenance", "out_of_service"]),
      text("make"), text("model"), number("year", false, 1900, nextYear),
      { ...text("vin"), uppercase: true },
      text("licensePlate"), text("licensePlateState"), boolean("isHazmatPlacarded"),
      relation(
        "mainDriverId",
        "drivers",
        false,
        (r) => r.firstName ? `${r.firstName} ${r.lastName} (${r.email})` : (r.email || r.id),
      ),
      relation(
        "secondaryDriverId",
        "drivers",
        false,
        (r) => r.firstName ? `${r.firstName} ${r.lastName} (${r.email})` : (r.email || r.id),
      ),
      boolean("adrEquipmentIsAdrCertified"),
      text("adrEquipmentAllowedClasses"), text("adrEquipmentOrangePlateNumber"),
    ],
  },
  loads: {
    fields: [
      text("name", true),
      select("type", ["container", "dry_van", "flatbed", "reefer", "vehicle"]),
      // Phải khớp đúng `LoadStatus` (5 giá trị). Thiếu giá trị nào thì load đang ở
      // trạng thái đó mở form edit sẽ ra ô trống và bị ghi đè khi lưu.
      //
      // Lưu ý: KHÔNG suy enum của form từ `src/types/*.dto.ts` — chính DTO từng khai thừa
      // `pending`/`in_transit`, và bản sửa theo DTO đó đã ghi đè mất trạng thái thật.
      // Nguồn sự thật là enum Java của backend; xem `resourceFormEnums.test.ts`.
      select("status", ["draft", "dispatched", "picked_up", "delivered", "cancelled"]),
      number("distance", true, 0),
      // Server công bố, không phải người dùng khai.
      readOnly(boolean("isInProximity")),
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
      select("source", ["manual", "customer_portal", "load_board", "api"]),
      datetime("requestedPickupDate"), datetime("requestedDeliveryDate"), textarea("notes"),
      boolean("isHazmat"), text("hazmatClass"), text("unNumber"), uuid("containerId"),
      relation(
        "originTerminalId",
        "terminals",
        false,
        (r) => r.code ? `[${r.code}] ${r.name}` : (r.name || r.id),
      ),
      relation(
        "destinationTerminalId",
        "terminals",
        false,
        (r) => r.code ? `[${r.code}] ${r.name}` : (r.name || r.id),
      ),
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
      select("status", ["draft", "dispatched", "completed", "cancelled"]),
      relation(
        "truckId",
        "trucks",
        false,
        (r) => r.number ? `${r.number} (${r.licensePlate || "Xe"})` : r.id,
      ),
      { control: "tripStops", name: "stops", required: true },
    ],
  },
  invoices: {
    fields: [
      select("type", ["customer", "payroll", "subscription", "credit_note"]),
      select("status", ["draft", "issued", "partially_paid", "paid", "cancelled"]),
      select("taxBehavior", ["exclusive", "inclusive"], false), textarea("notes"),
      datetime("dueDate"),
      relation("loadId", "loads", false, (r) => r.name ? `Load #${r.number ?? ""} ${r.name}` : r.id),
      relation("customerId", "customers", false, (r) => r.name || r.id),
      relation(
        "employeeId",
        "employees",
        false,
        (r) => r.firstName ? `${r.firstName} ${r.lastName}` : (r.email || r.id),
      ),
      number("subtotalAmount", true, 0), text("subtotalCurrency", true),
      number("taxTotalAmount", true, 0), text("taxTotalCurrency", true),
      number("totalAmount", true, 0), text("totalCurrency", true),
      datetime("periodStart"), datetime("periodEnd"), number("totalDistanceDriven", false, 0),
    ],
  },
  payments: {
    fields: [
      select("status", ["pending", "processing", "succeeded", "failed", "cancelled", "refunded"]),
      relation(
        "invoiceId",
        "invoices",
        false,
        (r) => r.number
          ? translate("crud.invoiceOption", { number: r.number })
          : (r.id ? translate("crud.invoiceOptionFallback", { id: r.id.slice(0, 8) }) : r.id),
      ),
      number("amountAmount", true, 0), text("amountCurrency", true),
      textarea("description"), text("referenceNumber"),
      // Stripe sở hữu hai ID này; UI không dựng luồng thanh toán Stripe.
      readOnly(text("stripePaymentMethodId")), readOnly(text("stripePaymentIntentId")),
      datetime("recordedAt"),
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
