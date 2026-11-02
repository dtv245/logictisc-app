/** Lazy load-scoped documents: server pagination, identity guards and transport dates. */
import { PlusOutlined } from "@ant-design/icons";
import { useCan, useDataProvider, useList } from "@refinedev/core";
import { Button, Card, Spin, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

import { ForbiddenState } from "@/components/ErrorStates";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { DocumentUploadModal } from "@/features/documents/components/DocumentUploadModal";
import { formatDateTime } from "@/formatters/dateTime";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { BaseTable } from "@/table/BaseTable";
import type { ApiHttpError } from "@/utils/httpError";
import type { DocumentDto } from "@/types/document.dto";
import { createListPaginationConfig, DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";

export interface LoadDocumentsPanelProps {
  loadId: string;
}

export const LoadDocumentsPanel = ({ loadId }: LoadDocumentsPanelProps) => {
  const { t, i18n } = useTranslation();
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "documents", action: "list" });
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const queryClient = useQueryClient();
  const getDataProvider = useDataProvider();
  const canRead = access.data?.can === true;
  const filters = useMemo(() => [{ field: "loadId", operator: "eq" as const, value: loadId }], [loadId]);
  const query = useList<DocumentDto, ApiHttpError>({
    resource: "documents",
    filters,
    pagination: { current, pageSize, mode: "server" },
    errorNotification: false,
    queryOptions: {
      enabled: Boolean(loadId && tenant?.tenantKey && canRead),
      queryKey: ["load-documents", tenant?.tenantKey, loadId, current, pageSize],
      keepPreviousData: true,
      staleTime: 30_000,
    },
  });

  useEffect(() => {
    const total = query.data?.total ?? 0;
    if (!query.data || !loadId || !tenant?.tenantKey || !canRead || total <= current * pageSize) return;
    const nextCurrent = current + 1;
    void queryClient.prefetchQuery(
      ["load-documents", tenant.tenantKey, loadId, nextCurrent, pageSize],
      (context) => getDataProvider().getList<DocumentDto>({
        resource: "documents",
        filters,
        pagination: { current: nextCurrent, pageSize, mode: "server" },
        hasPagination: true,
        sorters: [],
        sort: [],
        meta: { queryContext: context },
      }),
      { staleTime: 30_000 },
    );
  }, [canRead, current, filters, getDataProvider, loadId, pageSize, query.data, queryClient, tenant?.tenantKey]);

  const columns: ColumnsType<DocumentDto> = useMemo(() => [
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
  ], [i18n.language, t]);

  if (access.isLoading) return <Spin />;
  if (!canRead || query.error?.statusCode === 403) return <ForbiddenState />;

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
        loading: query.isFetching,
          pagination: {
            current,
            pageSize,
            total: query.data?.total ?? 0,
            ...createListPaginationConfig(t),
            onChange: (nextCurrent, nextPageSize) => {
              setPageSize(nextPageSize);
              setCurrent(nextPageSize === pageSize ? nextCurrent : 1);
            },
          },
        }}
      />
    </Card>
  );
};
