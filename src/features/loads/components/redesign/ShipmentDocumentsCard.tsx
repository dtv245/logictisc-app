import React from "react";
import { FilePdfOutlined, CheckCircleFilled, ClockCircleFilled } from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { Alert, Button, Spin, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import type { Load } from "@/types/load.types";
import type { DocumentDto } from "@/types/document.dto";
import { formatDateOnly } from "@/formatters/dateTime";

export interface ShipmentDocumentsCardProps {
  load: Load;
}

export const ShipmentDocumentsCard: React.FC<ShipmentDocumentsCardProps> = ({ load }) => {
  const { t } = useTranslation();
  const loadId = load?.id ? String(load.id) : "";

  // Query real documents for this load
  const { data: documentsData, isLoading, isError, error, refetch, isFetching } = useList<DocumentDto>({
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
          {t("loads.documents.title")}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#64748B", textTransform: "uppercase" }}>
          {t("loads.documents.recentCount", { count: docCount })}
        </span>
      </div>

      {/* Metadata items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "#64748B", fontWeight: 600 }}>{t("loads.documents.referenceLabel")}</span>
          <span style={{ fontWeight: 800, color: "#0F172A" }}>#{load.number}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "#64748B", fontWeight: 600 }}>{t("loads.documents.pickupLabel")}</span>
          <span style={{ fontWeight: 600, color: "#1E293B" }}>
            {load.originAddressCity || t("loads.documents.originUnavailable")}
            {load.requestedPickupDate ? ` · ${formatDateOnly(load.requestedPickupDate)}` : ""}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "#64748B", fontWeight: 600 }}>{t("loads.documents.podLabel")}</span>
          <span style={{ fontWeight: 600, color: load.deliveredAt ? "#16A34A" : "#64748B" }}>
            {load.deliveredAt ? t("loads.documents.podSigned") : t("loads.documents.podPending")}
          </span>
        </div>
      </div>

      {/* Documents List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 12 }}><Spin size="small" /></div>
        ) : isError ? (
          <Alert
            type="error"
            showIcon
            message={t("loads.documents.loadFailed")}
            description={error?.message}
            action={<Button size="small" disabled={isFetching} onClick={() => void refetch()}>{t("actions.retry")}</Button>}
          />
        ) : documents.map((doc) => {
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
                    {t("loads.documents.signed")}
                  </Tag>
                ) : (
                  <Tag
                    color="default"
                    icon={<ClockCircleFilled />}
                    style={{ margin: 0, borderRadius: 10, fontSize: 11 }}
                    >
                    {t("loads.documents.processing")}
                  </Tag>
                )}
              </div>
            </div>
          );
        })}

        {docCount === 0 && !isLoading && !isError && (
          <div style={{ textAlign: "center", padding: "12px", color: "#94A3B8", fontSize: 12 }}>
            {t("loads.documents.empty")}
          </div>
        )}
      </div>
    </div>
  );
};
