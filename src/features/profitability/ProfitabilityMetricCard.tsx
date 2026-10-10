/** Preserves authoritative metric availability, reason and basis in the presentation. */
import { Card, Space, Statistic, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { StatusTag } from "@/components/StatusTag";
import type { ProfitabilityMetricDto } from "@/types/profitability.dto";
import { financialMetricValue } from "./financialDisplay";

export const ProfitabilityMetricCard = ({ title, metric, currency }: {
  title: string; metric: ProfitabilityMetricDto | null | undefined; currency: string;
}) => {
  const { t, i18n } = useTranslation();
  const availability = metric?.availability ?? "UNAVAILABLE";
  return <Card size="small">
    <Statistic title={title} value={financialMetricValue(metric, currency, i18n.language)} />
    <Space direction="vertical">
      <StatusTag label={t(`finance.availability.${availability}`)}
        tone={availability === "AVAILABLE" ? "success" : availability === "PARTIAL" ? "warning" : "neutral"} />
      {metric?.reason && <Typography.Text type="secondary">{metric.reason}</Typography.Text>}
      {metric?.basis && <Typography.Text type="secondary">{metric.basis}</Typography.Text>}
    </Space>
  </Card>;
};
