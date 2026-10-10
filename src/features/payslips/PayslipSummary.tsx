/** Displays immutable server amounts and policy evidence; never derives net pay or missing tax. */
import { Alert, Descriptions, Space } from "antd";
import { useTranslation } from "react-i18next";
import { formatDateOnly, formatDateTime } from "@/formatters/dateTime";
import { financialAmount } from "@/features/profitability/financialDisplay";
import type { PayslipDto } from "@/types/payslip.dto";
import type { PayslipSnapshot } from "./payslip.snapshot";
import { PayslipPaymentStatus } from "./PayslipPaymentStatus";
export function PayslipSummary({ payslip, snapshot: s }: { payslip: PayslipDto; snapshot: PayslipSnapshot }) {
  const { t, i18n } = useTranslation(); const available = s.calculation.availability === "AVAILABLE";
  return <Space direction="vertical" size="large" style={{ width: "100%" }}>
    <Alert type="info" message={t("payslips.immutable")} />
    <Descriptions bordered column={{ xs: 1, sm: 2 }} items={[
      { key: "driver", label: t("settlements.driver"), children: s.employeeName ?? payslip.driverId },
      { key: "period", label: t("settlements.payPeriod"), children: `${formatDateOnly(s.periodStart, { locale: i18n.language })} – ${formatDateOnly(s.periodEnd, { locale: i18n.language })}` },
      { key: "currency", label: t("finance.currency"), children: s.currency },
      { key: "issued", label: t("payslips.issuedAt"), children: formatDateTime(payslip.issuedAt, { locale: i18n.language }) },
      ...(["grossAmount", "otherDeductionAmount", "reimbursementAmount", "netAmount"] as const).map((field) => ({ key: field, label: t(`payroll.${field}`), children: <span data-testid={`payslip-${field}`}>{financialAmount(field === "netAmount" && !available ? null : s.calculation[field], s.currency, i18n.language)}</span> })),
      ...(["incomeTaxAmount", "insuranceAmount"] as const).map((field) => ({ key: field, label: t(`payroll.${field}`), children: <span data-testid={`payslip-${field}`}>{financialAmount(available ? s[field] : null, s.currency, i18n.language)}</span> })),
      { key: "country", label: t("payroll.country"), children: s.calculation.jurisdiction?.countryCode ?? "—" },
      { key: "region", label: t("payroll.subdivision"), children: s.calculation.jurisdiction?.subdivisionCode ?? "—" },
      { key: "locality", label: t("payroll.locality"), children: s.calculation.jurisdiction?.localityCode ?? "—" },
      { key: "worker", label: t("payroll.workerClassification"), children: s.calculation.workerClassification ? t(`payroll.workers.${s.calculation.workerClassification}`, { defaultValue: s.calculation.workerClassification }) : "—" },
      { key: "policy", label: t("payroll.policyVersion"), children: `${s.calculation.policyId ?? "—"} / ${s.calculation.policyVersion ?? "—"}` },
      { key: "source", label: t("payroll.resolutionSource"), children: s.calculation.jurisdictionResolution?.source ? t(`payroll.resolutionSources.${s.calculation.jurisdictionResolution.source}`, { defaultValue: s.calculation.jurisdictionResolution.source }) : "—" },
    ]} />
    {!available && <Alert type="warning" message={t("payslips.calculationUnavailable")} description={s.calculation.reason ? t(`payroll.errors.${s.calculation.reason}`, { defaultValue: s.calculation.reason }) : undefined} />}
    <PayslipPaymentStatus />
  </Space>;
}
