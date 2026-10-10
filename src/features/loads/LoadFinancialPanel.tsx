/** Mounts only the active, permitted financial tab so hidden tabs cannot fetch. */
import { CanAccess, useCan } from "@refinedev/core";
import { Spin, Tabs } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ForbiddenState } from "@/components/ErrorStates";
import { AccessorialChargesTable } from "@/features/accessorials/AccessorialChargesTable";
import { ShipmentCostTable } from "@/features/shipment-costs/ShipmentCostTable";
import { LoadFinancialSummary } from "./LoadFinancialSummary";
import { FscPreview } from "@/features/rates/FscPreview";

export const LoadFinancialPanel = ({ loadId }: { loadId: string }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("summary");
  const summary = useCan({ resource: "profitability", action: "PROFITABILITY_VIEW" });
  const costs = useCan({ resource: "shipment-costs", action: "COST_VIEW" });
  const accessorials = useCan({ resource: "accessorials", action: "ACCESSORIAL_VIEW" });
  const rating = useCan({ resource: "rates", action: "RATE_PREVIEW" });
  const tabs = [
    { key: "summary", label: t("finance.summary"), allowed: summary.data?.can === true,
      resource: "profitability", action: "PROFITABILITY_VIEW", view: <LoadFinancialSummary loadId={loadId} /> },
    { key: "costs", label: t("loads.financial.shipmentCosts"), allowed: costs.data?.can === true,
      resource: "shipment-costs", action: "COST_VIEW", view: <ShipmentCostTable loadId={loadId} /> },
    { key: "accessorials", label: t("loads.financial.accessorialCharges"), allowed: accessorials.data?.can === true,
      resource: "accessorials", action: "ACCESSORIAL_VIEW", view: <AccessorialChargesTable loadId={loadId} /> },
    { key: "rating", label: t("rating.title"), allowed: rating.data?.can === true,
      resource: "rates", action: "RATE_PREVIEW", view: <FscPreview key={loadId} loadId={loadId} /> },
  ].filter((tab) => tab.allowed);
  const active = tabs.some((tab) => tab.key === selected) ? selected : tabs[0]?.key;
  if (summary.isLoading || costs.isLoading || accessorials.isLoading || rating.isLoading) return <Spin />;
  if (!active) return <ForbiddenState />;
  return <div data-testid="load-financial-panel"><Tabs activeKey={active} onChange={setSelected}
    items={tabs.map((tab) => ({ key: tab.key, label: tab.label, children: active === tab.key
      ? <CanAccess resource={tab.resource} action={tab.action}>{tab.view}</CanAccess> : null }))} /></div>;
};
