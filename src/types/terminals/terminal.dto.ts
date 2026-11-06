import type { ApiResponse, ISODateTime, PagedResponse } from "@/types/api.types";

/**
 * Khớp `TerminalType` của backend (`terminal/TerminalType.java`).
 */
export type TerminalType =
  | "SEA_PORT"
  | "RAIL_TERMINAL"
  | "INLAND_DEPOT"
  | "AIR_CARGO"
  | "BORDER_CROSSING";

/**
 * Create payload for a terminal (`POST /api/terminals`).
 */
export interface CreateTerminalRequest {
  name: string;
  code: string;           // 5 chữ cái, ví dụ: USNYC
  countryCode: string;    // 2 chữ cái, ví dụ: US
  type: TerminalType;
  notes?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressCountry: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Local time, serialized as "HH:mm:ss". */
  workingHoursOpen?: string | null;
  /** Local time, serialized as "HH:mm:ss". */
  workingHoursClose?: string | null;
}

/**
 * Update payload for a terminal (`PUT /api/terminals/{id}`).
 * Body giống CreateTerminalRequest.
 */
export type UpdateTerminalRequest = CreateTerminalRequest;

/**
 * Read model returned by terminal endpoints (`TerminalResponse.java`).
 */
export interface TerminalResponse {
  id: string;
  name: string;
  code: string;
  countryCode: string;
  type: TerminalType;
  notes?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressCountry: string;
  latitude?: number | null;
  longitude?: number | null;
  workingHoursOpen?: string | null;
  workingHoursClose?: string | null;
  createdAt: ISODateTime;
  lastModifiedAt?: ISODateTime | null;
}

export type { ApiResponse, PagedResponse };
