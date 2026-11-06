import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ShipmentCard } from "@/components/tms-flow/ShipmentCard";
import type { LoadResponse } from "@/types/loads/load.dto";
import { toTmsShipment } from "@/utils/tms-flow/status";

const makeLoad = (overrides: Partial<LoadResponse> = {}): LoadResponse => ({
  id: "load-overdue",
  number: 51,
  name: "Test load",
  customerId: "customer-1",
  status: "OPEN",
  type: "FTL",
  source: "MANUAL",
  distance: 1,
  isHazmat: false,
  isInProximity: false,
  ...overrides,
});

afterEach(() => vi.useRealTimers());

describe("ShipmentCard overdue labels", () => {
  it("shows pickup overdue duration using the shared definition", () => {
    vi.useFakeTimers().setSystemTime(new Date("2026-11-06T12:00:00.000Z"));
    const shipment = toTmsShipment(makeLoad({
      requestedPickupDate: "2026-10-17T12:00:00.000Z",
      requestedDeliveryDate: "2026-11-07T12:00:00.000Z",
    }));

    render(<ShipmentCard onSelect={vi.fn()} shipment={shipment} />);

    expect(screen.getByTestId("shipment-card-risk-reason-load-overdue")).toHaveTextContent("Quá hạn lấy hàng 20 ngày");
  });

  it("does not label a delivered load overdue even if the server supplied an old risk reason", () => {
    vi.useFakeTimers().setSystemTime(new Date("2026-11-06T12:00:00.000Z"));
    const load = makeLoad({
      deliveredAt: "2026-11-05T12:00:00.000Z",
      requestedDeliveryDate: "2026-10-17T12:00:00.000Z",
    });
    const shipment = {
      ...toTmsShipment(load),
      risk: "none" as const,
      riskReasons: [{ code: "DELIVERY_OVERDUE", message: "old server reason" }],
    };

    render(<ShipmentCard onSelect={vi.fn()} shipment={shipment} />);

    expect(screen.queryByText(/Quá hạn/)).not.toBeInTheDocument();
  });
});
