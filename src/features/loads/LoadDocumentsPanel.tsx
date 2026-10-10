/** Lazy load-scoped documents: server pagination, identity guards and transport dates. */
import { PlusOutlined } from "@ant-design/icons";
import { useCan, useList } from "@refinedev/core";
import { Button, Card, Spin, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ForbiddenState } from "@/components/ErrorStates";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { DocumentUploadModal } from "@/features/documents/DocumentUploadModal";
import { formatDateTime } from "@/formatters/dateTime";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { BaseTable } from "@/table/BaseTable";
import type { ApiHttpError } from "@/providers/api/httpError";
import type { DocumentDto } from "@/types/document.dto";

export interface LoadDocumentsPanelProps {
  loadId: string;
}

const PAGE_SIZE = 20;

export const LoadDocumentsPanel = ({ loadId }: LoadDocumentsPanelProps) => {
  const { t, i18n } = useTranslation();
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "documents", action: "list" });
  const [current, setCurrent] = useState(1);
  const canRead = access.data?.can === true;
  const query = useList<DocumentDto, ApiHttpError>({
    resource: "documents",
    filters: [{ field: "loadId", operator: "eq", value: loadId }],
    pagination: { current, pageSize: PAGE_SIZE, mode: "server" },
    errorNotification: false,
    queryOptions: {
      enabled: Boolean(loadId && tenant?.tenantKey && canRead),
      queryKey: ["load-documents", tenant?.tenantKey, loadId, current, PAGE_SIZE],
    },
  });

  if (access.isLoading) return <Spin />;
  if (!canRead || query.error?.statusCode === 403) return <ForbiddenState />;

  const columns: ColumnsType<DocumentDto> = [
    {
      title: t("columns.documents.fileName"),
      dataIndex: "fileName",
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      title: t("columns.documents.type"),
      dataIndex: "type",
      render: (type: string) => t(`documents.upload.types.${type}`, { defaultValue: type }),
    },
    {
      title: t("columns.documents.status"),
      dataIndex: "status",
      render: (status: string) => (
        <StatusTag label={t(`documents.status.${status}`, { defaultValue: status })} tone={statusTone(status)} />
      ),
    },
    {
      title: t("columns.documents.contentType"),
      dataIndex: "contentType",
      render: (value: string | null) => value || "—",
    },
    {
      title: t("loads.documents.capturedAt"),
      dataIndex: "capturedAt",
      render: (value: string | null) => formatDateTime(value, { locale: i18n.language }),
    },
    {
      title: t("loads.documents.description"),
      dataIndex: "description",
      render: (value: string | null) => value || "—",
    },
  ];

  return (
    <Card
      title={t("loads.documents.title")}
      extra={
        <DocumentUploadModal
          defaultValues={{ loadId }}
          onSuccess={() => void query.refetch()}
          trigger={(show) => (
            <Button type="primary" icon={<PlusOutlined />} onClick={show} data-testid="upload-document-btn">
              {t("documents.upload.button")}
            </Button>
          )}
        />
      }
      data-testid="load-documents-panel"
    >
      <BaseTable<DocumentDto>
        columns={columns}
        queryResult={query}
        tableProps={{
          dataSource: query.data?.data ?? [],
          loading: query.isLoading,
          pagination: {
            current,
            pageSize: PAGE_SIZE,
            total: query.data?.total ?? 0,
            showSizeChanger: false,
            onChange: setCurrent,
          },
        }}
      />
    </Card>
  );
};
