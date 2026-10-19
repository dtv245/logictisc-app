/**
 * Reusable Metric Card component for Fleet and Maintenance KPIs.
 * Fulfills honesty principles: never fakes zero or placeholder numbers when UNAVAILABLE.
 * Supports props: status (trạng thái), value (giá trị), unit (đơn vị), explanation, etc.
 * When backend connects and returns real values, only data props change; layout remains intact.
 */
import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, Card, Space, Statistic, Tooltip, Typography } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useCan } from "@refinedev/core";
import { StatusTag } from "@/components/StatusTag";
import { formatDateTime } from "@/formatters/dateTime";
import type { FleetMetricAvailability, FleetReport } from "@/types/fleetReport.dto";
import { formatMetricValue } from "../utils/fleetMetricFormat";

export interface FleetMetricCardProps {
  /** Metric identifier code (e.g. FLEET_UTILIZATION_PERCENT, UNPLANNED_DOWNTIME) */
  code?: string;
  /** Display title for the card */
  title?: ReactNode;
  /** Trạng thái khả dụng (AVAILABLE | PARTIAL | UNAVAILABLE | NOT_APPLICABLE) */
  status?: FleetMetricAvailability | string;
  /** Alias for status */
  availability?: FleetMetricAvailability | string;
  /** Giá trị chỉ số từ backend */
  value?: string | number | null;
  /** Đơn vị chỉ số (SECOND | PERCENT | MONEY_PER_MILE | COUNT_PER_100K_MILES | etc.) */
  unit?: string | null;
  /** Giải thích ngắn (ví dụ khi UNAVAILABLE do chưa nối module bảo dưỡng định kỳ) */
  explanation?: ReactNode;
  /** Backend reason code(s) */
  reason?: string | null;
  /** Metric basis identifier */
  basis?: string | null;
  /** Numerator from backend */
  numerator?: string | number | null;
  /** Denominator from backend */
  denominator?: string | number | null;
  /** Formula explanation string for Tooltip (e.g. Productive/Capacity seconds) */
  formula?: string;
  /** Period information for Tooltip */
  period?: FleetReport["period"];
  /** Backend calculated timestamp */
  updatedAt?: string | null;
  /** Explicit permission override for mileage attribution action */
  canAttributeMileage?: boolean;
  /** Navigation callback for mileage attribution */
  onNavigateMileageAttributions?: () => void;
  /** Override testId */
  testId?: string;
}

function formatPeriod(period: FleetReport["period"], locale: string): string {
  if (!period) return "";
  try {
    const from = formatDateTime(period.from, {
      locale,
      ...(period.businessZoneId ? { timeZone: period.businessZoneId } : {}),
    });
    const to = formatDateTime(period.to, {
      locale,
      ...(period.businessZoneId ? { timeZone: period.businessZoneId } : {}),
    });
    return `${from} → ${to}`;
  } catch {
    return `${period.from} → ${period.to}`;
  }
}

