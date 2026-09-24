/**
 * Khu vực Tài chính.
 *
 * Ba biểu đồ, và một quy tắc chi phối cả ba: KHÔNG dùng trục kép.
 *
 * - Doanh thu vs Chi phí vận hành: cùng đơn vị tiền, chung một trục.
 * - RPM vs CPM: cùng đơn vị $/dặm, chung một trục, kèm vạch mục tiêu CPM và
 *   dải tô giữa hai đường chính là biên đóng góp.
 * - Biên đóng góp: vẽ RIÊNG ở biểu đồ nhỏ bên dưới, chung trục thời gian
 *   nhưng trục giá trị riêng. Biên chỉ ~$0.57 trong khi RPM ~$2.50 — nhét
 *   chung trục thì biên bị ép bẹp thành đường phẳng, còn dựng trục thứ hai
 *   trên cùng một plot là lỗi trục kép. Hai plot tách biệt là cách đúng.
 */

import { Typography } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  CostCategoryPoint,
  MetricReference,
  MetricValue,
  MonthlyFinancialPoint,
} from "@/types/executive.types";
import {
  formatMetricOrDash,
  formatMetricValue,
  metricNumber,
} from "../executive.format";
import { unavailableReasonKey } from "../executive.metrics";
import { useIntlLocale } from "../useIntlLocale";
import { SectionCard } from "./SectionCard";
import { UnavailableNotice } from "./UnavailableNotice";

interface FinancialSectionProps {
  points: readonly MonthlyFinancialPoint[] | null;
  costCategories: readonly CostCategoryPoint[] | null;
  /** Ngưỡng CPM mục tiêu, kèm nguồn. */
  costPerMileTarget: MetricReference | null;
  reasonKey: string;
  /**
   * Tổng số dặm của tháng gần nhất.
   *
   * Hiện kèm lý do khi chưa đo được: đây là mẫu số của mọi chỉ số mỗi-dặm trên
   * khu vực này, nên "chưa có nguồn dặm" khác hẳn "dặm bằng không" và người đọc
   * phải phân biệt được hai tình huống đó.
   */
  totalMiles: MetricValue;
  currency: string;
}

/**
 * Một điểm trên biểu đồ, đã quy về số hoặc `null`.
 *
 * `null` là khe hở dữ liệu: Recharts bỏ qua điểm đó và ngắt đường tại chỗ, đúng
 * với ý nghĩa "tháng này chưa đo được". Điền 0 vào đây sẽ vẽ ra một đường tụt
 * xuống đáy như thể doanh thu tháng đó bằng không.
 */
interface ChartPoint {
  month: string;
  label: string;
  revenue: number | null;
  operatingCost: number | null;
  revenuePerMile: number | null;
  costPerMile: number | null;
  contributionSpread: number | null;
}

const GRID_COLOR = "var(--exec-grid)";
const AXIS_COLOR = "var(--exec-axis)";

