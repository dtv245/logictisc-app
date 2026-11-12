import { Alert, Button, Input, Spin } from "antd";
import { ArrowRight, MapPin, Search, Truck as TruckIcon } from "lucide-react";
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DispatchMapLayers } from "@/components/map/DispatchMapLayers";
import { MapShell } from "@/components/map/MapShell";
import { useMap } from "@/components/map/MapContext";
import { isMapStyleReady } from "@/components/map/mapStyleSafety";
import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { StatusTag } from "@/components/StatusTag";
import { routes } from "@/constants/routes";
import { useTmsWorkspace } from "@/hooks/tms-flow/useTmsWorkspace";
import { useRouteEstimate } from "@/hooks/useRouteEstimate";
import type { TruckResponse } from "@/types/trucks/truck.dto";
import type { TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";
import type { DispatchMapVehicleInput } from "@/types/tms-flow/mapbox.types";
import { toShipmentRouteLine } from "@/utils/tms-flow/map";
import { describeTmsError, formatTmsDateTime, operationalStatusMeta, riskMeta } from "@/utils/tms-flow/presentation";

type TrackingFilter = "all" | "moving" | "risk" | "available";

const truckStatusLabel = (status: TruckResponse["status"]): string => {
  switch (status) {
    case "in_use": return "Đang vận hành";
    case "available": return "Sẵn sàng";
    case "maintenance": return "Đang bảo trì";
    case "out_of_service": return "Ngừng hoạt động";
  }
};

const equipmentLabel = (type: TruckResponse["type"]): string => {
  switch (type) {
    case "SEMI_TRUCK": return "Xe đầu kéo";
    case "FLATBED": return "Sơ mi rơ moóc sàn";
    case "BOX_TRUCK": return "Xe thùng";
    case "TANKER": return "Xe bồn";
    case "REEFER": return "Xe lạnh";
  }
};

const buildActiveLoadsByTruck = (
  shipments: readonly TmsShipmentView[],
): Map<string, TmsShipmentView> => {
  const map = new Map<string, TmsShipmentView>();
  for (const shipment of shipments) {
    const truckId = shipment.assignedTruckId;
    if (!truckId || shipment.status === "delivered" || shipment.status === "cancelled") {
      continue;
    }
    const existing = map.get(truckId);
    if (!existing) {
      map.set(truckId, shipment);
    } else if (existing.status !== "in_transit" && shipment.status === "in_transit") {
      map.set(truckId, shipment);
    }
  }
  return map;
};

interface LiveVehicleItemProps {
  truck: TruckResponse;
  load?: TmsShipmentView;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const LiveVehicleItem = memo(function LiveVehicleItem({
  truck,
  load,
  isSelected,
  onSelect,
}: LiveVehicleItemProps) {
  const handleClick = useCallback(() => onSelect(truck.id), [onSelect, truck.id]);
  const statusTone =
    truck.status === "in_use"
      ? "processing"
      : truck.status === "available"
      ? "success"
      : "neutral";

  return (
    <button
      aria-pressed={isSelected}
      className={`tms-live-vehicle${isSelected ? " is-selected" : ""}`}
      key={truck.id}
      onClick={handleClick}
      type="button"
    >
      <span className="tms-live-vehicle__icon"><TruckIcon size={17} aria-hidden="true" /></span>
      <span className="tms-live-vehicle__content">
        <strong>{truck.number}</strong>
        <small>{truck.mainDriverName ?? "Chưa có tên tài xế"}</small>
        <span className="tms-live-vehicle__meta">
          {load ? `#${load.number} · ${load.originCity} → ${load.destinationCity}` : "Chưa có lô hàng đang chạy được liên kết"}
        </span>
        {load?.risk && load.risk !== "none" ? (
          <span className="tms-live-vehicle__risk">{riskMeta[load.risk].label}</span>
        ) : null}
      </span>
      <StatusTag label={truckStatusLabel(truck.status)} tone={statusTone} />
    </button>
  );
});

interface LiveTrackingMapContentProps {
  vehicles: readonly DispatchMapVehicleInput[];
  load?: TmsShipmentView;
  routeCoordinates: readonly [number, number][];
  routeLoading: boolean;
  routeError: boolean;
  selectedTruck?: TruckResponse;
  onVehicleSelect: (id: string) => void;
}

const LiveTrackingMapContent = memo(function LiveTrackingMapContent({
  vehicles,
  load,
  routeCoordinates,
  routeLoading,
  routeError,
  selectedTruck,
  onVehicleSelect,
}: LiveTrackingMapContentProps) {
  const map = useMap();

  useEffect(() => {
    if (load || !selectedTruck || selectedTruck.currentLocationLatitude == null || selectedTruck.currentLocationLongitude == null) {
      return undefined;
    }
    try {
      if (!isMapStyleReady(map)) return undefined;
      map.flyTo({
        center: [selectedTruck.currentLocationLongitude, selectedTruck.currentLocationLatitude],
        zoom: 12,
        duration: 450,
        padding: map.getPadding(),
      });
    } catch {
      // Selection can change while the WebGL context is restoring.
    }
    return undefined;
  }, [load, map, selectedTruck, selectedTruck?.currentLocationLatitude, selectedTruck?.currentLocationLongitude, selectedTruck?.id]);

  return (
    <DispatchMapLayers
      focusVehicleId={selectedTruck?.id}
      isRouteError={routeError}
      isRouteLoading={routeLoading}
      load={load}
      onVehicleSelect={onVehicleSelect}
      routeCoordinates={routeCoordinates}
      vehicles={vehicles}
    />
  );
});

export function LiveTrackingPage() {
  const navigate = useNavigate();
  const workspace = useTmsWorkspace();
  const [filter, setFilter] = useState<TrackingFilter>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedTruckId, setSelectedTruckId] = useState<string>();

  const locatedTrucks = useMemo(
    () => (workspace.trucks.data?.items ?? []).filter(
      (truck) => truck.currentLocationLatitude != null && truck.currentLocationLongitude != null,
    ),
    [workspace.trucks.data?.items],
  );

  const activeLoadsByTruck = useMemo(
    () => buildActiveLoadsByTruck(workspace.shipments),
    [workspace.shipments],
  );

  const trucksWithLoads = useMemo(
    () => locatedTrucks.map((truck) => ({ truck, load: activeLoadsByTruck.get(truck.id) })),
    [locatedTrucks, activeLoadsByTruck],
  );

  const filteredVehicles = useMemo(() => {
    const search = deferredQuery.trim().toLocaleLowerCase("vi-VN");
    return trucksWithLoads.filter(({ truck, load }) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "moving" && truck.status === "in_use") ||
        (filter === "available" && truck.status === "available") ||
        (filter === "risk" && load?.risk !== undefined && load.risk !== "none");
      if (!matchesFilter) return false;
      if (!search) return true;
      return [
        truck.number,
        truck.licensePlate ?? "",
        truck.mainDriverName ?? "",
        load?.number.toString() ?? "",
        load?.customerName ?? "",
        load?.originCity ?? "",
        load?.destinationCity ?? "",
      ].some((value) => value.toLocaleLowerCase("vi-VN").includes(search));
    });
  }, [trucksWithLoads, filter, deferredQuery]);

  const selected = useMemo(
    () =>
      filteredVehicles.find(({ truck }) => truck.id === selectedTruckId) ??
      trucksWithLoads.find(({ truck }) => truck.id === selectedTruckId) ??
      filteredVehicles[0],
    [filteredVehicles, trucksWithLoads, selectedTruckId],
  );
  const selectedTruck = selected?.truck;
  const selectedLoad = selected?.load;

  const routeOrigin = useMemo(
    () =>
      selectedLoad?.originLatitude != null && selectedLoad.originLongitude != null
        ? { latitude: selectedLoad.originLatitude, longitude: selectedLoad.originLongitude }
        : null,
    [selectedLoad],
  );
  const routeDestination = useMemo(
    () =>
      selectedLoad?.destinationLatitude != null && selectedLoad.destinationLongitude != null
        ? { latitude: selectedLoad.destinationLatitude, longitude: selectedLoad.destinationLongitude }
        : null,
    [selectedLoad],
  );
  const routeOptions = useMemo(() => ({ includeGeometry: true }), []);
  const routeQuery = useRouteEstimate(routeOrigin, routeDestination, routeOptions);

  const routeLines = useMemo(
    () => toShipmentRouteLine(selectedLoad, routeQuery.estimate?.coordinates),
    [selectedLoad, routeQuery.estimate?.coordinates],
  );
  const activeRouteCoordinates = useMemo(
    () => routeLines[0]?.coordinates ?? [],
    [routeLines],
  );

  const mapVehicles = useMemo<DispatchMapVehicleInput[]>(
    () => locatedTrucks.map((truck) => ({
      id: truck.id,
      number: truck.number,
      licensePlate: truck.licensePlate,
      mainDriverName: truck.mainDriverName,
      status: truck.status,
      currentLocationLatitude: truck.currentLocationLatitude,
      currentLocationLongitude: truck.currentLocationLongitude,
    })),
    [locatedTrucks],
  );

  const handleSelectTruck = useCallback((id: string) => {
    setSelectedTruckId(id);
  }, []);

  const handleMapVehicleSelect = useCallback(
    (id: string) => {
      if (!filteredVehicles.some(({ truck }) => truck.id === id)) {
        setFilter("all");
        setQuery("");
      }
      setSelectedTruckId(id);
    },
    [filteredVehicles],
  );

  const counts = useMemo(() => {
    let moving = 0;
    let risk = 0;
    let available = 0;
    for (const { truck, load } of trucksWithLoads) {
      if (truck.status === "in_use") moving += 1;
      if (truck.status === "available") available += 1;
      if (load?.risk !== undefined && load.risk !== "none") risk += 1;
    }
    return {
      all: trucksWithLoads.length,
      moving,
      risk,
      available,
    };
  }, [trucksWithLoads]);

  return (
    <div className="tms-page tms-map-page" data-testid="live-tracking-map-page">
      <MapShell
        leftTitle="Xe có vị trí"
        rightTitle="Chi tiết xe đang chọn"
        top={(
          <div className="tms-live-tracking__top">
            <Button onClick={() => void workspace.trucks.refetch()} loading={workspace.trucks.isFetching}>
              Làm mới vị trí
            </Button>
            {workspace.trucks.isLoading ? (
              <span className="tms-refresh-state" role="status" aria-live="polite">
                <Spin size="small" aria-hidden="true" /> Đang tải vị trí xe…
              </span>
            ) : (
              <span className="tms-refresh-state">
                {locatedTrucks.length} xe · vị trí theo tọa độ đã ghi nhận
              </span>
            )}
            {!workspace.trucks.isLoading && locatedTrucks.length === 0 ? (
              <span className="map-shell__no-vehicles" role="status">
                <MapPin size={16} aria-hidden="true" /> Chưa có vị trí xe nào
              </span>
            ) : null}
          </div>
        )}
        left={(
          <div className="tms-live-tracking__left">
            {workspace.loads.error ? (
              <Alert
                action={
                  <Button onClick={() => void workspace.loads.refetch()} size="small">
                    Thử lại
                  </Button>
                }
                description={describeTmsError(workspace.loads.error)}
                message="Không tải được thông tin lô hàng"
                showIcon
                type="warning"
              />
            ) : null}
            {workspace.trucksError ? (
              <Alert
                action={<Button onClick={() => void workspace.trucks.refetch()} size="small">Thử lại</Button>}
                description={describeTmsError(workspace.trucksError)}
                message="Không tải được vị trí xe"
                showIcon
                type="warning"
              />
            ) : null}
            <FlowPanel
          subtitle={`${filteredVehicles.length} xe trong danh sách`}
          title="Xe có vị trí"
          testId="live-tracking-list"
        >
          <Input
            allowClear
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm xe, tài xế hoặc lô hàng"
            prefix={<Search size={15} aria-hidden="true" />}
            value={query}
          />
          <div className="tms-filters tms-live-tracking__filters" role="group" aria-label="Lọc xe">
            {([
              ["all", "Tất cả", counts.all],
              ["moving", "Đang vận hành", counts.moving],
              ["risk", "Có rủi ro", counts.risk],
              ["available", "Sẵn sàng", counts.available],
            ] as const).map(([value, label, count]) => (
              <button
                aria-pressed={filter === value}
                className={filter === value ? "is-active" : ""}
                key={value}
                onClick={() => setFilter(value)}
                type="button"
              >
                {label} {count}
              </button>
            ))}
          </div>
          <div className="tms-live-tracking__vehicles">
            {workspace.trucks.isLoading ? (
              <p className="tms-empty" role="status" aria-live="polite">
                <Spin size="small" aria-hidden="true" /> Đang tải vị trí xe…
              </p>
            ) : null}
            {filteredVehicles.map(({ truck, load }) => (
              <LiveVehicleItem
                isSelected={selectedTruck?.id === truck.id}
                key={truck.id}
                load={load}
                onSelect={handleSelectTruck}
                truck={truck}
              />
            ))}
            {!workspace.trucks.isLoading && filteredVehicles.length === 0 ? (
              <p className="tms-empty">
                {locatedTrucks.length === 0
                  ? "Chưa có xe nào có tọa độ vị trí. Bản đồ sẽ hiển thị xe khi dữ liệu vị trí được ghi nhận."
                  : "Không có xe phù hợp với bộ lọc hoặc từ khóa tìm kiếm."}
              </p>
            ) : null}
          </div>
        </FlowPanel>
          </div>
        )}
        right={(
          <FlowPanel title="Chi tiết xe đang chọn" testId="live-tracking-details">
          {selectedTruck ? (
            <div className="tms-stack">
              <div className="tms-live-detail__heading">
                <span className="tms-live-vehicle__icon"><TruckIcon size={19} aria-hidden="true" /></span>
                <div>
                  <h2>{selectedTruck.number}</h2>
                  <p>{equipmentLabel(selectedTruck.type)}{selectedTruck.make || selectedTruck.model ? ` · ${[selectedTruck.make, selectedTruck.model].filter(Boolean).join(" ")}` : ""}</p>
                </div>
              </div>
              <dl className="tms-detail-list">
                <div><dt>Trạng thái xe</dt><dd>{truckStatusLabel(selectedTruck.status)}</dd></div>
                <div><dt>Tài xế</dt><dd>{selectedTruck.mainDriverName ?? "Chưa có dữ liệu"}</dd></div>
                <div>
                  <dt>Vị trí ghi nhận</dt>
                  <dd className="tms-live-detail__coordinates">
                    <MapPin size={13} aria-hidden="true" />
                    {selectedTruck.currentLocationLatitude?.toFixed(5)}, {selectedTruck.currentLocationLongitude?.toFixed(5)}
                  </dd>
                </div>
                <div><dt>Biển số</dt><dd>{selectedTruck.licensePlate ?? "Chưa có dữ liệu"}</dd></div>
              </dl>
              {selectedLoad ? (
                <div className="tms-live-detail__load">
                  <div className="tms-row">
                    <strong>Lô hàng #{selectedLoad.number}</strong>
                    <StatusTag label={operationalStatusMeta[selectedLoad.status].label} tone={operationalStatusMeta[selectedLoad.status].tone} />
                  </div>
                  <p>{selectedLoad.customerName}</p>
                  <div className="tms-live-detail__route">
                    <span>{selectedLoad.originCity}</span><ArrowRight size={14} aria-hidden="true" /><span>{selectedLoad.destinationCity}</span>
                  </div>
                  <p>Giờ giao yêu cầu: {formatTmsDateTime(selectedLoad.requestedDeliveryDate)}</p>
                  <Button block onClick={() => navigate(routes.tmsFlow.shipment.replace(":shipmentId", selectedLoad.id))}>
                    Mở chi tiết lô hàng
                  </Button>
                </div>
              ) : (
                <p className="tms-empty">
                  {workspace.loads.isLoading
                    ? "Đang tải thông tin lô hàng…"
                    : workspace.loads.error
                    ? "Chưa tải được thông tin lô hàng. Hãy thử lại để kiểm tra chuyến đang chạy."
                    : "Chưa có lô hàng đang hoạt động được liên kết với xe này."}
                </p>
              )}
              <p className="tms-live-detail__note">
                {routeLines.length > 0
                  ? "Đường tím là tuyến tham khảo giữa điểm lấy và giao đã lưu; vị trí xe hiển thị riêng theo tọa độ gần nhất."
                  : "Tốc độ, ETA trực tiếp, nhiên liệu và nhiệt độ chưa có trong dữ liệu xe hiện tại."}
              </p>
            </div>
          ) : (
            <p className="tms-empty">Chọn xe có tọa độ trong danh sách để xem thông tin.</p>
          )}
          </FlowPanel>
        )}
      >
        <LiveTrackingMapContent
          load={selectedLoad}
          onVehicleSelect={handleMapVehicleSelect}
          routeCoordinates={activeRouteCoordinates}
          routeError={routeQuery.isError}
          routeLoading={routeQuery.isLoading}
          selectedTruck={selectedTruck}
          vehicles={mapVehicles}
        />
        <div className="map-shell__legend" aria-label="Chú giải bản đồ">
          <span><b>▲ A:</b> Điểm lấy hàng</span>
          <span><b>◆ B:</b> Điểm giao hàng</span>
          <span><b>▰</b> Xe có vị trí được hệ thống ghi nhận</span>
          {routeLines.length > 0 ? (
            <span className="map-shell__legend-route">Đường đi tham khảo, không phải đường xe đã chạy</span>
          ) : null}
        </div>
      </MapShell>
    </div>
  );
}
