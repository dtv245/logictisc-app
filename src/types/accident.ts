/**
 * Chứa các kiểu dữ liệu báo cáo tai nạn, bên thứ ba và nhân chứng.
 */

import type { AuditableEntity, GeoLocation } from "./common";
import type { Employee } from "./employee";
import type { Trip } from "./trip";
import type { Truck } from "./truck";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type AccidentReportStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "closed";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type AccidentType =
  | "collision"
  | "rollover"
  | "cargo_damage"
  | "property_damage"
  | "other";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type AccidentSeverity = "minor" | "moderate" | "serious" | "fatal";

/** Báo cáo chi tiết một tai nạn liên quan đến tài xế và xe tải. */
export interface AccidentReport extends AuditableEntity {
  id: string;
  driverId: string;
  truckId: string;
  tripId?: string | null;
  status: AccidentReportStatus;
  accidentType: AccidentType;
  severity: AccidentSeverity;
  accidentDateTime: string;
  location: GeoLocation;
  address?: string | null;
  description?: string | null;
  weatherConditions?: string | null;
  roadConditions?: string | null;
  anyInjuries: boolean;
  numberOfInjuries?: number | null;
  injuryDescription?: string | null;
  vehicleDamaged: boolean;
  vehicleDamageDescription?: string | null;
  /** Chi phí thiệt hại ước tính; schema không có cột currency đi kèm. */
  estimatedDamageCost?: number | null;
  vehicleDrivable: boolean;
  policeReportFiled: boolean;
  policeReportNumber?: string | null;
  policeOfficerName?: string | null;
  policeOfficerBadge?: string | null;
  policeDepartment?: string | null;
  insuranceNotified: boolean;
  insuranceNotifiedAt?: string | null;
  insuranceClaimNumber?: string | null;
  driverStatement?: string | null;
  driverSignature?: string | null;
  driverSignedAt?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
}

/** Bên thứ ba có liên quan đến một tai nạn. */
export interface AccidentThirdParty {
  id: string;
  accidentReportId: string;
  name: string;
  phoneNumber?: string | null;
  address?: string | null;
  driverLicense?: string | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  vehicleLicensePlate?: string | null;
  vehicleVin?: string | null;
  vehicleColor?: string | null;
  insuranceCompany?: string | null;
  insurancePolicyNumber?: string | null;
  insuranceAgentPhone?: string | null;
}

/** Nhân chứng cung cấp thông tin về một tai nạn. */
export interface AccidentWitness {
  id: string;
  accidentReportId: string;
  name: string;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
  statement?: string | null;
}

/** Báo cáo tai nạn kèm các quan hệ thường dùng khi điều tra. */
export interface AccidentReportWithRelations extends AccidentReport {
  driver?: Employee;
  truck?: Truck;
  trip?: Trip | null;
  reviewedBy?: Employee | null;
  thirdParties?: AccidentThirdParty[];
  witnesses?: AccidentWitness[];
}
