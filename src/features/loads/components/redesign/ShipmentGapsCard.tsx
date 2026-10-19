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
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
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
          <CheckCircleFilled style={{ fontSize: 18, color: "#16A34A" }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Thông tin chuyến hàng đầy đủ và sẵn sàng vận hành.
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {blockingGaps.map((gap) => (
            <div
              key={gap.id}
              style={{
                border: "1px solid #FECACA",
                background: "#FEF2F2",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <ExclamationCircleFilled style={{ color: "#DC2626", fontSize: 14 }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: "#991B1B" }}>
                  {gap.fieldLabel || gap.fieldName} (Bắt buộc)
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#7F1D1D", marginBottom: 8, lineHeight: 1.4 }}>
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
                background: "#FFFBEB",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <ExclamationCircleFilled style={{ color: "#D97706", fontSize: 14 }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: "#92400E" }}>
                  {gap.fieldLabel || gap.fieldName}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#78350F", marginBottom: 8, lineHeight: 1.4 }}>
                {gap.questionNatural}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
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
