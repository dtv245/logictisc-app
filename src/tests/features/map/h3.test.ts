import { describe, expect, it } from "vitest";
import {
  pointToH3Cell,
  h3CellToBoundaryLngLat,
  aggregatePointsByH3,
} from "@/features/map/lib/h3";
import type { LngLat } from "@/features/map/types";

describe("lib/h3.ts", () => {
  const sampleLngLat: LngLat = [106.660172, 10.762622];

  it("chuyển đổi toạ độ sang mã ô lục giác H3 hợp lệ", () => {
    const cell = pointToH3Cell(sampleLngLat[0], sampleLngLat[1], 8);
    expect(typeof cell).toBe("string");
    expect(cell.length).toBe(15); // Chuỗi hex H3 resolution 8 thường dài 15 ký tự
  });

  it("lấy ranh giới ô H3 trả về mảng toạ độ dạng [lng, lat]", () => {
    const cell = pointToH3Cell(sampleLngLat[0], sampleLngLat[1], 8);
    const boundary = h3CellToBoundaryLngLat(cell);

    expect(boundary.length).toBeGreaterThanOrEqual(6); // Lục giác có 6 đỉnh
    // Kiểm tra toạ độ đỉnh đầu tiên là [lng, lat]
    const [firstLng, firstLat] = boundary[0];
    expect(firstLng).toBeGreaterThan(106.0);
    expect(firstLng).toBeLessThan(107.0);
    expect(firstLat).toBeGreaterThan(10.0);
    expect(firstLat).toBeLessThan(11.0);
  });

  it("gom cụm danh sách điểm vào các ô H3 và tính toán mật độ", () => {
    const points = [
      { coordinates: sampleLngLat },
      { coordinates: [106.6605, 10.7628] as LngLat }, // Điểm gần kề cùng ô
      { coordinates: [106.7200, 10.8100] as LngLat }, // Điểm ở xa ô khác
    ];

    const clusters = aggregatePointsByH3(points, 8);
    expect(clusters.length).toBeGreaterThan(0);

    const firstCluster = clusters[0];
    expect(firstCluster).toHaveProperty("hex");
    expect(firstCluster).toHaveProperty("count");
    expect(firstCluster).toHaveProperty("boundary");
    expect(firstCluster).toHaveProperty("color");
  });
});
