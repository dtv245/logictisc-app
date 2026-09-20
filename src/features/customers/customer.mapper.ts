import type { CustomerResponse, CreateCustomerRequest } from "@/types/customer.dto";
import type { Customer, CustomerFormValues } from "@/types/customer.types";

/**
 * Map từ Backend DTO sang Frontend Domain Model.
 * Hàm này đặc biệt hữu dụng khi API trả về JSON thô nhưng UI lại cần:
 * - Date string -> Javascript Date object
 * - fullName = firstName + lastName
 * - Format lại tiền tệ, v.v...
 */
export function mapCustomerResponseToDomain(response: CustomerResponse): Customer {
  return {
    ...response,
    // Ví dụ giả định: Nếu UI yêu cầu biến ngày chuỗi thành Date object thực thụ
    // createdAt: new Date(response.createdAt),
  };
}

/**
 * Map từ State của Form (những gì User nhập) sang Backend Request DTO.
 * Xử lý cắt khoảng trắng thừa (trim), ép kiểu (type casting), hoặc đặt giá trị mặc định.
 */
export function toCreateCustomerRequest(values: CustomerFormValues): CreateCustomerRequest {
  return {
    name: values.name.trim(),
    email: values.email?.trim() || null,
    phone: values.phone?.trim() || null,
    status: values.status,
    notes: values.notes?.trim() || null,
    taxId: values.taxId?.trim() || null,
    isVatExempt: values.isVatExempt,
    address: values.address || null,
  };
}
