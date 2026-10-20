import axios from "axios";
import { getAuthHeaders } from "@/api/ai/ai.api";
import type { DocumentType } from "@/types/document.types";

// Runtime OpenAPI (2026-10-05) and DocumentController expose GET/DELETE only.
// Keep the upload implementation dormant until POST multipart is confirmed.
// See FE-DOC-001 and BE-020 in docs/plan-frontend-progress.md/backend-gaps.md.
export const DOCUMENT_UPLOAD_CONTRACT_CONFIRMED = false;

/** Fetch an existing document using the authenticated download endpoint. */
export async function fetchDocumentDownload(
  apiUrl: string,
  documentId: string,
): Promise<Blob> {
  const baseUrl = apiUrl.replace(/\/+$/, "");
  const response = await axios.get<Blob>(
    `${baseUrl}/api/documents/${encodeURIComponent(documentId)}/download`,
    {
      headers: getAuthHeaders(),
      responseType: "blob",
    },
  );
  const blob = response.data;
  const contentType = String(response.headers["content-type"] ?? blob?.type ?? "").toLowerCase();

  if (
    !(blob instanceof Blob) ||
    blob.size === 0 ||
    contentType.includes("application/json") ||
    contentType.includes("text/html")
  ) {
    throw new Error("DOCUMENT_DOWNLOAD_INVALID_RESPONSE");
  }

  return blob;
}

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
