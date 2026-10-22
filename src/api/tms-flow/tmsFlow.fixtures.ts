/**
 * Demo dataset for the `/tms` flow. Every value is browser-local sample data;
 * no screen imports this module directly (only the demo gateway does).
 */

import type {
  AuditEvent,
  Driver,
  MapRoute,
  MapVehicle,
  MessageThread,
  RouteApproval,
  RoutePlan,
  Shipment,
  TmsFlowSnapshot,
  TrackingLink,
  Vehicle,
} from "@/types/tms-flow/tmsFlow.types";

const DAY = "2026-10-05";
const NEXT_DAY = "2026-10-06";

export const demoT = (time: string): string => `${DAY}T${time}:00-07:00`;
const nextDayT = (time: string): string => `${NEXT_DAY}T${time}:00-07:00`;

const drivers: Driver[] = [
  { id: "D-MARCUS", name: "Marcus Johnson", phone: "+1 415 555 0134", homeTerminal: "Oakland" },
  { id: "D-EMILY", name: "Emily Rodriguez", phone: "+1 415 555 0198", homeTerminal: "Hayward" },
  { id: "D-MICHAEL", name: "Michael Thompson", phone: "+1 415 555 0177", homeTerminal: "San Jose" },
  { id: "D-LUIS", name: "Luis Hernandez", phone: "+1 415 555 0142", homeTerminal: "Stockton" },
  { id: "D-PRIYA", name: "Priya Shah", phone: "+1 415 555 0110", homeTerminal: "Fremont" },
  { id: "D-DANIEL", name: "Daniel Kim", phone: "+1 415 555 0155", homeTerminal: "Sacramento" },
  { id: "D-AISHA", name: "Aisha Patel", phone: "+1 415 555 0126", homeTerminal: "Modesto" },
  { id: "D-TOM", name: "Tom Becker", phone: "+1 415 555 0188", homeTerminal: "Vallejo" },
  { id: "D-ELENA", name: "Elena Ruiz", phone: "+1 415 555 0163", homeTerminal: "San Francisco" },
];

const vehicles: Vehicle[] = [
  { id: "V-204", plate: "V-204", driverId: "D-MARCUS", truck: "Sleeper tractor · reefer" },
  { id: "V-118", plate: "V-118", driverId: "D-EMILY", truck: "Day cab · dry van" },
  { id: "V-091", plate: "V-091", driverId: "D-LUIS", truck: "Sleeper tractor · dry van" },
  { id: "V-330", plate: "V-330", driverId: "D-MICHAEL", truck: "Day cab · reefer" },
  { id: "V-412", plate: "V-412", driverId: "D-PRIYA", truck: "Sleeper tractor · flatbed" },
  { id: "V-515", plate: "V-515", driverId: "D-DANIEL", truck: "Day cab · dry van" },
  { id: "V-620", plate: "V-620", driverId: "D-AISHA", truck: "Sleeper tractor · reefer" },
  { id: "V-701", plate: "V-701", driverId: "D-TOM", truck: "Day cab · dry van" },
  { id: "V-812", plate: "V-812", driverId: "D-ELENA", truck: "Sleeper tractor · reefer" },
];

