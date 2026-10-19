import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PriorityShipmentCard } from "@/components/dashboard/PriorityShipmentCard";
import type { PriorityShipment } from "@/types/dashboard/priority-shipment.types";

const shipment: PriorityShipment = {
  id: "load-1", reference: "#1001", origin: "Điểm đi A", destination: "Điểm đến B",
  customer: "Khách hàng thử nghiệm", scheduledDelivery: "15:30",
  stops: [{ id: "origin", name: "Kho A", completed: true }, { id: "destination", name: "Kho B" }],
};

describe("PriorityShipmentCard", () => {
  it("shows an empty state without injecting sample shipments", () => {
    render(<PriorityShipmentCard />);
    expect(screen.getByRole("heading", { name: "Chưa có chuyến đang vận chuyển" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Chưa có dữ liệu");
    expect(screen.queryByText(/Oakland|Cát Lái|Marcus|Nguyễn Văn Hùng/)).not.toBeInTheDocument();
  });

  it("keeps scheduled delivery separate from absent ETA and telemetry", () => {
    render(<PriorityShipmentCard shipments={[shipment]} />);
    expect(screen.getByText("15:30")).toBeInTheDocument();
    expect(screen.getByText("Giờ giao đã hẹn").nextElementSibling).toHaveTextContent("15:30");
    expect(screen.getByText("ETA hiện tại").nextElementSibling).toHaveTextContent("—");
    expect(screen.queryByText(/trong khung giờ|đúng kế hoạch/)).not.toBeInTheDocument();
    expect(screen.queryByText(/mph|km\/h|°F|°C/)).not.toBeInTheDocument();
  });

  it("displays a loading state instead of stale shipment values", () => {
    render(<PriorityShipmentCard shipments={[shipment]} isLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Đang tải");
    expect(screen.queryByText("Khách hàng thử nghiệm")).not.toBeInTheDocument();
    expect(screen.getByRole("region")).toHaveAttribute("aria-busy", "true");
  });

  it("shows a retriable error without displaying stale shipment values", () => {
    const retry = vi.fn();
    render(<PriorityShipmentCard shipments={[shipment]} error="Không kết nối được" onRetry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Không kết nối được");
    expect(screen.queryByText("Khách hàng thử nghiệm")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("wraps shipment navigation and reports the selected ID", () => {
    const onSelectShipment = vi.fn();
    render(<PriorityShipmentCard shipments={[shipment, { ...shipment, id: "load-2", origin: "Điểm đi C" }]} onSelectShipment={onSelectShipment} />);
    fireEvent.click(screen.getByRole("button", { name: "Chuyến trước" }));
    expect(screen.getByRole("heading")).toHaveTextContent("Điểm đi C");
    expect(onSelectShipment).toHaveBeenLastCalledWith("load-2");
    fireEvent.click(screen.getByRole("button", { name: "Chuyến tiếp theo" }));
    expect(screen.getByRole("heading")).toHaveTextContent("Điểm đi A");
    expect(onSelectShipment).toHaveBeenLastCalledWith("load-1");
  });

  it("falls back to an available shipment when the selected shipment disappears", () => {
    const second = { ...shipment, id: "load-2", origin: "Điểm đi C" };
    const view = render(<PriorityShipmentCard shipments={[shipment, second]} />);
    fireEvent.click(screen.getByRole("button", { name: "Chuyến tiếp theo" }));
    view.rerender(<PriorityShipmentCard shipments={[shipment]} />);
    expect(screen.getByRole("heading")).toHaveTextContent("Điểm đi A");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("preserves zero telemetry values and their units", () => {
    render(<PriorityShipmentCard locale="en" shipments={[{ ...shipment, speed: { value: 0, unit: "km/h" }, fuel: { percent: 0, range: 0, rangeUnit: "km" }, reefer: { temperature: 0, setPoint: 0, unit: "C" }, cargo: { pallets: 0, capacity: 26, weight: 0, weightUnit: "kg" } }]} />);
    expect(screen.getByText("0 km/h")).toBeInTheDocument();
    expect(screen.getByText("0% · 0 km")).toBeInTheDocument();
    expect(screen.getByText("0°C · set 0°C")).toBeInTheDocument();
    expect(screen.getByText("0 / 26 pallets · 0 kg")).toBeInTheDocument();
  });

  it("renders supplied agent, delay, congestion and detour information", () => {
    render(<PriorityShipmentCard locale="en" shipments={[{ ...shipment, agent: { label: "Route agent flagged", timeLabel: "26 min ago" }, eta: "15:49", delayMinutes: 47, detour: { label: "I-680 detour", eta: "15:18", savedMinutes: 31, insideWindow: true }, progressPercent: 44, congestion: { startPercent: 48, endPercent: 63, label: "I-80 E · Vallejo", changePercent: -24 } }]} />);
    expect(screen.getByText(/Route agent flagged · 26 min ago/)).toBeInTheDocument();
    expect(screen.getByText("+47 min vs plan")).toBeInTheDocument();
    expect(screen.getByText("inside window")).toBeInTheDocument();
    expect(screen.getByText("−31 min")).toBeInTheDocument();
    expect(screen.getByText("-24% speed")).toBeInTheDocument();
  });

  it("does not claim that an early ETA is late", () => {
    render(<PriorityShipmentCard locale="en" shipments={[{ ...shipment, eta: "15:00", delayMinutes: -10 }]} />);
    expect(screen.getByText("10 min ahead of plan")).toBeInTheDocument();
    expect(screen.queryByText(/vs plan/)).not.toBeInTheDocument();
  });
});
