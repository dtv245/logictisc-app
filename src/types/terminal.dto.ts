import type { ISODateTime } from "./api.types";

/**
 * Khớp `TerminalType` của backend (`terminal/TerminalType.java`).
 *
 * Backend lưu dạng CamelCase (`SeaPort`, `RailTerminal`…) nhưng `fromDbValue` chấp nhận **cả**
 * CamelCase lẫn tên hằng, nên API nhận đúng các giá trị UPPERCASE dưới đây.
 */
export type TerminalType =
  | "SEA_PORT"
  | "RAIL_TERMINAL"
  | "INLAND_DEPOT"
  | "AIR_CARGO"
  | "BORDER_CROSSING";

/**
 * Read model returned by terminal endpoints (`TerminalResponse.java`).
 * Cấu trúc địa chỉ là các trường phẳng (addressLine1..addressCountry).
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
  lastModifiedAt: ISODateTime;
}

/**
 * Create/update payload for a terminal (`CreateTerminalRequest.java`).
 */
export interface CreateTerminalRequest {
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
}

/**
 * Update payload for a terminal (`PUT /api/terminals/{id}`).
 */
export type UpdateTerminalRequest = Partial<CreateTerminalRequest>;
