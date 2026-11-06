import { describe, expect, it } from "vitest";
import {
  addMinutes,
  estimateDeliveryAt,
  formatDurationMinutes,
  validateDeliveryAfterPickup,
} from "./loadSchedule";

describe("load schedule", () => {
  it("chặn giờ giao trước hoặc bằng giờ lấy", () => {
    const pickup = "2026-11-02T08:00:00.000Z";
    expect(validateDeliveryAfterPickup(pickup, "2026-11-02T07:59:00.000Z")).toBe(
      "Thời gian giao hàng phải sau thời gian lấy hàng",
    );
    expect(validateDeliveryAfterPickup(pickup, pickup)).toBe(
      "Thời gian giao hàng phải sau thời gian lấy hàng",
    );
  });

  it("cho phép giờ giao sau giờ lấy và bỏ trống một mốc", () => {
    expect(
      validateDeliveryAfterPickup("2026-11-02T08:00:00.000Z", "2026-11-02T09:00:00.000Z"),
    ).toBeNull();
    expect(validateDeliveryAfterPickup(null, "2026-11-02T09:00:00.000Z")).toBeNull();
    expect(validateDeliveryAfterPickup("2026-11-02T08:00:00.000Z", undefined)).toBeNull();
  });

  it("cộng phút và tính ETA", () => {
    const pickup = new Date("2026-11-02T08:00:00.000Z");
    expect(addMinutes(pickup, 90)?.toISOString()).toBe("2026-11-02T09:30:00.000Z");
    expect(estimateDeliveryAt(pickup, 90)?.toISOString()).toBe(
      "2026-11-02T09:30:00.000Z",
    );
    expect(estimateDeliveryAt(pickup, null)).toBeNull();
    expect(addMinutes("không phải ngày", 30)).toBeNull();
  });

  it("định dạng thời lượng", () => {
    expect(formatDurationMinutes(45)).toBe("45 phút");
    expect(formatDurationMinutes(120)).toBe("2 giờ");
    expect(formatDurationMinutes(135)).toBe("2 giờ 15 phút");
    expect(formatDurationMinutes(null)).toBe("—");
  });
});
