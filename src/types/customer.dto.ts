import type { AuditableEntity, OptionalAddress } from "./common.types";

/**
 * Các Type Enum do Backend quy định.
 */
export type ApiCustomerStatus = "active" | "inactive" | "suspended";

/**
 * Data Transfer Object (DTO) nhận trực tiếp từ API Backend trả về (Response).
 * Tuyệt đối tôn trọng cấu trúc JSON của Backend ở file này.
 */
export interface CustomerResponse extends AuditableEntity {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: ApiCustomerStatus;
  notes?: string | null;
  taxId?: string | null;
  isVatExempt: boolean;
  address?: OptionalAddress | null;
}

/**
 * Payload gửi lên API để tạo mới Customer.
 * Thường sẽ KHÔNG CÓ `id` hay `createdAt`, `updatedAt` vì Backend tự sinh.
 */
export interface CreateCustomerRequest {
  name: string;
  email?: string | null;
  phone?: string | null;
  status: ApiCustomerStatus;
  notes?: string | null;
  taxId?: string | null;
  isVatExempt: boolean;
  address?: OptionalAddress | null;
}

/**
 * Payload gửi lên API để cập nhật Customer.
 * Sử dụng Partial vì thường Update (PATCH) chỉ cần gửi các trường bị thay đổi.
 */
export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;
