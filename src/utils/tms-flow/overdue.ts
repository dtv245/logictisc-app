import type { LoadResponse } from "@/types/loads/load.dto";

export type TmsOverdueKind = "pickup" | "delivery";

export interface TmsOverdueReason {
  kind: TmsOverdueKind;
  dueAt: string;
  overdueMilliseconds: number;
}

export interface TmsOverdueResult {
  ended: boolean;
  reasons: TmsOverdueReason[];
  mostOverdueMilliseconds: number;
}

export type TmsOverdueInput = Pick<
  LoadResponse,
  | "cancelledAt"
  | "deliveredAt"
  | "pickedUpAt"
  | "requestedPickupDate"
  | "requestedDeliveryDate"
>;

const timestamp = (value?: string | null): number | undefined => {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** Applies the shared TMS definition: active load, missed pickup before pickup, or missed delivery. */
export function getTmsOverdue(
  load: TmsOverdueInput,
  now: number | Date = Date.now(),
): TmsOverdueResult {
  const nowMs = now instanceof Date ? now.getTime() : now;
  const ended = Boolean(load.deliveredAt || load.cancelledAt);
  if (ended || !Number.isFinite(nowMs)) {
    return { ended, reasons: [], mostOverdueMilliseconds: 0 };
  }

  const reasons: TmsOverdueReason[] = [];
  const pickupDueAt = timestamp(load.requestedPickupDate);
  if (!load.pickedUpAt && pickupDueAt !== undefined && pickupDueAt < nowMs) {
    reasons.push({
      kind: "pickup",
      dueAt: load.requestedPickupDate as string,
      overdueMilliseconds: nowMs - pickupDueAt,
    });
  }

  const deliveryDueAt = timestamp(load.requestedDeliveryDate);
  if (!load.deliveredAt && deliveryDueAt !== undefined && deliveryDueAt < nowMs) {
    reasons.push({
      kind: "delivery",
      dueAt: load.requestedDeliveryDate as string,
      overdueMilliseconds: nowMs - deliveryDueAt,
    });
  }

  reasons.sort((left, right) => right.overdueMilliseconds - left.overdueMilliseconds);
  return {
    ended: false,
    reasons,
    mostOverdueMilliseconds: reasons[0]?.overdueMilliseconds ?? 0,
  };
}

export function formatTmsOverdueDuration(overdueMilliseconds: number): {
  amount: number;
  unit: "days" | "hours";
} {
  const hours = Math.max(1, Math.floor(overdueMilliseconds / 3_600_000));
  return hours >= 24
    ? { amount: Math.floor(hours / 24), unit: "days" }
    : { amount: hours, unit: "hours" };
}
