import type { ContainerIsoType, ContainerStatus } from "./container.dto";
import type { Terminal } from "./terminal.types";

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
  loadedAt?: Date | null;
  deliveredAt?: Date | null;
  returnedAt?: Date | null;
  createdAt: Date;
  createdBy?: string | null;
  lastModifiedAt?: Date | null;
  lastModifiedBy?: string | null;
}

export interface ContainerWithRelations extends Container {
  currentTerminal?: Terminal | null;
}
