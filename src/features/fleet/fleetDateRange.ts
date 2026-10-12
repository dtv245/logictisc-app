import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isoWeek from "dayjs/plugin/isoWeek";
import quarterOfYear from "dayjs/plugin/quarterOfYear";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

export { dayjs };

export interface TimeZoneOption {
  value: string;
  label: string;
}

export const COMMON_TIMEZONES: TimeZoneOption[] = [
  { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho_Chi_Minh (GMT+7 - Việt Nam)" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok (GMT+7 - Thái Lan)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (GMT+8 - Singapore)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (GMT+9 - Nhật Bản)" },
  { value: "Asia/Seoul", label: "Asia/Seoul (GMT+9 - Hàn Quốc)" },
  { value: "UTC", label: "UTC (GMT+0 - Giờ phối hợp quốc tế)" },
  { value: "Europe/London", label: "Europe/London (GMT+0/+1 - London)" },
  { value: "Europe/Paris", label: "Europe/Paris (GMT+1/+2 - Paris)" },
  { value: "America/New_York", label: "America/New_York (GMT-5/-4 - New York)" },
  { value: "America/Chicago", label: "America/Chicago (GMT-6/-5 - Chicago)" },
  { value: "America/Denver", label: "America/Denver (GMT-7/-6 - Denver)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (GMT-8/-7 - Los Angeles)" },
];

/**
 * Lấy danh sách tất cả múi giờ IANA được trình duyệt hỗ trợ, ưu tiên các múi giờ phổ biến ở đầu.
 */
export function getAllSupportedTimeZones(): TimeZoneOption[] {
  try {
    const supported = Intl.supportedValuesOf("timeZone");
    const commonSet = new Set(COMMON_TIMEZONES.map((tz) => tz.value));
    const others = supported
      .filter((tz) => !commonSet.has(tz))
      .map((tz) => ({ value: tz, label: tz }));
    return [...COMMON_TIMEZONES, ...others];
  } catch {
    return COMMON_TIMEZONES;
  }
}

/**
 * Tên hiển thị thân thiện của múi giờ cho người dùng.
 */
export function getTimeZoneDisplayName(zoneId: string, locale: string = "vi"): string {
  const normalized = zoneId.trim();
  const isVi = locale.startsWith("vi");
  switch (normalized) {
    case "Asia/Ho_Chi_Minh":
      return isVi ? "giờ Việt Nam" : "Vietnam time";
    case "Asia/Bangkok":
      return isVi ? "giờ Bangkok" : "Bangkok time";
    case "Asia/Singapore":
      return isVi ? "giờ Singapore" : "Singapore time";
    case "Asia/Tokyo":
      return isVi ? "giờ Tokyo" : "Tokyo time";
    case "Asia/Seoul":
      return isVi ? "giờ Seoul" : "Seoul time";
    case "America/New_York":
      return isVi ? "giờ New York" : "New York time";
    case "America/Chicago":
      return isVi ? "giờ Chicago" : "Chicago time";
    case "America/Los_Angeles":
      return isVi ? "giờ Los Angeles" : "Los Angeles time";
    case "Europe/London":
      return isVi ? "giờ London" : "London time";
    case "Europe/Paris":
      return isVi ? "giờ Paris" : "Paris time";
    case "UTC":
      return isVi ? "giờ UTC" : "UTC";
    default:
      return isVi ? `giờ ${normalized}` : `${normalized} time`;
  }
}

/**
 * Chuyển đổi ngày cuối bao gồm (inclusive end date) sang exclusiveLastDate = ngày kế tiếp
 * theo đúng businessZoneId (sử dụng dayjs timezone, không phụ thuộc múi giờ trình duyệt).
 */
export function inclusiveToExclusiveLastDate(
  inclusiveEndDate: Dayjs | string,
  businessZoneId: string,
): string {
  const dateStr = typeof inclusiveEndDate === "string"
    ? inclusiveEndDate
    : inclusiveEndDate.format("YYYY-MM-DD");
  return dayjs.tz(dateStr, "YYYY-MM-DD", businessZoneId).add(1, "day").format("YYYY-MM-DD");
}

/**
 * Chuyển đổi ngược exclusiveLastDate (ngày kế tiếp không bao gồm) từ backend/URL
 * sang ngày cuối bao gồm để hiển thị chính xác trên RangePicker.
 */
