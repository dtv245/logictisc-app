import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { OperationsDashboardPage } from "@/pages/dashboard/OperationsDashboardPage";

vi.mock("@/features/dashboard/components/OperationsDashboardView", () => ({
  OperationsDashboardView: () => <div>Dữ liệu Operations từ API</div>,
}));

vi.mock("@/features/dashboard/components/DashboardHeader", () => ({
  DashboardHeader: () => <h1>Operations</h1>,
}));

vi.mock("@/components/dashboard/NetworkRouteMap", () => ({
  NetworkRouteMap: () => <div>Bản đồ xe mẫu</div>,
}));

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Đường dẫn hiện tại">{location.pathname}{location.search}</output>;
}

function renderPage(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <OperationsDashboardPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe("Operations preview", () => {
  it("keeps live data as the default and preserves other URL parameters when toggling", () => {
    renderPage("/operations?tab=overview");
    const toggle = screen.getByRole("switch", { name: "Dữ liệu mẫu Operations" });
    expect(toggle).not.toBeChecked();
    expect(screen.getByText("Dữ liệu Operations từ API")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
    expect(screen.queryByText("Dữ liệu Operations từ API")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Đường dẫn hiện tại")).toHaveTextContent("/operations?tab=overview&demo=1");

    fireEvent.click(toggle);
    expect(screen.getByText("Dữ liệu Operations từ API")).toBeInTheDocument();
    expect(screen.getByLabelText("Đường dẫn hiện tại")).toHaveTextContent("/operations?tab=overview");
  });

  it("opens a populated preview directly and lets users browse both sample shipments", () => {
    renderPage("/operations?demo=1");
    expect(screen.getByText("Đang xem dữ liệu mẫu Operations")).toBeInTheDocument();
    expect(screen.queryByText("Dữ liệu Operations từ API")).not.toBeInTheDocument();
    expect(screen.getByText("Đúng giờ (OTD)")).toBeInTheDocument();
    expect(screen.getByText(/3 chuyến có nguy cơ trễ khung giờ giao/)).toBeInTheDocument();
    expect(screen.getByText("Bản đồ xe mẫu")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Biểu đồ điều phối tài xế" })).getByText("Nguyễn Văn Hùng")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Chuyến tiếp theo" }));
    expect(screen.getByRole("heading", { name: /Kho Bến Lức, Long An/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Chuyến trước" }));
    expect(screen.getByRole("heading", { name: /VSIP 1, Bình Dương/ })).toBeInTheDocument();
  });

  it("leaves approval and rejection disabled for sample recommendations", async () => {
    renderPage("/operations?demo=1");
    fireEvent.click(screen.getByRole("button", { name: /Đổi tuyến cho LD-84920/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Phê duyệt" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Từ chối" })).toBeDisabled();
  });
});
