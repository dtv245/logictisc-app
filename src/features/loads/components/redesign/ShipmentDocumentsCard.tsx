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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-md)" }}>
        <div style={{ fontSize: "var(--font-size-md)", fontWeight: 800, color: "var(--color-text)" }}>
          {t("loads.documents.title")}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>
          {t("loads.documents.recentCount", { count: docCount })}
        </span>
      </div>

      {/* Metadata items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "var(--spacing-md)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--font-size-xs)" }}>
          <span style={{ color: "var(--color-text-tertiary)", fontWeight: 600 }}>{t("loads.documents.referenceLabel")}</span>
          <span style={{ fontWeight: 800, color: "var(--color-text)" }}>#{load.number}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--font-size-xs)" }}>
          <span style={{ color: "var(--color-text-tertiary)", fontWeight: 600 }}>{t("loads.documents.pickupLabel")}</span>
          <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
            {load.originAddressCity || t("loads.documents.originUnavailable")}
            {load.requestedPickupDate ? ` · ${formatDateOnly(load.requestedPickupDate)}` : ""}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--font-size-xs)" }}>
          <span style={{ color: "var(--color-text-tertiary)", fontWeight: 600 }}>{t("loads.documents.podLabel")}</span>
          <span style={{ fontWeight: 600, color: load.deliveredAt ? "var(--color-success-text)" : "var(--color-text-tertiary)" }}>
            {load.deliveredAt ? t("loads.documents.podSigned") : t("loads.documents.podPending")}
          </span>
        </div>
      </div>

      {/* Documents List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "var(--spacing-sm)" }}><Spin size="small" /></div>
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
                background: "var(--color-bg-subtle)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-xs)" }}>
                <FilePdfOutlined style={{ fontSize: "var(--font-size-md)", color: "var(--color-error-text)" }} />
                <Typography.Text ellipsis style={{ maxWidth: 140, fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
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
          <div style={{ textAlign: "center", padding: "12px", color: "var(--color-text-tertiary)", fontSize: "var(--font-size-xs)" }}>
            {t("loads.documents.empty")}
          </div>
        )}
      </div>
    </div>
  );
};
