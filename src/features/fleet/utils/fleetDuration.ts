import type { TFunction } from "i18next";
import type { FleetDecimal } from "@/types/fleetReport.dto";

export function formatSecondsToHoursMinutes(
  seconds: FleetDecimal | null | undefined,
  t: TFunction,
): { formatted: string; rawSeconds: string } {
  if (seconds === null || seconds === undefined || seconds === "") {
    return { formatted: "—", rawSeconds: "—" };
  }
  const numeric = typeof seconds === "number" ? seconds : Number(seconds);
  if (Number.isNaN(numeric)) {
    return { formatted: String(seconds), rawSeconds: String(seconds) };
  }
  const totalAbs = Math.round(Math.abs(numeric));
  const hours = Math.floor(totalAbs / 3600);
  const minutes = Math.floor((totalAbs % 3600) / 60);
  const sign = numeric < 0 ? "-" : "";
  const formatted = `${sign}${t("fleet.durationFormat", {
    hours,
    minutes,
    defaultValue: `${hours} giờ ${minutes} phút`,
  })}`;
  return { formatted, rawSeconds: `${numeric}s` };
}