const knownShipments: Shipment[] = [
  {
    id: "SF-48291",
    customer: "Acme Retail",
    contactName: "Sarah Mitchell",
    po: "77341-118",
    origin: "Oakland, CA",
    destination: "Sacramento, CA",
    pickup: { start: demoT("13:00"), end: demoT("14:00") },
    delivery: { start: demoT("15:00"), end: demoT("15:30") },
    status: "at_risk",
    priority: "critical",
    pallets: 14,
    weightLb: 8420,
    equipment: "Reefer 53'",
    driverId: "D-MARCUS",
    vehicleId: "V-204",
    routeId: "R-48291",
    currentEta: demoT("15:49"),
    proposedEta: demoT("15:18"),
    notes: "Receiving closes at 3:30 PM.",
  },
  {
    id: "SF-49281",
    customer: "Bluewave Foods",
    contactName: "Dana Whitfield",
    po: "BW-20418",
    origin: "Los Angeles, CA",
    destination: "San Diego, CA",
    pickup: { start: demoT("11:00"), end: demoT("12:00") },
    delivery: { start: demoT("16:00"), end: demoT("17:00") },
    status: "delayed",
    priority: "priority",
    pallets: 10,
    weightLb: 6200,
    equipment: "Dry van 53'",
    driverId: "D-EMILY",
    vehicleId: "V-118",
    routeId: "R-49281",
    currentEta: demoT("17:22"),
  },
  {
    id: "SF-49305",
    customer: "Summit Hardware",
    contactName: "Owen Park",
    po: "SH-55190",
    origin: "Fresno, CA",
    destination: "Bakersfield, CA",
    pickup: { start: demoT("14:00"), end: demoT("15:00") },
    delivery: { start: demoT("17:00"), end: demoT("18:00") },
    status: "booked",
    priority: "standard",
    pallets: 12,
    weightLb: 7100,
    equipment: "Dry van 53'",
    currentEta: demoT("18:10"),
  },
  {
    id: "SF-49311",
    customer: "Northline Parts",
    contactName: "Iris Chen",
    po: "NP-88420",
    origin: "San Jose, CA",
    destination: "Oakland, CA",
    pickup: { start: demoT("15:00"), end: demoT("15:30") },
    delivery: { start: demoT("16:30"), end: demoT("17:00") },
    status: "booked",
    priority: "priority",
    pallets: 8,
    weightLb: 3900,
    equipment: "Dry van 53'",
    currentEta: demoT("17:05"),
    notes: "Needs dock slot.",
  },
  {
    id: "SF-49318",
    customer: "Coastline Produce",
    contactName: "Mateo Silva",
    po: "CP-77102",
    origin: "Stockton, CA",
    destination: "Modesto, CA",
    pickup: { start: demoT("13:30"), end: demoT("14:00") },
    delivery: { start: demoT("16:00"), end: demoT("16:30") },
    status: "in_transit",
    priority: "standard",
    pallets: 16,
    weightLb: 9100,
    equipment: "Reefer 53'",
    driverId: "D-EMILY",
    vehicleId: "V-118",
    routeId: "R-49318",
    currentEta: demoT("16:05"),
  },
];

const generatedCustomers = [
  "Bayline Supply",
  "Cedar Grocers",
  "Delta Medical",
  "Evergreen Home",
  "Fairfield Toys",
  "Golden Valley",
  "Harbor Electronics",
  "Ironwood Tools",
  "Juniper Apparel",
  "Keystone Auto",
  "Lakeside Paper",
  "Marin Outdoor",
];

const generatedShipments: Shipment[] = Array.from({ length: 41 }, (_, index) => {
  const number = 49350 + index;
  const isAtRisk = index < 17;
  const isPriority = index >= 17 && index < 24;
  const statuses = ["booked", "assigned", "in_transit", "delivered"] as const;
  const status = isAtRisk ? "at_risk" : isPriority ? "assigned" : statuses[index % statuses.length];
  const driver = isAtRisk || status !== "booked" ? drivers[index % drivers.length] : undefined;
  const windowStartMinute = 8 * 60 + (index % 8) * 75;
  const start = `${String(Math.floor(windowStartMinute / 60)).padStart(2, "0")}:${String(windowStartMinute % 60).padStart(2, "0")}`;
  const endMinute = windowStartMinute + 60;
  const end = `${String(Math.floor(endMinute / 60)).padStart(2, "0")}:${String(endMinute % 60).padStart(2, "0")}`;
  const etaMinute = windowStartMinute + (isAtRisk ? 95 + (index % 30) : 25);
  const eta = `${String(Math.floor(etaMinute / 60)).padStart(2, "0")}:${String(etaMinute % 60).padStart(2, "0")}`;

  return {
    id: `SF-${number}`,
    customer: generatedCustomers[index % generatedCustomers.length],
    contactName: "Demo contact",
    po: `PO-${number}`,
    origin: "Bay Area, CA",
    destination: "Central Valley, CA",
    pickup: { start: demoT(start), end: demoT(end) },
    delivery: { start: demoT(start), end: demoT(end) },
    status,
    priority: isAtRisk || isPriority ? "priority" : "standard",
    pallets: 4 + (index % 14),
    weightLb: 2800 + (index % 12) * 420,
    equipment: index % 3 === 0 ? "Reefer 53'" : "Dry van 53'",
    ...(driver ? { driverId: driver.id, vehicleId: vehicles[index % vehicles.length].id } : {}),
    currentEta: demoT(eta),
  };
});

