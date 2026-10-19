import { Alert } from "antd";
import { AddressSearch } from "@/features/map/components/AddressSearch";
import { MapView } from "@/features/map/components/MapView";
import { useDeliveryPoints } from "@/features/map/hooks/useDeliveryPoints";

export function MapPage() {
  const { points, zones } = useDeliveryPoints();
  return <div style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
    <AddressSearch />
    <Alert type="info" showIcon message="Chưa có dữ liệu điểm giao hàng, vùng giao hàng và tuyến đường." />
    <div style={{ flex: 1, position: "relative", minHeight: 400 }}>
      <MapView points={points} zones={zones} routes={[]} />
    </div>
  </div>;
}
