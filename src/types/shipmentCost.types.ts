import type { ISODateTime } from "./api.types";

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
  approvedAt?: ISODateTime | null;
  postedAt?: ISODateTime | null;
  note?: string | null;
  version?: number;
}