export const FinancialSection = ({
  points,
  costCategories,
  costPerMileTarget,
  reasonKey,
  totalMiles,
  currency,
}: FinancialSectionProps) => {
  const { t } = useTranslation();
  const locale = useIntlLocale();

  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);

  const rate = (value: number) =>
    formatMetricValue(value, "currencyPerMile", locale, currency);

  // Recharts gọi formatter với giá trị có thể là undefined (chuỗi thiếu điểm
  // dữ liệu). Nhận `unknown` rồi tự thu hẹp, thay vì ép kiểu và để lọt NaN ra
  // màn hình điều hành.
  const moneyTooltip = (value: unknown) =>
    typeof value === "number" ? money(value) : "";

  const rateTooltip = (value: unknown) =>
    typeof value === "number" ? rate(value) : "";

  const chartPoints = useMemo<ChartPoint[]>(
    () =>
      points?.map((point) => ({
        month: point.month,
        label: point.label,
        revenue: metricNumber(point.revenue),
        operatingCost: metricNumber(point.operatingCost),
        revenuePerMile: metricNumber(point.revenuePerMile),
        costPerMile: metricNumber(point.costPerMile),
        contributionSpread: metricNumber(point.contributionSpread),
      })) ?? [],
    [points],
  );

  // Có điểm nhưng không điểm nào có số: backend trả về đủ tháng, chỉ là không
  // tháng nào có dòng nào trong loại tiền đang yêu cầu. Vẽ ra ba khung trục
  // trống sẽ trông như lỗi tải dữ liệu, nên dùng đúng khung "chưa có số".
  const hasPlottable = chartPoints.some(
    (point) => point.revenue !== null || point.operatingCost !== null,
  );

  // Dải tô giữa hai đường chỉ vẽ khi MỌI tháng đều có cả hai đầu. Recharts vẽ
  // dải từ hai giá trị, và một dải bị khuyết một đầu sẽ được nó suy diễn thành
  // một hình dạng không có thật.
  const hasCostBand = chartPoints.every(
    (point) => point.operatingCost !== null && point.revenue !== null,
  );
  const hasRateBand = chartPoints.every(
    (point) => point.costPerMile !== null && point.revenuePerMile !== null,
  );

  return (
    <SectionCard
      question={t("executive.sections.financial.question")}
      title={t("executive.sections.financial.title")}
    >
      {!hasPlottable ? (
        <UnavailableNotice reasonKey={reasonKey} />
      ) : (
        <div className="exec-charts">
          {/* Biểu đồ 1 — Doanh thu vs Chi phí vận hành */}
          <figure className="exec-chart">
            <figcaption>{t("executive.charts.revenueVsCost.title")}</figcaption>
            <ResponsiveContainer height={300} width="100%">
              <ComposedChart
                data={chartPoints}
                margin={{ top: 16, right: 24, bottom: 8, left: 8 }}
              >
                <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                <XAxis
                  axisLine={{ stroke: AXIS_COLOR }}
                  dataKey="label"
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tickFormatter={money}
                  tickLine={false}
                  width={72}
                />
                <Tooltip formatter={moneyTooltip} />
                {hasCostBand ? (
                  <Area
                    dataKey={(point: ChartPoint) => [
                      point.operatingCost,
                      point.revenue,
                    ]}
                    fill="var(--exec-band)"
                    name={t("executive.charts.revenueVsCost.band")}
                    stroke="none"
                    type="monotone"
                  />
                ) : null}
                <Line
                  dataKey="revenue"
                  dot={false}
                  name={t("executive.charts.revenueVsCost.revenue")}
                  stroke="var(--exec-series-revenue)"
                  strokeWidth={2}
                  type="monotone"
                />
                <Line
                  dataKey="operatingCost"
                  dot={false}
                  name={t("executive.charts.revenueVsCost.cost")}
                  stroke="var(--exec-series-cost)"
                  strokeWidth={2}
                  type="monotone"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </figure>

          {/* Biểu đồ 2 — RPM vs CPM, kèm vạch mục tiêu và dải biên */}
          <figure className="exec-chart">
            <figcaption>{t("executive.charts.rpmVsCpm.title")}</figcaption>
            <ResponsiveContainer height={300} width="100%">
              <ComposedChart
                data={chartPoints}
                margin={{ top: 16, right: 24, bottom: 8, left: 8 }}
              >
                <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                <XAxis
                  axisLine={{ stroke: AXIS_COLOR }}
                  dataKey="label"
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={rate}
                  tickLine={false}
                  width={72}
                />
                <Tooltip formatter={rateTooltip} />
                {hasRateBand ? (
                  <Area
                    dataKey={(point: ChartPoint) => [
                      point.costPerMile,
                      point.revenuePerMile,
                    ]}
                    fill="var(--exec-band)"
                    name={t("executive.charts.rpmVsCpm.band")}
                    stroke="none"
                    type="monotone"
                  />
                ) : null}
                <Line
                  dataKey="revenuePerMile"
                  dot={false}
                  name={t("executive.charts.rpmVsCpm.rpm")}
                  stroke="var(--exec-series-revenue)"
                  strokeWidth={2}
                  type="monotone"
                />
                <Line
                  dataKey="costPerMile"
                  dot={false}
                  name={t("executive.charts.rpmVsCpm.cpm")}
                  stroke="var(--exec-series-cost)"
                  strokeWidth={2}
                  type="monotone"
                />
                {costPerMileTarget ? (
                  <ReferenceLine
                    label={{
                      // Nhãn vạch mục tiêu LUÔN kèm chữ "T" và giá trị; nguồn
                      // đầy đủ nằm ở chú giải ngay trên biểu đồ.
                      value: t("executive.charts.rpmVsCpm.targetLabel", {
                        value: rate(costPerMileTarget.value),
                      }),
                      position: "insideTopLeft",
                      fill: "var(--exec-ink-1)",
                      fontSize: 11,
                    }}
                    stroke="var(--exec-ref-target)"
                    strokeWidth={2.5}
                    y={costPerMileTarget.value}
                  />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </figure>

          {/* Biểu đồ 3 — Biên đóng góp, trục giá trị riêng (small multiple) */}
          <figure className="exec-chart exec-chart--sub">
            <figcaption>{t("executive.charts.spread.title")}</figcaption>
            <ResponsiveContainer height={150} width="100%">
              <BarChart
                data={chartPoints}
                margin={{ top: 12, right: 24, bottom: 8, left: 8 }}
              >
                <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                <XAxis
                  axisLine={{ stroke: AXIS_COLOR }}
                  dataKey="label"
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tickFormatter={rate}
                  tickLine={false}
                  width={72}
                />
                <Tooltip formatter={rateTooltip} />
                <Bar
                  dataKey="contributionSpread"
                  name={t("executive.charts.spread.series")}
                  radius={[4, 4, 0, 0]}
                >
                  {chartPoints.map((point) => (
                    <Cell fill="var(--exec-series-profit)" key={point.month} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </figure>

          {/* Cơ cấu chi phí — thanh ngang, không dùng biểu đồ tròn */}
          <figure className="exec-chart">
            <figcaption>{t("executive.charts.costStructure.title")}</figcaption>
            {costCategories === null || costCategories.length === 0 ? (
              <UnavailableNotice reasonKey={reasonKey} />
            ) : (
              <ul className="exec-cost-list">
                {costCategories.map((category) => {
                  const share = metricNumber(category.shareOfTotal);
                  return (
                    <li className="exec-cost" key={category.id}>
                      <span className="exec-cost__label">
                        {t(category.labelKey)}
                      </span>
                      <span className="exec-cost__track">
                        {/* Không có tỉ trọng thì để rãnh trống. Vẽ một thanh
                            dài 0% là khẳng định hạng mục này không chiếm gì,
                            trong khi sự thật là chưa đo được nó. */}
                        {share === null ? null : (
                          <span
                            className="exec-cost__fill"
                            style={{ width: `${share}%` }}
                          />
                        )}
                      </span>
                      <span className="exec-cost__value">
                        {formatMetricOrDash(
                          category.currentPerMile,
                          "currencyPerMile",
                          locale,
                          currency,
                        )}
                      </span>
                      <span className="exec-cost__share">
                        {formatMetricOrDash(
                          category.shareOfTotal,
                          "percent",
                          locale,
                          currency,
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </figure>
        </div>
      )}

      {/* Mẫu số của mọi chỉ số mỗi-dặm ở trên. Khi chưa có nguồn dặm thì nói rõ
          lý do ngay tại đây, để "—" ở các tháng không bị đọc thành "bằng 0". */}
      <Typography.Text className="exec-card__footnote" type="secondary">
        {t("executive.metrics.totalMiles")}:{" "}
        {formatMetricOrDash(totalMiles, "count", locale, currency)}
        {totalMiles.status === "unavailable"
          ? ` — ${t(unavailableReasonKey(totalMiles.reasonCode))}`
          : null}
      </Typography.Text>

      <Typography.Text className="exec-card__footnote" type="secondary">
        {t("executive.sections.financial.footnote")}
      </Typography.Text>
    </SectionCard>
  );
};
