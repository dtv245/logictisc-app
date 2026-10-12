import { describe, expect, it } from "vitest";
import {
  distanceKm,
  isInsideZone,
  isInsideAnyZone,
  calculateBbox,
} from "@/features/map/lib/geo";
import type { DeliveryZone, LngLat } from "@/features/map/types";

describe("lib/geo.ts", () => {
  // Toạ độ TP.HCM: [lng, lat]
  const p1: LngLat = [106.660172, 10.762622]; // Quận 10
  const p2: LngLat = [106.700000, 10.775000]; // Bến Thành, Quận 1

  const samplePolygon: { type: "Polygon"; coordinates: [number, number][][] } = {
    type: "Polygon",
    coordinates: [
      [
        [106.65, 10.75],
        [106.71, 10.75],
        [106.71, 10.80],
        [106.65, 10.80],
        [106.65, 10.75], // Đóng vòng
      ],
    ],
  };

  const sampleZone: DeliveryZone = {
    id: "zone-test",
    name: "Khu vực kiểm thử",
    code: "TEST-01",
    polygon: {
      type: "Feature",
      properties: {},
      geometry: samplePolygon,
    },
  };

  it("tính toán khoảng cách kilômét chính xác theo đường cong Trái Đất", () => {
    // Khoảng cách cùng 1 điểm phải bằng 0
    expect(distanceKm(p1, p1)).toBe(0);

    // Khoảng cách giữa Q.10 và Q.1 khoảng ~4.5 km
    const dist = distanceKm(p1, p2);
    expect(dist).toBeGreaterThan(4.0);
    expect(dist).toBeLessThan(5.0);
  });

  it("kiểm tra điểm nằm trong vùng polygon (isInsideZone)", () => {
    // Điểm p1: [106.66, 10.76] nằm trong hình chữ nhật [106.65-10.71, 10.75-10.80]
    expect(isInsideZone(p1, samplePolygon)).toBe(true);

    // Điểm ngoại thành Hà Nội: [105.85, 21.02] nằm hoàn toàn bên ngoài
    const outsidePoint: LngLat = [105.850000, 21.020000];
    expect(isInsideZone(outsidePoint, samplePolygon)).toBe(false);
  });

  it("kiểm tra điểm nằm trong bất kỳ vùng nào (isInsideAnyZone)", () => {
    expect(isInsideAnyZone(p1, [sampleZone])).toBe(true);

    const outsidePoint: LngLat = [107.000000, 11.500000];
    expect(isInsideAnyZone(outsidePoint, [sampleZone])).toBe(false);
    expect(isInsideAnyZone(outsidePoint, [])).toBe(false);
  });

  it("tính toán bounding box bao quanh tập hợp toạ độ", () => {
    const coords: LngLat[] = [
      [106.65, 10.75],
      [106.70, 10.78],
      [106.68, 10.72],
    ];
    const bbox = calculateBbox(coords);
    expect(bbox).toHaveLength(4);
    // [minLng, minLat, maxLng, maxLat]
    expect(bbox[0]).toBeCloseTo(106.65);
    expect(bbox[1]).toBeCloseTo(10.72);
    expect(bbox[2]).toBeCloseTo(106.70);
    expect(bbox[3]).toBeCloseTo(10.78);
  });
});
