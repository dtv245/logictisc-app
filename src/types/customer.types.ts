/**
 * Chứa các kiểu dữ liệu của module khách hàng và tài khoản khách hàng.
 */

import type { AuditableEntity, OptionalAddress } from "./common.types";

export type CustomerStatus = "active" | "inactive" | "suspended";

/** 
 * [DOMAIN MODEL] 
 * Khách hàng thuê dịch vụ vận tải của tenant. Dùng chủ yếu cho React Components, Refine Hooks và UI Table.
 */
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
 * Không chứa `id`, `createdAt`, `updatedAt` vì form không trực tiếp sửa chúng.
 */
export interface CustomerFormValues {
  name: string;
  email?: string;
  phone?: string;
  status: CustomerStatus;
  notes?: string;
  taxId?: string;
  isVatExempt: boolean;
  address?: OptionalAddress;
}
