import React from "react";
import { Alert, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import type { Load } from "@/types/load.types";

export interface ShipmentLoadPlanCardProps {
  load: Load;
}

export const ShipmentLoadPlanCard: React.FC<ShipmentLoadPlanCardProps> = ({ load }) => {
  const { t } = useTranslation();
  return (
    <div className="shipment-card" data-testid="shipment-load-plan-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--spacing-md)" }}>
        <div>
          <div style={{ fontSize: "var(--font-size-md)", fontWeight: 800, color: "var(--color-text)", marginBottom: "var(--spacing-xxs)" }}>
            {t("loads.redesign.planTitle")}
          </div>
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", fontWeight: 500 }}>
            {load.assignedTruckNumber
              ? t("loads.redesign.assignedTruck", { number: load.assignedTruckNumber })
              : t("loads.redesign.truckUnavailable")}
            {load.distance ? ` · ${t("loads.redesign.distance", { value: load.distance })}` : ""}
          </div>
        </div>
        <Tag color={load.type?.toLowerCase().includes("reefer") ? "blue" : "default"}>
          {load.type || t("loads.redesign.standardType")}
        </Tag>
      </div>

      {/* Cargo overview & specs */}
      <div
        style={{
          background: "var(--color-bg-subtle)",
          borderRadius: 14,
          padding: "var(--spacing-md)",
          marginBottom: "var(--spacing-md)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--spacing-sm)" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>
              {t("loads.redesign.cargoType")}
            </div>
            <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, color: "var(--color-text)", marginTop: 2 }}>
              {load.isHazmat ? (
                <span style={{ color: "var(--color-error-text)" }}>⚠️ {t("loads.redesign.hazmatCargo")}</span>
              ) : (
                t("loads.redesign.generalCargo")
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>
              {t("loads.redesign.sourceTitle")}
            </div>
            <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, color: "var(--color-text)", marginTop: 2 }}>
              {load.source || t("loads.redesign.manualSource")}
            </div>
          </div>
        </div>

        {load.notes && (
          <div style={{ marginTop: "var(--spacing-sm)", paddingTop: 10, borderTop: "1px solid var(--color-border)", fontSize: "var(--font-size-xs)", color: "#475569" }}>
            <span style={{ fontWeight: 600 }}>{t("loads.redesign.notesLabel")}: </span>
            {load.notes}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--spacing-sm)", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", marginBottom: 6 }}>
            {t("loads.redesign.statusTitle")}
          </div>
          {load.status ? (
            <StatusTag label={load.status} tone={statusTone(load.status)} />
          ) : (
            <Tag>{t("loads.redesign.statusUnavailable")}</Tag>
          )}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", marginBottom: 6 }}>
            {t("loads.redesign.deliveryCost")}
          </div>
          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
            {load.deliveryCostAmount != null
              ? `${Number(load.deliveryCostAmount).toLocaleString()} ${load.deliveryCostCurrency || ""}`.trim()
              : t("loads.redesign.deliveryCostUnavailable")}
          </span>
        </div>
        <Alert
          type="info"
          showIcon
          message={t("loads.redesign.statusDescription")}
          style={{ flex: "1 1 240px", margin: 0 }}
        />
      </div>
    </div>
  );
};
