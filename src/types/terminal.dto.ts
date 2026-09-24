import type { Address } from "./common.types";
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

export interface TerminalResponse {
  id: string;
  name: string;
  code: string;
  countryCode: string;
  type: TerminalType;
  notes?: string | null;
  address: Address;
  createdAt: ISODateTime;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
}
