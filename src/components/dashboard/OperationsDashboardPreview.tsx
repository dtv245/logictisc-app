import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PriorityShipmentCard } from "@/components/dashboard/PriorityShipmentCard";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { DispatchTimeline } from "@/features/dashboard/components/DispatchTimeline";
import { KpiStrip } from "@/features/dashboard/components/KpiStrip";
import { NetworkMiniMap } from "@/features/dashboard/components/NetworkMiniMap";
import { OperationsBrief } from "@/features/dashboard/components/OperationsBrief";
import type { KpiItemProps } from "@/features/dashboard/types/primitives.types";
import type { NetworkRouteLine, NetworkVehiclePoint } from "@/types/dashboard/network-map.types";
import type { DriverTimelineRow, OperationsBriefProps } from "@/types/dashboard/operations-panels.types";
import type { PriorityShipmentViewModel } from "@/types/dashboard/priority-shipment.types";
import { adaptPreviewShipment } from "@/features/dashboard/priorityShipmentAdapters";
import { resolveSupportedLocale } from "@/locales";
import "@/features/dashboard/components/OperationsDashboardView.scss";

/** Demo values stay in this explicitly selected preview, with display copy localized. */
export function OperationsDashboardPreview(): ReactElement {
  const { t, i18n } = useTranslation();
  const preview = (key: string, options?: Record<string, string | number>) => t(`dashboard.opsView.panels.preview.${key}`, options);
  const locale = resolveSupportedLocale(i18n.resolvedLanguage);
  const duration = locale === "vi" ? "5 giờ 20 phút" : locale === "ja" ? "5時間20分" : "5h 20m";

  const kpis: KpiItemProps[] = [
    { label: t("dashboard.opsView.kpi.inTransit"), value: 28, delta: { text: "+4", tone: "positive" }, tag: { text: preview("activeTag"), tone: "info" }, context: preview("allRoutes") },
    { label: t("dashboard.opsView.kpi.atRisk"), value: 3, delta: { text: "+2", tone: "negative" }, tag: { text: preview("interventionTag"), tone: "negative" }, context: t("dashboard.opsView.kpi.atRiskContext") },
    { label: t("dashboard.opsView.kpi.onTime"), value: 94, unit: "%", delta: { text: locale === "vi" ? "+1,2%" : "+1.2%", tone: "positive" }, context: preview("target") },
    { label: t("dashboard.opsView.kpi.deliveredToday"), value: 46, delta: { text: "+8", tone: "positive" }, context: preview("comparedYesterday") },
    { label: t("dashboard.opsView.kpi.assignableVehicles"), value: 14, tag: { text: preview("fleetTag"), tone: "neutral" }, context: preview("assignableContext") },
    { label: t("dashboard.opsView.kpi.exceptions"), value: 2, delta: { text: preview("warningTag"), tone: "warning" }, context: preview("deliveryIssues") },
  ];

  const shipments: PriorityShipmentViewModel[] = [
    {
      id: "demo-load-84920", reference: "LD-84920", origin: "Cảng Cát Lái", destination: "VSIP 1, Bình Dương", customer: preview("customerColdStorage"),
      status: { label: t("dashboard.opsView.kpi.atRisk"), tone: "warning" }, agent: { label: preview("routeRecommendation"), timeLabel: preview("sampleData") },
      deliveryWindow: "16:00–16:30", eta: "17:15", delayMinutes: 45,
      detour: { label: preview("detourRoute"), eta: "16:20", savedMinutes: 55, insideWindow: true },
      driver: { name: "Nguyễn Văn Hùng", dutyLabel: preview("drivingDuration", { duration }) }, vehicleLabel: "51D-892.41",
      speed: { value: 42, unit: "km/h", changePercent: -24, road: "QL13" }, fuel: { percent: 68, range: 412, rangeUnit: "km" },
      reefer: { temperature: -18.2, setPoint: -18, unit: "C" }, cargo: { pallets: 14, capacity: 26, weight: 14500, weightUnit: "kg" },
      progressPercent: 44, congestion: { startPercent: 48, endPercent: 65, label: "QL13 · Lái Thiêu", changePercent: -24 },
      stops: [
        { id: "demo-stop-1", name: "Cát Lái", time: "13:30", completed: true, positionPercent: 0 },
        { id: "demo-stop-2", name: "Thủ Đức", time: "14:15", completed: true, positionPercent: 25 },
        { id: "demo-stop-3", name: "Lái Thiêu", time: "15:20", positionPercent: 70 },
        { id: "demo-stop-4", name: "VSIP 1", time: "17:15", estimated: true, positionPercent: 100 },
      ],
    },
    {
      id: "demo-load-84921", reference: "LD-84921", origin: "Cảng Cát Lái", destination: "Kho Bến Lức, Long An", customer: preview("customerFoods"),
      status: { label: t("dashboard.opsView.panels.priority.onTime"), tone: "success" }, deliveryWindow: "15:30–16:00", eta: "15:50", delayMinutes: 0,
      driver: { name: "Trần Thị Lan", dutyLabel: preview("drivingDuration", { duration: locale === "vi" ? "4 giờ 10 phút" : locale === "ja" ? "4時間10分" : "4h 10m" }) }, vehicleLabel: "51D-326.78",
      speed: { value: 62, unit: "km/h", road: preview("expressway") }, fuel: { percent: 76, range: 485, rangeUnit: "km" },
      reefer: { temperature: 3.8, setPoint: 4, unit: "C" }, cargo: { pallets: 18, capacity: 26, weight: 11200, weightUnit: "kg" }, progressPercent: 72,
      stops: [
        { id: "demo-stop-5", name: "Cát Lái", time: "13:00", completed: true, positionPercent: 0 },
        { id: "demo-stop-6", name: "Bình Chánh", time: "14:35", completed: true, positionPercent: 50 },
        { id: "demo-stop-7", name: "Bến Lức", time: "15:50", estimated: true, positionPercent: 100 },
      ],
    },
  ];

  const brief: OperationsBriefProps = {
    summary: preview("summary"), agentCount: 6, confidenceScore: 92, updatedAtLabel: preview("updatedAt"), canViewRuns: false,
    causes: [
      { label: preview("congestionCause"), count: 1, share: 0.6 },
      { label: preview("portCause"), count: 1, share: 0.4 },
      { label: preview("scheduleCause"), count: 1, share: 0.3 },
    ],
    actions: [
      { id: "demo-action-1", kind: "reroute", title: preview("rerouteTitle"), hint: preview("rerouteHint") },
      { id: "demo-action-2", kind: "reassign", title: preview("reassignTitle"), hint: preview("reassignHint") },
      { id: "demo-action-3", kind: "notify", title: preview("notifyTitle"), hint: preview("notifyHint") },
    ],
  };

  const vehicles: NetworkVehiclePoint[] = [
    { id: "demo-truck-1", plate: "51D-892.41", latitude: 10.919, longitude: 106.705, status: "delayed", loadReference: "LD-84920", delayMinutes: 45, roadLabel: "QL13 · Lái Thiêu" },
    { id: "demo-truck-2", plate: "51D-326.78", latitude: 10.701, longitude: 106.474, status: "moving", loadReference: "LD-84921" },
    { id: "demo-truck-3", plate: "61C-415.62", latitude: 10.971, longitude: 106.711, status: "idle" },
    { id: "demo-truck-4", plate: "51H-782.19", latitude: 10.844, longitude: 106.78, status: "moving" },
    { id: "demo-truck-5", plate: "60C-238.95", latitude: 10.946, longitude: 106.843, status: "moving" },
  ];
  const networkRoutes: NetworkRouteLine[] = [
    { id: "demo-route-1", status: "delayed", coordinates: [[106.79, 10.76], [106.754, 10.85], [106.705, 10.919], [106.711, 10.971]] },
    { id: "demo-route-2", coordinates: [[106.79, 10.76], [106.67, 10.71], [106.55, 10.69], [106.474, 10.701], [106.42, 10.64]] },
    { id: "demo-route-3", isProposed: true, coordinates: [[106.754, 10.85], [106.78, 10.89], [106.768, 10.96], [106.711, 10.971]] },
  ];
  const drivers: DriverTimelineRow[] = [
    { driverId: "demo-driver-1", driverName: "Nguyễn Văn Hùng", vehiclePlate: "51D-892.41", blocks: [
      { id: "demo-block-1", driverId: "demo-driver-1", startAt: "07:00", endAt: "11:00", kind: "scheduled", label: "LD-84908" },
      { id: "demo-block-2", driverId: "demo-driver-1", startAt: "13:30", endAt: "16:30", kind: "active", label: "LD-84920" },
      { id: "demo-block-3", driverId: "demo-driver-1", startAt: "16:30", endAt: "17:15", kind: "overrun", label: locale === "vi" ? "+45 phút" : locale === "ja" ? "+45分" : "+45 min", delayMinutes: 45 },
    ] },
    { driverId: "demo-driver-2", driverName: "Trần Thị Lan", vehiclePlate: "51D-326.78", blocks: [
      { id: "demo-block-4", driverId: "demo-driver-2", startAt: "07:30", endAt: "11:30", kind: "scheduled", label: "LD-84912" },
      { id: "demo-block-5", driverId: "demo-driver-2", startAt: "13:00", endAt: "16:00", kind: "active", label: "LD-84921" },
    ] },
    { driverId: "demo-driver-3", driverName: "Phạm Minh Tuấn", vehiclePlate: "61C-415.62", statusTag: { text: preview("readyDriver"), tone: "positive" }, blocks: [
      { id: "demo-block-6", driverId: "demo-driver-3", startAt: "08:00", endAt: "12:00", kind: "scheduled", label: "LD-84915" },
      { id: "demo-block-7", driverId: "demo-driver-3", startAt: "15:30", endAt: "17:30", kind: "ai-suggested", label: preview("reassignBlock") },
    ] },
    { driverId: "demo-driver-4", driverName: "Lê Quốc Bảo", vehiclePlate: "51H-782.19", blocks: [
      { id: "demo-block-8", driverId: "demo-driver-4", startAt: "08:30", endAt: "12:30", kind: "scheduled", label: "LD-84916" },
      { id: "demo-block-9", driverId: "demo-driver-4", startAt: "14:00", endAt: "17:00", kind: "delayed", label: "LD-84922" },
    ] },
  ];

  return (
    <div className="ops-dashboard-layout">
      <div className="ops-grid-area-header"><DashboardHeader monitoringCount={28} approvalsCount={3} /></div>
      <div className="ops-grid-area-kpi"><KpiStrip items={kpis} /></div>
      <div className="ops-grid-area-priority"><PriorityShipmentCard shipments={shipments.map(adaptPreviewShipment)} /></div>
      <div className="ops-grid-area-brief"><OperationsBrief {...brief} /></div>
      <div className="ops-grid-area-map"><NetworkMiniMap vehicles={vehicles} routes={networkRoutes} onRoadCount={28} /></div>
      <div className="ops-grid-area-timeline"><DispatchTimeline drivers={drivers} totalDriversCount={32} now="15:20" /></div>
    </div>
  );
}
