import type { VehicleStatusMeta } from "@/types/trucks/vehicle.types";
import { DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";

export const VEHICLE_IMAGES: Record<string, string> = {
  SEMI: "/assets/vehicles/tractor-head.webp",
  TRACTOR_HEAD: "/assets/vehicles/tractor-head.webp",
  CONTAINER_TRUCK: "/assets/vehicles/container-truck.webp",
  BOX_TRUCK: "/assets/vehicles/box-truck.webp",
  FLATBED_TRUCK: "/assets/vehicles/flatbed-truck.webp",
  DUMP_TRUCK: "/assets/vehicles/dump-truck.webp",
  VAN: "/assets/vehicles/van.webp",
  TRAILER: "/assets/vehicles/container-truck.webp",
  STRAIGHT_TRUCK: "/assets/vehicles/box-truck.webp",
};

export const DEFAULT_VEHICLE_IMAGE = "/assets/vehicles/default.webp";

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  SEMI: "Xe đầu kéo (Semi)",
  TRACTOR_HEAD: "Xe đầu kéo",
  CONTAINER_TRUCK: "Xe chở container",
  BOX_TRUCK: "Xe tải thùng",
  FLATBED_TRUCK: "Xe tải thùng lửng",
  DUMP_TRUCK: "Xe ben",
  VAN: "Xe tải van",
  TRAILER: "Rơ-moóc",
  STRAIGHT_TRUCK: "Xe tải rigid",
};

export const VEHICLE_STATUS_META: Record<string, VehicleStatusMeta> = {
  AVAILABLE: { label: "Sẵn sàng", tagColor: "success", dotColor: "#12B76A" },
  ACTIVE: { label: "Hoạt động", tagColor: "processing", dotColor: "#1677FF" },
  ON_TRIP: { label: "Đang chạy", tagColor: "processing", dotColor: "#1677FF" },
  MAINTENANCE: { label: "Bảo trì", tagColor: "warning", dotColor: "#F79009" },
  INACTIVE: { label: "Ngừng hoạt động", tagColor: "default", dotColor: "#98A2B3" },
};

export const VEHICLE_STATUS_OPTIONS = Object.entries(VEHICLE_STATUS_META).map(
  ([value, meta]) => ({ value, label: meta.label }),
);

export const CAPACITY_UNIT = "lbs" as const;
export const PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;
