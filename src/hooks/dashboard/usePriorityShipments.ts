import { useCan, useList } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import { formatTimeOnly } from "@/formatters/dateTime";
import type { ApiError } from "@/types/api.types";
import type { Load } from "@/types/load.types";
import type { PriorityShipment, ShipmentCardLocale } from "@/types/dashboard/priority-shipment.types";

/** The existing load API supplies scheduled times, not predicted ETA or vehicle telemetry. */
export function usePriorityShipments(): {
  shipments: PriorityShipment[];
  locale: ShipmentCardLocale;
  isLoading: boolean;
  error?: string;
  retry: () => void;
} {
  const { t, i18n } = useTranslation();
  const locale: ShipmentCardLocale = i18n.resolvedLanguage?.startsWith("en") ? "en" : "vi";
  const access = useCan({ resource: "loads", action: "list" });
  const canRead = access.data?.can === true;
  const query = useList<Load, ApiError>({
    resource: "loads",
    filters: [{ field: "status", operator: "eq", value: "in_transit" }],
    pagination: { current: 1, pageSize: 20 },
    queryOptions: { enabled: canRead, staleTime: 30_000, retry: false },
  });
  const shipments: PriorityShipment[] = canRead && !query.isError ? (query.data?.data ?? []).map((load) => ({
    id: load.id,
    reference: `#${load.number}`,
    origin: load.originAddressCity || load.originAddressLine1 || (locale === "vi" ? "Chưa có điểm đi" : "Origin unavailable"),
    destination: load.destinationAddressCity || load.destinationAddressLine1 || (locale === "vi" ? "Chưa có điểm đến" : "Destination unavailable"),
    customer: load.customerName || undefined,
    status: { label: t(`forms.options.${load.status.toLowerCase()}`, { defaultValue: load.status }), tone: "neutral" },
    vehicleLabel: load.assignedTruckNumber || undefined,
    scheduledDelivery: load.requestedDeliveryDate ? formatTimeOnly(load.requestedDeliveryDate) : undefined,
    stops: [
      { id: `${load.id}-origin`, name: load.originAddressCity || load.originAddressLine1 || (locale === "vi" ? "Điểm đi" : "Origin"), time: load.pickedUpAt ? formatTimeOnly(load.pickedUpAt) : undefined, completed: Boolean(load.pickedUpAt) },
      { id: `${load.id}-destination`, name: load.destinationAddressCity || load.destinationAddressLine1 || (locale === "vi" ? "Điểm đến" : "Destination"), time: load.deliveredAt ? formatTimeOnly(load.deliveredAt) : undefined, completed: Boolean(load.deliveredAt) },
    ],
  })) : [];

  let error: string | undefined;
  if (access.isError || (!access.isLoading && !canRead)) {
    error = locale === "vi" ? "Bạn chưa có quyền xem chuyến vận chuyển." : "You do not have permission to view shipments.";
  } else if (query.isError) {
    error = locale === "vi" ? "Không tải được chuyến vận chuyển. Vui lòng thử lại." : "Unable to load shipments. Please try again.";
  }

  return {
    shipments,
    locale,
    isLoading: access.isLoading || (canRead && query.isLoading),
    error,
    retry: () => { if (canRead) void query.refetch(); else void access.refetch(); },
  };
}
