import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Skeleton, theme } from "antd";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { NetworkRouteMap } from "@/components/dashboard/NetworkRouteMap";
import type {
  NetworkMapMarker,
  NetworkRouteLine,
  NetworkVehiclePoint,
} from "@/types/dashboard/network-map.types";
import type {
  DispatchMapVehicleInput,
  DispatchMapVehicleStatus,
  MapboxLngLat,
} from "@/types/tms-flow/mapbox.types";
import {
  type DispatchLoadStopSource,
  extractLoadStopInfo,
  formatVietnameseRouteBadge,
  normalizeDispatchMapVehicles,
  validateMapboxPublicToken,
} from "@/utils/tms-flow/mapbox";

const LazyMapboxDispatchMapCanvas = React.lazy(
  () => import("@/components/tms-flow/MapboxDispatchMapCanvas"),
);

const EMPTY_ROUTES: readonly NetworkRouteLine[] = [];
const EMPTY_DISPATCH_VEHICLES: readonly DispatchMapVehicleInput[] = [];
const EMPTY_ROUTE_COORDINATES: MapboxLngLat[] = [];

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
  routeFallback?: {
    origin: string;
    destination: string;
    coordinatesAvailable: boolean;
  };
  /** Bật chế độ bản đồ Mapbox GL JS cho màn điều phối. */
  dispatchMode?: boolean;
  /** Bản đồ tổng quan chỉ hiển thị xe và giữ mức zoom đủ gần khu vực vận hành. */
  overviewMode?: boolean;
  /** Lô hàng đang chọn ở màn điều phối. */
  selectedLoad?: DispatchLoadStopSource | null;
  /** Danh sách xe thực tế từ API (chỉ vẽ xe có tọa độ hợp lệ). */
  dispatchVehicles?: readonly DispatchMapVehicleInput[];
  /** Chuỗi tọa độ [lng, lat] của tuyến đường từ Mapbox Directions (hoặc đường thẳng fallback). */
  routeCoordinates?: MapboxLngLat[];
  /** Khoảng cách mét từ Mapbox Directions API. */
  distanceMeters?: number | null;
  /** Thời gian di chuyển giây từ Mapbox Directions API. */
  durationSeconds?: number | null;
  /** Đánh dấu đang vẽ đường thẳng đứt nét tham khảo khi Directions lỗi/hết hạn mức. */
  isFallbackStraightLine?: boolean;
  /** Cho phép truyền token trong test; mặc định đọc từ VITE_MAPBOX_ACCESS_TOKEN. */
  mapboxToken?: string | null;
}

function statusSymbol(status: DispatchMapVehicleStatus): string {
  if (status === "signal_lost") return "▲";
  if (status === "available") return "✓";
  return "■";
}

function hasAssignedTruckReference(load?: DispatchLoadStopSource | null): boolean {
  return Boolean(load?.assignedTruckId?.trim() || load?.assignedTruckNumber?.trim());
}

