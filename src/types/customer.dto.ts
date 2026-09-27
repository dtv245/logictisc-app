/**
 * Các Type Enum do Backend quy định.
 */
export type ApiCustomerStatus = "active" | "inactive" | "suspended";

/**
 * Data Transfer Object (DTO) nhận trực tiếp từ API Backend trả về (`CustomerResponse.java`).
 * Tuyệt đối tôn trọng cấu trúc JSON của Backend ở file này:
 * - Address là các trường phẳng (addressLine1..addressCountry).
 * - Backend không trả audit fields (createdAt, updatedAt).
 */
export interface CustomerResponse {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: ApiCustomerStatus;
  notes?: string | null;
  taxId?: string | null;
  isVatExempt: boolean;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZipCode?: string | null;
  addressCountry?: string | null;
}

/**
 * Payload gửi lên API để tạo mới Customer (`CreateCustomerRequest.java`).
 */
export interface CreateCustomerRequest {
  name: string;
  email?: string | null;
  phone?: string | null;
  status: ApiCustomerStatus;
  notes?: string | null;
  taxId?: string | null;
  isVatExempt: boolean;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZipCode?: string | null;
  addressCountry?: string | null;
}

/**
 * Payload gửi lên API để cập nhật Customer (`PUT /api/customers/{id}`).
 */
export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;
