/** Displays immutable server amounts and policy evidence; never derives net pay or missing tax. */
import { Alert, Card, Col, Descriptions, Row, Space } from "antd";
import { useTranslation } from "react-i18next";
import { formatDateOnly, formatDateTime } from "@/formatters/dateTime";
import { financialAmount } from "@/features/profitability/utils/financialDisplay";
import type { PayslipDto } from "@/types/payslip.dto";
import type { PayslipSnapshot } from "../utils/payslip.snapshot";
import { PayslipPaymentStatus } from "./PayslipPaymentStatus";

export function PayslipSummary({ payslip, snapshot: s }: { payslip: PayslipDto; snapshot: PayslipSnapshot }) {
  const { t, i18n } = useTranslation();
  const available = s.calculation.availability === "AVAILABLE";

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Alert type="info" message={t("payslips.immutable")} />

      <Descriptions
        bordered
        size="small"
        column={{ xs: 1, sm: 2 }}
        items={[
          { key: "driver", label: t("settlements.driver"), children: <span style={{ wordBreak: "break-all" }}>{s.employeeName ?? payslip.driverId}</span> },
          { key: "period", label: t("settlements.payPeriod"), children: `${formatDateOnly(s.periodStart, { locale: i18n.language })} – ${formatDateOnly(s.periodEnd, { locale: i18n.language })}` },
          { key: "currency", label: t("finance.currency"), children: <strong style={{ letterSpacing: 1 }}>{s.currency}</strong> },
          { key: "issued", label: t("payslips.issuedAt"), children: formatDateTime(payslip.issuedAt, { locale: i18n.language }) },
        ]}
      />

      <Row gutter={[16, 16]}>
        {/* Earnings */}
        <Col xs={24} md={8}>
          <Card title={t("settlements.gross")} size="small" style={{ height: "100%" }}>
            <Descriptions
              column={1}
              size="small"
              items={[
                {
                  key: "grossAmount",
                  label: t("payroll.grossAmount"),
                  children: (
                    <span data-testid="payslip-grossAmount" style={{ fontWeight: 600 }}>
                      {financialAmount(s.calculation.grossAmount, s.currency, i18n.language)}
                    </span>
                  ),
                },
                {
                  key: "reimbursementAmount",
                  label: t("payroll.reimbursementAmount"),
                  children: (
                    <span data-testid="payslip-reimbursementAmount">
                      {financialAmount(s.calculation.reimbursementAmount, s.currency, i18n.language)}
                    </span>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Deductions */}
        <Col xs={24} md={8}>
          <Card title={t("settlements.deductions")} size="small" style={{ height: "100%" }}>
            <Descriptions
              column={1}
              size="small"
              items={[
                {
                  key: "incomeTaxAmount",
                  label: t("payroll.incomeTaxAmount"),
                  children: (
                    <span data-testid="payslip-incomeTaxAmount">
                      {financialAmount(available ? s.incomeTaxAmount : null, s.currency, i18n.language)}
                    </span>
                  ),
                },
                {
                  key: "insuranceAmount",
                  label: t("payroll.insuranceAmount"),
                  children: (
                    <span data-testid="payslip-insuranceAmount">
                      {financialAmount(available ? s.insuranceAmount : null, s.currency, i18n.language)}
                    </span>
                  ),
                },
                {
                  key: "otherDeductionAmount",
                  label: t("payroll.otherDeductionAmount"),
                  children: (
                    <span data-testid="payslip-otherDeductionAmount">
                      {financialAmount(s.calculation.otherDeductionAmount, s.currency, i18n.language)}
                    </span>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Net Pay */}
        <Col xs={24} md={8}>
          <Card
            title={t("settlements.net")}
            size="small"
            style={{
              height: "100%",
              background: "#f0f7ff",
              borderColor: "#adc6ff",
            }}
          >
            <div>
              <div style={{ color: "rgba(0, 0, 0, 0.65)", fontSize: 13 }}>{t("payroll.netAmount")}</div>
              <div style={{ marginTop: 8 }}>
                <span
                  data-testid="payslip-netAmount"
                  style={{ fontSize: 24, fontWeight: "bold", color: "#1677ff", wordBreak: "break-all" }}
                >
                  {financialAmount(!available ? null : s.calculation.netAmount, s.currency, i18n.language)}
                </span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Descriptions
        bordered
        size="small"
        column={{ xs: 1, sm: 2 }}
        items={[
          { key: "country", label: t("payroll.country"), children: s.calculation.jurisdiction?.countryCode ?? "—" },
          { key: "region", label: t("payroll.subdivision"), children: s.calculation.jurisdiction?.subdivisionCode ?? "—" },
          { key: "locality", label: t("payroll.locality"), children: s.calculation.jurisdiction?.localityCode ?? "—" },
          { key: "worker", label: t("payroll.workerClassification"), children: s.calculation.workerClassification ? t(`payroll.workers.${s.calculation.workerClassification}`, { defaultValue: s.calculation.workerClassification }) : "—" },
          { key: "policy", label: t("payroll.policyVersion"), children: <span style={{ wordBreak: "break-all" }}>{`${s.calculation.policyId ?? "—"} / ${s.calculation.policyVersion ?? "—"}`}</span> },
          { key: "source", label: t("payroll.resolutionSource"), children: s.calculation.jurisdictionResolution?.source ? t(`payroll.resolutionSources.${s.calculation.jurisdictionResolution.source}`, { defaultValue: s.calculation.jurisdictionResolution.source }) : "—" },
        ]}
      />

      {!available && (
        <Alert
          type="warning"
          message={t("payslips.calculationUnavailable")}
          description={s.calculation.reason ? t(`payroll.errors.${s.calculation.reason}`, { defaultValue: s.calculation.reason }) : undefined}
        />
      )}
      <PayslipPaymentStatus />
    </Space>
  );
}