const shipments: Shipment[] = [...knownShipments, ...generatedShipments];

const eastBayStops: RoutePlan["stops"] = [
  { id: "stop-oakland-dc", name: "Oakland DC", city: "Oakland", kind: "pickup", window: { start: demoT("07:00"), end: demoT("07:30") }, completed: true },
  { id: "stop-atlas-hercules", name: "Atlas · Hercules", city: "Hercules", kind: "delivery", window: { start: demoT("08:30"), end: demoT("09:00") } },
  { id: "stop-bayline", name: "Bayline Supply", city: "Richmond", kind: "delivery", window: { start: demoT("09:15"), end: demoT("09:45") } },
  { id: "stop-cedar", name: "Cedar Grocers", city: "Berkeley", kind: "delivery", window: { start: demoT("10:00"), end: demoT("10:30") } },
  { id: "stop-delta", name: "Delta Medical", city: "Alameda", kind: "delivery", window: { start: demoT("10:45"), end: demoT("11:15") } },
  { id: "stop-evergreen", name: "Evergreen Home", city: "San Leandro", kind: "delivery", window: { start: demoT("11:30"), end: demoT("12:00") } },
  { id: "stop-fairfield", name: "Fairfield Toys", city: "Hayward", kind: "delivery", window: { start: demoT("12:15"), end: demoT("12:45") } },
  { id: "stop-golden", name: "Golden Valley", city: "Union City", kind: "delivery", window: { start: demoT("13:00"), end: demoT("13:30") } },
  { id: "stop-harbor", name: "Harbor Electronics", city: "Fremont", kind: "delivery", window: { start: demoT("13:45"), end: demoT("14:15") } },
  { id: "stop-ironwood", name: "Ironwood Tools", city: "Milpitas", kind: "delivery", window: { start: demoT("14:30"), end: demoT("15:00") } },
  { id: "stop-juniper", name: "Juniper Apparel", city: "San Jose", kind: "delivery", window: { start: demoT("15:15"), end: demoT("15:45") } },
];

const routes: RoutePlan[] = [
  {
    id: "R-1042",
    name: "East Bay loop",
    driverId: "D-EMILY",
    stops: eastBayStops,
    current: { miles: 86.0, driveMinutes: 384, costUsd: 96.4, windowsMet: 9, windowsTotal: 11, co2Kg: 118 },
    optimized: { miles: 79.8, driveMinutes: 358, costUsd: 89.1, windowsMet: 11, windowsTotal: 11, co2Kg: 109 },
    mode: "current",
    coordinates: [
      [-122.2712, 37.8044],
      [-122.1661, 37.6819],
      [-122.0866, 37.5485],
      [-122.0322, 37.6688],
      [-121.8863, 37.3382],
    ],
  },
  {
    id: "R-48291",
    name: "I-80 corridor",
    driverId: "D-MARCUS",
    stops: [
      { id: "stop-sf48291-pickup", name: "Oakland DC Dock 4", city: "Oakland", kind: "pickup", window: { start: demoT("13:00"), end: demoT("14:00") }, completed: true },
      { id: "stop-sf48291-drop", name: "Acme Retail · Sacramento", city: "Sacramento", kind: "delivery", window: { start: demoT("15:00"), end: demoT("15:30") } },
    ],
    current: { miles: 81.0, driveMinutes: 149, costUsd: 42.1, windowsMet: 1, windowsTotal: 2, co2Kg: 111 },
    optimized: { miles: 85.2, driveMinutes: 118, costUsd: 48.9, windowsMet: 2, windowsTotal: 2, co2Kg: 117 },
    mode: "current",
    coordinates: [
      [-122.2712, 37.8044],
      [-122.2712, 37.8716],
      [-122.2566, 38.1041],
      [-121.4944, 38.5816],
    ],
  },
  {
    id: "R-49281",
    name: "South coast run",
    driverId: "D-EMILY",
    stops: [],
    current: { miles: 120.4, driveMinutes: 155, costUsd: 58.2, windowsMet: 1, windowsTotal: 2, co2Kg: 160 },
    optimized: { miles: 118.2, driveMinutes: 149, costUsd: 56.1, windowsMet: 2, windowsTotal: 2, co2Kg: 157 },
    mode: "current",
    coordinates: [
      [-118.2437, 34.0522],
      [-117.5114, 33.6595],
      [-117.1611, 32.7157],
    ],
  },
];

