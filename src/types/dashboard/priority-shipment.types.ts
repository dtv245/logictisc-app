export type ShipmentCardLocale = "vi" | "en";

export interface ShipmentRouteStop {
  id: string;
  name: string;
  time?: string;
  completed?: boolean;
  estimated?: boolean;
  positionPercent?: number;
}

/** Presentation values; absent telemetry must stay absent, rather than be inferred. */
export interface PriorityShipment {
  id: string;
  reference: string;
  origin: string;
  destination: string;
  customer?: string;
  status?: { label: string; tone: "warning" | "danger" | "success" | "neutral" };
  agent?: { label: string; timeLabel?: string };
  deliveryWindow?: string;
  scheduledDelivery?: string;
  eta?: string;
  delayMinutes?: number;
  detour?: { label: string; eta?: string; savedMinutes?: number; insideWindow?: boolean };
  driver?: { name: string; avatarUrl?: string; dutyLabel?: string };
  vehicleLabel?: string;
  speed?: { value: number; unit: "mph" | "km/h"; changePercent?: number; road?: string };
  fuel?: { percent?: number; range?: number; rangeUnit?: "mi" | "km" };
  reefer?: { temperature: number; setPoint?: number; unit: "F" | "C" };
  cargo?: { pallets?: number; capacity?: number; weight?: number; weightUnit?: "lb" | "kg" };
  stops?: readonly ShipmentRouteStop[];
  progressPercent?: number;
  congestion?: { startPercent: number; endPercent: number; label: string; changePercent?: number };
}

export interface PriorityShipmentCardProps {
  shipments?: readonly PriorityShipment[];
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  onSelectShipment?: (shipmentId: string) => void;
  locale?: ShipmentCardLocale;
  className?: string;
}
