import type { ReactElement } from "react";
import { PriorityShipmentCard } from "@/components/dashboard/PriorityShipmentCard";
import { usePriorityShipments } from "@/hooks/dashboard/usePriorityShipments";

export function DashboardPriorityShipment(): ReactElement {
  const { shipments, locale, isLoading, isUnavailable, error, retry } = usePriorityShipments();
  return <PriorityShipmentCard shipments={shipments} locale={locale} isLoading={isLoading} isUnavailable={isUnavailable} error={error} onRetry={retry} />;
}
