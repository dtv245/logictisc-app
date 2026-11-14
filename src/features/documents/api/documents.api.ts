import type { DocumentType } from "@/types/documents/document.types";

// DocumentController exposes GET list, GET by id and DELETE only.
// POST /api/documents (multipart) and GET /api/documents/{id}/download are both
// absent from the backend, so both features stay dormant. See BE-020 in
// docs/backend-gaps.md. Unknown actions remain denied by the role matrix.
export const DOCUMENT_UPLOAD_CONTRACT_CONFIRMED = false;

/**
 * The backend has no file-content route. The UI must not issue a request to a
 * route that is known to be missing: `GET /api/documents/{id}` returns metadata
 * JSON, not a file, and must never be treated as a download.
 */
export const DOCUMENT_DOWNLOAD_CONTRACT_CONFIRMED = false;

export interface DocumentUploadPayload {
  file: File;
  type: DocumentType | string;
  description?: string | null;
  notes?: string | null;
  loadId?: string | null;
  truckId?: string | null;
  employeeId?: string | null;
}

/**
 * Xây dựng FormData cho upload tài liệu theo chuẩn multipart/form-data.
 * Browser/axios sẽ tự động sinh boundary và thiết lập Content-Type phù hợp.
 */
export function buildDocumentFormData(payload: DocumentUploadPayload): FormData {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("type", payload.type);
  if (payload.description) {
    formData.append("description", payload.description);
  }
  if (payload.notes) {
    formData.append("notes", payload.notes);
  }
  if (payload.loadId) {
    formData.append("loadId", payload.loadId);
  }
  if (payload.truckId) {
    formData.append("truckId", payload.truckId);
  }
  if (payload.employeeId) {
    formData.append("employeeId", payload.employeeId);
  }
  return formData;
}