const approvals: RouteApproval[] = [
  {
    id: "AP-48291",
    shipmentId: "SF-48291",
    state: "pending_approval",
    currentRoute: "I-80",
    proposedRoute: "I-680",
    currentEta: demoT("15:49"),
    proposedEta: demoT("15:18"),
    currentMiles: 81.0,
    proposedMiles: 85.2,
    savedMinutes: 31,
    fuelDeltaUsd: 6.8,
    hosRemainingMinutes: 288,
    requestedBy: "Route Agent",
    reason: "Traffic on I-80 pushes the ETA 19 minutes past the receiving window. I-680 adds 4.2 miles but arrives inside the window.",
  },
  {
    id: "AP-49281",
    shipmentId: "SF-49281",
    state: "under_review",
    currentRoute: "US-101",
    proposedRoute: "I-5",
    currentEta: demoT("17:22"),
    proposedEta: demoT("16:48"),
    currentMiles: 120.4,
    proposedMiles: 118.2,
    savedMinutes: 34,
    fuelDeltaUsd: -2.1,
    hosRemainingMinutes: 241,
    requestedBy: "Route Agent",
    reason: "Southbound congestion adds 34 minutes; I-5 keeps the delivery inside the window.",
  },
  {
    id: "AP-49318",
    shipmentId: "SF-49318",
    state: "pending_approval",
    currentRoute: "CA-99",
    proposedRoute: "CA-132",
    currentEta: demoT("16:35"),
    proposedEta: demoT("16:12"),
    currentMiles: 32.1,
    proposedMiles: 34.8,
    savedMinutes: 23,
    fuelDeltaUsd: 1.4,
    hosRemainingMinutes: 187,
    requestedBy: "Route Agent",
    reason: "A lane closure on CA-99 clears later than planned; CA-132 protects the window.",
  },
];

