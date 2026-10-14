/**
 * Format giá trị chỉ số theo đơn vị.
 *
 * Tách khỏi component để mọi nơi hiển thị cùng một chỉ số cho ra cùng một
 * chuỗi — nếu thẻ KPI ghi "$1.68" mà tooltip ghi "1.68 USD" thì ban điều hành
 * phải tự dịch, đó là lỗi trình bày.
 */

import type { MetricUnit, MetricValue } from "@/types/executive.types";

/** Rút gọn số lớn cho tiền tệ, giữ 1 chữ số thập phân. */
const compactCurrency = (
  value: number,
  locale: string,
  currency: string,
): string =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const formatMetricValue = (
  value: number,
  unit: MetricUnit,
  locale: string,
  currency: string,
): string => {
  if (!Number.isFinite(value)) return "—";

  switch (unit) {
    case "currencyPerMile":
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    case "currency":
      return compactCurrency(value, locale, currency);
    case "percent":
      return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value / 100);
    case "days":
      return new Intl.NumberFormat(locale, {
        style: "unit",
        unit: "day",
        unitDisplay: "short",
        maximumFractionDigits: 1,
      }).format(value);
    case "count":
    default:
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 1,
      }).format(value);
  }
};

/**
 * Giá trị số của một chỉ số, hoặc `null` khi chưa đo được.
 *
 * Dùng cho những chỗ BẮT BUỘC phải có số — toạ độ một điểm trên biểu đồ, độ
 * rộng một thanh. Trả `null` để nơi gọi tự quyết định cách biểu diễn khoảng
 * trống; không bao giờ trả 0, vì 0 là một phép đo.
 */
export const metricNumber = (value: MetricValue): number | null =>
  value.status === "available" ? value.value : null;

/**
 * Format một chỉ số, hiện gạch ngang khi chưa đo được.
 *
 * "—" chứ không phải "0": trên màn hình điều hành, số 0 là một khẳng định về
 * hoạt động kinh doanh, còn gạch chỉ nói rằng chưa có gì để khẳng định.
 */
export const formatMetricOrDash = (
  value: MetricValue,
  unit: MetricUnit,
  locale: string,
  currency: string,
): string =>
  value.status === "available"
    ? formatMetricValue(value.value, unit, locale, currency)
    : "—";

/**
 * Chênh lệch so với kỳ trước, kèm dấu.
 *
 * Trả về `null` khi thiếu một trong hai kỳ — thà không hiển thị còn hơn hiển
 * thị "+0%" gây hiểu nhầm là không đổi.
 */
export const formatDeltaPercent = (
  current: number | undefined,
  previous: number | undefined,
  locale: string,
): string | null => {
  if (
    current === undefined ||
    previous === undefined ||
    !Number.isFinite(current) ||
    !Number.isFinite(previous) ||
    previous === 0
  ) {
    return null;
  }

  const delta = ((current - previous) / Math.abs(previous)) * 100;
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(delta / 100);
};
