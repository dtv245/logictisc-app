import { z } from "zod";
import { Bike, Car, Truck } from "lucide-react";
import type { DeliveryStatus, VehicleConfig, VehicleType } from "@/types/map/map.types";

export const LngLatSchema = z.tuple([
  z.number().min(-180).max(180), // Longitude
  z.number().min(-90).max(90),   // Latitude
]);

export const DeliveryStatusSchema = z.enum([
  "pending",     // Chờ giao
  "in_transit",   // Đang giao
  "delivered",    // Giao thành công
  "failed",       // Giao thất bại
]);

export const STATUS_CONFIGS: Record<
  DeliveryStatus,
  { label: string; color: [number, number, number]; hex: string }
> = {
  pending: {
    label: "Chờ giao",
    color: [234, 179, 8],
    hex: "#EAB308",
  },
  in_transit: {
    label: "Đang giao",
    color: [59, 130, 246],
    hex: "#3B82F6",
  },
  delivered: {
    label: "Hoàn tất",
    color: [16, 185, 129],
    hex: "#10B981",
  },
  failed: {
    label: "Thất bại",
    color: [239, 68, 68],
    hex: "#EF4444",
  },
};

export const VehicleTypeSchema = z.enum(["motorbike", "van", "truck_1t"]);

export const VEHICLE_CONFIGS: Record<VehicleType, VehicleConfig> = {
  motorbike: {
    type: "motorbike",
    label: "Xe máy",
    maxWeightKg: 50,
    color: [16, 185, 129],
    hex: "#10B981",
    icon: Bike,
  },
  van: {
    type: "van",
    label: "Xe Van",
    maxWeightKg: 500,
    color: [59, 130, 246],
    hex: "#3B82F6",
    icon: Car,
  },
  truck_1t: {
    type: "truck_1t",
    label: "Xe tải 1T",
    maxWeightKg: 1000,
    color: [245, 158, 11],
    hex: "#F59E0B",
    icon: Truck,
  },
};

export const DeliveryPointSchema = z.object({
  id: z.string(),
  orderCode: z.string(),
  customerName: z.string(),
  phoneNumber: z.string().optional(),
  address: z.string(),
  coordinates: LngLatSchema,
  status: DeliveryStatusSchema,
  weightKg: z.number().positive(),
  vehicleType: VehicleTypeSchema,
  zoneId: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const DeliveryZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
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

export const RouteDataSchema = z.object({
  id: z.string(),
  vehicleType: VehicleTypeSchema,
  vehiclePlate: z.string(),
  driverName: z.string(),
  coordinates: z.array(LngLatSchema),
  distanceKm: z.number(),
  durationMinutes: z.number(),
  encodedPolyline: z.string().optional(),
  color: z.tuple([z.number(), z.number(), z.number()]),
});

export const GeocodingResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  formattedAddress: z.string(),
  coordinates: LngLatSchema,
  postalCode: z.string().optional(),
  type: z.string().optional(),
});

export const VietnamPostalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Mã bưu chính Việt Nam phải gồm đúng 6 chữ số (VD: 700000)");
