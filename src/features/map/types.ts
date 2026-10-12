import { z } from "zod";
import type { LucideIcon } from "lucide-react";
import { Bike, Car, Truck } from "lucide-react";

/**
 * Toạ độ chuẩn toạ độ địa lý: [longitude, latitude] (kinh độ, vĩ độ).
 * LƯU Ý: Luôn dùng [lng, lat] cho MapLibre, GeoJSON và deck.gl.
 */
export type LngLat = [number, number];

export const LngLatSchema = z.tuple([
  z.number().min(-180).max(180), // Longitude
  z.number().min(-90).max(90),   // Latitude
]);

/**
 * Trạng thái giao hàng
 */
export const DeliveryStatusSchema = z.enum([
  "pending",     // Chờ giao
  "in_transit",   // Đang giao
  "delivered",    // Giao thành công
  "failed",       // Giao thất bại
]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

/**
 * Cấu hình hiển thị màu và nhãn trạng thái giao hàng
 */
export const STATUS_CONFIGS: Record<
  DeliveryStatus,
  { label: string; color: [number, number, number]; hex: string }
> = {
  pending: {
    label: "Chờ giao",
    color: [234, 179, 8], // Vàng amber
    hex: "#EAB308",
  },
  in_transit: {
    label: "Đang giao",
    color: [59, 130, 246], // Xanh dương
    hex: "#3B82F6",
  },
  delivered: {
    label: "Hoàn tất",
    color: [16, 185, 129], // Xanh lục emerald
    hex: "#10B981",
  },
  failed: {
    label: "Thất bại",
    color: [239, 68, 68], // Đỏ
    hex: "#EF4444",
  },
};

/**
 * Loại phương tiện giao hàng
 */
export const VehicleTypeSchema = z.enum(["motorbike", "van", "truck_1t"]);
export type VehicleType = z.infer<typeof VehicleTypeSchema>;

export interface VehicleConfig {
  type: VehicleType;
  label: string;
  maxWeightKg: number;
  color: [number, number, number];
  hex: string;
  icon: LucideIcon;
}

export const VEHICLE_CONFIGS: Record<VehicleType, VehicleConfig> = {
  motorbike: {
    type: "motorbike",
    label: "Xe máy",
    maxWeightKg: 50,
    color: [16, 185, 129], // Emerald
    hex: "#10B981",
    icon: Bike,
  },
  van: {
    type: "van",
    label: "Xe Van",
    maxWeightKg: 500,
    color: [59, 130, 246], // Blue
    hex: "#3B82F6",
    icon: Car,
  },
  truck_1t: {
    type: "truck_1t",
    label: "Xe tải 1T",
    maxWeightKg: 1000,
    color: [245, 158, 11], // Amber
    hex: "#F59E0B",
    icon: Truck,
  },
};

/**
 * Điểm giao hàng (Delivery Point)
 */
export const DeliveryPointSchema = z.object({
  id: z.string(),
  orderCode: z.string(),
  customerName: z.string(),
  phoneNumber: z.string().optional(),
  address: z.string(),
  coordinates: LngLatSchema, // [lng, lat]
  status: DeliveryStatusSchema,
  weightKg: z.number().positive(),
  vehicleType: VehicleTypeSchema,
  zoneId: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type DeliveryPoint = z.infer<typeof DeliveryPointSchema>;

/**
 * Vùng giao hàng (Delivery Zone)
 */
export const DeliveryZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  // GeoJSON Polygon coordinates: array of rings, each ring is [lng, lat][]
  polygon: z.object({
    type: z.literal("Feature"),
    properties: z.record(z.string(), z.unknown()),
    geometry: z.object({
      type: z.literal("Polygon"),
      coordinates: z.array(z.array(LngLatSchema)),
    }),
  }),
  color: z.tuple([z.number(), z.number(), z.number()]).optional(),
});
export type DeliveryZone = z.infer<typeof DeliveryZoneSchema>;
export type { RouteRequest } from "./hooks/useRoutes";

/**
 * Dữ liệu tuyến đường (Route Data)
 */
export const RouteDataSchema = z.object({
  id: z.string(),
  vehicleType: VehicleTypeSchema,
  vehiclePlate: z.string(),
  driverName: z.string(),
  coordinates: z.array(LngLatSchema), // Mảng toạ độ [lng, lat] đã giải mã
  distanceKm: z.number(),
  durationMinutes: z.number(),
  encodedPolyline: z.string().optional(),
  color: z.tuple([z.number(), z.number(), z.number()]),
});
export type RouteData = z.infer<typeof RouteDataSchema>;

/**
 * Kết quả tìm kiếm địa chỉ (Geocoding Result)
 */
export const GeocodingResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  formattedAddress: z.string(),
  coordinates: LngLatSchema, // [lng, lat]
  postalCode: z.string().optional(),
  type: z.string().optional(),
});
export type GeocodingResult = z.infer<typeof GeocodingResultSchema>;

/**
 * Schema kiểm tra mã bưu chính Việt Nam (Mã bưu điện 6 chữ số theo chuẩn VNPost)
 */
export const VietnamPostalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Mã bưu chính Việt Nam phải gồm đúng 6 chữ số (VD: 700000)");

/**
 * Cụm dữ liệu H3 (H3 Cluster)
 */
export interface H3Cluster {
  hex: string;
  count: number;
  boundary: LngLat[]; // [lng, lat][]
  color: [number, number, number, number];
}
