import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAiFeatures } from "@/hooks/ai/useAiFeatures";
import { useTmsLoad, useTmsTimeline } from "@/hooks/tms-flow/useTmsQueries";
import { useTmsWorkspace } from "@/hooks/tms-flow/useTmsWorkspace";
import { useRouteEstimate } from "@/hooks/useRouteEstimate";
import { ShipmentDetailPage } from "./ShipmentDetailPage";

vi.mock("@/hooks/ai/useAiFeatures", () => ({ useAiFeatures: vi.fn() }));
vi.mock("@/hooks/tms-flow/useTmsQueries", () => ({
  useTmsLoad: vi.fn(),
  useTmsTimeline: vi.fn(),
}));
vi.mock("@/hooks/tms-flow/useTmsWorkspace", () => ({ useTmsWorkspace: vi.fn() }));
vi.mock("@/hooks/useRouteEstimate", () => ({ useRouteEstimate: vi.fn() }));

describe("ShipmentDetailPage", () => {
  beforeEach(() => {
    vi.mocked(useAiFeatures).mockReturnValue({} as ReturnType<typeof useAiFeatures>);
    vi.mocked(useTmsLoad).mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTmsLoad>);
    vi.mocked(useTmsTimeline).mockReturnValue({} as ReturnType<typeof useTmsTimeline>);
    vi.mocked(useTmsWorkspace).mockReturnValue({
      approvals: [],
      trucks: { data: undefined },
    } as unknown as ReturnType<typeof useTmsWorkspace>);
    vi.mocked(useRouteEstimate).mockReturnValue({
      estimate: null,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useRouteEstimate>);
  });

  it("does not query the API for a malformed shipment ID in the route", () => {
    render(
      <MemoryRouter initialEntries={["/tms/shipments/%3Canonymous%20code%3E"]}>
        <Routes>
          <Route element={<ShipmentDetailPage />} path="/tms/shipments/:shipmentId" />
        </Routes>
      </MemoryRouter>,
    );

    expect(useTmsLoad).toHaveBeenCalledWith(undefined);
    expect(useTmsTimeline).toHaveBeenCalledWith(undefined);
    expect(screen.getByText(/Không có lô hàng khớp với/)).toBeInTheDocument();
    expect(screen.queryByText("Đang tải lô hàng…")).not.toBeInTheDocument();
  });
});