export function exclusiveToInclusiveLastDate(
  exclusiveEndDate: Dayjs | string,
  businessZoneId: string,
): string {
  const dateStr = typeof exclusiveEndDate === "string"
    ? exclusiveEndDate
    : exclusiveEndDate.format("YYYY-MM-DD");
  return dayjs.tz(dateStr, "YYYY-MM-DD", businessZoneId).subtract(1, "day").format("YYYY-MM-DD");
}

/**
 * Định dạng dòng xác nhận dễ hiểu cho người dùng:
 * Ví dụ: "Từ 00:00 01/10 đến hết 31/10 (giờ Việt Nam)"
 */
export function formatPeriodConfirmation(
  startDate: Dayjs | string,
  inclusiveEndDate: Dayjs | string,
  businessZoneId: string,
  locale: string = "vi",
): string {
  const startDayjs = typeof startDate === "string"
    ? dayjs.tz(startDate, "YYYY-MM-DD", businessZoneId)
    : startDate;
  const endDayjs = typeof inclusiveEndDate === "string"
    ? dayjs.tz(inclusiveEndDate, "YYYY-MM-DD", businessZoneId)
    : inclusiveEndDate;

  const startFormatted = startDayjs.format("DD/MM");
  const endFormatted = endDayjs.format("DD/MM");
  const zoneName = getTimeZoneDisplayName(businessZoneId, locale);

  if (locale.startsWith("vi")) {
    return `Từ 00:00 ${startFormatted} đến hết ${endFormatted} (${zoneName})`;
  }
  return `From 00:00 ${startFormatted} to end of ${endFormatted} (${zoneName})`;
}

/**
 * Kiểm tra xem ngày có sau hôm nay theo múi giờ businessZoneId không.
 * Nếu vượt quá hôm nay thì disable.
 */
export function isDateDisabledAfterToday(
  currentDate: Dayjs,
  businessZoneId: string,
  nowReference?: Dayjs,
): boolean {
  if (!currentDate) return false;
  const base = nowReference ?? dayjs();
  const todayInZone = base.tz(businessZoneId).endOf("day");
  return currentDate.isAfter(todayInZone, "day");
}

export interface PresetItem {
  label: string;
  value: [Dayjs, Dayjs];
}

/**
 * Tạo danh sách các preset khoảng ngày theo businessZoneId:
 * - Hôm nay
 * - 7 ngày qua
 * - Tuần này
 * - Tuần trước
 * - Tháng này
 * - Tháng trước
 * - Quý này
 * - Quý trước
 */
export function getFleetPeriodPresets(
  businessZoneId: string,
  translate?: (key: string, defaultValue: string) => string,
  nowReference?: Dayjs,
): PresetItem[] {
  const t = translate ?? ((_k: string, def: string) => def);
  const nowInZone = (nowReference ?? dayjs()).tz(businessZoneId);
  const today = nowInZone.startOf("day");

  return [
    {
      label: t("fleet.presets.today", "Hôm nay"),
      value: [today, today],
    },
    {
      label: t("fleet.presets.last7Days", "7 ngày qua"),
      value: [today.subtract(6, "day"), today],
    },
    {
      label: t("fleet.presets.thisWeek", "Tuần này"),
      value: [today.startOf("isoWeek"), today],
    },
    {
      label: t("fleet.presets.lastWeek", "Tuần trước"),
      value: [
        today.subtract(1, "week").startOf("isoWeek"),
        today.subtract(1, "week").endOf("isoWeek"),
      ],
    },
    {
      label: t("fleet.presets.thisMonth", "Tháng này"),
      value: [today.startOf("month"), today],
    },
    {
      label: t("fleet.presets.lastMonth", "Tháng trước"),
      value: [
        today.subtract(1, "month").startOf("month"),
        today.subtract(1, "month").endOf("month"),
      ],
    },
    {
      label: t("fleet.presets.thisQuarter", "Quý này"),
      value: [today.startOf("quarter"), today],
    },
    {
      label: t("fleet.presets.lastQuarter", "Quý trước"),
      value: [
        today.subtract(1, "quarter").startOf("quarter"),
        today.subtract(1, "quarter").endOf("quarter"),
      ],
    },
  ];
}
