import { useMemo } from "react";
import type { DeliveryPoint, DeliveryStatus, DeliveryZone, LngLat, VehicleType } from "../types";
import { isInsideZone } from "../lib/geo";

/**
 * Đa giác vùng giao hàng trọng điểm TP.HCM (Khu vực Quận 1, Quận 3, Quận 10, Bình Thạnh).
 * Chuẩn GeoJSON Polygon: coordinates là mảng các vòng khép kín toạ độ [lng, lat].
 */
export const SAMPLE_DELIVERY_ZONE: DeliveryZone = {
  id: "zone-hcm-central",
  name: "Vùng Trung Tâm TP.HCM (Q1, Q3, Bình Thạnh)",
  code: "ZONE-HCM-01",
  polygon: {
    type: "Feature",
    properties: {
      name: "Vùng Trung Tâm TP.HCM",
      description: "Khu vực ưu tiên xe máy và xe van",
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [106.675, 10.745],
          [106.715, 10.760],
          [106.725, 10.805],
          [106.690, 10.820],
          [106.660, 10.800],
          [106.650, 10.765],
          [106.675, 10.745], // Điểm đóng vòng
        ],
      ],
    },
  },
  color: [59, 130, 246], // Xanh dương
};

const SAMPLE_CUSTOMERS = [
  "Công ty Logistics Alpha",
  "Kho hàng Tân Bình",
  "Cửa hàng Tiện lợi GS25",
  "Siêu thị Co.opmart",
  "Nhà thuốc An Khang",
  "Văn phòng Vincom Center",
  "Cà phê The Coffee House",
  "Shopee Hub Bình Thạnh",
  "Bưu cục Viettel Post",
  "Đại lý Sữa Vinamilk",
];

const SAMPLE_STREETS = [
  "Nguyễn Huệ, Q.1",
  "Lê Lợi, Q.1",
  "Cách Mạng Tháng 8, Q.3",
  "Điện Biên Phủ, Bình Thạnh",
  "Võ Văn Tần, Q.3",
  "Nguyễn Thị Minh Khai, Q.1",
  "Trần Hưng Đạo, Q.5",
  "Ba Tháng Hai, Q.10",
  "Hoàng Văn Thụ, Tân Bình",
  "Phan Xích Long, Phú Nhuận",
];

const STATUS_POOL: DeliveryStatus[] = [
  "pending",
  "in_transit",
  "delivered",
  "failed",
];

const VEHICLE_POOL: VehicleType[] = ["motorbike", "van", "truck_1t"];

/**
 * Sinh ngẫu nhiên ~2,000 điểm giao hàng phân bố thực tế tại TP. Hồ Chí Minh
 * (khoảng toạ độ: lng 106.62 -> 106.73, lat 10.73 -> 10.82)
 */
export function generateMockDeliveryPoints(count: number = 2000): DeliveryPoint[] {
  const points: DeliveryPoint[] = [];

  // Tâm TP.HCM: 106.660172, 10.762622
  const baseLng = 106.675;
  const baseLat = 10.775;

  for (let i = 1; i <= count; i++) {
    // Phân bố Gaussian giả lập để tập trung dày hơn ở khu trung tâm
    const u1 = Math.random();
    const u2 = Math.random();
    const radius = Math.sqrt(-2 * Math.log(u1 || 0.001)) * 0.035;
    const angle = 2 * Math.PI * u2;

    const lng = baseLng + radius * Math.cos(angle);
    const lat = baseLat + radius * Math.sin(angle);
    const coords: LngLat = [lng, lat];

    const status = STATUS_POOL[Math.floor(Math.random() * STATUS_POOL.length)];
    const vehicleType = VEHICLE_POOL[Math.floor(Math.random() * VEHICLE_POOL.length)];
    const customer = SAMPLE_CUSTOMERS[Math.floor(Math.random() * SAMPLE_CUSTOMERS.length)];
    const street = SAMPLE_STREETS[Math.floor(Math.random() * SAMPLE_STREETS.length)];

    const inZone = isInsideZone(coords, SAMPLE_DELIVERY_ZONE.polygon);

    points.push({
      id: `dp-${i}`,
      orderCode: `ORD-HCM-${String(10000 + i)}`,
      customerName: customer,
      phoneNumber: `090${Math.floor(1000000 + Math.random() * 9000000)}`,
      address: `Số ${Math.floor(1 + Math.random() * 300)}, ${street}, TP.HCM`,
      coordinates: coords,
      status,
      weightKg: Math.round((0.5 + Math.random() * (vehicleType === "motorbike" ? 25 : 300)) * 10) / 10,
      vehicleType,
      zoneId: inZone ? SAMPLE_DELIVERY_ZONE.id : null,
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString(),
    });
  }

  return points;
}

/**
 * Hook nạp dữ liệu mẫu điểm giao hàng và vùng giao hàng.
 */
export function useDeliveryPoints(count: number = 2000) {
  const points = useMemo(() => generateMockDeliveryPoints(count), [count]);
  const zones = useMemo(() => [SAMPLE_DELIVERY_ZONE], []);

  return {
    points,
    zones,
    isLoading: false,
    totalCount: points.length,
  };
}
