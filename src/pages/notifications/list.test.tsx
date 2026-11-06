import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTmsWorkspace } from "@/hooks/tms-flow/useTmsWorkspace";
import { usePaginatedTable } from "@/hooks/usePaginatedTable";
import type { LoadResponse } from "@/types/loads/load.dto";
import type { TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";
import { NotificationList } from "./list";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/hooks/usePaginatedTable", () => ({
  usePaginatedTable: vi.fn(),
}));

vi.mock("@/hooks/tms-flow/useTmsWorkspace", () => ({
  useTmsWorkspace: vi.fn(),
}));

vi.mock("@/features/notifications/components/NotificationMarkAllRead", () => ({
  NotificationMarkAllRead: () => (
    <button type="button">Đánh dấu tất cả đã đọc</button>
  ),
}));

const makeShipment = (
  overrides: Partial<TmsShipmentView> & { id: string; number: number },
): TmsShipmentView => ({
  id: overrides.id,
  number: overrides.number,
  name: overrides.name ?? `Lô hàng ${overrides.number}`,
  customerName: overrides.customerName ?? "Công ty Vận tải Minh Phát",
  rawStatus: overrides.rawStatus ?? "OPEN",
  status: overrides.status ?? "open",
  risk: overrides.risk ?? "none",
  originCity: overrides.originCity ?? "Hà Nội",
  destinationCity: overrides.destinationCity ?? "Đà Nẵng",
  originAddress: overrides.originAddress ?? "Hà Nội",
  destinationAddress: overrides.destinationAddress ?? "Đà Nẵng",
  distance: overrides.distance ?? 760,
  isHazmat: overrides.isHazmat ?? false,
  ...(overrides.assignedTruckId
    ? { assignedTruckId: overrides.assignedTruckId }
    : {}),
  raw: {
    id: overrides.id,
    number: overrides.number,
    name: overrides.name ?? `Lô hàng ${overrides.number}`,
    customerId: "cust-1",
    status: "OPEN",
    type: "FTL",
    source: "MANUAL",
    distance: 760,
    isHazmat: false,
    isInProximity: false,
  } as LoadResponse,
});

describe("NotificationList (/notifications)", () => {
  const delayedShipment = makeShipment({
    id: "load-101",
    number: 1001,
    risk: "delayed",
    originCity: "Hà Nội",
    destinationCity: "TP.HCM",
  });

  const unassignedShipment = makeShipment({
    id: "load-102",
    number: 1002,
    risk: "none",
    originCity: "Hải Phòng",
    destinationCity: "Bắc Ninh",
  });

  beforeEach(() => {
    mockNavigate.mockReset();

    vi.mocked(useTmsWorkspace).mockReturnValue({
      shipments: [delayedShipment, unassignedShipment],
      riskShipments: [delayedShipment],
      unassignedShipments: [unassignedShipment],
      approvals: [],
      riskCollection: { items: [], totalItems: 1, truncated: false },
      unassignedCollection: { items: [], totalItems: 1, truncated: false },
    } as unknown as ReturnType<typeof useTmsWorkspace>);

    vi.mocked(usePaginatedTable).mockReturnValue({
      current: 1,
      setCurrent: vi.fn(),
      pageSize: 10,
      setPageSize: vi.fn(),
      tableQueryResult: {
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
        data: {
          total: 3,
          data: [
            {
              id: "notif-1",
              title: "Lô hàng #1001 quá hạn giao hàng",
              message: "Chuyến Hà Nội - TP.HCM đang bị trễ hạn nghiêm trọng",
              isRead: false,
              createdDate: "2026-04-17T08:00:00.000Z",
            },
            {
              id: "notif-2",
              title: "Cảnh báo lô #1002 chưa phân công xe",
              message: "Cần gán tài xế và đầu kéo trước giờ lấy hàng",
              isRead: false,
              createdDate: "2026-04-17T07:30:00.000Z",
            },
            {
              id: "notif-3",
              title: "Hóa đơn thanh toán đã hoàn tất",
              message: "Đã ghi nhận thanh toán từ đối tác",
              isRead: true,
              severity: "info",
              createdDate: "2026-04-17T06:00:00.000Z",
            },
          ],
        },
      },
    } as unknown as ReturnType<typeof usePaginatedTable>);
  });

  it("displays notification severity badges and linked problematic load context", () => {
    render(
      <MemoryRouter initialEntries={["/notifications?pageSize=10&current=1"]}>
        <NotificationList />
      </MemoryRouter>,
    );

    const list = screen.getByRole("list", { name: "Danh sách thông báo" });
    const cards = within(list).getAllByRole("button");
    expect(cards.length).toBeGreaterThanOrEqual(3);

    expect(
      screen.getByText("Lô hàng #1001 quá hạn giao hàng"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cảnh báo lô #1002 chưa phân công xe"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Khẩn cấp").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Quan trọng").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Thông tin").length).toBeGreaterThanOrEqual(1);
  });

  it("navigates to the problematic load on Dispatch screen when clicking a notification", () => {
    render(
      <MemoryRouter initialEntries={["/notifications?pageSize=10&current=1"]}>
        <NotificationList />
      </MemoryRouter>,
    );

    const criticalTitle = screen.getByText("Lô hàng #1001 quá hạn giao hàng");
    const criticalCard = criticalTitle.closest("article");
    expect(criticalCard).not.toBeNull();

    fireEvent.click(criticalCard!);

    expect(mockNavigate).toHaveBeenCalledWith(
      "/tms/dispatch?filter=at-risk&shipment=load-101",
    );

    mockNavigate.mockReset();

    const unassignedTitle = screen.getByText(
      "Cảnh báo lô #1002 chưa phân công xe",
    );
    const unassignedCard = unassignedTitle.closest("article");
    expect(unassignedCard).not.toBeNull();

    fireEvent.click(unassignedCard!);

    expect(mockNavigate).toHaveBeenCalledWith(
      "/tms/dispatch?filter=unassigned&shipment=load-102",
    );
  });

  it("filters notifications by severity and search query", () => {
    render(
      <MemoryRouter initialEntries={["/notifications?pageSize=10&current=1"]}>
        <NotificationList />
      </MemoryRouter>,
    );

    const filterGroup = screen.getByRole("group", {
      name: "Lọc theo mức độ quan trọng",
    });
    const criticalFilterBtn = within(filterGroup).getByRole("button", {
      name: /Khẩn cấp/i,
    });

    fireEvent.click(criticalFilterBtn);

    expect(
      screen.getByText("Lô hàng #1001 quá hạn giao hàng"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Hóa đơn thanh toán đã hoàn tất"),
    ).not.toBeInTheDocument();
  });
});
