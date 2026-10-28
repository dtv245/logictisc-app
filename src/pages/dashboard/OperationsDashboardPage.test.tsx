import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { OperationsDashboardPage } from "@/pages/dashboard/OperationsDashboardPage";

vi.mock("@/features/dashboard/components/OperationsDashboardView", () => ({
  OperationsDashboardView: () => <div>Dữ liệu Operations từ API</div>,
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

describe("OperationsDashboardPage", () => {
  it("renders live operations data and preserves URL query parameters", () => {
    renderPage("/operations?tab=overview");
    expect(screen.getByText("Dữ liệu Operations từ API")).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Dữ liệu mẫu Operations" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Đường dẫn hiện tại")).toHaveTextContent("/operations?tab=overview");
  });

  it("ignores demo query parameter and still renders live operations data", () => {
    renderPage("/operations?demo=1");
    expect(screen.getByText("Dữ liệu Operations từ API")).toBeInTheDocument();
    expect(screen.queryByText("Đang xem dữ liệu mẫu Operations")).not.toBeInTheDocument();
    expect(screen.queryByText("Xem thử Operations với dữ liệu mẫu")).not.toBeInTheDocument();
  });

  it("does not render any sample preview banner or switch controls", () => {
    renderPage("/operations");
    expect(screen.getByText("Dữ liệu Operations từ API")).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
