import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { NetworkRouteMap } from "@/components/dashboard/NetworkRouteMap";
import type {
  NetworkMapMarker,
  NetworkRouteLine,
  NetworkVehiclePoint,
} from "@/types/dashboard/network-map.types";

const EMPTY_ROUTES: readonly NetworkRouteLine[] = [];

export interface TmsFlowMapProps {
  markers: readonly NetworkMapMarker[];
  routes?: readonly NetworkRouteLine[];
  vehicles?: readonly NetworkVehiclePoint[];
  highlightedVehicleId?: string;
  isRouteLoading?: boolean;
  isRouteError?: boolean;
  title?: string;
  subtitle?: string;
  testId?: string;
}

/** Real points only: load pickup/delivery, truck positions, and supplied route geometry. */
export function TmsFlowMap({
  markers,
  routes = EMPTY_ROUTES,
  vehicles = [],
  highlightedVehicleId,
  isRouteLoading = false,
  isRouteError = false,
  title = "Bản đồ hoạt động",
  subtitle,
  testId,
}: TmsFlowMapProps) {
  const hasPoints = markers.length > 0 || vehicles.length > 0 || routes.length > 0;

  return (
    <FlowPanel subtitle={subtitle} testId={testId} title={title}>
      <div className="tms-map">
        <div className="tms-map__canvas">
          <NetworkRouteMap
            highlightedVehicleId={highlightedVehicleId}
            markers={markers}
            routes={routes}
            vehicles={vehicles}
          />
        </div>
        {hasPoints ? (
          <>
            <p className="tms-map__notice" role={isRouteError ? "status" : undefined}>
              {routes.length > 0
                ? "Đường tuyến đã tải được hiển thị màu tím; các điểm A/B đánh dấu nơi lấy và giao hàng."
                : isRouteLoading
                  ? "Đang tải hình học đường tuyến cho lô hàng…"
                  : isRouteError
                    ? "Không tải được đường tuyến. Các điểm lấy/giao vẫn được hiển thị nếu có tọa độ."
                    : "Chưa có hình học tuyến; bản đồ chỉ hiển thị các điểm có tọa độ đã ghi nhận."}
            </p>
            <div className="tms-map__legend" aria-label="Chú giải bản đồ">
              <span><i className="tms-map__dot tms-map__dot--origin" aria-hidden="true" /> Điểm lấy hàng</span>
              <span><i className="tms-map__dot tms-map__dot--destination" aria-hidden="true" /> Điểm giao hàng</span>
              {routes.length > 0 ? <span><i className="tms-map__line tms-map__line--proposed" aria-hidden="true" /> Tuyến load đang chọn</span> : null}
              <span><i className="tms-map__dot tms-map__dot--moving" aria-hidden="true" /> Xe</span>
            </div>
            {vehicles.length > 0 ? (
              <ul className="tms-map__vehicle-list" aria-label="Xe trên bản đồ">
                {vehicles.map((vehicle) => (
                  <li key={vehicle.id}>
                    <strong>{vehicle.plate}</strong>
                    <span>{vehicle.loadReference ?? "Chưa có tài xế"}</span>
                    <span className={`tms-map__status tms-map__status--${vehicle.status}`}>
                      {vehicle.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="tms-empty">
            Chưa có dữ liệu vị trí xe.
          </p>
        )}
      </div>
    </FlowPanel>
  );
}
