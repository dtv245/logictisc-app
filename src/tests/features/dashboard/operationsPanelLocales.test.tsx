import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DispatchTimeline } from "@/features/dashboard/components/DispatchTimeline";
import { NetworkMiniMap } from "@/features/dashboard/components/NetworkMiniMap";
import { OperationsBrief } from "@/features/dashboard/components/OperationsBrief";
import { PriorityShipmentCard } from "@/components/dashboard/PriorityShipmentCard";
import { setTestLocale } from "@/tests/testLocale";

describe("Operations panel locale switching", () => {
  it.each([
    { locale: "vi" as const, brief: "Bản tin điều phối", map: "Chưa có dữ liệu vị trí xe hoặc tuyến vận hành.", timeline: "Chưa có lịch điều phối tài xế.", priority: "Chưa có chuyến đang vận chuyển", foreign: ["Operations brief", "No vehicle positions or routes available.", "No driver schedules available.", "No shipments in transit", "運行概要", "車両位置またはルート情報はありません。", "ドライバーの予定はありません。", "輸送中の貨物はありません"] },
    { locale: "en" as const, brief: "Operations brief", map: "No vehicle positions or routes available.", timeline: "No driver schedules available.", priority: "No shipments in transit", foreign: ["Bản tin điều phối", "Chưa có dữ liệu vị trí xe hoặc tuyến vận hành.", "Chưa có lịch điều phối tài xế.", "Chưa có chuyến đang vận chuyển", "運行概要", "車両位置またはルート情報はありません。", "ドライバーの予定はありません。", "輸送中の貨物はありません"] },
    { locale: "ja" as const, brief: "運行概要", map: "車両位置またはルート情報はありません。", timeline: "ドライバーの予定はありません。", priority: "輸送中の貨物はありません", foreign: ["Bản tin điều phối", "Chưa có dữ liệu vị trí xe hoặc tuyến vận hành.", "Chưa có lịch điều phối tài xế.", "Chưa có chuyến đang vận chuyển", "Operations brief", "No vehicle positions or routes available.", "No driver schedules available.", "No shipments in transit"] },
  ])("renders all Operations panels in $locale without mixed UI copy", async ({ locale, brief, map, timeline, priority, foreign }) => {
    const i18n = await setTestLocale(locale);
    render(<MemoryRouter><OperationsBrief /><NetworkMiniMap /><DispatchTimeline /><PriorityShipmentCard /></MemoryRouter>);

    expect(screen.getByRole("region", { name: brief })).toBeInTheDocument();
    expect(screen.getByText(map)).toBeInTheDocument();
    expect(screen.getByText(timeline)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: priority })).toBeInTheDocument();
    for (const copy of foreign) expect(screen.queryByText(copy)).not.toBeInTheDocument();
    expect(i18n.language).toBe(locale);
  });
});
