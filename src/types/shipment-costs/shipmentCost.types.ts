import type { ISODateTime } from "@/types/api.types";

export interface ShipmentCostView {
  id: string;
  loadId: string;
  tripId?: string | null;
  truckId?: string | null;
  driverId?: string | null;
  category: string;
  costBasis: string;
  status: string;
  sourceType?: string | null;
  sourceId?: string | null;
  allocationMethod?: string | null;
  quantity?: number | null;
  unit?: string | null;
  unitRate?: number | null;
  amount: number;
  currency: string;
  incurredAt?: ISODateTime | null;
  verifiedAt?: ISODateTime | null;
  verifiedBy?: string | null;
  approvedAt?: ISODateTime | null;
  approvedBy?: string | null;
  postedAt?: ISODateTime | null;
  voidedAt?: ISODateTime | null;
  voidedBy?: string | null;
  voidReason?: string | null;
  note?: string | null;
  version?: number;
}
