import type { Address } from "./common.types";
import type { ISODateTime } from "./api.types";

export type TerminalType = "port" | "rail" | "warehouse" | "yard";

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
