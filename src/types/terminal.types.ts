import type { Address } from "./common.types";
import type { TerminalType } from "./terminal.dto";
import type { ISODateTime } from "./api.types";

export interface Terminal {
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
