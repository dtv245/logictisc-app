import type { ISODateTime } from "./api.types";

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
  createdAt: ISODateTime;
  lastModifiedAt?: ISODateTime | null;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
  errors?: Array<{ field: string; message: string }>;
  meta?: { timestamp: string; requestId: string };
}
