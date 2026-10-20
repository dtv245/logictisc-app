import { useCan, useList } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import { resolveSupportedLocale, translateOptional } from "@/locales";
import type { ApiError } from "@/types/api.types";
import type { Load } from "@/types/load.types";
import type { PriorityShipment, ShipmentCardLocale } from "@/types/dashboard/priority-shipment.types";
import { adaptLiveLoadToPriorityShipment } from "@/features/dashboard/priorityShipmentAdapters";

/** The existing load API supplies scheduled times, not predicted ETA or vehicle telemetry. */
export function usePriorityShipments(): {
  shipments: PriorityShipment[];
  locale: ShipmentCardLocale;
  isLoading: boolean;
  isUnavailable: boolean;
  error?: string;
  retry: () => void;
} {
  const { t, i18n } = useTranslation();
  const locale: ShipmentCardLocale = resolveSupportedLocale(i18n.resolvedLanguage);
  const fixedT = i18n.getFixedT(locale);
  const access = useCan({ resource: "loads", action: "list" });
  const canRead = access.data?.can === true;
  const query = useList<Load, ApiError>({
    resource: "loads",
    filters: [{ field: "status", operator: "eq", value: "in_transit" }],
    pagination: { current: 1, pageSize: 20 },
    queryOptions: { enabled: canRead, staleTime: 30_000, retry: false },
  });
  const shipments: PriorityShipment[] = canRead && !query.isError
    ? (query.data?.data ?? []).map((load) => adaptLiveLoadToPriorityShipment(
      load,
      (status) => translateOptional(i18n, (key) => t(key), `forms.options.${status.toLowerCase()}`, status),
      { origin: fixedT("loads.redesign.originUnavailable"), destination: fixedT("loads.redesign.destinationUnavailable") },
    ))
    : [];

  let error: string | undefined;
  if (access.isError || (!access.isLoading && !canRead)) {
    error = fixedT("dashboard.opsView.panels.priority.permissionError");
  } else if (query.isError) {
    error = fixedT("dashboard.opsView.panels.priority.loadError");
  }

  return {
    shipments,
    locale,
    isLoading: access.isLoading || (canRead && query.isLoading),
    isUnavailable: canRead && !query.isLoading && !query.isError && query.data === undefined,
    error,
    retry: () => { if (canRead) void query.refetch(); else void access.refetch(); },
  };
}
