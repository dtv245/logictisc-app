import type { ContainerIsoType, ContainerStatus } from "./container.dto";
import type { Terminal } from "./terminal.types";
import type { ISODateTime } from "./api.types";

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
  createdAt: ISODateTime;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
}

export interface ContainerWithRelations extends Container {
  currentTerminal?: Terminal | null;
}
