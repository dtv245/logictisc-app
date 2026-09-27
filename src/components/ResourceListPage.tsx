import { CreateButton, List, useTable, useModalForm, TextField } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useShow } from "@refinedev/core";
import { Modal, Form, Descriptions } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";

import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import { useEntityFilters } from "@hooks/useEntityFilters";
import { BaseTable } from "@table";
import { resolveAsyncState } from "@utils/asyncStateModel";
import { AsyncStateView } from "./AsyncState";
import { FilterBar } from "./FilterBar";
import { getResourceCapabilities } from "./resources/resourceCapabilities";
import { ResourceCreateModal } from "./ResourceCreateModal";
import { ResourceActionContext } from "./ResourceActionContext";
import { ResourceFormFields } from "./resources/ResourceFormFields";
import {
  isEditableResourceName,
  resourceFormDefinitions,
} from "./resources/resourceForms";
import { useLocalizedColumns } from "./useLocalizedColumns";

interface ResourceListPageProps<TData extends BaseRecord> {
  columns: ColumnsType<TData>;
  resource: string;
}

export const ResourceListPage = <TData extends BaseRecord>({
  columns,
  resource,
}: ResourceListPageProps<TData>) => {
  const { t } = useTranslation();
  const localizedColumns = useLocalizedColumns(columns);

  const capabilities = getResourceCapabilities(resource);

  const {
    filters,
    setCurrent,
    setFilters,
    tableProps,
    tableQueryResult,
  } = useTable<TData, ApiError>({
    pagination: { mode: "server" },
    resource,
    syncWithLocation: true,
  });

  // Filter sống trên URL nhờ `syncWithLocation` ở trên; hook chỉ dịch qua lại giữa
  // `CrudFilter[]` và giá trị `FilterBar` hiển thị được.
  const entityFilters = useEntityFilters(resource, {
    filters,
    setCurrent,
    setFilters,
  });

  // Tên resource lấy từ cùng khoá locale mà menu dùng, để tiêu đề modal khớp menu.
  const resourceLabel = t(`resources.${resource}`);

  const editModal = useModalForm<BaseRecord, ApiError, Record<string, unknown>>({
    action: "edit",
    resource,
    mutationMode: "pessimistic",
    warnWhenUnsavedChanges: true,
    successNotification: () => ({
      key: `edit-${resource}`,
      message: t("notifications.editSuccess", { resource: resourceLabel }),
      description: t("notifications.success"),
      type: "success",
    }),
    errorNotification: (error) => ({
      key: `edit-${resource}`,
      message: t("notifications.editError", {
        resource: resourceLabel,
        statusCode: (error as ApiError)?.statusCode ?? 500,
      }),
      description: error?.message,
      type: "error",
    }),
    // Lỗi validation của backend gắn vào đúng field đang sửa — xem `ResourceCreateModal`.
    onMutationError: (error) => {
      applyBackendFieldErrors(editModal.form, error.errors ?? {});
    },
  });

  const discardEditConfirm = useDiscardConfirm(editModal.close);

  const { queryResult: showQueryResult, showId, setShowId } = useShow<BaseRecord, ApiError>({
    resource,
  });

  const isEditable = isEditableResourceName(resource);
  // `isEditableResourceName` là type predicate nên `resource` đã được thu hẹp, không cần ép kiểu.
  const definition = isEditable ? resourceFormDefinitions[resource] : null;

  const actionContext = {
    showEdit: (id: string | number) => editModal.show(id),
    showView: (id: string | number) => setShowId(id),
  };

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

  return (
    <ResourceActionContext.Provider value={actionContext}>
      <List
        headerButtons={
          capabilities.create ? (
            <ResourceCreateModal
              resource={resource}
              trigger={(show) => (
                <CreateButton
                  resource={resource}
                  onClick={(e) => {
                    e.preventDefault();
                    show();
                  }}
                />
              )}
            />
          ) : null
        }
      >
        {entityFilters.controls.length > 0 ? (
          <FilterBar
            controls={entityFilters.controls}
            onChange={entityFilters.setFilter}
            onReset={entityFilters.reset}
            value={entityFilters.value}
          />
        ) : null}

        {/* Việc xử lý lỗi/đang tải/rỗng của bảng nằm trong `BaseTable` — xem chú thích
            ở đó để biết vì sao chỉ nhánh lỗi mới thay hẳn bảng. */}
        <BaseTable<TData>
          columns={localizedColumns}
          queryResult={{
            error: tableQueryResult.error,
            isFetching: tableQueryResult.isFetching,
            refetch: tableQueryResult.refetch,
          }}
          tableProps={tableProps}
        />
      </List>

      {isEditable && definition && (
        <Modal
          {...editModal.modalProps}
          onCancel={discardEditConfirm.onCancel}
          title={t("crud.editTitle", { resource: resourceLabel })}
          okText={t("actions.save")}
          cancelText={t("actions.cancel")}
          confirmLoading={editModal.formLoading}
          cancelButtonProps={{ disabled: editModal.formLoading }}
          okButtonProps={{
            disabled: editModal.formLoading,
            loading: editModal.formLoading,
          }}
          destroyOnHidden
          width={720}
        >
          <Form
            {...editModal.formProps}
            layout="vertical"
            disabled={editModal.formLoading}
          >
            <ResourceFormFields definition={definition} />
          </Form>
        </Modal>
      )}

      <Modal
        open={!!showId}
        onCancel={() => setShowId(undefined)}
        title={t("crud.viewTitle", { resource: resourceLabel })}
        footer={null}
        destroyOnHidden
        width={720}
      >
        <AsyncStateView
          onRetry={() => void showQueryResult?.refetch()}
          retrying={showQueryResult?.isFetching}
          state={showState}
        >
          {(record) =>
            definition ? (
              <Form initialValues={record} layout="vertical" disabled>
                <ResourceFormFields definition={definition} />
              </Form>
            ) : (
              <Descriptions bordered column={1}>
                {Object.entries(record).map(([field, value]) => (
                  <Descriptions.Item key={field} label={field}>
                    <TextField
                      value={
                        value === null || value === undefined || value === ""
                          ? t("crud.emptyValue")
                          : typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)
                      }
                    />
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )
          }
        </AsyncStateView>
      </Modal>
    </ResourceActionContext.Provider>
  );
};
