/**
 * Chứa các kiểu dữ liệu Hours of Service, ELD và hành vi tài xế.
 */

import type { DatabaseInterval, GeoLocation } from "./common";
import type { Employee } from "./employee";
import type { Truck } from "./truck";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type EldProviderType =
  | "samsara"
  | "motive"
  | "geotab"
  | "keeptruckin"
  | "other";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type DutyStatus =
  | "off_duty"
  | "sleeper_berth"
  | "driving"
  | "on_duty_not_driving";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type HosViolationType =
  | "driving_limit"
  | "on_duty_limit"
  | "rest_break"
  | "cycle_limit";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type DriverBehaviorEventType =
  | "harsh_acceleration"
  | "harsh_braking"
  | "harsh_cornering"
  | "speeding"
  | "distracted_driving";

/** Cấu hình kết nối với một nhà cung cấp ELD. */
export interface EldProviderConfiguration {
  id: string;
  providerType: EldProviderType;
  apiKey: string;
  apiSecret?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  webhookSecret?: string | null;
  isActive: boolean;
  lastSyncedAt?: string | null;
  externalAccountId?: string | null;
}

/** Một khoảng duty status trong nhật ký HOS của tài xế. */
export interface HosLog {
  id: string;
  employeeId: string;
  logDate: string;
  dutyStatus: DutyStatus;
  startTime: string;
  endTime?: string | null;
  durationMinutes: number;
  location?: string | null;
  geoLocation?: GeoLocation | null;
  remark?: string | null;
  externalLogId?: string | null;
  providerType: EldProviderType;
}

/** Vi phạm quy tắc Hours of Service của tài xế. */
export interface HosViolation {
  id: string;
  employeeId: string;
  violationDate: string;
  violationType: HosViolationType;
  description: string;
  severityLevel: number;
  isResolved: boolean;
  resolvedAt?: string | null;
  externalViolationId?: string | null;
  providerType: EldProviderType;
  ruleSetCode: string;
}

/** Trạng thái HOS hiện tại và quỹ thời gian còn lại của tài xế. */
export interface DriverHosStatus {
  id: string;
  employeeId: string;
  externalDriverId?: string | null;
  providerType: EldProviderType;
  currentDutyStatus: DutyStatus;
  statusChangedAt: string;
  drivingMinutesRemaining: number;
  onDutyMinutesRemaining: number;
  cycleMinutesRemaining: number;
  timeUntilBreakRequired?: DatabaseInterval | null;
  isInViolation: boolean;
  lastUpdatedAt: string;
  nextMandatoryBreakAt?: string | null;
}

/** Ánh xạ nhân viên nội bộ với tài xế tại nhà cung cấp ELD. */
export interface EldDriverMapping {
  id: string;
  employeeId: string;
  providerType: EldProviderType;
  externalDriverId: string;
  externalDriverName?: string | null;
  isSyncEnabled: boolean;
  lastSyncedAt?: string | null;
}

/** Ánh xạ xe tải nội bộ với phương tiện tại nhà cung cấp ELD. */
export interface EldVehicleMapping {
  id: string;
  truckId: string;
  providerType: EldProviderType;
  externalVehicleId: string;
  externalVehicleName?: string | null;
  isSyncEnabled: boolean;
  lastSyncedAt?: string | null;
}

/** Sự kiện hành vi lái xe được đồng bộ từ ELD. */
export interface DriverBehaviorEvent {
  id: string;
  employeeId: string;
  truckId?: string | null;
  eventType: DriverBehaviorEventType;
  occurredAt: string;
  providerType: EldProviderType;
  geoLocation?: GeoLocation | null;
  location?: string | null;
  speedMph?: number | null;
  speedLimitMph?: number | null;
  gForce?: number | null;
  durationSeconds?: number | null;
  externalEventId?: string | null;
  rawEventDataJson?: unknown | null; // TODO: định nghĩa shape cụ thể khi biết rõ payload.
  isReviewed: boolean;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  isDismissed?: boolean | null;
}

/** Nhật ký HOS kèm nhân viên sở hữu. */
export interface HosLogWithRelations extends HosLog {
  employee?: Employee;
}

/** Sự kiện hành vi kèm tài xế, xe và người review. */
export interface DriverBehaviorEventWithRelations extends DriverBehaviorEvent {
  employee?: Employee;
  truck?: Truck | null;
  reviewedBy?: Employee | null;
}
