/* eslint-disable react-refresh/only-export-components */
/** Backend-owned percentages remain independent; missing history never becomes zero. */
import { Col, Row, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";
import type { FleetReport } from "@/types/fleetReport.dto";
import { FleetMetricCard } from "./FleetMetricCard";

export const KPI_FORMULAS: Record<string, string> = {
  FLEET_UTILIZATION_PERCENT: "Productive/Capacity seconds",
  LOADED_MILES_PERCENT: "Loaded/(Loaded+Empty)",
  DEADHEAD_PERCENT: "Empty/Actual",
  utilization: "Productive/Capacity seconds",
  loadedMilesPercent: "Loaded/(Loaded+Empty)",
  deadheadPercent: "Empty/Actual",
};

export interface FleetKpiGridProps {
  report: FleetReport;
  canAttributeMileage?: boolean;
  onNavigateMileageAttributions?: () => void;
}

export function FleetKpiGrid({
  report,
  canAttributeMileage,
  onNavigateMileageAttributions,
}: FleetKpiGridProps) {
  const { t } = useTranslation();
  const operationalMetrics = [
    report.utilization,
    report.loadedMilesPercent,
    report.deadheadPercent,
  ];
  const maintenanceMetrics = report.health ?? [];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* 1. Mục KPI vận hành */}
      <div>
        <Typography.Title level={4} style={{ marginBottom: 16 }}>
          {t("fleet.sections.operationalKpi", { defaultValue: "KPI vận hành" })}
        </Typography.Title>
        <Row gutter={[16, 16]}>
          {operationalMetrics.map((metric) => (
            <Col key={metric.code} xs={24} sm={12} xl={8}>
              <FleetMetricCard
                code={metric.code}
                status={metric.availability}
                value={metric.value}
                unit={metric.unit}
                reason={metric.reason}
                basis={metric.basis}
                numerator={metric.numerator}
                denominator={metric.denominator}
                formula={KPI_FORMULAS[metric.code]}
                period={report.period}
                updatedAt={report.calculatedAt}
                canAttributeMileage={canAttributeMileage}
                onNavigateMileageAttributions={onNavigateMileageAttributions}
              />
            </Col>
          ))}
        </Row>
      </div>

      {/* 2. Mục Sức khỏe bảo dưỡng */}
      <div>
        <Typography.Title level={4} style={{ marginBottom: 16 }}>
          {t("fleet.sections.maintenanceHealth", { defaultValue: "Sức khỏe bảo dưỡng" })}
        </Typography.Title>
        <Row gutter={[16, 16]}>
          {maintenanceMetrics.map((metric) => (
            <Col key={metric.code} xs={24} sm={12} xl={6}>
              <FleetMetricCard
                code={metric.code}
                status={metric.availability}
                value={metric.value}
                unit={metric.unit}
                explanation={
                  metric.availability === "UNAVAILABLE"
                    ? t("fleet.maintenanceModuleUnavailable", {
                        defaultValue: "Chỉ số này sẽ có khi kết nối module bảo dưỡng định kỳ",
                      })
                    : undefined
                }
                reason={metric.reason}
                basis={metric.basis}
                numerator={metric.numerator}
                denominator={metric.denominator}
                period={report.period}
                updatedAt={report.calculatedAt}
                canAttributeMileage={canAttributeMileage}
                onNavigateMileageAttributions={onNavigateMileageAttributions}
              />
            </Col>
          ))}
        </Row>
      </div>
    </Space>
  );
}
