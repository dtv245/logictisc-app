import type { Address } from "./common.types";
import type { TerminalType } from "./terminal.dto";

export interface Terminal {
  id: string;
  name: string;
  code: string;
  countryCode: string;
  type: TerminalType;
  notes?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZipCode?: string | null;
  addressCountry?: string | null;
  address?: Address | null;
  createdAt: string | Date;
  createdBy?: string | null;
  lastModifiedAt?: string | Date | null;
  lastModifiedBy?: string | null;
}
