import React from "react";
import { useTranslation } from "react-i18next";
import { ExclamationCircleFilled, CheckCircleFilled, EditOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { Button, Tag } from "antd";
import { CORE_VERSIONED_WRITES_RUNTIME_VERIFIED } from "@/components/resources/resourceCapabilities";
import { routes } from "@/constants/routes";
import { useLoadAiGaps } from "@/hooks/ai/useLoadAiGaps";
import type { AiGap } from "@/api/ai/ai.types";

export interface ShipmentGapsCardProps {
  loadId: string;
}

export const ShipmentGapsCard: React.FC<ShipmentGapsCardProps> = ({ loadId }) => {
  const { t } = useTranslation();
  const { blockingGaps, warningGaps, dismissGap, isLoading, isError, aiState, refetch } = useLoadAiGaps({ loadId });

  const totalGaps = blockingGaps.length + warningGaps.length;
  const isAnalyzing = aiState === "debouncing" || aiState === "running";
  const isPending = Boolean(isLoading) || isAnalyzing;

  const handleNavigateEdit = (gap: AiGap) => {
    if (CORE_VERSIONED_WRITES_RUNTIME_VERIFIED && typeof window !== "undefined") {
      const editPath = routes.resources.loads.edit.replace(":id", encodeURIComponent(loadId));
      const focusField = gap.fieldKey || gap.fieldName;
      const focusQuery = focusField ? `?focusField=${encodeURIComponent(focusField)}` : "";
      window.location.assign(`${editPath}${focusQuery}`);
    }
  };

  const handleDismiss = async (gap: AiGap) => {
    try {
      await dismissGap({ gapId: gap.id, reason: t("loads.redesign.dismissReason") });
    } catch {
      // Handled in hook
    }
  };

  return (
    <div className="shipment-card" data-testid="shipment-gaps-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: "var(--font-size-md)", fontWeight: 800, color: "var(--color-text)" }}>
          {t("loads.redesign.gapsTitle")}
        </div>
        {isError ? (
          <Tag color="error" style={{ borderRadius: 10, fontWeight: 700 }}>
            {t("loads.redesign.gapsError")}
          </Tag>
        ) : isPending ? (
          <Tag color="processing" style={{ borderRadius: 10, fontWeight: 700 }}>
            {t("loads.redesign.gapsChecking")}
          </Tag>
        ) : totalGaps > 0 ? (
          <Tag color="error" style={{ borderRadius: 10, fontWeight: 700 }}>
            {t("loads.redesign.gapCount", { count: totalGaps })}
          </Tag>
        ) : (
          <Tag color="success" icon={<CheckCircleFilled />} style={{ borderRadius: 10, fontWeight: 700 }}>
            {t("loads.redesign.accurate")}
          </Tag>
        )}
      </div>

      {isError && totalGaps === 0 ? (
        <div role="alert" style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0", color: "#991B1B" }}>
          <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
            {t("loads.redesign.gapsErrorDescription")}
          </span>
          <Button onClick={() => void refetch()} size="small">
            {t("loads.redesign.gapsRetry")}
          </Button>
        </div>
      ) : isPending && totalGaps === 0 ? (
        <div role="status" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", color: "var(--color-text-secondary)" }}>
          <ExclamationCircleFilled style={{ fontSize: "var(--font-size-lg)" }} />
          <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
            {t("loads.redesign.gapsChecking")}
          </span>
        </div>
      ) : totalGaps === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", color: "#166534" }}>
          <CheckCircleFilled style={{ fontSize: "var(--font-size-lg)", color: "var(--color-success-text)" }} />
          <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
            {t("loads.redesign.loadInformationComplete")}
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
          {blockingGaps.map((gap) => (
            <div
              key={gap.id}
              style={{
                border: "1px solid var(--color-error-border)",
                background: "var(--color-error-bg)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--spacing-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "var(--spacing-xxs)" }}>
                <ExclamationCircleFilled style={{ color: "var(--color-error-text)", fontSize: "var(--font-size-base)" }} />
                <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 800, color: "#991B1B" }}>
                  {gap.fieldLabel || gap.fieldName} ({t("loads.redesign.required")})
                </span>
              </div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "#7F1D1D", marginBottom: "var(--spacing-xs)", lineHeight: 1.4 }}>
                {gap.questionNatural}
              </div>
              <Button
                size="small"
                type="primary"
                danger
                aria-label={t("loads.redesign.fillOnForm")}
                icon={<EditOutlined />}
                style={{ borderRadius: 14, fontSize: 11, fontWeight: 600 }}
                disabled={!CORE_VERSIONED_WRITES_RUNTIME_VERIFIED}
                onClick={() => handleNavigateEdit(gap)}
              >
                {t("loads.redesign.fillOnForm")}
              </Button>
              {!CORE_VERSIONED_WRITES_RUNTIME_VERIFIED && (
                <span role="note" style={{ display: "block", marginTop: 6, color: "#7f1d1d", fontSize: 11 }}>
                  {t("loads.redesign.loadEditingUnavailable")}
                </span>
              )}
            </div>
          ))}

          {warningGaps.map((gap) => (
            <div
              key={gap.id}
              style={{
                border: "1px solid #FED7AA",
                background: "var(--color-warning-bg)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--spacing-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "var(--spacing-xxs)" }}>
                <ExclamationCircleFilled style={{ color: "#D97706", fontSize: "var(--font-size-base)" }} />
                <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 800, color: "#92400E" }}>
                  {gap.fieldLabel || gap.fieldName}
                </span>
              </div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "#78350F", marginBottom: "var(--spacing-xs)", lineHeight: 1.4 }}>
                {gap.questionNatural}
              </div>
              <div style={{ display: "flex", gap: "var(--spacing-xs)" }}>
                <Button
                  size="small"
                  aria-label={t("loads.redesign.supplement")}
                  icon={<EditOutlined />}
                  style={{ borderRadius: 14, fontSize: 11, fontWeight: 600 }}
                  disabled={!CORE_VERSIONED_WRITES_RUNTIME_VERIFIED}
                  onClick={() => handleNavigateEdit(gap)}
                >
                  {t("loads.redesign.supplement")}
                </Button>
                <Button
                  size="small"
                  type="text"
                  icon={<EyeInvisibleOutlined />}
                  style={{ borderRadius: 14, fontSize: 11, color: "#92400E" }}
                  onClick={() => handleDismiss(gap)}
                >
                  {t("loads.redesign.dismiss")}
                </Button>
              </div>
              {!CORE_VERSIONED_WRITES_RUNTIME_VERIFIED && (
                <span role="note" style={{ display: "block", marginTop: 6, color: "#78350f", fontSize: 11 }}>
                  {t("loads.redesign.loadEditingUnavailable")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