export function FleetMetricCard({
  code,
  title,
  status: statusProp,
  availability: availabilityProp,
  value,
  unit,
  explanation,
  reason,
  basis,
  numerator,
  denominator,
  formula,
  period,
  updatedAt,
  canAttributeMileage: canAttributeMileageProp,
  onNavigateMileageAttributions,
  testId,
}: FleetMetricCardProps) {
  const { t, i18n } = useTranslation();

  const currentStatus = (statusProp ?? availabilityProp ?? "UNAVAILABLE") as FleetMetricAvailability;
  const displayTitle = title ?? (code ? t(`fleet.metrics.${code}`, { defaultValue: code }) : "");
  const formattedValue = formatMetricValue(value, currentStatus, unit);
  const cardTestId = testId ?? (code ? `fleet-metric-${code}` : undefined);

  // Check mileage attribution permission: ADMIN or DISPATCHER
  const attributionAccess = useCan({
    resource: "fleet-reports",
    action: "FLEET_MILEAGE_ATTRIBUTION",
  });
  const tripsAccess = useCan({
    resource: "trips",
    action: "complete",
  });
  const hasMileagePermission =
    canAttributeMileageProp ?? Boolean(attributionAccess.data?.can || tripsAccess.data?.can);

  const periodText = period ? formatPeriod(period, i18n.language) : "";

  const tooltipContent = formula ? (
    <div data-testid={`fleet-metric-tooltip-content-${code}`}>
      <div>
        <strong>{t("fleet.formula", { defaultValue: "Công thức" })}:</strong> {formula}
      </div>
      {periodText && (
        <div>
          <strong>{t("fleet.appliedPeriod", { defaultValue: "Kỳ áp dụng" })}:</strong> {periodText}
        </div>
      )}
    </div>
  ) : null;

  const tooltipTitle = formula
    ? `${t("fleet.formula", { defaultValue: "Công thức" })}: ${formula}${
        periodText ? ` | ${t("fleet.appliedPeriod", { defaultValue: "Kỳ áp dụng" })}: ${periodText}` : ""
      }`
    : "";

  const reasonCodes = reason ? reason.split(";").map((r) => r.trim()).filter(Boolean) : [];
  const hasMileageAttributionRequired = reasonCodes.includes("FLEET_MILEAGE_ATTRIBUTION_REQUIRED");
  const hasActualMileageHistoryUnavailable = reasonCodes.includes("ACTUAL_MILEAGE_HISTORY_UNAVAILABLE");

  function getReasonText(rCode: string): string {
    if (rCode === "FLEET_MILEAGE_ATTRIBUTION_REQUIRED") {
      return t("fleet.reasons.FLEET_MILEAGE_ATTRIBUTION_REQUIRED", {
        defaultValue: "Chưa xác nhận dặm cho các chuyến trong kỳ",
      });
    }
    if (rCode === "ACTUAL_MILEAGE_HISTORY_UNAVAILABLE") {
      return t("fleet.reasons.ACTUAL_MILEAGE_HISTORY_UNAVAILABLE", {
        defaultValue: "Chưa có lịch sử dặm thực tế cho kỳ này",
      });
    }
    return t(`fleet.reasons.${rCode}`, { defaultValue: rCode });
  }

  // 3 distinct concepts:
  // 1. "bằng 0 thật": has qualified data, result is 0
  // 2. "chưa có dữ liệu": unavailable, null or invalid
  // 3. "không áp dụng": not applicable
  const hasQualifiedValue =
    ["AVAILABLE", "PARTIAL"].includes(currentStatus) &&
    value != null &&
    formattedValue !== "—";

  // Full aria-label for accessibility: metric name, value or status
  const metricTitleStr = typeof displayTitle === "string" ? displayTitle : (code ?? "");
  const statusLabelStr = t(`finance.availability.${currentStatus}`, { defaultValue: currentStatus });

  const cardAriaLabel = hasQualifiedValue
    ? `${metricTitleStr}: ${formattedValue}`
    : currentStatus === "NOT_APPLICABLE"
      ? `${metricTitleStr}: ${statusLabelStr}`
      : `${metricTitleStr}: ${statusLabelStr}${reasonCodes.length > 0 ? ` - ${reasonCodes.map(getReasonText).join("; ")}` : ""}`;

  return (
    <Card
      size="small"
      data-testid={cardTestId}
      aria-label={cardAriaLabel}
      style={{ height: "100%" }}
    >
      <Statistic
        title={
          <Space align="center" size={4}>
            <span>{displayTitle}</span>
            {formula && (
              <Tooltip title={tooltipContent}>
                <span
                  data-testid={`fleet-metric-info-${code}`}
                  title={tooltipTitle}
                  style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}
                >
                  <InfoCircleOutlined
                    role="img"
                    aria-label={`${metricTitleStr} - ${tooltipTitle}`}
                    style={{ color: "rgba(0, 0, 0, 0.45)", fontSize: 13 }}
                  />
                </span>
              </Tooltip>
            )}
          </Space>
        }
        value={formattedValue}
        formatter={() => formattedValue}
      />
      <Space direction="vertical" style={{ width: "100%", marginTop: 8 }}>
        <StatusTag
          label={statusLabelStr}
          tone={
            currentStatus === "AVAILABLE"
              ? "success"
              : currentStatus === "PARTIAL"
              ? "warning"
              : "neutral"
          }
        />
        {hasQualifiedValue && updatedAt && (
          <Typography.Text type="secondary" data-testid={`fleet-metric-updated-${code}`}>
            {t("fleet.calculatedAt")}: {formatDateTime(updatedAt, { locale: i18n.language })}
          </Typography.Text>
        )}
        {explanation && (
          <Typography.Text type="secondary" style={{ fontSize: 13, lineHeight: 1.4 }}>
            {explanation}
          </Typography.Text>
        )}
        {unit && (
          <Typography.Text type="secondary">
            {t(`fleet.units.${unit}`, { defaultValue: unit })}
          </Typography.Text>
        )}
        {reason && (
          <Typography.Text type="secondary" data-testid={`fleet-metric-reason-${code}`}>
            {reasonCodes.map(getReasonText).join("; ")}
          </Typography.Text>
        )}
        {hasMileageAttributionRequired && hasMileagePermission && (
          <>
            <Button
              type="link"
              size="small"
              style={{ padding: 0, height: "auto" }}
              data-testid={`fleet-attribution-btn-${code}`}
              disabled={!onNavigateMileageAttributions}
              onClick={onNavigateMileageAttributions}
            >
              {t("fleet.enterMileageAttribution", { defaultValue: "Nhập phân bổ dặm" })}
            </Button>
            {!onNavigateMileageAttributions && (
              <Typography.Text
                type="secondary"
                data-testid={`fleet-attribution-unavailable-${code}`}
              >
                {t("fleet.mileageAttributionUnavailable", {
                  defaultValue: "Màn nhập phân bổ dặm chưa khả dụng.",
                })}
              </Typography.Text>
            )}
          </>
        )}
        {hasActualMileageHistoryUnavailable && (
          <Typography.Text type="secondary" data-testid={`fleet-metric-explanation-${code}`}>
            {t("fleet.actualMileageHistoryUnavailableExplanation", {
              defaultValue: "Hệ thống không suy đoán từ trạng thái xe hiện tại.",
            })}
          </Typography.Text>
        )}
        {basis && <Typography.Text type="secondary">{basis}</Typography.Text>}
        {numerator != null && denominator != null && (
          <Typography.Text type="secondary">
            {t("fleet.numeratorDenominator")}: {numerator} / {denominator}
          </Typography.Text>
        )}
      </Space>
    </Card>
  );
}