const threads: MessageThread[] = [
  {
    id: "TH-48291",
    contactName: "Sarah Mitchell",
    customer: "Acme Retail",
    shipmentId: "SF-48291",
    channel: "email",
    unread: true,
    lastMessageAt: demoT("15:12"),
    suggestedReplies: [
      "Thanks Sarah — the reroute is in review and I will confirm the new ETA shortly.",
      "The driver is 12 minutes out; we are holding the dock window.",
      "I have attached the updated rate confirmation for your records.",
    ],
    messages: [
      { id: "M-1", threadId: "TH-48291", from: "Sarah Mitchell", to: "Sarah Bennett", channel: "email", subject: "SF-48291 delivery window", body: "Can you confirm the truck will still make the 3:30 PM receiving cutoff?", at: demoT("15:12") },
      { id: "M-2", threadId: "TH-48291", from: "Sarah Bennett", to: "Sarah Mitchell", channel: "email", subject: "Re: SF-48291 delivery window", body: "We are reviewing an alternate route now. I will confirm as soon as it is approved.", at: demoT("15:14") },
    ],
  },
  {
    id: "TH-MARCUS",
    contactName: "Marcus Johnson",
    customer: "Fleet",
    shipmentId: "SF-48291",
    channel: "sms",
    unread: false,
    lastMessageAt: demoT("15:05"),
    suggestedReplies: ["Copy — stay on I-80 until dispatch confirms the reroute.", "Please take the next safe exit and hold."],
    messages: [{ id: "M-3", threadId: "TH-MARCUS", from: "Marcus Johnson", to: "Sarah Bennett", channel: "sms", body: "Traffic is stopped past Emeryville. Still showing 3:49 arrival.", at: demoT("15:05") }],
  },
  {
    id: "TH-OPS",
    contactName: "Dispatch team",
    customer: "Internal",
    channel: "internal",
    unread: false,
    lastMessageAt: demoT("14:58"),
    suggestedReplies: ["Route approval is pending — hold customer update until applied."],
    messages: [{ id: "M-4", threadId: "TH-OPS", from: "Dispatch team", to: "Sarah Bennett", channel: "internal", body: "Three route approvals are waiting in the queue.", at: demoT("14:58") }],
  },
  {
    id: "TH-DRAFT",
    contactName: "Customer Agent",
    customer: "AI drafts",
    channel: "internal",
    unread: true,
    lastMessageAt: demoT("15:16"),
    suggestedReplies: ["Use the draft, then press Send.", "Keep the update concise and mention the new ETA."],
    messages: [{ id: "M-5", threadId: "TH-DRAFT", from: "Customer Agent", to: "Sarah Bennett", channel: "internal", body: "Draft: Hi Sarah — we have a faster route that arrives at 3:18 PM, inside your receiving window.", at: demoT("15:16") }],
  },
];

const audits: AuditEvent[] = [
  { id: "AUD-1", at: demoT("15:10"), actor: "Route Agent", action: "reroute_proposed", detail: "Proposed I-680 for SF-48291: ETA 3:18 PM, 31 minutes earlier." },
  { id: "AUD-2", at: demoT("15:14"), actor: "Sarah Bennett", action: "approval_opened", detail: "Opened the SF-48291 route approval for review." },
];

const trackingLinks: TrackingLink[] = [
  {
    token: "demo-SF-48291-live",
    shipmentId: "SF-48291",
    recipients: [],
    preferences: { liveMap: true, eta: true, reefer: true, driverName: true, driverPhone: true },
    createdAt: demoT("15:00"),
    expiresAt: nextDayT("15:18"),
  },
];

const mapVehicles: MapVehicle[] = [
  { id: "V-204", label: "SF-48291 · Marcus", latitude: 38.02, longitude: -122.1, status: "moving" },
  { id: "V-118", label: "SF-49281 · Emily", latitude: 37.55, longitude: -121.95, status: "delayed" },
  { id: "V-091", label: "SF-49318 · Luis", latitude: 37.7, longitude: -121.8, status: "idle" },
];

const mapRoutes: MapRoute[] = [
  {
    id: "map-r48291-current",
    status: "delayed",
    coordinates: [
      [-122.2712, 37.8044],
      [-122.2712, 37.8716],
      [-122.2566, 38.1041],
      [-121.4944, 38.5816],
    ],
  },
  {
    id: "map-r48291-proposed",
    proposed: true,
    coordinates: [
      [-122.2712, 37.8044],
      [-122.06, 37.91],
      [-122.03, 37.98],
      [-122.04, 38.25],
      [-121.4944, 38.5816],
    ],
  },
  {
    id: "map-r1042",
    coordinates: [
      [-122.2712, 37.8044],
      [-122.1661, 37.6819],
      [-122.0866, 37.5485],
      [-122.0322, 37.6688],
      [-121.8863, 37.3382],
    ],
  },
];

export const tmsFlowFixtures: TmsFlowSnapshot = {
  operatorName: "Sarah Bennett",
  kpis: { active: 1284, inTransit: 842, deliveredToday: 612, delayed: 37, atRisk: 18, exceptions: 24 },
  shipments,
  drivers,
  vehicles,
  routes,
  approvals,
  threads,
  audits,
  trackingLinks,
  mapVehicles,
  mapRoutes,
};

export const tmsFlowDemoNow = demoT("15:20");
