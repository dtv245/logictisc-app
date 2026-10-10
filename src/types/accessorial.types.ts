import type { ISODateTime } from "./api.types";

export interface AccessorialChargeView {
  id: string;
  loadId: string;
  tripId?: string | null;
  tripStopId?: string | null;
  type: string;
  status: string;
  quantity: number;
  unit: string;
  rate: number;
  freeQuantity?: number | null;
  customerAmount: number;
  companyCostAmount?: number | null;
  driverPayAmount?: number | null;
  currency: string;
  occurredAt?: ISODateTime | null;
  approvedAt?: ISODateTime | null;
  approvedBy?: string | null;
  documentId?: string | null;
  note?: string | null;
  version?: number;
}
