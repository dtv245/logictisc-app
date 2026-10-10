import { useResourceEditContract } from "./resources/useResourceEditContract";
import { CreateButton, List, useTable, useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useShow } from "@refinedev/core";
import { Modal, Form } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
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
import { ResourceDetailView } from "./resources/ResourceDetailView";
import {
  isEditableResourceName,
  resourceFormDefinitions,
} from "./resources/resourceForms";
import { useLocalizedColumns } from "./useLocalizedColumns";

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

  const editModal = useModalForm<BaseRecord, ApiError, Record<string, unknown>>({
    action: "edit",
    resource,
    // Lỗi validation của backend gắn vào đúng field đang sửa — xem `ResourceCreateModal`.
    onMutationError: (error) => {
      applyBackendFieldErrors(editModal.form, error.errors ?? {});
      editContract.reportError(error);
    },
  });

  const editContract = useResourceEditContract(resource, editModal.form, editModal.queryResult?.data?.data, Boolean(editModal.modalProps.open));

  const { queryResult: showQueryResult, showId, setShowId } = useShow<BaseRecord, ApiError>({
    resource,
  });

  const isEditable = isEditableResourceName(resource);
  // `isEditableResourceName` là type predicate nên `resource` đã được thu hẹp, không cần ép kiểu.
  const definition = isEditable ? resourceFormDefinitions[resource] : null;

  // Tên resource lấy từ cùng khoá locale mà menu dùng, để tiêu đề modal khớp menu.
  const resourceLabel = t(`resources.${resource}`);

  // `editModal.show` đổi identity mỗi lần render, nên phải bọc `useCallback` trước khi memo
  // value — nếu không, `ActionButtons` (consumer) re-render theo mọi lần render của list.
  const { show: showEditModal } = editModal;
  const showEdit = useCallback(
    (id: string | number) => showEditModal(id),
    [showEditModal],
  );
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

  return (
    <ResourceActionContext.Provider value={actionContext}>
      <List headerButtons={resolvedHeaderButtons}>
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

      {isEditable && capabilities.edit && definition && (
        <Modal
          {...editModal.modalProps}
          destroyOnClose
          width={860}
          title={t("crud.editTitle", { resource: resourceLabel })}
          okText={t("actions.save")}
          confirmLoading={editModal.formLoading}
        >
          {editContract.feedback}
          <Form {...editModal.formProps} onValuesChange={(changed, values) => { editContract.onValuesChange(changed, values); editModal.formProps.onValuesChange?.(changed, values); }} onFinish={(values) => editModal.formProps.onFinish?.(editContract.prepare(values))} layout="vertical">
            <ResourceFormFields columns={2} definition={definition} />
          </Form>
        </Modal>
      )}

      {Boolean(showId) && (
        <Modal
          destroyOnClose
          footer={null}
          onCancel={() => setShowId(undefined)}
          open={!!showId}
          title={t("crud.viewTitle", { resource: resourceLabel })}
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
        </Modal>
      )}
    </ResourceActionContext.Provider>
  );
};
