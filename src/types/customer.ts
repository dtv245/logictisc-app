/**
 * Chứa các kiểu dữ liệu của module khách hàng và tài khoản khách hàng.
 */

import type { AuditableEntity, OptionalAddress } from "./common";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type CustomerStatus = "active" | "inactive" | "suspended";

/** Khách hàng thuê dịch vụ vận tải của tenant. */
export interface Customer extends AuditableEntity {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: CustomerStatus;
  notes?: string | null;
  taxId?: string | null;
  isVatExempt: boolean;
  address?: OptionalAddress | null;
}

/** Liên kết một người dùng hệ thống với khách hàng. */
export interface CustomerUser extends AuditableEntity {
  id: string;
  userId: string;
  customerId: string;
  email: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  displayName?: string | null;
}

/** Khách hàng kèm các tài khoản có quyền truy cập. */
export interface CustomerWithRelations extends Customer {
  users?: CustomerUser[];
}
