import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PriorityShipmentCard } from "@/features/dashboard/components/PriorityShipmentCard";

describe("PriorityShipmentCard data truth", () => {
  it("does not invent a shipment when no data is supplied", () => {
    render(<PriorityShipmentCard />);

    expect(screen.getByRole("status")).toHaveTextContent("Chưa có dữ liệu chuyến ưu tiên");
    expect(screen.queryByText("LD-84920")).not.toBeInTheDocument();
    expect(screen.queryByText(/AI PHÁT HIỆN CHUYẾN CÓ RỦI RO/)).not.toBeInTheDocument();
  });

  it("uses supplied shipment status and shows an AI banner only when supplied", () => {
    render(<PriorityShipmentCard shipments={[{
      id: "load-1",
      trackingNumber: "LOAD-1",
      origin: "Điểm đi",
      destination: "Điểm đến",
      status: "Đang vận chuyển",
      windowStart: "10:00",
      windowEnd: "11:00",
      eta: "10:45",
    }]} />);

    expect(screen.getByText("Đang vận chuyển")).toBeInTheDocument();
    expect(screen.queryByText(/AI PHÁT HIỆN CHUYẾN CÓ RỦI RO/)).not.toBeInTheDocument();
  });
});
