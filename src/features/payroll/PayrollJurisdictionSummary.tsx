/** Country-neutral jurisdiction display with explicit unavailable policy evidence. */
import { Descriptions } from "antd";
import { useTranslation } from "react-i18next";
import { readPayrollResolution } from "./payroll.snapshot";
import type { PayrollItem } from "@/types/payroll.dto";
export function PayrollJurisdictionSummary({ item }: { item: PayrollItem }) {
  const { t } = useTranslation();
  const resolution = readPayrollResolution(item.calculationSnapshotJson);
  return <Descriptions size="small" column={1} items={[
    { key: "country", label: t("payroll.country"), children: item.jurisdiction?.countryCode ?? "—" },
    { key: "region", label: t("payroll.subdivision"), children: item.jurisdiction?.subdivisionCode ?? "—" },
    { key: "locality", label: t("payroll.locality"), children: item.jurisdiction?.localityCode ?? "—" },
    { key: "worker", label: t("payroll.workerClassification"), children: item.workerClassification ? t(`payroll.workers.${item.workerClassification}`) : "—" },
    { key: "resolution", label: t("payroll.resolutionSource"), children: resolution?.source ? t(`payroll.resolutionSources.${resolution.source}`, { defaultValue: resolution.source }) : "—" },
    { key: "policy", label: t("payroll.policyVersion"), children: `${item.policyId ?? "—"} / ${item.policyVersion ?? "—"}` },
  ]} />;
}
