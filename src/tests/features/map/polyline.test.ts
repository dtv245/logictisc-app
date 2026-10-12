import { describe, expect, it } from "vitest";
import { decodePolyline, encodePolyline } from "@/features/map/lib/polyline";
import type { LngLat } from "@/features/map/types";

describe("lib/polyline.ts", () => {
  // Toạ độ mẫu tại TP.HCM: [lng, lat]
  const sampleCoords: LngLat[] = [
    [106.66017, 10.76262], // Bắt đầu
    [106.67500, 10.77200], // Giữa
    [106.70000, 10.78500], // Kết thúc
  ];

  it("mã hoá và giải mã polyline đảo đúng thứ tự [lat, lng] sang [lng, lat]", () => {
    const encoded = encodePolyline(sampleCoords, 5);
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodePolyline(encoded, 5);
    expect(decoded).toHaveLength(sampleCoords.length);

    // Kiểm tra toạ độ đầu tiên: [lng, lat]
    // Dung sai sai số làm tròn 1e-5
    expect(decoded[0][0]).toBeCloseTo(106.66017, 4); // Kinh độ (lng)
    expect(decoded[0][1]).toBeCloseTo(10.76262, 4);  // Vĩ độ (lat)

    expect(decoded[2][0]).toBeCloseTo(106.70000, 4);
    expect(decoded[2][1]).toBeCloseTo(10.78500, 4);
  });

  it("hỗ trợ độ chính xác precision 6 cho các API routing như Valhalla", () => {
    const encoded6 = encodePolyline(sampleCoords, 6);
    const decoded6 = decodePolyline(encoded6, 6);

    expect(decoded6).toHaveLength(sampleCoords.length);
    expect(decoded6[0][0]).toBeCloseTo(106.66017, 5);
    expect(decoded6[0][1]).toBeCloseTo(10.76262, 5);
  });

  it("trả về mảng rỗng một cách an toàn khi chuỗi polyline rỗng hoặc không hợp lệ", () => {
    expect(decodePolyline("")).toEqual([]);
    expect(decodePolyline(null as unknown as string)).toEqual([]);
    expect(encodePolyline([])).toBe("");
  });
});
