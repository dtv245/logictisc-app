import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { NetworkMiniMap } from "@/features/dashboard/components/NetworkMiniMap";
import type { NetworkRouteMapProps } from "@/types/dashboard/network-map.types";

vi.mock("@/components/dashboard/NetworkRouteMap", () => ({ NetworkRouteMap: ({ vehicles, routes }: NetworkRouteMapProps) => <div data-testid="map" data-vehicles={vehicles.length} data-routes={routes.length} /> }));
const vehicle = { id: "v-test", plate: "TEST-001", latitude: 10, longitude: 106, status: "moving" as const };

describe("NetworkMiniMap", () => {
  it("does not create a map or fake live data for missing/empty positions", () => {
    const view = render(<MemoryRouter><NetworkMiniMap /></MemoryRouter>);
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Chưa có dữ liệu");
    expect(screen.queryByRole("button", { name: "Chi tiết bản đồ" })).not.toBeInTheDocument();
    view.rerender(<MemoryRouter><NetworkMiniMap vehicles={[]} routes={[]} /></MemoryRouter>);
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
  });
  it("discards invalid positions and malformed routes", () => {
    render(<MemoryRouter><NetworkMiniMap vehicles={[vehicle, { ...vehicle, id: "bad", latitude: Number.NaN }]} routes={[{ id: "bad-route", coordinates: [[106, 95], [107, 20]] }]} /></MemoryRouter>);
    expect(screen.getByTestId("map")).toHaveAttribute("data-vehicles", "1");
    expect(screen.getByTestId("map")).toHaveAttribute("data-routes", "0");
    expect(screen.getByText("Vị trí gần nhất")).toBeInTheDocument();
    expect(screen.queryByText("Trực tuyến")).not.toBeInTheDocument();
  });
  it("shows live status and an aggregate only when explicitly supplied", () => {
    render(<MemoryRouter><NetworkMiniMap vehicles={[vehicle]} isLive onRoadCount={214} locale="en" /></MemoryRouter>);
    expect(screen.getByText("Live network")).toBeInTheDocument();
    expect(screen.getByText("214 on road")).toBeInTheDocument();
  });
  it("opens the full map through the supplied handler", () => {
    const open = vi.fn();
    render(<MemoryRouter><NetworkMiniMap onOpenFullMap={open} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Chi tiết bản đồ" }));
    expect(open).toHaveBeenCalledOnce();
  });
});
