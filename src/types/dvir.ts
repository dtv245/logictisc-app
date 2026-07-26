/**
 * Chứa các kiểu dữ liệu báo cáo kiểm tra xe của tài xế và khiếm khuyết.
 */

import type { AuditableEntity, GeoLocation } from "./common";
import type { Employee } from "./employee";
import type { Trip } from "./trip";
import type { Truck } from "./truck";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type DvirReportType = "pre_trip" | "post_trip";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type DvirReportStatus =
  | "draft"
  | "submitted"
  | "reviewed"
  | "certified";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type DvirDefectCategory =
  | "brakes"
  | "engine"
  | "lights"
  | "steering"
  | "tires"
  | "other";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type DvirDefectSeverity = "minor" | "major" | "out_of_service";

/** Báo cáo kiểm tra phương tiện trước hoặc sau hành trình. */
export interface DvirReport extends AuditableEntity {
  id: string;
  truckId: string;
  driverId: string;
  type: DvirReportType;
  status: DvirReportStatus;
  inspectionDate: string;
  location?: GeoLocation | null;
  odometerReading?: number | null;
  hasDefects: boolean;
  driverSignature?: string | null;
  driverNotes?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  mechanicSignature?: string | null;
  mechanicNotes?: string | null;
  defectsCorrected?: boolean | null;
  tripId?: string | null;
}

/** Khiếm khuyết phương tiện được ghi nhận trong DVIR. */
export interface DvirDefect {
  id: string;
  dvirReportId: string;
  category: DvirDefectCategory;
  description: string;
  severity: DvirDefectSeverity;
  isCorrected: boolean;
  correctionNotes?: string | null;
  correctedAt?: string | null;
  correctedById?: string | null;
}

/** DVIR kèm xe, tài xế, hành trình và các khiếm khuyết. */
export interface DvirReportWithRelations extends DvirReport {
  truck?: Truck;
  driver?: Employee;
  reviewedBy?: Employee | null;
  trip?: Trip | null;
  defects?: DvirDefect[];
}
