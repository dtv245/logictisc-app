import type { ISODateTime } from "./api.types";

/**
 * Data Transfer Object (DTO) cho Inspection endpoints (`/api/inspections`).
 * Khớp chính xác với Spring Boot `InspectionController`, `InspectionResponse.java`, `DefectResponse.java`, `CreateInspectionRequest.java`.
 */

export interface DefectResponse {
  id: string;
  partCategory: string;
  description: string;
  severity: string;
}

export interface DefectRequest {
  partCategory: string;
  description: string;
  severity: string;
}

export interface InspectionResponse {
  id: string;
  loadId: string;
  type: string;
  vin?: string | null;
  vehicleYear?: number | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleBodyClass?: string | null;
  containerNumber?: string | null;
  sealNumber?: string | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  inspectedAt: ISODateTime;
  inspectedById: string;
  inspectedByName?: string | null;
  defects: DefectResponse[];
}

export interface CreateInspectionRequest {
  loadId: string;
  type: string;
  vin?: string | null;
  vehicleYear?: number | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleBodyClass?: string | null;
  containerNumber?: string | null;
  sealNumber?: string | null;
  notes?: string | null;
  inspectorSignature?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  inspectedAt: ISODateTime;
  inspectedById: string;
  defects: DefectRequest[];
}

export type UpdateInspectionRequest = Partial<CreateInspectionRequest>;
