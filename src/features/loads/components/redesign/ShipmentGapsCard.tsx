import React from "react";
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
  const { blockingGaps, warningGaps, dismissGap } = useLoadAiGaps({ loadId });

  const totalGaps = blockingGaps.length + warningGaps.length;

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
      await dismissGap({ gapId: gap.id, reason: "Người dùng bỏ qua từ giao diện chi tiết" });
    } catch {
      // Handled in hook
    }
  };

  return (
    <div className="shipment-card" data-testid="shipment-gaps-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: "var(--font-size-md)", fontWeight: 800, color: "var(--color-text)" }}>
          Rà Soát Dữ Liệu Chuyến Hàng
        </div>
        {totalGaps > 0 ? (
          <Tag color="error" style={{ borderRadius: 10, fontWeight: 700 }}>
            {totalGaps} vấn đề
          </Tag>
        ) : (
          <Tag color="success" icon={<CheckCircleFilled />} style={{ borderRadius: 10, fontWeight: 700 }}>
            Chuẩn xác
          </Tag>
        )}
      </div>

      {totalGaps === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", color: "#166534" }}>
          <CheckCircleFilled style={{ fontSize: "var(--font-size-lg)", color: "var(--color-success-text)" }} />
          <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
            Thông tin chuyến hàng đầy đủ và sẵn sàng vận hành.
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
                  {gap.fieldLabel || gap.fieldName} (Bắt buộc)
                </span>
              </div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "#7F1D1D", marginBottom: "var(--spacing-xs)", lineHeight: 1.4 }}>
                {gap.questionNatural}
              </div>
              <Button
                size="small"
                type="primary"
                danger
                aria-label="Điền trên form"
                icon={<EditOutlined />}
                style={{ borderRadius: 14, fontSize: 11, fontWeight: 600 }}
                disabled={!CORE_VERSIONED_WRITES_RUNTIME_VERIFIED}
                onClick={() => handleNavigateEdit(gap)}
              >
                Điền trên form
              </Button>
              {!CORE_VERSIONED_WRITES_RUNTIME_VERIFIED && (
                <span role="note" style={{ display: "block", marginTop: 6, color: "#7f1d1d", fontSize: 11 }}>
                  Chỉnh sửa Load chưa khả dụng trong phiên bản này.
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
                  aria-label="Bổ sung"
                  icon={<EditOutlined />}
                  style={{ borderRadius: 14, fontSize: 11, fontWeight: 600 }}
                  disabled={!CORE_VERSIONED_WRITES_RUNTIME_VERIFIED}
                  onClick={() => handleNavigateEdit(gap)}
                >
                  Bổ sung
                </Button>
                <Button
                  size="small"
                  type="text"
                  icon={<EyeInvisibleOutlined />}
                  style={{ borderRadius: 14, fontSize: 11, color: "#92400E" }}
                  onClick={() => handleDismiss(gap)}
                >
                  Bỏ qua
                </Button>
              </div>
              {!CORE_VERSIONED_WRITES_RUNTIME_VERIFIED && (
                <span role="note" style={{ display: "block", marginTop: 6, color: "#78350f", fontSize: 11 }}>
                  Chỉnh sửa Load chưa khả dụng trong phiên bản này.
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
