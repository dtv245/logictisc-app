import { formatTimeOnly } from "@/formatters/dateTime";
import type { Load } from "@/types/load.types";
import type { PriorityShipmentViewModel, ShipmentCardLocale } from "@/types/dashboard/priority-shipment.types";

/** Maps only fields the current Load contract supplies; missing ETA and telemetry stay absent. */
export function adaptLiveLoadToPriorityShipment(
  load: Load,
  locale: ShipmentCardLocale,
  translateStatus: (status: string) => string,
): PriorityShipmentViewModel {
  return {
    id: load.id,
    reference: `#${load.number}`,
    origin: load.originAddressCity || load.originAddressLine1 || (locale === "vi" ? "Chưa có điểm đi" : "Origin unavailable"),
    destination: load.destinationAddressCity || load.destinationAddressLine1 || (locale === "vi" ? "Chưa có điểm đến" : "Destination unavailable"),
    customer: load.customerName || undefined,
    status: { label: translateStatus(load.status), tone: "neutral" },
    vehicleLabel: load.assignedTruckNumber || undefined,
    scheduledDelivery: load.requestedDeliveryDate ? formatTimeOnly(load.requestedDeliveryDate) : undefined,
    stops: [
      { id: `${load.id}-origin`, name: load.originAddressCity || load.originAddressLine1 || (locale === "vi" ? "Điểm đi" : "Origin"), time: load.pickedUpAt ? formatTimeOnly(load.pickedUpAt) : undefined, completed: Boolean(load.pickedUpAt) },
      { id: `${load.id}-destination`, name: load.destinationAddressCity || load.destinationAddressLine1 || (locale === "vi" ? "Điểm đến" : "Destination"), time: load.deliveredAt ? formatTimeOnly(load.deliveredAt) : undefined, completed: Boolean(load.deliveredAt) },
    ],
  };
}

/** Copies an explicitly supplied preview fixture into the shared presentation contract. */
export function adaptPreviewShipment(
  shipment: PriorityShipmentViewModel,
): PriorityShipmentViewModel {
  return {
    ...shipment,
    ...(shipment.status ? { status: { ...shipment.status } } : {}),
    ...(shipment.stops ? { stops: shipment.stops.map((stop) => ({ ...stop })) } : {}),
  };
}
