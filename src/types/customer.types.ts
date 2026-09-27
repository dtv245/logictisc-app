/**
 * Chứa các kiểu dữ liệu của module khách hàng và tài khoản khách hàng.
 */

import type { AuditableEntity, OptionalAddress } from "./common.types";

export type CustomerStatus = "active" | "inactive" | "suspended";

/** 
 * [DOMAIN MODEL] 
 * Khách hàng thuê dịch vụ vận tải của tenant. Dùng chủ yếu cho React Components, Refine Hooks và UI Table.
 */
export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: CustomerStatus;
  notes?: string | null;
  taxId?: string | null;
  isVatExempt: boolean;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZipCode?: string | null;
  addressCountry?: string | null;
  address?: OptionalAddress | null;
}

/** 
 * [DOMAIN MODEL] 
 * Liên kết một người dùng hệ thống với khách hàng. 
 */
export interface CustomerUser extends AuditableEntity {
  id: string;
  userId: string;
  customerId: string;
  email: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  displayName?: string | null;
}

/** 
 * [COMPOSITION MODEL] 
 * Khách hàng kèm các tài khoản có quyền truy cập. Phục vụ màn hình chi tiết (Show Page).
 */
export interface CustomerWithRelations extends Customer {
  users?: CustomerUser[];
}

/**
 * [FORM MODEL]
 * Đại diện chính xác cho các fields mà User có thể nhập liệu trong form Tạo/Sửa.
 * Đồng bộ với `resourceForms.ts`.
 */
export interface CustomerFormValues {
  name: string;
  email?: string;
  phone?: string;
  status: CustomerStatus;
  notes?: string;
  taxId?: string;
  isVatExempt: boolean;
  addressLine1?: string;
  addressLine2?: string;
  addressCity?: string;
  addressState?: string;
  addressZipCode?: string;
  addressCountry?: string;
  address?: OptionalAddress;
}
