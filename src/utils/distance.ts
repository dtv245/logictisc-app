/**
 * Định dạng khoảng cách dùng chung cho Dispatch, Loads và Trips.
 *
 * Hợp đồng backend trả khoảng cách theo dặm (Load.distance,
 * Trip.totalDistance/plannedDistanceMiles/actualDistanceMiles), nên mọi màn
 * hình phải hiển thị cùng một đơn vị thay vì tự gắn "mi" hoặc "km".
 */

export type DistanceUnit = "mi" | "km";

const KM_PER_MILE = 1.609344;

export interface FormatDistanceOptions {
  /** Đơn vị muốn hiển thị; mặc định giữ nguyên đơn vị nguồn. */
  displayUnit?: DistanceUnit;
  /** Locale cho phần số; mặc định theo môi trường. */
  locale?: string;
  maximumFractionDigits?: number;
}

export const convertDistance = (
  value: number,
  from: DistanceUnit,
  to: DistanceUnit,
): number => {
  if (from === to) return value;
  return from === "mi" ? value * KM_PER_MILE : value / KM_PER_MILE;
};

export const formatDistance = (
  value: number | null | undefined,
  sourceUnit: DistanceUnit,
  options: FormatDistanceOptions = {},
): string => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "—";
  }
  const {
    displayUnit = sourceUnit,
    locale,
    maximumFractionDigits = 2,
  } = options;
  const amount = convertDistance(Number(value), sourceUnit, displayUnit);
  return `${amount.toLocaleString(locale, { maximumFractionDigits })} ${displayUnit}`;
};
