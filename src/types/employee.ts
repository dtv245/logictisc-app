/**
 * Chứa các kiểu dữ liệu nhân sự, phân quyền, giấy phép và chấm công.
 */

import type {
  AuditableEntity,
  DatabaseInterval,
  Money,
  OptionalAddress,
} from "./common";
import type { Document } from "./document";
import type { Invoice } from "./finance";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type SalaryType = "hourly" | "salary" | "per_mile" | "per_load";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type EmployeeStatus = "active" | "inactive" | "on_leave" | "terminated";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type DriverLicenseClass = "A" | "B" | "C";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type DriverLicenseStatus = "active" | "expired" | "suspended" | "revoked";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type TimeEntryType = "regular" | "overtime" | "break" | "leave";

/** Nhân viên thuộc tenant, bao gồm tài xế và điều phối viên. */
export interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  salaryType: SalaryType;
  status: EmployeeStatus;
  joinedDate: string;
  deviceToken?: string | null;
  stripeConnectedAccountId?: string | null;
  roleId?: string | null;
  address?: OptionalAddress | null;
  salary: Money;
}

/** Giấy phép lái xe và thời hạn chứng nhận của nhân viên. */
export interface DriverLicense extends AuditableEntity {
  id: string;
  employeeId: string;
  licenseNumber: string;
  licenseClass: DriverLicenseClass;
  /** Danh sách endorsement theo định dạng chuỗi do backend cung cấp. */
  endorsements: string;
  issuingCountry: string;
  issuingRegion?: string | null;
  issuedDate: string;
  expiresAt: string;
  medicalCertExpiresAt?: string | null;
  status: DriverLicenseStatus;
  documentId?: string | null;
  lastReminderSentAt?: string | null;
  lastReminderThresholdDays?: number | null;
}

/** Vai trò phân quyền trong phạm vi tenant. */
export interface TenantRole {
  id: string;
  name: string;
  displayName?: string | null;
  normalizedName: string;
}

/** Claim quyền được gán cho một vai trò tenant. */
export interface TenantRoleClaim {
  id: string;
  claimType: string;
  claimValue: string;
  roleId: string;
}

/** Khoảng thời gian làm việc dùng cho tính lương. */
export interface TimeEntry extends AuditableEntity {
  id: string;
  employeeId: string;
  date: string;
  startTime: DatabaseInterval;
  endTime: DatabaseInterval;
  totalHours: number;
  type: TimeEntryType;
  payrollInvoiceId?: string | null;
  notes?: string | null;
}

/** Nhân viên kèm vai trò và giấy phép thường được tải cùng. */
export interface EmployeeWithRelations extends Employee {
  role?: TenantRole | null;
  driverLicenses?: DriverLicense[];
}

/** Giấy phép lái xe kèm tài liệu chứng minh. */
export interface DriverLicenseWithRelations extends DriverLicense {
  document?: Document | null;
}

/** Bản ghi chấm công kèm nhân viên và hóa đơn lương. */
export interface TimeEntryWithRelations extends TimeEntry {
  employee?: Employee;
  payrollInvoice?: Invoice | null;
}
