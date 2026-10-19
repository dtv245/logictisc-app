import React from "react";
import { FilePdfOutlined, CheckCircleFilled, ClockCircleFilled } from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { Tag, Typography } from "antd";
import type { Load } from "@/types/load.types";
import type { DocumentDto } from "@/types/document.dto";
import { formatDateOnly } from "@/formatters/dateTime";

export interface ShipmentDocumentsCardProps {
  load: Load;
}

export const ShipmentDocumentsCard: React.FC<ShipmentDocumentsCardProps> = ({ load }) => {
  const loadId = load?.id ? String(load.id) : "";

  // Query real documents for this load
  const { data: documentsData, isLoading } = useList<DocumentDto>({
    resource: "documents",
    filters: [{ field: "loadId", operator: "eq", value: loadId }],
    pagination: { pageSize: 5 },
    queryOptions: {
      enabled: Boolean(loadId),
    },
  });

  const documents = documentsData?.data || [];
  const docCount = documents.length;

  return (
    <div className="shipment-card" data-testid="shipment-documents-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
          PO / BOL & Chứng Từ
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#64748B", textTransform: "uppercase" }}>
          TÀI LIỆU · {docCount}
        </span>
      </div>

      {/* Metadata items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "#64748B", fontWeight: 600 }}>MÃ VẬN ĐƠN (PO / BOL):</span>
          <span style={{ fontWeight: 800, color: "#0F172A" }}>#{load.number}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "#64748B", fontWeight: 600 }}>LẤY HÀNG (PICKUP):</span>
          <span style={{ fontWeight: 600, color: "#1E293B" }}>
            {load.originAddressCity || "Kho gửi"}
            {load.requestedPickupDate ? ` · ${formatDateOnly(load.requestedPickupDate)}` : ""}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "#64748B", fontWeight: 600 }}>CHỨNG TỪ GIAO (POD):</span>
          <span style={{ fontWeight: 600, color: load.deliveredAt ? "#16A34A" : "#64748B" }}>
            {load.deliveredAt ? "Đã ký biên bản" : "Chờ giao nhận"}
          </span>
        </div>
      </div>

      {/* Documents List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {documents.map((doc) => {
          const isSigned = doc.status === "signed" || doc.status === "approved";
          return (
            <div
              key={doc.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: 10,
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FilePdfOutlined style={{ fontSize: 16, color: "#DC2626" }} />
                <Typography.Text ellipsis style={{ maxWidth: 140, fontSize: 12, fontWeight: 600 }}>
                  {doc.fileName}
                </Typography.Text>
              </div>

              <div>
                {isSigned ? (
                  <Tag
                    color="success"
                    icon={<CheckCircleFilled />}
                    style={{ margin: 0, borderRadius: 10, fontSize: 11 }}
                  >
                    Đã ký
                  </Tag>
                ) : (
                  <Tag
                    color="default"
                    icon={<ClockCircleFilled />}
                    style={{ margin: 0, borderRadius: 10, fontSize: 11 }}
                  >
                    Đang xử lý
                  </Tag>
                )}
              </div>
            </div>
          );
        })}

        {docCount === 0 && !isLoading && (
          <div style={{ textAlign: "center", padding: "12px", color: "#94A3B8", fontSize: 12 }}>
            Chưa có chứng từ đính kèm
          </div>
        )}
      </div>
    </div>
  );
};
