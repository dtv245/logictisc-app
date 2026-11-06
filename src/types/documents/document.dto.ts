/** Exact DocumentView transport contract; capture time is not an upload timestamp. */
export interface DocumentDto {
  id: string;
  ownerType: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number | null;
  blobPath: string | null;
  blobContainer: string | null;
  type: string;
  status: string;
  description: string | null;
  uploadedById: string | null;
  uploadedByName: string | null;
  loadId: string | null;
  truckId: string | null;
  employeeId: string | null;
  recipientName: string | null;
  capturedAt: string | null;
  captureLatitude: number | null;
  captureLongitude: number | null;
  notes: string | null;
}
