import {
  CAPACITY_UNIT,
  DEFAULT_VEHICLE_IMAGE,
  VEHICLE_IMAGES,
  VEHICLE_STATUS_META,
  VEHICLE_TYPE_LABELS,
} from "@/constants/vehicle";
import type { VehicleStatusMeta } from "@/types/trucks/vehicle.types";

const LBS_PER_KG = 0.453592;

export const getVehicleImage = (type: string): string =>
  VEHICLE_IMAGES[type] ?? DEFAULT_VEHICLE_IMAGE;

export const getVehicleTypeLabel = (type: string): string =>
  VEHICLE_TYPE_LABELS[type] ?? type;

export const getVehicleStatusMeta = (status: string): VehicleStatusMeta =>
  VEHICLE_STATUS_META[status] ?? {
    label: status,
    tagColor: "default",
    dotColor: "#98A2B3",
  };

export const formatNumberVN = (value: number): string =>
  new Intl.NumberFormat("vi-VN").format(value);

export const formatCapacity = (
  capacity: number | null | undefined,
): string =>
  capacity === null || capacity === undefined
    ? "—"
    : `${formatNumberVN(capacity)} ${CAPACITY_UNIT}`;

export const formatCapacityAlt = (
  capacity: number | null | undefined,
): string | null => {
  if (capacity === null || capacity === undefined || CAPACITY_UNIT !== "lbs") {
    return null;
  }
  const kg = capacity * LBS_PER_KG;
  if (kg > 0 && kg < 1) return "≈ <1 kg";
  return `≈ ${formatNumberVN(Math.round(kg))} kg`;
};

export const formatLocation = (
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): string => {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return "Chưa cập nhật vị trí";
  }
  const northSouth = latitude >= 0 ? "N" : "S";
  const eastWest = longitude >= 0 ? "E" : "W";
  return `${Math.abs(latitude).toFixed(5)}° ${northSouth}, ${Math.abs(longitude).toFixed(5)}° ${eastWest}`;
};

export const formatDriver = (
  primary: string | null | undefined,
  secondary: string | null | undefined,
): string => {
  if (primary && secondary) return `${primary} · ${secondary}`;
  return primary || secondary || "Chưa gán";
};

export const formatVehicleSubtitle = (
  typeLabel: string,
  make: string | null | undefined,
  model: string | null | undefined,
  year: number | null | undefined,
): string => {
  const makeModel = [make, model].filter(Boolean).join(" ");
  const makeModelYear = makeModel
    ? [makeModel, year ? `(${year})` : ""].filter(Boolean).join(" ")
    : "";
  return [typeLabel, makeModelYear].filter(Boolean).join("  •  ");
};

export const normalizeVi = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
