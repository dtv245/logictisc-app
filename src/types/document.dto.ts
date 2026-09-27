import type { ISODateTime } from "./api.types";
import type { DocumentOwnerType, DocumentStatus, DocumentType } from "./document.types";

export type { DocumentOwnerType, DocumentStatus, DocumentType };

/**
 * Data Transfer Object (DTO) nhận trực tiếp từ API Backend Document (`DocumentResponse.java`).
 */
export interface DocumentResponse {
  id: string;
  ownerType: DocumentOwnerType | string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  blobPath: string;
  blobContainer: string;
  type: DocumentType | string;
  status: DocumentStatus | string;
  description?: string | null;
  uploadedById: string;
  uploadedByName?: string | null;
  loadId?: string | null;
  truckId?: string | null;
  employeeId?: string | null;
  recipientName?: string | null;
  capturedAt?: ISODateTime | null;
  captureLatitude?: number | null;
  captureLongitude?: number | null;
  notes?: string | null;
}

/**
 * Metadata gửi kèm multipart file upload (`DocumentUploadRequest.java`).
 */
export interface DocumentUploadRequest {
  ownerType: DocumentOwnerType | string;
  type: DocumentType | string;
  description?: string | null;
  uploadedById: string;
  loadId?: string | null;
  truckId?: string | null;
  employeeId?: string | null;
  recipientName?: string | null;
  capturedAt?: ISODateTime | null;
  captureLatitude?: number | null;
  captureLongitude?: number | null;
  notes?: string | null;
}
