import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShipmentHeroCard } from "@/features/loads/components/redesign/ShipmentHeroCard";
import { ShipmentLoadPlanCard } from "@/features/loads/components/redesign/ShipmentLoadPlanCard";
import { ShipmentDocumentsCard } from "@/features/loads/components/redesign/ShipmentDocumentsCard";
import { ShipmentAgentCard } from "@/features/loads/components/redesign/ShipmentAgentCard";
import { ShipmentDetailView } from "@/features/loads/components/redesign/ShipmentDetailView";
import type { Load } from "@/types/load.types";

vi.mock("@refinedev/core", () => ({
  useCan: () => ({ data: { can: true } }),
  useList: () => ({
    data: {
      data: [
        { id: "doc-1", fileName: "Bill of lading.pdf", status: "signed" },
        { id: "doc-2", fileName: "Rate sheet.pdf", status: "pending" },
      ],
    },
    isLoading: false,
  }),
  useCustom: () => ({
    data: {
      data: {
        loadId: "load-101",
        events: [
          { id: "1", eventType: "PICKUP", occurredAt: "2026-10-16T09:14:00Z", note: "Oakland DC Dock 4" },
          { id: "2", eventType: "APPROV", occurredAt: "2026-10-16T11:58:00Z", note: "Lộ trình đã duyệt" },
        ],
      },
    },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/ai/useAiFeatures", () => ({
  useAiFeatures: () => ({ enabled: true, dryRun: false }),
}));

vi.mock("@/hooks/ai/useLoadAiGaps", () => ({
  useLoadAiGaps: () => ({
    blockingGaps: [],
    warningGaps: [],
    dismissGap: vi.fn(),
  }),
}));

vi.mock("@/hooks/ai/useLoadAiDispatch", () => ({
  useLoadAiDispatch: () => ({
    dispatchState: "ready",
    rankingSource: "llm",
    confidenceScore: 0.92,
    suggestions: [
      {
        id: "sug-1",
        driverId: "drv-1",
        driverName: "Marcus Johnson",
        truckId: "trk-5531",
        truckNumber: "TR-5531",
        rank: 1,
        score: 0.92,
        confidenceScore: 0.92,
        reasoning: "Tối ưu hóa hành trình tránh tắc nghẽn, đảm bảo thời gian giao hàng.",
        utilities: {
          margin: { score: 85, displayValue: "85%" },
          onTime: { score: 95 },
          deadhead: { score: 12 },
          hos: { score: 90 },
        },
        status: "executed",
      },
    ],
    capabilities: { canApprove: true, canReject: true },
    approveSuggestion: vi.fn(),
    rejectSuggestion: vi.fn(),
  }),
}));

const mockLoad: Load = {
  id: "load-101",
  number: 48291,
  name: "Oakland Express",
  type: "Reefer 53'",
  status: "in_transit",
  distance: 88,
  isInProximity: true,
  customerId: "cust-1",
  customerName: "Acme Retail",
  assignedTruckNumber: "TR-5531",
  assignedDispatcherName: "Marcus Johnson",
  source: "manual",
  isHazmat: false,
  deliveryCostAmount: 1842,
  deliveryCostCurrency: "USD",
  version: 1,
  requestedPickupDate: "2026-10-16T09:48:00Z",
  requestedDeliveryDate: "2026-10-16T15:18:00Z",
  originAddressCity: "Oakland",
  destinationAddressCity: "Sacramento",
};

describe("ShipmentDetail Redesign Components", () => {
  it("renders ShipmentHeroCard with route, truck graphic and progress bar", () => {
    render(<ShipmentHeroCard load={mockLoad} />);

    expect(screen.getByTestId("shipment-hero-card")).toBeInTheDocument();
    expect(screen.getByText(/Oakland → Sacramento/i)).toBeInTheDocument();
    expect(screen.getByText(/95%/i)).toBeInTheDocument();
    expect(screen.getByTestId("route-progress-bar")).toBeInTheDocument();
  });

  it("renders ShipmentLoadPlanCard with cargo specs and weight indicator", () => {
    render(<ShipmentLoadPlanCard load={mockLoad} />);

    expect(screen.getByTestId("shipment-load-plan-card")).toBeInTheDocument();
    expect(screen.getByText(/Phương tiện & Kế hoạch xếp hàng/i)).toBeInTheDocument();
    expect(screen.getByText(/Hàng bách hóa thông thường/i)).toBeInTheDocument();
  });

  it("renders ShipmentDocumentsCard with real document list", () => {
    render(<ShipmentDocumentsCard load={mockLoad} />);

    expect(screen.getByTestId("shipment-documents-card")).toBeInTheDocument();
    expect(screen.getByText("Bill of lading.pdf")).toBeInTheDocument();
    expect(screen.getByText("Rate sheet.pdf")).toBeInTheDocument();
  });

  it("renders ShipmentAgentCard with metrics strip and approved state", () => {
    render(<ShipmentAgentCard loadId="load-101" />);

    expect(screen.getByTestId("shipment-agent-card")).toBeInTheDocument();
    expect(screen.getByText(/92% tin cậy/i)).toBeInTheDocument();
    expect(screen.getByText(/95%/i)).toBeInTheDocument();
    expect(screen.getByText(/Marcus Johnson/i)).toBeInTheDocument();
  });

  it("renders full ShipmentDetailView with all cards in place", () => {
    render(<ShipmentDetailView load={mockLoad} />);

    expect(screen.getByTestId("load-overview-panel")).toBeInTheDocument();
    expect(screen.getByTestId("shipment-hero-card")).toBeInTheDocument();
    expect(screen.getByTestId("shipment-load-plan-card")).toBeInTheDocument();
    expect(screen.getByTestId("shipment-documents-card")).toBeInTheDocument();
    expect(screen.getByTestId("shipment-agent-card")).toBeInTheDocument();
  });
});
