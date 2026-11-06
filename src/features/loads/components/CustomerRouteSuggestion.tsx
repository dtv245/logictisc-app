import { useList } from "@refinedev/core";
import { Alert, Button, Form, Tooltip, type FormInstance } from "antd";

import type { Load } from "@/types/loads/load.types";
import { isUsableCoordinate } from "@/utils/routeEstimate";

/** Các field địa chỉ có thể tái sử dụng từ đơn gần nhất của cùng khách hàng. */
const ROUTE_FIELDS = [
  "originAddressLine1",
  "originAddressLine2",
  "originAddressCity",
  "originAddressState",
  "originAddressZipCode",
  "originAddressCountry",
  "destinationAddressLine1",
  "destinationAddressLine2",
  "destinationAddressCity",
  "destinationAddressState",
  "destinationAddressZipCode",
  "destinationAddressCountry",
] as const;

const placeLabel = (city?: string | null, state?: string | null, line1?: string | null) =>
  [city, state].filter(Boolean).join(", ") || line1 || "—";

const hasRoute = (load: Load): boolean =>
  Boolean(load.originAddressLine1 && load.destinationAddressLine1);

export interface CustomerRouteSuggestionProps {
  form: FormInstance;
}

/**
 * Gợi ý tuyến lấy → giao dùng gần nhất của khách hàng đang chọn.
 *
 * Chỉ đọc đơn hàng thật từ `GET /api/loads?customerId=...`; không có lịch sử
 * thì không hiển thị gì. Khi bấm "Áp dụng", chỉ điền vào các field người dùng
 * chưa chạm tới.
 */
export function CustomerRouteSuggestion({ form }: CustomerRouteSuggestionProps) {
  const customerId = Form.useWatch("customerId", form) as string | undefined;

  const query = useList<Load>({
    resource: "loads",
    filters: [{ field: "customerId", operator: "eq", value: customerId ?? "" }],
    sorters: [{ field: "number", order: "desc" }],
    pagination: { pageSize: 5 },
    queryOptions: { enabled: Boolean(customerId), staleTime: 5 * 60 * 1000 },
  });

  const route = query.data?.data.find(hasRoute);

  if (!route) return null;

  const applyRoute = () => {
    const updates: Record<string, unknown> = {};

    for (const field of ROUTE_FIELDS) {
      const value = route[field];
      if (value === null || value === undefined || String(value).trim() === "") continue;
      if (!form.isFieldTouched(field)) {
        updates[field] = value;
      }
    }

    const coordinates = [
      {
        latitude: route.originLocationLatitude,
        longitude: route.originLocationLongitude,
        latitudeField: "originLocationLatitude",
        longitudeField: "originLocationLongitude",
      },
      {
        latitude: route.destinationLocationLatitude,
        longitude: route.destinationLocationLongitude,
        latitudeField: "destinationLocationLatitude",
        longitudeField: "destinationLocationLongitude",
      },
    ];
    for (const item of coordinates) {
      const candidate = {
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
      };
      if (!isUsableCoordinate(candidate)) continue;
      if (!form.isFieldTouched(item.latitudeField)) {
        updates[item.latitudeField] = candidate.latitude;
      }
      if (!form.isFieldTouched(item.longitudeField)) {
        updates[item.longitudeField] = candidate.longitude;
      }
    }

    if (Object.keys(updates).length > 0) {
      form.setFieldsValue(updates);
    }
  };

  const routeDescription = `${placeLabel(
    route.originAddressCity,
    route.originAddressState,
    route.originAddressLine1,
  )} → ${placeLabel(
    route.destinationAddressCity,
    route.destinationAddressState,
    route.destinationAddressLine1,
  )}`;

  return (
    <Alert
      action={
        <Button onClick={applyRoute} size="small" type="link">
          Áp dụng
        </Button>
      }
      description={
        <Tooltip title={routeDescription}>
          <span
            className="table-cell-ellipsis"
            style={{ maxWidth: "100%", verticalAlign: "bottom" }}
          >
            {routeDescription}
          </span>
        </Tooltip>
      }
      message={`Tuyến gần nhất của khách hàng (đơn #${route.number})`}
      showIcon
      style={{ marginBottom: 16 }}
      type="info"
    />
  );
}
