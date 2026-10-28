import type { ReactElement } from "react";
import { OperationsDashboardView } from "@/features/dashboard/components/OperationsDashboardView";

/** Preview mock data has been removed; delegates to the live Operations view. */
export function OperationsDashboardPreview(): ReactElement {
  return <OperationsDashboardView />;
}
