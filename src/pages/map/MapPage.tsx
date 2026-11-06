import { Alert, Empty, Select, Space, Spin, Typography } from "antd";
import { useMemo, useState } from "react";
import { AddressSearch } from "@/features/map/components/AddressSearch";
import { MapView } from "@/features/map/components/MapView";
import { useRouteEstimate } from "@/hooks/useRouteEstimate";
import { useTmsLoads } from "@/hooks/tms-flow/useTmsQueries";
import type { GeoCoordinate } from "@/utils/routeEstimate";

export function MapPage() {
  const loads = useTmsLoads();
  const [selectedLoadId, setSelectedLoadId] = useState<string>();
  const routeableLoads = useMemo(
    () => (loads.data?.shipments ?? []).filter((load) =>
      load.originLatitude != null && load.originLongitude != null &&
      load.destinationLatitude != null && load.destinationLongitude != null &&
      load.status !== "delivered" && load.status !== "cancelled",
    ),
    [loads.data?.shipments],
  );
  const selectedLoad = routeableLoads.find((load) => load.id === selectedLoadId) ?? routeableLoads[0];
  const origin: GeoCoordinate | undefined = selectedLoad?.originLatitude != null && selectedLoad.originLongitude != null
    ? { latitude: selectedLoad.originLatitude, longitude: selectedLoad.originLongitude }
    : undefined;
  const destination: GeoCoordinate | undefined = selectedLoad?.destinationLatitude != null && selectedLoad.destinationLongitude != null
    ? { latitude: selectedLoad.destinationLatitude, longitude: selectedLoad.destinationLongitude }
    : undefined;
  const route = useRouteEstimate(origin, destination, { includeGeometry: true });

  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column", gap: 10 }}>
      <Space wrap align="center" style={{ padding: "4px 8px" }}>
        <AddressSearch />
        <Typography.Text strong>Lô hàng trên bản đồ</Typography.Text>
        <Select
          aria-label="Chọn lô hàng để xem tuyến"
          showSearch
          optionFilterProp="label"
          placeholder="Chọn lô hàng có tọa độ"
          value={selectedLoad?.id}
          onChange={setSelectedLoadId}
          loading={loads.isLoading}
          disabled={loads.isLoading || routeableLoads.length === 0}
          style={{ width: 340, maxWidth: "100%" }}
          options={routeableLoads.map((load) => ({
            value: load.id,
            label: `#${load.number} · ${load.customerName} · ${load.originCity} → ${load.destinationCity}`,
          }))}
        />
      </Space>
      {loads.isLoading && <Alert type="info" showIcon message={<Space><Spin size="small" />Đang tải lô hàng…</Space>} />}
      {loads.isError && <Alert type="error" showIcon message="Không tải được lô hàng. Hãy thử tải lại trang." />}
      {!loads.isLoading && !loads.isError && routeableLoads.length === 0 && (
        <Alert type="info" showIcon message="Chưa có lô hàng đang hoạt động với đủ tọa độ lấy hàng và giao hàng để vẽ tuyến." />
      )}
      {selectedLoad && route.isLoading && <Alert type="info" showIcon message="Đang tìm tuyến đường khả dụng…" />}
      {selectedLoad && route.isError && <Alert type="warning" showIcon message="Dịch vụ định tuyến hiện không trả được tuyến đường cho lô hàng này." />}
      {selectedLoad && !route.isLoading && !route.isError && !route.estimate?.coordinates && (
        <Alert type="warning" showIcon message="Chưa có hình học tuyến đường khả dụng cho lô hàng đã chọn." />
      )}
      <div style={{ flex: 1, position: "relative", minHeight: 400 }}>
        <MapView
          points={[]}
          zones={[]}
          routes={[]}
          highlightedRouteCoordinates={route.estimate?.coordinates}
        />
        {!selectedLoad && !loads.isLoading && !loads.isError && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
            <Empty description="Chọn lô hàng có tọa độ để xem tuyến" />
          </div>
        )}
      </div>
    </div>
  );
}
