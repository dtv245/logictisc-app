import type { AiDispatchMode, AiMovementPlan } from "@/features/ai-dispatch/types/ai-dispatch.types";
/**
 * Fixture mẫu dùng riêng cho kiểm thử tự động (Unit Tests).
 * KHÔNG sử dụng làm mock runtime trong ứng dụng thực tế.
 */
interface AiMovementPlanFixtureParams {
  mode: AiDispatchMode;
  loadId: string;
  truckId?: string;
  instructions?: string;
}

export function generateAiMovementPlan(params: AiMovementPlanFixtureParams): AiMovementPlan {
  const planId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const truckId = params.truckId || "TRK-01";
  const truckShort = truckId.slice(0, 8);
  const loadShort = (params.loadId || "LD-01").slice(0, 8);

  return {
    id: planId,
    sessionId,
    truckId,
    truckNumber: `TRK-${truckShort.toUpperCase()}`,
    driverId: crypto.randomUUID(),
    driverName: "Nguyễn Văn Hùng",
    loadId: params.loadId,
    loadNumber: `LD-${loadShort.toUpperCase()}`,
    totalDistanceMiles: 245,
    deadheadMiles: 18,
    deadheadReductionPercent: 32,
    estimatedDurationHours: 5.5,
    estimatedRevenue: 1450,
    estimatedCost: 680,
    estimatedMargin: 770,
    currency: "USD",
    hosStatus: "compliant",
    hosRemainingHours: 7.5,
    aiConfidenceScore: 96,
    aiReasoning:
      params.instructions && params.instructions.trim().length > 0
        ? `AI đã tối ưu theo chỉ đạo: "${params.instructions.trim()}". Xe TRK-${truckShort.toUpperCase()} có vị trí xuất phát tối ưu nhất, giảm 32% quãng đường chạy rỗng, đảm bảo tuân thủ giờ nghỉ HOS theo quy định an toàn và giao hàng đúng khung giờ hẹn.`
        : `AI đã phân tích các xe và đơn hàng khả dụng. Xe TRK-${truckShort.toUpperCase()} được chỉ định cho chuyến hàng LD-${loadShort.toUpperCase()} với mức giảm chạy rỗng 32%, tiết kiệm chi phí nhiên liệu và lộ trình có điểm dừng nghỉ 30 phút bắt buộc tuân thủ HOS.`,
    status: "proposed",
    stops: [
      {
        id: crypto.randomUUID(),
        order: 1,
        type: "terminal_origin",
        name: "Bến xe Tân Bình (Bãi xe xuất phát)",
        address: "142 Hoàng Hoa Thám",
        city: "TP. Hồ Chí Minh",
        state: "HCM",
        plannedArrival: "2026-10-11T07:00:00Z",
        plannedDeparture: "2026-10-11T07:15:00Z",
        distanceFromLastStopMiles: 0,
        durationMinutes: 15,
        dwellTimeMinutes: 15,
        instructions: "Kiểm tra kỹ thuật xe trước khi khởi hành (Pre-trip Inspection DVIR).",
      },
      {
        id: crypto.randomUUID(),
        order: 2,
        type: "pickup",
        name: "Kho Tổng Sotrans Thủ Đức (Điểm lấy hàng)",
        address: "Khu Công Nghệ Cao, Xa lộ Hà Nội",
        city: "TP. Thủ Đức",
        state: "HCM",
        plannedArrival: "2026-10-11T08:00:00Z",
        plannedDeparture: "2026-10-11T08:45:00Z",
        distanceFromLastStopMiles: 18,
        durationMinutes: 45,
        dwellTimeMinutes: 45,
        instructions: `Nhận đơn hàng LD-${loadShort.toUpperCase()}. Kiểm tra niêm phong seal và chứng từ vận tải.`,
      },
      {
        id: crypto.randomUUID(),
        order: 3,
        type: "rest_break",
        name: "Trạm Dừng Nghỉ Cao Tốc Km 104 (Nghỉ HOS bắt buộc)",
        address: "Km 104 Cao tốc Dầu Giây - Phan Thiết",
        city: "Xuân Lộc",
        state: "Đồng Nai",
        plannedArrival: "2026-10-11T12:00:00Z",
        plannedDeparture: "2026-10-11T12:30:00Z",
        distanceFromLastStopMiles: 86,
        durationMinutes: 30,
        dwellTimeMinutes: 30,
        instructions: "Nghỉ ngơi 30 phút theo luật an toàn HOS (30-minute rest break compliance).",
      },
      {
        id: crypto.randomUUID(),
        order: 4,
        type: "delivery",
        name: "Trung Tâm Phân Phối Mega Bình Dương (Điểm giao hàng)",
        address: "Khu Công Nghiệp VSIP 1, Đại Lộ Độc Lập",
        city: "Thuận An",
        state: "Bình Dương",
        plannedArrival: "2026-10-11T14:30:00Z",
        plannedDeparture: "2026-10-11T15:15:00Z",
        distanceFromLastStopMiles: 110,
        durationMinutes: 45,
        dwellTimeMinutes: 45,
        instructions: "Bàn giao hàng hóa, chụp ảnh ký nhận biên bản giao nhận e-POD.",
      },
      {
        id: crypto.randomUUID(),
        order: 5,
        type: "terminal_return",
        name: "Bến xe Tân Bình (Bãi xe tập kết về)",
        address: "142 Hoàng Hoa Thám",
        city: "TP. Hồ Chí Minh",
        state: "HCM",
        plannedArrival: "2026-10-11T16:30:00Z",
        plannedDeparture: "2026-10-11T16:45:00Z",
        distanceFromLastStopMiles: 31,
        durationMinutes: 15,
        dwellTimeMinutes: 15,
        instructions: "Kết thúc chuyến đi, ghi nhận số km Odometer và hoàn thành Post-trip DVIR.",
      },
    ],
  };
}

export const initialMovementPlan = generateAiMovementPlan({
  mode: "assisted",
  truckId: "4a2b9183-1100-4b2e-a551-912c7d91a123",
  loadId: "7e5f3922-2200-4c3d-b442-823d6e82b456",
  instructions: "Ưu tiên xe có hệ thống định vị GPS và tài xế đã quen tuyến cao tốc phía Nam.",
});
