import type { DriverExpiryStatus } from "@/types/drivers/driver-profile.types";

export const formatMinutes = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return "—";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.max(0, Math.floor(minutes % 60));
  return `${hours}h ${remainingMinutes}m`;
};

export const daysUntil = (date: string | null | undefined, now = new Date()): number | null => {
  if (!date) return null;
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp)) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const expiry = new Date(timestamp);
  const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()).getTime();
  return Math.ceil((expiryDay - today) / 86_400_000);
};

export const getExpiryTagColor = (status: DriverExpiryStatus | null | undefined): string => {
  if (status === "EXPIRED") return "red";
  if (status === "EXPIRING_SOON") return "orange";
  if (status === "VALID") return "green";
  return "default";
};
