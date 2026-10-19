import type { ReactElement } from "react";
import { PriorityShipmentCard } from "@/components/dashboard/PriorityShipmentCard";
import { usePriorityShipments } from "@/hooks/dashboard/usePriorityShipments";

export function DashboardPriorityShipment(): ReactElement {
  const { shipments, locale, isLoading, error, retry } = usePriorityShipments();
  return <PriorityShipmentCard shipments={shipments} locale={locale} isLoading={isLoading} error={error} onRetry={retry} />;
}
