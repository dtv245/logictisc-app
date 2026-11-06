import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTmsTimeline } from "@/hooks/tms-flow/useTmsQueries";
import { useTmsWorkspace } from "@/hooks/tms-flow/useTmsWorkspace";
import { useMapboxRoute } from "@/hooks/tms-flow/useMapboxRoute";
import type { LoadResponse } from "@/types/load.dto";
import type { TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";
import { DispatchPage } from "./DispatchPage";

vi.mock("@/hooks/tms-flow/useTmsQueries", () => ({
  useTmsTimeline: vi.fn(),
}));
vi.mock("@/hooks/tms-flow/useTmsWorkspace", () => ({
  useTmsWorkspace: vi.fn(),
}));
vi.mock("@/hooks/tms-flow/useDispatchSelection", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/tms-flow/useDispatchSelection")>();
  return {
    ...actual,
    useDispatchSelection: ({
      requestedId,
      visibleShipments,
      defaultShipment,
    }: {
      requestedId?: string | null;
      visibleShipments: TmsShipmentView[];
      defaultShipment?: TmsShipmentView;
    }) => {
      if (!requestedId) {
        return defaultShipment
          ? { status: "selected", shipment: defaultShipment, outsideQueue: false }
          : { status: "idle", outsideQueue: false };
      }
      const match = visibleShipments.find((shipment) => shipment.id === requestedId);
      return match
        ? { status: "selected", shipment: match, outsideQueue: false }
        : { status: "not-found", outsideQueue: false };
    },
  };
});
vi.mock("@/hooks/tms-flow/useMapboxRoute", () => ({
  useMapboxRoute: vi.fn(),
}));
vi.mock("@/components/tms-flow/TmsFlowMap", () => ({
  TmsFlowMap: () => <div data-testid="mock-tms-map" />,
}));
vi.mock("@/components/loads/LoadCreateModal", () => ({
  LoadCreateModal: ({ trigger }: { trigger: (show: () => void) => React.ReactNode }) =>
    trigger(() => {}),
}));

