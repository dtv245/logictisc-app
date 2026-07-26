/**
 * Chứa các kiểu dữ liệu tài liệu và liên kết theo dõi chuyến hàng.
 */

import type { AuditableEntity, GeoLocation } from "./common";
import type { Load } from "./load";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type DocumentOwnerType =
  | "employee"
  | "load"
  | "truck"
  | "accident"
  | "dvir"
  | "maintenance";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type DocumentType =
  | "bill_of_lading"
  | "proof_of_delivery"
  | "driver_license"
  | "inspection"
  | "receipt"
  | "photo"
  | "signature"
  | "other";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type DocumentStatus = "active" | "archived" | "deleted";

/** Tệp tài liệu được gắn với một hoặc nhiều nghiệp vụ. */
export interface Document extends AuditableEntity {
  id: string;
  ownerType: DocumentOwnerType;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  blobPath: string;
  blobContainer: string;
  type: DocumentType;
  status: DocumentStatus;
  description?: string | null;
  uploadedById: string;
  employeeId?: string | null;
  loadId?: string | null;
  loadConditionReportId?: string | null;
  recipientName?: string | null;
  recipientSignature?: string | null;
  captureLocation?: GeoLocation | null;
  capturedAt?: string | null;
  tripStopId?: string | null;
  notes?: string | null;
  truckId?: string | null;
  accidentReportId?: string | null;
  dvirReportId?: string | null;
  maintenanceRecordId?: string | null;
}

/** Liên kết công khai có thời hạn để theo dõi chuyến hàng. */
export interface TrackingLink extends AuditableEntity {
  id: string;
  token: string;
  loadId: string;
  expiresAt: string;
  isActive: boolean;
  createdByUserId: string;
  accessCount: number;
  lastAccessedAt?: string | null;
}

/** Liên kết theo dõi kèm chuyến hàng được chia sẻ. */
export interface TrackingLinkWithRelations extends TrackingLink {
  load?: Load;
}
