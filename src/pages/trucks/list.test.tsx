import type { ReactNode } from "react";
import { App as AntdApp } from "antd";
import { useCan, useList } from "@refinedev/core";
import type { CrudFilters } from "@refinedev/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Vehicle } from "@/types/trucks/vehicle.types";

import { TruckList } from "./list";

vi.mock("@refinedev/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@refinedev/core")>();
  return { ...actual, useCan: vi.fn(() => ({ data: { can: true } })), useList: vi.fn() };
});

vi.mock("@/components/trucks/TruckCreateModal", () => ({
  TruckCreateModal: ({ trigger }: { trigger: (show: () => void) => ReactNode }) =>
    trigger(() => undefined),
}));

const vehicle: Vehicle = {
  id: "vehicle-1",
  version: 3,
  number: "TRK-UPD-1791603980",
  type: "SEMI",
  vehicleCapacity: 46_000,
  status: "AVAILABLE",
  make: "Freightliner",
  model: "Cascadia Evolution",
  year: 2024,
  vin: null,
  licensePlate: null,
  licensePlateState: null,
  isHazmatPlacarded: true,
  mainDriverId: "driver-1",
  mainDriverName: "Nguyễn Văn An",
  secondaryDriverId: null,
  secondaryDriverName: null,
  adrEquipmentIsAdrCertified: true,
  adrEquipmentAllowedClasses: "3,8",
  currentLocationLatitude: 21.02776,
  currentLocationLongitude: 105.83416,
};

const listResult = {
  data: { data: [vehicle], total: 28 },
  isLoading: false,
  isFetching: false,
  isError: false,
  isFetched: true,
  refetch: vi.fn(),
};

const mockedUseList = vi.mocked(useList);
const mockedUseCan = vi.mocked(useCan);

const renderTruckList = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AntdApp>
        <TruckList />
      </AntdApp>
    </MemoryRouter>,
  );

describe("truck list page", () => {
  beforeEach(() => {
    mockedUseList.mockReturnValue(listResult as never);
    mockedUseCan.mockReturnValue({ data: { can: true } } as never);
  });

  it("shows server pagination totals and the null-plate fallback", () => {
    renderTruckList();

    expect(screen.getByText("Hiển thị 1–10 / 28 xe")).toBeInTheDocument();
    expect(screen.getAllByText("TRK-UPD-1791603980").length).toBeGreaterThan(0);
    expect(screen.getByText("Chưa có biển số")).toBeInTheDocument();
  });

  it("filters by the discovered type value and resets the API page to one", async () => {
    renderTruckList();
    const pageTwo = document.querySelector(".ant-pagination-item-2");
    expect(pageTwo).not.toBeNull();
    fireEvent.click(pageTwo as HTMLElement);

    await waitFor(() => {
      expect(mockedUseList).toHaveBeenCalledWith(expect.objectContaining({
        pagination: expect.objectContaining({ current: 2, pageSize: 10 }),
      }));
    });
    fireEvent.click(screen.getByText("Xe đầu kéo (Semi)", { exact: true }));

    await waitFor(() => {
      expect(mockedUseList).toHaveBeenCalledWith(expect.objectContaining({
        pagination: expect.objectContaining({ current: 1, pageSize: 10 }),
        filters: expect.arrayContaining([
          expect.objectContaining({ field: "type", operator: "eq", value: "SEMI" }),
        ]),
      }));
    });
  });

  it("opens a drawer with all thirteen vehicle details", () => {
    renderTruckList();
    fireEvent.click(screen.getByRole("button", { name: "Xem chi tiết xe TRK-UPD-1791603980" }));

    expect(screen.getByText("Chi tiết xe — TRK-UPD-1791603980")).toBeInTheDocument();
    expect(screen.getByText("Đã chứng nhận — lớp 3,8")).toBeInTheDocument();
    expect(screen.getByText("Có gắn biển")).toBeInTheDocument();
    expect(screen.getAllByText("21.02776° N, 105.83416° E")).toHaveLength(2);
    expect(screen.getByText("Phiên bản")).toBeInTheDocument();
    expect(document.body.querySelectorAll(".ant-descriptions-row")).toHaveLength(13);
  });

  it("sends search to the API and falls back to normalized text on the current page", async () => {
    const otherVehicle: Vehicle = {
      ...vehicle,
      id: "vehicle-2",
      number: "TRK-OTHER-0001",
      mainDriverName: "John Driver",
    };
    const unfilteredResult = {
      ...listResult,
      data: { data: [vehicle, otherVehicle], total: 28 },
    };
    mockedUseList.mockImplementation(((options: { filters?: CrudFilters }) => {
      const hasSearch = options.filters?.some((filter) =>
        "field" in filter && filter.field === "search",
      ) ?? false;
      return hasSearch
        ? { ...listResult, data: { data: [], total: 0 } }
        : unfilteredResult;
    }) as never);
    renderTruckList();

    fireEvent.change(screen.getByRole("textbox", { name: "Tìm kiếm xe" }), {
      target: { value: "nguyen van an" },
    });

    await waitFor(() => {
      expect(mockedUseList).toHaveBeenCalledWith(expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ field: "search", operator: "contains", value: "nguyen van an" }),
        ]),
      }));
    });
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Xem chi tiết xe/ })).toHaveLength(1);
      expect(screen.queryByText("TRK-OTHER-0001")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Nguyễn Văn An")).toBeInTheDocument();
  });

  it("confirms deactivation and shows the backend-unavailable toast", async () => {
    renderTruckList();

    fireEvent.click(screen.getByRole("button", { name: "Vô hiệu hóa xe TRK-UPD-1791603980" }));
    expect(screen.getAllByText("Vô hiệu hóa xe?").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Vô hiệu hóa" }));

    expect(await screen.findByText("API vô hiệu hóa xe chưa được hỗ trợ.")).toBeInTheDocument();
    expect(screen.queryByText("Chi tiết xe — TRK-UPD-1791603980")).not.toBeInTheDocument();
  });
});
