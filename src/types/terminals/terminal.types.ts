import type { Address } from "@/types/common.types";
import type {
  ApiResponse,
  CreateTerminalRequest,
  PagedResponse,
  TerminalResponse,
  TerminalType,
  UpdateTerminalRequest,
} from "./terminal.dto";
import type { ISODateTime } from "@/types/api.types";

export type {
  ApiResponse,
  CreateTerminalRequest,
  PagedResponse,
  TerminalResponse,
  TerminalType,
  UpdateTerminalRequest,
};

/**
 * Domain model của Terminal trong frontend.
 * Hỗ trợ các trường phẳng theo API response và đối tượng address lồng nhau khi cần.
 */
export interface Terminal {
  id: string;
  name: string;
  code: string;
  countryCode: string;
  type: TerminalType;
  notes?: string | null;
  address?: Address;
  addressLine1?: string;
  addressLine2?: string | null;
  addressCity?: string;
  addressState?: string;
  addressZipCode?: string;
  addressCountry?: string;
  latitude?: number | null;
  longitude?: number | null;
  workingHoursOpen?: string | null;
  workingHoursClose?: string | null;
  createdAt: ISODateTime;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
}
