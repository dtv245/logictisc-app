import type { ContainerIsoType, ContainerStatus } from "@/types/containers/container.dto";
import type { Terminal } from "@/types/terminals/terminal.types";
import type { ISODateTime } from "@/types/api.types";

export interface Container {
  id: string;
  number: string;
  isoType: ContainerIsoType;
  sealNumber?: string | null;
  bookingReference?: string | null;
  billOfLadingNumber?: string | null;
  isLaden: boolean;
  grossWeight: number;
  status: ContainerStatus;
  currentTerminalId?: string | null;
  notes?: string | null;
  loadedAt?: ISODateTime | null;
  deliveredAt?: ISODateTime | null;
  returnedAt?: ISODateTime | null;
  /** ContainerView allows null (legacy rows may have no audit timestamp). */
  createdAt: ISODateTime | null;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
}

export interface ContainerWithRelations extends Container {
  currentTerminal?: Terminal | null;
}
