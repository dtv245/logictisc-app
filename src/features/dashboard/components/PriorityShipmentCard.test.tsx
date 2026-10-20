import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PriorityShipmentCard } from "@/features/dashboard/components/PriorityShipmentCard";

describe("PriorityShipmentCard data truth", () => {
  it("does not render the preview fixture shipment when live data is unavailable", () => {
    render(<PriorityShipmentCard />);

    expect(screen.getByRole("status")).toHaveTextContent("Chưa có dữ liệu chuyến ưu tiên");
    expect(screen.queryByText("LD-84920")).not.toBeInTheDocument();
    expect(screen.queryByText("Cảng Cát Lái")).not.toBeInTheDocument();
    expect(screen.queryByText(/AI PHÁT HIỆN CHUYẾN CÓ RỦI RO/)).not.toBeInTheDocument();
  });

  it("uses supplied shipment status and shows an AI banner only when supplied", () => {
    render(<PriorityShipmentCard shipments={[{
      id: "load-1",
      reference: "LOAD-1",
      origin: "Điểm đi",
      destination: "Điểm đến",
      status: { label: "Đang vận chuyển", tone: "neutral" },
      deliveryWindow: "10:00–11:00",
      eta: "10:45",
    }]} />);

    expect(screen.getByText("Đang vận chuyển")).toBeInTheDocument();
    expect(screen.queryByText(/AI PHÁT HIỆN CHUYẾN CÓ RỦI RO/)).not.toBeInTheDocument();
  });

});