const makeShipment = (index: number): TmsShipmentView => ({
  id: `load-${index}`,
  number: 1000 + index,
  name: `Lô hàng ${index}`,
  customerName: `Khách hàng ${index}`,
  rawStatus: "OPEN",
  status: "open",
  risk: "none",
  originCity: "Hà Nội",
  destinationCity: "Hải Phòng",
  originAddress: "Hà Nội",
  destinationAddress: "Hải Phòng",
  distance: 100,
  isHazmat: false,
  raw: {
    id: `load-${index}`,
    number: 1000 + index,
    name: `Lô hàng ${index}`,
    customerId: "cust-1",
    status: "OPEN",
    type: "FTL",
    source: "MANUAL",
    distance: 100,
    isHazmat: false,
    isInProximity: false,
  } as LoadResponse,
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="dispatch-location">{location.search}</output>;
}

describe("DispatchPage infinite load queue", () => {
  const fetchNextPageSpy = vi.fn();

  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("1200px"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }));
    fetchNextPageSpy.mockReset();
    vi.mocked(useTmsTimeline).mockReturnValue({
      data: { events: [] },
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTmsTimeline>);
    vi.mocked(useMapboxRoute).mockReturnValue({
      estimate: null,
      distanceMeters: null,
      durationSeconds: null,
      routeCoordinates: [],
      isError: false,
      isLoading: false,
      isFallbackStraightLine: false,
    });
  });

  it("renders initial 10 items and calls fetchNextPage when scrolling down the queue", () => {
    const shipments = Array.from({ length: 10 }, (_, i) => makeShipment(i + 1));
    vi.mocked(useTmsWorkspace).mockReturnValue({
      approvals: [],
      approvalIds: new Set<string>(),
      approvalsError: null,
      collection: {
        items: shipments.map((s) => s.raw),
        totalItems: 1000,
        truncated: false,
      },
      error: null,
      generatedAt: 1700000000000,
      isLoading: false,
      loads: {
        fetchNextPage: fetchNextPageSpy,
        hasNextPage: true,
        isFetchingNextPage: false,
        refetch: vi.fn(),
      },
      pending: { refetch: vi.fn() },
      shipments,
      statuses: { refetch: vi.fn() },
      trucks: { data: { items: [] }, refetch: vi.fn() },
      trucksError: null,
    } as unknown as ReturnType<typeof useTmsWorkspace>);

    render(
      <MemoryRouter initialEntries={["/tms/dispatch"]}>
        <DispatchPage />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId(/^dispatch-summary-/)).not.toBeInTheDocument();
    expect(document.querySelector(".tms-next-action")).toBeNull();
    expect(screen.getAllByTestId(/^shipment-card-/)).toHaveLength(10);
    expect(fetchNextPageSpy).not.toHaveBeenCalled();

    const queueEl = screen.getByTestId("dispatch-load-queue");
    Object.defineProperty(queueEl, "scrollHeight", { value: 1100, configurable: true });
    Object.defineProperty(queueEl, "clientHeight", { value: 500, configurable: true });
    Object.defineProperty(queueEl, "scrollTop", { value: 520, configurable: true });

    fireEvent.scroll(queueEl);

    expect(fetchNextPageSpy).toHaveBeenCalledTimes(1);
  });

  it("shows loading indicator while fetching next page and prevents duplicate calls", () => {
    const shipments = Array.from({ length: 10 }, (_, i) => makeShipment(i + 1));
    vi.mocked(useTmsWorkspace).mockReturnValue({
      approvals: [],
      approvalIds: new Set<string>(),
      approvalsError: null,
      collection: {
        items: shipments.map((s) => s.raw),
        totalItems: 1000,
        truncated: false,
      },
      error: null,
      generatedAt: 1700000000000,
      isLoading: false,
      loads: {
        fetchNextPage: fetchNextPageSpy,
        hasNextPage: true,
        isFetchingNextPage: true,
        refetch: vi.fn(),
      },
      pending: { refetch: vi.fn() },
      shipments,
      statuses: { refetch: vi.fn() },
      trucks: { data: { items: [] }, refetch: vi.fn() },
      trucksError: null,
    } as unknown as ReturnType<typeof useTmsWorkspace>);

    render(
      <MemoryRouter initialEntries={["/tms/dispatch"]}>
        <DispatchPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("dispatch-queue-loading-more")).toBeInTheDocument();

    const queueEl = screen.getByTestId("dispatch-load-queue");
    Object.defineProperty(queueEl, "scrollHeight", { value: 1100, configurable: true });
    Object.defineProperty(queueEl, "clientHeight", { value: 500, configurable: true });
    Object.defineProperty(queueEl, "scrollTop", { value: 600, configurable: true });

    fireEvent.scroll(queueEl);

    expect(fetchNextPageSpy).not.toHaveBeenCalled();
  });

  it("displays real backend operational totals on filter buttons and renders riskReasons from /api/loads/dispatch-board/risk", () => {
    const shipments = Array.from({ length: 10 }, (_, i) => makeShipment(i + 1));
    const riskShipment: TmsShipmentView = {
      ...makeShipment(99),
      id: "load-risk-99",
      number: 2099,
      risk: "delayed",
      riskReasons: [
        {
          code: "OPEN_EXCEPTION",
          message: "Load has an unresolved exception.",
          exceptionType: "BREAKDOWN",
          exceptionReason: "Hỏng lạnh",
        },
        {
          code: "DELIVERY_OVERDUE",
          message: "Requested delivery deadline has passed without delivery recorded.",
        },
      ],
    };
    const unassignedShipment: TmsShipmentView = {
      ...makeShipment(88),
      id: "load-unassigned-88",
      number: 2088,
    };
    const fetchNextRiskSpy = vi.fn();
    const fetchNextUnassignedSpy = vi.fn();

    vi.mocked(useTmsWorkspace).mockReturnValue({
      approvals: [],
      approvalIds: new Set<string>(),
      approvalsError: null,
      collection: {
        items: shipments.map((s) => s.raw),
        totalItems: 340,
        truncated: true,
      },
      error: null,
      generatedAt: 1700000000000,
      isLoading: false,
      loads: {
        fetchNextPage: fetchNextPageSpy,
        hasNextPage: true,
        isFetchingNextPage: false,
        refetch: vi.fn(),
      },
      pending: { refetch: vi.fn() },
      riskCollection: {
        items: [riskShipment.raw],
        totalItems: 27,
        truncated: true,
      },
      riskError: null,
      riskLoads: {
        fetchNextPage: fetchNextRiskSpy,
        hasNextPage: true,
        isFetchingNextPage: false,
        refetch: vi.fn(),
      },
      riskShipments: [riskShipment],
      shipments,
      statuses: { refetch: vi.fn() },
      trucks: { data: { items: [] }, refetch: vi.fn() },
      trucksError: null,
      unassignedCollection: {
        items: [unassignedShipment.raw],
        totalItems: 64,
        truncated: true,
      },
      unassignedError: null,
      unassignedLoads: {
        fetchNextPage: fetchNextUnassignedSpy,
        hasNextPage: true,
        isFetchingNextPage: false,
        refetch: vi.fn(),
      },
      unassignedShipments: [unassignedShipment],
    } as unknown as ReturnType<typeof useTmsWorkspace>);

    render(
      <MemoryRouter initialEntries={["/tms/dispatch?filter=at-risk"]}>
        <DispatchPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("dispatch-filter-all")).toHaveTextContent("Tất cả 340");
    expect(screen.getByTestId("dispatch-filter-at-risk")).toHaveTextContent("Cần chú ý 27");
    expect(screen.getByTestId("dispatch-filter-unassigned")).toHaveTextContent(
      "Chưa có xe 64",
    );

    expect(screen.getByTestId("shipment-card-load-risk-99")).toBeInTheDocument();
    expect(
      screen.getByTestId("shipment-card-risk-reason-load-risk-99"),
    ).toHaveTextContent(
      "Sự cố chưa xử lý (BREAKDOWN: Hỏng lạnh) · Quá hạn giao hàng chưa hoàn tất",
    );
    expect(screen.getByTestId("selected-load-risk-reasons")).toHaveTextContent(
      "Sự cố chưa xử lý (BREAKDOWN: Hỏng lạnh) · Quá hạn giao hàng chưa hoàn tất",
    );

    const queueEl = screen.getByTestId("dispatch-load-queue");
    Object.defineProperty(queueEl, "scrollHeight", { value: 1100, configurable: true });
    Object.defineProperty(queueEl, "clientHeight", { value: 500, configurable: true });
    Object.defineProperty(queueEl, "scrollTop", { value: 520, configurable: true });

    fireEvent.scroll(queueEl);
    expect(fetchNextRiskSpy).toHaveBeenCalledTimes(1);
    expect(fetchNextPageSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("dispatch-filter-unassigned"));
    expect(screen.getByTestId("shipment-card-load-unassigned-88")).toBeInTheDocument();
  });

  it("pins the automatic selection in the URL so background refresh cannot switch loads", async () => {
    const first = makeShipment(1);
    const second = makeShipment(2);
    const initialWorkspace = {
      approvals: [],
      approvalIds: new Set<string>(),
      approvalsError: null,
      collection: { items: [first.raw, second.raw], totalItems: 2, truncated: false },
      error: null,
      generatedAt: 1700000000000,
      isLoading: false,
      loads: { fetchNextPage: fetchNextPageSpy, hasNextPage: false, isFetchingNextPage: false, refetch: vi.fn() },
      pending: { data: [], refetch: vi.fn() },
      shipments: [first, second],
      statuses: { data: [], refetch: vi.fn() },
      trucks: { data: { items: [] }, refetch: vi.fn() },
      trucksError: null,
    } as unknown as ReturnType<typeof useTmsWorkspace>;
    vi.mocked(useTmsWorkspace).mockReturnValue(initialWorkspace);

    const view = () => (
      <MemoryRouter initialEntries={["/tms/dispatch"]}>
        <LocationProbe />
        <DispatchPage />
      </MemoryRouter>
    );
    const { rerender } = render(view());

    await waitFor(() => expect(screen.getByTestId("dispatch-location")).toHaveTextContent("shipment=load-1"));
    expect(screen.getByTestId("shipment-card-load-1")).toHaveAttribute("aria-pressed", "true");

    vi.mocked(useTmsWorkspace).mockReturnValue({
      ...initialWorkspace,
      shipments: [makeShipment(0), first, second],
    } as unknown as ReturnType<typeof useTmsWorkspace>);
    rerender(view());

    expect(screen.getByTestId("dispatch-location")).toHaveTextContent("shipment=load-1");
    expect(screen.getByTestId("shipment-card-load-1")).toHaveAttribute("aria-pressed", "true");
  });

  it("applies the overdue URL filter to the existing risk queue", () => {
    const late = makeShipment(31);
    late.raw.requestedPickupDate = "2026-11-01T00:00:00.000Z";
    const fetchNextRiskSpy = vi.fn();
    vi.mocked(useTmsWorkspace).mockReturnValue({
      approvals: [],
      approvalIds: new Set<string>(),
      approvalsError: null,
      collection: { items: [], totalItems: 1, truncated: false },
      riskCollection: { items: [late.raw], totalItems: 1, truncated: false, countSource: "server" },
      riskShipments: [late],
      riskLoads: { fetchNextPage: fetchNextRiskSpy, hasNextPage: true, isFetchingNextPage: false, refetch: vi.fn() },
      error: null,
      generatedAt: 1700000000000,
      isLoading: false,
      loads: { fetchNextPage: fetchNextPageSpy, hasNextPage: false, isFetchingNextPage: false, refetch: vi.fn() },
      pending: { data: [], refetch: vi.fn() },
      shipments: [late],
      statuses: { data: [], refetch: vi.fn() },
      trucks: { data: { items: [] }, refetch: vi.fn() },
      trucksError: null,
    } as unknown as ReturnType<typeof useTmsWorkspace>);

    render(
      <MemoryRouter initialEntries={["/tms/dispatch?filter=overdue"]}>
        <DispatchPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("shipment-card-load-31")).toBeInTheDocument();
    expect(screen.getByTestId("dispatch-filter-overdue")).toHaveClass("is-active");
  });

  it("applies the ai-pending URL filter to pending load ids", () => {
    const pendingLoad = makeShipment(32);
    vi.mocked(useTmsWorkspace).mockReturnValue({
      approvals: [],
      approvalIds: new Set([pendingLoad.id]),
      allKnownShipments: [pendingLoad],
      approvalsError: null,
      collection: { items: [pendingLoad.raw], totalItems: 1, truncated: false },
      error: null,
      generatedAt: 1700000000000,
      isLoading: false,
      loads: { fetchNextPage: fetchNextPageSpy, hasNextPage: false, isFetchingNextPage: false, refetch: vi.fn() },
      pending: { data: [], refetch: vi.fn() },
      shipments: [pendingLoad],
      statuses: { data: [], refetch: vi.fn() },
      trucks: { data: { items: [] }, refetch: vi.fn() },
      trucksError: null,
    } as unknown as ReturnType<typeof useTmsWorkspace>);

    render(
      <MemoryRouter initialEntries={["/tms/dispatch?filter=ai-pending"]}>
        <DispatchPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("shipment-card-load-32")).toBeInTheDocument();
    expect(screen.getByTestId("dispatch-filter-ai-pending")).toHaveClass("is-active");
  });

  it("ignores an invalid filter value and shows the full queue notice", () => {
    const load = makeShipment(33);
    vi.mocked(useTmsWorkspace).mockReturnValue({
      approvals: [],
      approvalIds: new Set<string>(),
      approvalsError: null,
      collection: { items: [load.raw], totalItems: 1, truncated: false },
      error: null,
      generatedAt: 1700000000000,
      isLoading: false,
      loads: { fetchNextPage: fetchNextPageSpy, hasNextPage: false, isFetchingNextPage: false, refetch: vi.fn() },
      pending: { data: [], refetch: vi.fn() },
      shipments: [load],
      statuses: { data: [], refetch: vi.fn() },
      trucks: { data: { items: [] }, refetch: vi.fn() },
      trucksError: null,
    } as unknown as ReturnType<typeof useTmsWorkspace>);

    render(
      <MemoryRouter initialEntries={["/tms/dispatch?filter=made-up"]}>
        <DispatchPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("dispatch-invalid-filter")).toHaveTextContent("Bộ lọc không hợp lệ");
    expect(screen.getByTestId("shipment-card-load-33")).toBeInTheDocument();
  });
});
