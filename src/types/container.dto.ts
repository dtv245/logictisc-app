import type { ISODateTime } from "./api.types";

export type ContainerIsoType = "20GP" | "20HC" | "40GP" | "40HC" | "45HC";

export type ContainerStatus = "available" | "booked" | "in_transit" | "delivered" | "returned";

export interface ContainerResponse {
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
