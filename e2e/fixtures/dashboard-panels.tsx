import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { ConfigProvider, App as AntdApp } from "antd";
import { Refine } from "@refinedev/core";
import { I18nextProvider } from "react-i18next";
import { initializeAppI18n } from "../../src/locales";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { KpiStrip } from "@/features/dashboard/components/KpiStrip";
import { OperationsBrief } from "@/features/dashboard/components/OperationsBrief";
import { DispatchTimeline } from "@/features/dashboard/components/DispatchTimeline";
import { NetworkMiniMap } from "@/features/dashboard/components/NetworkMiniMap";
import { PriorityShipmentCard } from "@/components/dashboard/PriorityShipmentCard";
import type { DriverTimelineRow, OperationsBriefProps } from "@/types/dashboard/operations-panels.types";
import type { NetworkRouteLine, NetworkVehiclePoint } from "@/types/dashboard/network-map.types";
import { referenceShipment } from "./dashboard-reference.data";
import "@/styles/global.scss";
import "@/features/dashboard/components/OperationsDashboardView.scss";

const i18n = await initializeAppI18n({
  locale: "en",
  fallbackLocale: "en",
  strictMissingKeys: true,
});

// Screenshot-reference content is isolated to this visual test page.
const brief: OperationsBriefProps = {
  locale: "en", agentCount: 6, confidenceScore: 92, updatedAtLabel: "11:56",
  summary: "18 shipments may miss their delivery windows. The rest of the network is on plan.",
  causes: [{ label: "Route delays on I-80 and I-580", count: 7, share: 1 }, { label: "Oakland DC dock backlog", count: 5, share: .72 }, { label: "Driver schedule conflicts", count: 4, share: .56 }, { label: "Missing delivery confirmations", count: 2, share: .28 }],
  actions: [{ id: "a1", kind: "reroute", title: "Reroute 5 drivers", hint: "saves 2h 40m" }, { id: "a2", kind: "reassign", title: "Reassign 3 shipments", hint: "clears conflicts" }, { id: "a3", kind: "notify", title: "Notify 4 customers", hint: "drafts ready" }],
};
const drivers: DriverTimelineRow[] = [
  { driverId: "d1", driverName: "Marcus Johnson", vehiclePlate: "SF-48291", blocks: [
    { id: "b1", driverId: "d1", startAt: "08:00", endAt: "09:40", kind: "scheduled", label: "48117" },
    { id: "b2", driverId: "d1", startAt: "09:50", endAt: "15:20", kind: "active", label: "48291" },
    { id: "b3", driverId: "d1", startAt: "15:25", endAt: "16:20", kind: "overrun", label: "+47m", delayMinutes: 47 },
    { id: "b4", driverId: "d1", startAt: "16:30", endAt: "17:50", kind: "scheduled", label: "48340" },
  ] },
  { driverId: "d2", driverName: "Emily Rodriguez", vehiclePlate: "SF-49281", blocks: [
    { id: "b5", driverId: "d2", startAt: "07:00", endAt: "10:20", kind: "scheduled", label: "49102" },
    { id: "b6", driverId: "d2", startAt: "10:40", endAt: "13:10", kind: "delayed", label: "49281" },
    { id: "b7", driverId: "d2", startAt: "13:30", endAt: "15:15", kind: "ai-suggested", label: "Reassign" },
  ] },
  { driverId: "d3", driverName: "Luis Hernandez", vehiclePlate: "", statusTag: { text: "Available", tone: "positive" }, blocks: [
    { id: "b8", driverId: "d3", startAt: "07:30", endAt: "10:15", kind: "scheduled", label: "48874" },
    { id: "b9", driverId: "d3", startAt: "13:30", endAt: "15:15", kind: "ai-suggested", label: "→ 49281" },
  ] },
];
const vehicles: NetworkVehiclePoint[] = [
  { id: "v1", plate: "V-204", longitude: -122.31, latitude: 37.98, status: "idle", loadReference: "SF-48291", delayMinutes: 47, roadLabel: "I-80 E" },
  { id: "v2", plate: "V-205", longitude: -122.27, latitude: 37.80, status: "moving" },
  { id: "v3", plate: "V-206", longitude: -122.09, latitude: 37.85, status: "delayed" },
  { id: "v4", plate: "V-207", longitude: -122.35, latitude: 38.08, status: "moving" },
];
const networkRoutes: NetworkRouteLine[] = [
  { id: "r1", coordinates: [[-122.35,38.08],[-122.34,38.01],[-122.31,37.98],[-122.33,37.88],[-122.27,37.80],[-122.09,37.85]] },
  { id: "r2", status: "delayed", coordinates: [[-122.31,37.98],[-122.36,37.94],[-122.43,37.72]] },
  { id: "r3", isProposed: true, coordinates: [[-122.20,38.14],[-122.22,38.03],[-122.29,37.91],[-122.20,37.83],[-122.25,37.72]] },
];
const params = new URLSearchParams(window.location.search);
const view = params.get("view");
const empty = params.get("state") === "empty";
const root = document.getElementById("root");
const map = <NetworkMiniMap locale="en" isLive vehicles={empty ? [] : vehicles} routes={empty ? [] : networkRoutes} onRoadCount={empty ? undefined : 214} />;
const briefCard = <OperationsBrief {...(empty ? { locale: "en" } : brief)} />;
const timeline = <DispatchTimeline locale="en" drivers={empty ? [] : drivers} totalDriversCount={empty ? undefined : 214} now="11:58" />;
if (root) createRoot(root).render(<I18nextProvider i18n={i18n}><ConfigProvider><AntdApp><MemoryRouter><Refine options={{ disableTelemetry: true }} authProvider={{ login: async () => ({ success: false }), logout: async () => ({ success: true }), check: async () => ({ authenticated: true }), onError: async () => ({}), getIdentity: async () => ({ name: "Sarah Bennett" }) }}>
  {view ? <div style={{ maxWidth: view === "brief" ? 328 : view === "map" ? 335 : 640, height: view === "map" ? 185 : undefined, margin: "auto" }}>{view === "brief" ? briefCard : view === "map" ? map : timeline}</div>
    : <div className="ops-dashboard-layout"><div className="ops-grid-area-header"><DashboardHeader monitoringCount={214} approvalsCount={3} /></div><div className="ops-grid-area-kpi"><KpiStrip items={[{ label: "Đang trên đường", value: 214 }, { label: "Nguy cơ trễ", value: 18 }, { label: "Đúng giờ (OTD)", value: 94 }, { label: "Đã giao hôm nay", value: 46 }, { label: "Xe sẵn sàng", value: 14 }, { label: "Ngoại lệ", value: 2 }]} /></div><div className="ops-grid-area-priority"><PriorityShipmentCard locale="en" shipments={empty ? [] : [referenceShipment]} /></div><div className="ops-grid-area-brief">{briefCard}</div><div className="ops-grid-area-map">{map}</div><div className="ops-grid-area-timeline">{timeline}</div></div>}
</Refine></MemoryRouter></AntdApp></ConfigProvider></I18nextProvider>);
