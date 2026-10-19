import type { PriorityShipment } from "@/types/dashboard/priority-shipment.types";

// Reference-image data belongs only to this visual test fixture, never the dashboard.
export const referenceShipment: PriorityShipment = {
  id: "reference-shipment", reference: "SF-48291", origin: "Oakland", destination: "Sacramento", customer: "Acme Retail",
  status: { label: "At Risk", tone: "warning" }, agent: { label: "Route agent flagged", timeLabel: "26 min ago" },
  deliveryWindow: "15:00–15:30", eta: "15:49", delayMinutes: 47,
  detour: { label: "I-680 detour", eta: "15:18", savedMinutes: 31, insideWindow: true },
  driver: { name: "Marcus Johnson", dutyLabel: "6h 12m on duty" }, vehicleLabel: "V-204",
  speed: { value: 38, unit: "mph", changePercent: -24, road: "I-80" },
  fuel: { percent: 64, range: 412, rangeUnit: "mi" }, reefer: { temperature: 34.1, setPoint: 34, unit: "F" },
  cargo: { pallets: 14, capacity: 26, weight: 8420, weightUnit: "lb" }, progressPercent: 44,
  congestion: { startPercent: 48, endPercent: 63, label: "I-80 E · Vallejo", changePercent: -24 },
  stops: [
    { id: "oakland", name: "Oakland DC", time: "09:48", completed: true, positionPercent: 0 },
    { id: "richmond", name: "Richmond", time: "10:41", completed: true, positionPercent: 22 },
    { id: "fairfield", name: "Fairfield", time: "12:55", positionPercent: 78 },
    { id: "sacramento", name: "Acme · Sacramento", time: "15:49", estimated: true, positionPercent: 100 },
  ],
};
