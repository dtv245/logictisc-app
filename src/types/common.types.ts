/**
 * Chứa các kiểu dữ liệu dùng chung cho toàn bộ domain của CETA.
 */

export type AsyncStatus = "idle" | "pending" | "success" | "error";

export interface PaginationState {
  currentPage: number;
  pageSize: number;
}

/**
 * Địa chỉ đã được chuẩn hóa từ nhóm cột `*_address_*`.
 *
 * Property nested này thay cho các key cột phẳng; cần mapper nếu API không
 * tự serialize owned value object thành JSON nested.
 */
export interface Address {
  city: string;
  country: string;
  line1: string;
  line2?: string | null;
  state: string;
  zipCode: string;
}

/** Địa chỉ có toàn bộ thành phần nullable trong database. */
export type OptionalAddress = {
  [TField in keyof Address]?: Address[TField] | null;
};

/**
 * Tọa độ địa lý đã được chuẩn hóa từ cặp latitude/longitude.
 *
 * Property nested này thay cho hai key cột phẳng tương ứng trong database.
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

/**
 * Giá trị tiền tệ đã được chuẩn hóa từ cặp amount/currency.
 *
 * Property nested này thay cho hai key cột phẳng tương ứng trong database.
 */
export interface Money {
  amount: number;
  currency: string;
}

/** Các trường audit dùng chung do backend quản lý. */
export interface AuditableEntity {
  createdAt: string;
  createdBy?: string | null;
  lastModifiedAt?: string | null;
  lastModifiedBy?: string | null;
}

/**
 * Khoảng thời gian PostgreSQL.
 *
 * Giả định backend trả chuỗi `HH:mm:ss` hoặc ISO 8601 duration.
 */
export type DatabaseInterval = string;