/** Real points only: load pickup/delivery, truck positions, and supplied route geometry. */
export function TmsFlowMap({
  markers,
  routes = EMPTY_ROUTES,
  vehicles = [],
  highlightedVehicleId,
  isRouteLoading = false,
  isRouteError = false,
  title,
  subtitle,
  testId,
  routeFallback,
  dispatchMode = false,
  overviewMode = false,
  selectedLoad,
  dispatchVehicles = EMPTY_DISPATCH_VEHICLES,
  routeCoordinates = EMPTY_ROUTE_COORDINATES,
  distanceMeters = null,
  durationSeconds = null,
  isFallbackStraightLine = false,
  mapboxToken,
}: TmsFlowMapProps) {
  const { t } = useTranslation();
  const { token: antdToken } = theme.useToken();
  const [mapRuntimeUnavailableReason, setMapRuntimeUnavailableReason] = useState<string | null>(null);

  const rawEnvToken =
    mapboxToken !== undefined
      ? mapboxToken
      : (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined);

  const tokenValidation = useMemo(
    () => validateMapboxPublicToken(rawEnvToken),
    [rawEnvToken],
  );

  useEffect(() => {
    if (!dispatchMode) return;
    if (!tokenValidation.valid) {
      const warning =
        tokenValidation.reason === "missing"
          ? "[TmsFlowMap] Mapbox public token is missing."
          : tokenValidation.reason === "secret_token_forbidden"
            ? "[TmsFlowMap] Mapbox secret-token prefix is forbidden in the frontend."
            : "[TmsFlowMap] Mapbox token has an invalid prefix; a public pk. token is required.";
      console.warn(warning);
    }
  }, [dispatchMode, tokenValidation.reason, tokenValidation.valid]);

  const stopInfo = useMemo(
    () => extractLoadStopInfo(selectedLoad),
    [selectedLoad],
  );

  const normalizedVehicles = useMemo(
    () =>
      normalizeDispatchMapVehicles(
        dispatchVehicles as DispatchMapVehicleInput[],
        selectedLoad?.assignedTruckId ?? null,
        selectedLoad?.assignedTruckNumber ?? null,
      ),
    [dispatchVehicles, selectedLoad?.assignedTruckId, selectedLoad?.assignedTruckNumber],
  );

  const assignedVehicle = useMemo(
    () => normalizedVehicles.find((v) => v.isAssignedToSelectedLoad) ?? null,
    [normalizedVehicles],
  );

  const routeBadgeText = useMemo(() => {
    if (isFallbackStraightLine || isRouteError) {
      return null;
    }
    return formatVietnameseRouteBadge(distanceMeters, durationSeconds);
  }, [distanceMeters, durationSeconds, isFallbackStraightLine, isRouteError]);

  const statusTextMap = useMemo(
    () => ({
      available: t("tmsDispatch.map.vehicleStatus.available"),
      in_use: t("tmsDispatch.map.vehicleStatus.inUse"),
      maintenance: t("tmsDispatch.map.vehicleStatus.maintenance"),
      out_of_service: t("tmsDispatch.map.vehicleStatus.outOfService"),
      unknown: t("tmsDispatch.map.vehicleStatus.unknown"),
      signal_lost: t("tmsDispatch.map.vehicleStatus.signalLost"),
    }),
    [t],
  );

  const formatUpdatedAtText = useCallback(
    (timeStr: string | null) =>
      timeStr
        ? t("tmsDispatch.map.updatedAtTime", { time: timeStr })
        : t("tmsDispatch.map.updatedAtUnavailable"),
    [t],
  );

  const isDarkTheme = useMemo(() => {
    if (typeof document !== "undefined") {
      const htmlTheme = document.documentElement.getAttribute("data-theme");
      if (htmlTheme === "dark" || document.documentElement.classList.contains("dark")) {
        return true;
      }
    }
    return false;
  }, []);

  const effectiveRouteCoords: MapboxLngLat[] = useMemo(() => {
    if (routeCoordinates.length >= 2) {
      return routeCoordinates;
    }
    if (
      (isFallbackStraightLine || isRouteError) &&
      stopInfo?.pickup.hasValidCoordinates &&
      stopInfo?.delivery.hasValidCoordinates &&
      stopInfo.pickup.lng !== null &&
      stopInfo.pickup.lat !== null &&
      stopInfo.delivery.lng !== null &&
      stopInfo.delivery.lat !== null
    ) {
      return [
        [stopInfo.pickup.lng, stopInfo.pickup.lat],
        [stopInfo.delivery.lng, stopInfo.delivery.lat],
      ];
    }
    return EMPTY_ROUTE_COORDINATES;
  }, [isFallbackStraightLine, isRouteError, routeCoordinates, stopInfo]);

  if (!dispatchMode) {
    const hasPoints = markers.length > 0 || vehicles.length > 0 || routes.length > 0;
    const routeMessage =
      routeFallback && !routeFallback.coordinatesAvailable
        ? t("tmsDispatch.map.noCoordinates")
        : isRouteError
          ? t("tmsDispatch.map.routeError")
          : isRouteLoading
            ? t("tmsDispatch.map.routeLoading")
            : routes.length === 0 && routeFallback
              ? t("tmsDispatch.map.routeUnavailable")
              : null;

    return (
      <FlowPanel
        subtitle={subtitle}
        testId={testId}
        title={title ?? t("tmsDispatch.map.activityTitle")}
      >
        <div className="tms-map">
          <div className="tms-map__canvas" style={overviewMode ? { height: 500 } : undefined}>
            <NetworkRouteMap
              highlightedVehicleId={highlightedVehicleId}
              markers={markers}
              routes={routes}
              vehicles={vehicles}
            />
          </div>
          {hasPoints || routeFallback ? (
            <>
              {routeFallback ? (
                <div className="tms-map__text-route" data-testid="tms-map-text-route">
                  <strong>
                    {routeFallback.origin} → {routeFallback.destination}
                  </strong>
                </div>
              ) : null}
              {routeMessage ? (
                <p className="tms-map__notice" role={isRouteError ? "status" : undefined}>
                  {routeMessage}
                </p>
              ) : null}
              {hasPoints ? (
                <div className="tms-map__legend" aria-label={t("tmsDispatch.map.legend")}>
                  <span>
                    <i className="tms-map__dot tms-map__dot--origin" aria-hidden="true" /> A ·{" "}
                    {t("tmsDispatch.map.origin")}
                  </span>
                  <span>
                    <i className="tms-map__dot tms-map__dot--destination" aria-hidden="true" /> B ·{" "}
                    {t("tmsDispatch.map.destination")}
                  </span>
                  {routes.length > 0 ? (
                    <span>
                      <i className="tms-map__line tms-map__line--proposed" aria-hidden="true" />{" "}
                      {t("tmsDispatch.map.proposedRoute")}
                    </span>
                  ) : null}
                  <span>
                    <i className="tms-map__dot tms-map__dot--moving" aria-hidden="true" />{" "}
                    {t("tmsDispatch.map.vehicleLocation")}
                  </span>
                </div>
              ) : null}
              {vehicles.length > 0 ? (
                <ul className="tms-map__vehicle-list" aria-label={t("tmsDispatch.map.vehicles")}>
                  {vehicles.map((vehicle) => (
                    <li key={vehicle.id}>
                      <strong>{vehicle.plate}</strong>
                      <span>{vehicle.loadReference ?? t("tmsDispatch.map.noDriver")}</span>
                      <span className={`tms-map__status tms-map__status--${vehicle.status}`}>
                        {t(`tmsDispatch.map.status.${vehicle.status}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p className="tms-empty">{t("tmsDispatch.map.noLocation")}</p>
          )}
          <p className="tms-map__disclaimer">{t("tmsDispatch.map.disclaimer")}</p>
        </div>
      </FlowPanel>
    );
  }

  // Chế độ bản đồ điều phối dùng Mapbox GL JS
  const canRenderMapbox =
    tokenValidation.valid && !mapRuntimeUnavailableReason && Boolean(tokenValidation.token);
  const pickupValid = Boolean(stopInfo?.pickup.hasValidCoordinates);
  const deliveryValid = Boolean(stopInfo?.delivery.hasValidCoordinates);
  const hasAssignedTruck = hasAssignedTruckReference(selectedLoad);
  const onlyPickupMissing = Boolean(stopInfo && !pickupValid && deliveryValid);
  const routeCoordinatesMissing = Boolean(stopInfo && (!pickupValid || !deliveryValid));
  const routeFailure = Boolean(
    selectedLoad &&
      pickupValid &&
      deliveryValid &&
      !isRouteLoading &&
      (isRouteError || isFallbackStraightLine || !tokenValidation.valid),
  );
  const mapStatusMessages = [
    !canRenderMapbox ? t("tmsDispatch.map.mapboxFallbackNotice") : null,
    routeCoordinatesMissing
      ? `${
          !pickupValid && !deliveryValid
            ? `${t("tmsDispatch.map.missingBothCoordinatesTitle")}.`
            : `${
                onlyPickupMissing
                  ? t("tmsDispatch.map.missingPickupCoordinates")
                  : t("tmsDispatch.map.missingDeliveryCoordinates")
              }.`
        } ${t("tmsDispatch.map.checkLoadAddressHint")}.`
      : null,
    routeFailure ? t("tmsDispatch.map.routeCalculationFailed") : null,
    selectedLoad && !hasAssignedTruck ? t("tmsDispatch.map.noTruckAssigned") : null,
    selectedLoad && hasAssignedTruck && !assignedVehicle
      ? t("tmsDispatch.map.noAssignedVehicleLocation")
      : null,
    selectedLoad && pickupValid && deliveryValid && isRouteLoading
      ? t("tmsDispatch.map.routeLoading")
      : null,
  ].filter((message): message is string => Boolean(message));

  const assignedTruckSource = dispatchVehicles.find(
    (vehicle) =>
      (selectedLoad?.assignedTruckId && vehicle.id === selectedLoad.assignedTruckId) ||
      (selectedLoad?.assignedTruckNumber &&
        (vehicle.number?.trim().toLowerCase() === selectedLoad.assignedTruckNumber.trim().toLowerCase() ||
          vehicle.licensePlate?.trim().toLowerCase() === selectedLoad.assignedTruckNumber.trim().toLowerCase())),
  );
  const assignedTruckValue = !hasAssignedTruck
    ? t("tmsDispatch.map.noTruckValue")
    : assignedVehicle
      ? `${assignedVehicle.licensePlate}${assignedVehicle.driverName ? ` (${assignedVehicle.driverName})` : ""} · ${statusTextMap[assignedVehicle.displayStatus]}`
      : assignedTruckSource?.licensePlate?.trim() ||
        assignedTruckSource?.number?.trim() ||
        selectedLoad?.assignedTruckNumber?.trim() ||
        "—";

  const laneHeadingText = stopInfo
    ? `${stopInfo.pickup.label} → ${stopInfo.delivery.label}`
    : routeFallback
      ? `${routeFallback.origin} → ${routeFallback.destination}`
      : null;

  return (
    <FlowPanel
      subtitle={subtitle}
      testId={testId}
      title={title ?? t("tmsDispatch.map.title")}
    >
      <div className="tms-map" data-testid="tms-mapbox-container">
        {canRenderMapbox && mapStatusMessages.length > 0 ? (
          <div
            className="tms-map__status-banner"
            data-testid="dispatch-map-status-banner"
            role="status"
          >
            <MapPin aria-hidden="true" size={20} />
            <div>
              {mapStatusMessages.map((message) => <p key={message}>{message}</p>)}
            </div>
          </div>
        ) : null}

        <div
          className="tms-map__canvas"
          style={{
            position: "relative",
            minHeight: overviewMode ? 500 : 320,
            ...(overviewMode ? { height: 500 } : {}),
          }}
        >
          {canRenderMapbox ? (
            <Suspense
              fallback={
                <div
                  data-testid="mapbox-loading-skeleton"
                  style={{
                    width: "100%",
                    height: 320,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f8fafc",
                    borderRadius: 12,
                  }}
                >
                  <Skeleton active paragraph={{ rows: 4 }} style={{ padding: 24, width: "100%" }} />
                </div>
              }
            >
              <LazyMapboxDispatchMapCanvas
                accessToken={tokenValidation.token as string}
                overviewMode={overviewMode}
                focusedVehicleId={highlightedVehicleId}
                isDarkTheme={isDarkTheme}
                primaryColor={antdToken.colorPrimary || "#1d4ed8"}
                selectedLoadId={selectedLoad?.id != null ? String(selectedLoad.id) : null}
                pickup={stopInfo?.pickup ?? null}
                delivery={stopInfo?.delivery ?? null}
                routeCoordinates={effectiveRouteCoords}
                isFallbackStraightLine={isFallbackStraightLine || isRouteError}
                routeBadgeText={routeBadgeText}
                vehicles={normalizedVehicles}
                recenterLabel={t("tmsDispatch.map.recenterToLoad")}
                zoomInLabel={t("tmsDispatch.map.zoomIn")}
                zoomOutLabel={t("tmsDispatch.map.zoomOut")}
                pickupTitle={t("tmsDispatch.map.origin")}
                deliveryTitle={t("tmsDispatch.map.destination")}
                licensePlateLabel={t("tmsDispatch.map.licensePlateLabel")}
                driverLabel={t("tmsDispatch.map.driverLabel")}
                noDriverLabel={t("tmsDispatch.map.noDriver")}
                statusLabel={t("tmsDispatch.map.statusLabel")}
                assignedVehicleBadgeLabel={t("tmsDispatch.map.assignedVehicleBadge")}
                statusTextMap={statusTextMap}
                formatUpdatedAtText={formatUpdatedAtText}
                onMapUnavailable={(reason) => setMapRuntimeUnavailableReason(reason)}
              />
            </Suspense>
          ) : (
            <div
              className="tms-map__fallback-box"
              data-testid="mapbox-fallback-notice"
              style={{
                height: "100%",
                minHeight: "inherit",
                boxSizing: "border-box",
                padding: "24px 20px",
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                overflow: "auto",
              }}
            >
              <div
                className="tms-map__fallback-message"
                data-testid="dispatch-map-fallback-status-banner"
                role="status"
                style={{ fontSize: 16, textAlign: "center" }}
              >
                <MapPin aria-hidden="true" size={24} />
                <div>
                  {mapStatusMessages.map((message) => <p key={message}>{message}</p>)}
                </div>
              </div>
              {stopInfo ? (
                <div
                  className="tms-map__fallback-route"
                  data-testid="tms-map-text-route"
                  style={{ fontSize: 16, textAlign: "center" }}
                >
                  <strong>
                    ▲ {stopInfo.pickup.label} <span aria-hidden="true">→</span> ◆ {stopInfo.delivery.label}
                  </strong>
                  <p>
                    <b>A · {t("tmsDispatch.map.origin")}:</b> {stopInfo.pickup.address}
                  </p>
                  <p>
                    <b>B · {t("tmsDispatch.map.destination")}:</b> {stopInfo.delivery.address}
                  </p>
                </div>
              ) : laneHeadingText ? (
                <div
                  className="tms-map__fallback-route"
                  data-testid="tms-map-text-route"
                  style={{ fontSize: 16, textAlign: "center" }}
                >
                  <strong>{laneHeadingText}</strong>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {!selectedLoad && !overviewMode ? (
          <p
            className="tms-map__notice"
            data-testid="dispatch-map-no-load"
            style={{ fontSize: 14, color: "#334155", margin: "8px 0 0" }}
          >
            {t("tmsDispatch.map.selectLoadPrompt")}
          </p>
        ) : null}

        {/* Khối tóm tắt dạng chữ ngay dưới bản đồ (hữu ích khi bản đồ lỗi và cho bàn phím/trợ năng) */}
        {selectedLoad && stopInfo ? (
          <div
            className="tms-map__text-summary"
            data-testid="dispatch-map-text-summary"
            aria-label={t("tmsDispatch.map.textSummaryTitle")}
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              fontSize: 14,
              lineHeight: 1.5,
              color: "#0f172a",
            }}
          >
            {canRenderMapbox && laneHeadingText ? (
              <div
                className="tms-map__text-route"
                data-testid="tms-map-text-route"
                style={{ fontWeight: 700, marginBottom: 4 }}
              >
                <span>▲ A: {stopInfo.pickup.label}</span>
                {" → "}
                <span>◆ B: {stopInfo.delivery.label}</span>
              </div>
            ) : null}
            {canRenderMapbox ? (
              <div style={{ color: "#334155", fontSize: 13 }}>
                <span>
                  <strong>A ({t("tmsDispatch.map.origin")}):</strong> {stopInfo.pickup.address}
                </span>
                {" · "}
                <span>
                  <strong>B ({t("tmsDispatch.map.destination")}):</strong> {stopInfo.delivery.address}
                </span>
              </div>
            ) : null}
            <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
              <span>
                <strong>{t("tmsDispatch.map.distanceDurationLabel")}:</strong>{" "}
                {routeBadgeText ?? "—"}
              </span>
              <span>
                <strong>{t("tmsDispatch.map.assignedVehicleLabel")}:</strong>{" "}
                {assignedVehicle
                  ? <>{statusSymbol(assignedVehicle.displayStatus)} {assignedTruckValue}</>
                  : assignedTruckValue}
              </span>
            </div>
          </div>
        ) : null}

        {/* Chú giải cố định dễ nhìn, chữ >= 14px, độ tương phản >= 4.5:1 */}
        <div
          className="tms-map__legend"
          data-testid="dispatch-map-legend"
          aria-label={t("tmsDispatch.map.legend")}
          style={{
            marginTop: 10,
            padding: "8px 12px",
            borderRadius: 8,
            background: "#f1f5f9",
            color: "#0f172a",
            fontSize: 14,
            lineHeight: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div>
            <span style={{ fontWeight: 600 }}>▲ A:</span> {t("tmsDispatch.map.origin")} ·{" "}
            <span style={{ fontWeight: 600 }}>◆ B:</span> {t("tmsDispatch.map.destination")} ·{" "}
            <span>{t("tmsDispatch.map.legendVehicleLocation")}</span>
          </div>
          <p
            className="tms-map__disclaimer"
            style={{ margin: 0, fontSize: 14, color: "#334155", fontWeight: 500 }}
          >
            {t("tmsDispatch.map.disclaimer")}
          </p>
        </div>
      </div>
    </FlowPanel>
  );
}
