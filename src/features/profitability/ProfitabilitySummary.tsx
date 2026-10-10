/** Presents backend values and classification evidence without recomputing financial metrics. */
import { Alert, Card, Col, Row, Statistic, Typography } from "antd";
import { useTranslation } from "react-i18next";
import type { LoadProfitabilityReportDto } from "@/types/profitability.dto";
import { financialAmount } from "./financialDisplay";
import { ProfitabilityMetricCard } from "./ProfitabilityMetricCard";

export const ProfitabilitySummary = ({ report }: { report: LoadProfitabilityReportDto }) => {
  const { t, i18n } = useTranslation();
  const classification = report.costClassification;
  const unclassified = classification && [...classification.costs, ...classification.unallocatedTripCosts]
    .some((cost) => cost.behavior === "UNCLASSIFIED");
  const amounts = [
    [t("finance.revenue"), report.actualRevenue],
    [t("finance.variableCost"), classification?.variableCost],
    [t("finance.allocatedFixedCost"), classification?.allocatedFixedCost],
  ] as const;
  const metrics = [
    [t("finance.contributionMargin"), report.contributionMarginMetric],
    [t("finance.allocatedProfit"), report.allocatedProfitMetric],
    [t("finance.marginPercent"), report.marginPercent],
    [t("finance.rpm"), report.revenuePerTotalMile],
    [t("finance.cpm"), report.costPerTotalMile],
    [t("finance.breakEvenRate"), report.breakEvenLoadedRate],
  ] as const;
  return <section aria-label={t("finance.summary")} data-testid="profitability-summary">
    {unclassified && <Alert type="warning" showIcon message={t("finance.unclassifiedWarning")} style={{ marginBottom: 16 }} />}
    <Row gutter={[16, 16]}>
      {amounts.map(([title, amount]) => <Col key={title} xs={24} sm={12} xl={8}>
        <Card size="small"><Statistic title={title} value={financialAmount(amount, report.currency, i18n.language)} /></Card>
      </Col>)}
      {metrics.map(([title, metric]) => <Col key={title} xs={24} sm={12} xl={8}>
        <ProfitabilityMetricCard title={title} metric={metric} currency={report.currency} />
      </Col>)}
    </Row>
    {classification && <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
      {t("finance.policy")}: {classification.policyName} / {classification.policyVersion}
    </Typography.Paragraph>}
  </section>;
};
