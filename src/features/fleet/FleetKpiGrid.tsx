/** Backend-owned percentages remain independent; missing history never becomes zero. */
import { Card, Col, Row, Space, Statistic, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { StatusTag } from "@/components/StatusTag";
import { toMoneyDecimal } from "@/formatters/money";
import type { FleetMetric, FleetReport } from "@/types/fleetReport.dto";
function metricText(metric: FleetMetric): string {
  if (!["AVAILABLE", "PARTIAL"].includes(metric.availability) || metric.value == null) return "—";
  try {
    const value = toMoneyDecimal(metric.value); if (!value.isFinite()) return "—";
    if (metric.unit === "RATIO") return `${value.times(100).toString()}%`;
    return `${value.toString()}${metric.unit === "PERCENT" ? "%" : ""}`;
  } catch { return "—"; }
}
export function FleetKpiGrid({ report }: { report: FleetReport }) {
  const { t } = useTranslation(); const metrics = [report.utilization, report.loadedMilesPercent, report.deadheadPercent, ...report.health];
  return <Row gutter={[16, 16]}>{metrics.map((metric) => <Col key={metric.code} xs={24} sm={12} xl={8}><Card size="small" data-testid={`fleet-metric-${metric.code}`}>
    <Statistic title={t(`fleet.metrics.${metric.code}`, { defaultValue: metric.code })} value={metricText(metric)} formatter={() => metricText(metric)} />
    <Space direction="vertical">
      <StatusTag label={t(`finance.availability.${metric.availability}`)} tone={metric.availability === "AVAILABLE" ? "success" : metric.availability === "PARTIAL" ? "warning" : "neutral"} />
      {metric.unit && <Typography.Text type="secondary">{t(`fleet.units.${metric.unit}`, { defaultValue: metric.unit })}</Typography.Text>}
      {metric.reason && <Typography.Text type="secondary">{metric.reason.split(";").map((code) => t(`fleet.reasons.${code}`, { defaultValue: code })).join("; ")}</Typography.Text>}
      {metric.basis && <Typography.Text type="secondary">{metric.basis}</Typography.Text>}
      {metric.numerator != null && metric.denominator != null && <Typography.Text type="secondary">{t("fleet.numeratorDenominator")}: {metric.numerator} / {metric.denominator}</Typography.Text>}
    </Space>
  </Card></Col>)}</Row>;
}
