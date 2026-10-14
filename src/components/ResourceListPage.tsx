import { CreateButton, List, useTable } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useShow } from "@refinedev/core";
import { Button, Space, type TableProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { ApiError } from "@/types/api.types";
import { useEntityFilters } from "@hooks/useEntityFilters";
import { BaseTable } from "@table";
import { resolveAsyncState } from "@utils/asyncStateModel";
import { AsyncStateView } from "./AsyncState";
import { ResourceListToolbar } from "./ResourceListToolbar";
import { getResourceCapabilities } from "./resources/resourceCapabilities";
import { ResourceCreateModal } from "./ResourceCreateModal";
import { ResourceEditModal } from "./ResourceEditModal";
import { ResourceModalFrame } from "./resources/ResourceModalFrame";
import { ResourceActionContext } from "./ResourceActionContext";
import { ResourceDetailView } from "./resources/ResourceDetailView";
import { StatusTag } from "./StatusTag";
import { statusTone } from "./statusTone";
import {
  isEditableResourceName,
  resourceFormDefinitions,
} from "./resources/resourceForms";
import { useLocalizedColumns } from "@hooks/useLocalizedColumns";
import { DEFAULT_LIST_PAGE, DEFAULT_LIST_PAGE_SIZE, normalizePage, normalizePageSize } from "@/utils/querySerializer";

interface ResourceListPageProps<TData extends BaseRecord> {
  columns: ColumnsType<TData>;
  resource: string;
  headerButtons?: ReactNode | ((props: { defaultButtons: ReactNode }) => ReactNode);
}

export const ResourceListPage = <TData extends BaseRecord>({
  columns,
  resource,
  headerButtons,
}: ResourceListPageProps<TData>) => {
  const { t } = useTranslation();
  const localizedColumns = useLocalizedColumns(columns);

  const capabilities = getResourceCapabilities(resource);

  const {
    filters,
    current,
    pageSize,
    setCurrent,
    setPageSize,
    setFilters,
    tableProps,
    tableQueryResult,
  } = useTable<TData, ApiError>({
    pagination: { mode: "server", current: DEFAULT_LIST_PAGE, pageSize: DEFAULT_LIST_PAGE_SIZE },
    resource,
    syncWithLocation: true,
  });

  const safeCurrent = Math.max(1, normalizePage(current));
  const safePageSize = normalizePageSize(pageSize);

  const safeSetCurrent = useCallback(
    (page: number | ((prev: number) => number)) => {
      if (typeof page === "function") {
        setCurrent((prev) => Math.max(1, page(prev) || 1));
      } else {
        setCurrent(Math.max(1, page || 1));
      }
    },
    [setCurrent],
  );

  // Đổi pageSize ở owner để số trang, URL và request server cùng dùng sức chứa mới.
  const handleAdaptivePageSizeChange = useCallback((nextPageSize: number) => {
    if (nextPageSize === safePageSize) return;
    setPageSize(nextPageSize);
    safeSetCurrent(1);
  }, [safePageSize, setPageSize, safeSetCurrent]);

  // Refine synchronizes these values with the browser URL. Repair malformed URL
  // state so navigation, Table render and API requests all use the same numbers.
  useEffect(() => {
    if (current !== undefined && !Object.is(current, safeCurrent)) safeSetCurrent(safeCurrent);
    if (pageSize !== undefined && !Object.is(pageSize, safePageSize)) setPageSize(safePageSize);
  }, [current, pageSize, safeCurrent, safePageSize, safeSetCurrent, setPageSize]);

  const entityFilters = useEntityFilters(resource, {
    filters,
    setCurrent: safeSetCurrent,
    setFilters,
  });

  const [editId, setEditId] = useState<string | number | null>(null);

  const { queryResult: showQueryResult, showId, setShowId } = useShow<BaseRecord, ApiError>({
    resource,
  });

  const isEditable = isEditableResourceName(resource);
  const definition = isEditable ? resourceFormDefinitions[resource] : null;

  const resourceLabel = t(`resources.${resource}`);

  const showEdit = useCallback((id: string | number) => setEditId(id), []);
  const showView = useCallback((id: string | number) => setShowId(id), [setShowId]);
  const actionContext = useMemo(
    () => ({ showEdit, showView }),
    [showEdit, showView],
  );

  // Modal xem chi tiết là một query riêng, nên nó có đủ bốn trạng thái và dùng thẳng
  // mô hình chung. Trước đây nhánh lỗi bị bỏ sót: fetch hỏng thì modal render form
  // với `initialValues` undefined — trông y hệt một bản ghi rỗng.
  //
  // `isEmpty: () => false` vì `resolveAsyncState` đã chặn `data === undefined` trước
  // khi gọi `isEmpty`; bản ghi tải xong thì luôn render được form. "Rỗng" ở đây chỉ
  // xảy ra khi server không trả về bản ghi nào.
  const showState = resolveAsyncState<BaseRecord>({
    data: showQueryResult?.data?.data,
    error: showQueryResult?.error,
    isEmpty: () => false,
    isLoading: showQueryResult?.isFetching ?? false,
  });

  const defaultCreateButton = capabilities.create ? (
    <ResourceCreateModal
      resource={resource}
      trigger={(show) => (
        <CreateButton onClick={(e) => { e.preventDefault(); show(); }} />
      )}
    />
  ) : null;

  const resolvedHeaderButtons =
    headerButtons !== undefined
      ? typeof headerButtons === "function"
        ? headerButtons({ defaultButtons: defaultCreateButton })
        : headerButtons
      : defaultCreateButton;

  const totalCount =
    typeof tableProps.pagination === "object" && tableProps.pagination?.total !== undefined
      ? tableProps.pagination.total
      : (tableQueryResult.data?.total ?? (Array.isArray(tableProps.dataSource) ? tableProps.dataSource.length : undefined));

  const safeTableProps: TableProps<TData> = useMemo(() => {
    if (tableProps.pagination === false) {
      return { ...tableProps, pagination: false };
    }
    if (typeof tableProps.pagination === "object" && tableProps.pagination !== null) {
      return {
        ...tableProps,
        pagination: {
          ...tableProps.pagination,
          current: Math.max(1, tableProps.pagination.current ?? 1),
        },
      };
    }
    return {
      ...tableProps,
      pagination: tableProps.pagination ? {} : false,
    };
  }, [tableProps]);

  return (
    <ResourceActionContext.Provider value={actionContext}>
      <List
        breadcrumb={<></>}
        canCreate={false}
        headerButtons={<></>}
        title={<></>}
        wrapperProps={{ className: "resource-list-page" }}
      >
        <div className="resource-list-card">
          <ResourceListToolbar
            controls={entityFilters.controls}
            filterValues={entityFilters.value}
            headerButtons={resolvedHeaderButtons}
            isFetching={tableQueryResult.isFetching}
            onFilterChange={entityFilters.setFilter}
            onFilterReset={entityFilters.reset}
            onRefresh={() => void tableQueryResult.refetch()}
            resource={resource}
            resourceLabel={resourceLabel}
            totalCount={totalCount}
          />

          {/* Việc xử lý lỗi/đang tải/rỗng của bảng nằm trong `BaseTable` — xem chú thích
              ở đó để biết vì sao chỉ nhánh lỗi mới thay hẳn bảng. */}
          <BaseTable<TData>
            fitToShell
            onAdaptivePageSizeChange={handleAdaptivePageSizeChange}
            columns={localizedColumns}
            queryResult={{
              error: tableQueryResult.error,
              isFetching: tableQueryResult.isFetching,
              refetch: tableQueryResult.refetch,
            }}
            tableProps={safeTableProps}
          />
        </div>
      </List>

      {isEditable && capabilities.edit && (
        <ResourceEditModal
          id={editId}
          onClose={() => setEditId(null)}
          resource={resource}
          visible={Boolean(editId)}
        />
      )}

      {Boolean(showId) && (
        <ResourceModalFrame
          className="resource-view-modal"
          destroyOnHidden
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%", flexWrap: "wrap" }}>
              <Button onClick={() => setShowId(undefined)}>
                {t("actions.cancel", "Đóng")}
              </Button>
              {capabilities.edit && isEditable && (
                <Button
                  type="primary"
                  onClick={() => {
                    const idToEdit = showId;
                    setShowId(undefined);
                    if (idToEdit) {
                      showEdit(idToEdit);
                    }
                  }}
                >
                  {t("actions.edit", "Sửa")}
                </Button>
              )}
            </div>
          }
          formId="view-resource-modal"
          maskClosable={true}
          onCancel={() => setShowId(undefined)}
          open={!!showId}
          title={
            <Space align="center" wrap>
              <span>{t("crud.viewTitle", { resource: resourceLabel })}</span>
              {showQueryResult?.data?.data && (
                <>
                  {(showQueryResult.data.data.number || showQueryResult.data.data.name) && (
                    <span style={{ color: "rgba(0, 0, 0, 0.45)", fontWeight: "normal" }}>
                      #{String(showQueryResult.data.data.number || showQueryResult.data.data.name)}
                    </span>
                  )}
                  {showQueryResult.data.data.status && (
                    <StatusTag
                      label={t(
                        `forms.options.${String(showQueryResult.data.data.status).toLowerCase()}`,
                        { defaultValue: String(showQueryResult.data.data.status) },
                      )}
                      tone={statusTone(String(showQueryResult.data.data.status))}
                    />
                  )}
                </>
              )}
            </Space>
          }
          width={860}
        >
          <AsyncStateView
            onRetry={() => void showQueryResult?.refetch()}
            retrying={showQueryResult?.isFetching}
            state={showState}
          >
            {(record) => (
              <ResourceDetailView
                definition={definition ?? undefined}
                record={record}
                resource={resource}
              />
            )}
          </AsyncStateView>
        </ResourceModalFrame>
      )}
    </ResourceActionContext.Provider>
  );
};
