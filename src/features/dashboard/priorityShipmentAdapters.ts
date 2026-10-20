import { formatTimeOnly } from "@/formatters/dateTime";
import type { Load } from "@/types/load.types";
import type { PriorityShipmentViewModel } from "@/types/dashboard/priority-shipment.types";

/** Maps only fields the current Load contract supplies; missing ETA and telemetry stay absent. */
export function adaptLiveLoadToPriorityShipment(
  load: Load,
  translateStatus: (status: string) => string,
  unavailable: { origin: string; destination: string },
): PriorityShipmentViewModel {
  return {
    id: load.id,
    reference: `#${load.number}`,
    origin: load.originAddressCity || load.originAddressLine1 || unavailable.origin,
    destination: load.destinationAddressCity || load.destinationAddressLine1 || unavailable.destination,
    customer: load.customerName || undefined,
    status: { label: translateStatus(load.status), tone: "neutral" },
    vehicleLabel: load.assignedTruckNumber || undefined,
    scheduledDelivery: load.requestedDeliveryDate ? formatTimeOnly(load.requestedDeliveryDate) : undefined,
    stops: [
      { id: `${load.id}-origin`, name: load.originAddressCity || load.originAddressLine1 || unavailable.origin, time: load.pickedUpAt ? formatTimeOnly(load.pickedUpAt) : undefined, completed: Boolean(load.pickedUpAt) },
      { id: `${load.id}-destination`, name: load.destinationAddressCity || load.destinationAddressLine1 || unavailable.destination, time: load.deliveredAt ? formatTimeOnly(load.deliveredAt) : undefined, completed: Boolean(load.deliveredAt) },
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
