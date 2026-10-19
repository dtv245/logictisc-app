import type { ProposedAction, TimelineBlockModel } from "@/features/dashboard/types/primitives.types";
import type { ShipmentCardLocale } from "@/types/dashboard/priority-shipment.types";

export interface CauseItem {
  label: string;
  count: number;
  share: number;
}

export interface OperationsBriefProps {
  summary?: string;
  causes?: readonly CauseItem[];
  actions?: readonly ProposedAction[];
  confidenceScore?: number;
  agentCount?: number;
  updatedAtLabel?: string;
  canViewRuns?: boolean;
  onApproveAction?: (action: ProposedAction) => Promise<void>;
  onRejectAction?: (action: ProposedAction) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  locale?: ShipmentCardLocale;
  className?: string;
}

export interface DriverTimelineRow {
  driverId: string;
  driverName: string;
  avatarUrl?: string;
  vehiclePlate: string;
  statusTag?: { text: string; tone: "positive" | "warning" | "negative" | "ai" };
  blocks: readonly TimelineBlockModel[];
}

export interface DispatchTimelineProps {
  totalDriversCount?: number;
  shownDriversCount?: number;
  drivers?: readonly DriverTimelineRow[];
  startHour?: number;
  endHour?: number;
  now?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  locale?: ShipmentCardLocale;
  className?: string;
}
