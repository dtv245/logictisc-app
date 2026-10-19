import { createRoot } from "react-dom/client";
import { PriorityShipmentCard } from "@/components/dashboard/PriorityShipmentCard";

import { referenceShipment } from "./dashboard-reference.data";

const params = new URLSearchParams(window.location.search);
const state = params.get("state");
const root = document.getElementById("root");
if (root) createRoot(root).render(
  <PriorityShipmentCard locale={params.get("locale") === "vi" ? "vi" : "en"}
    shipments={state === "empty" ? [] : [referenceShipment]}
    isLoading={state === "loading"}
    error={state === "error" ? "Unable to load shipments. Please try again." : undefined}
    onRetry={state === "error" ? () => window.location.reload() : undefined}
  />,
);
