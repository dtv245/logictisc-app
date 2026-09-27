import type { ISODateTime } from "./api.types";
import type { EmployeeStatus, SalaryType } from "./employee.types";

export type { EmployeeStatus, SalaryType };

/**
 * Data Transfer Object (DTO) nhận trực tiếp từ API Employee (`EmployeeResponse.java`).
 * Bao gồm cả `/api/employees` và `/api/drivers`.
 */
export interface EmployeeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  salaryType: SalaryType;
  status: EmployeeStatus;
  joinedDate: ISODateTime;
  roleId?: string | null;
  roleName?: string | null;
  salaryAmount: number;
  salaryCurrency: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZipCode?: string | null;
  addressCountry?: string | null;
}

/**
 * Payload gửi lên API để tạo mới Employee (`CreateEmployeeRequest.java`).
 */
export interface CreateEmployeeRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  salaryType: SalaryType;
  status: EmployeeStatus;
  joinedDate: ISODateTime;
  roleId?: string | null;
  salaryAmount: number;
  salaryCurrency: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZipCode?: string | null;
  addressCountry?: string | null;
}

/**
 * Payload gửi lên API để cập nhật Employee (`PUT /api/employees/{id}`).
 */
export type UpdateEmployeeRequest = Partial<CreateEmployeeRequest>;
