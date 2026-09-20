import { CreateButton, List, useTable, useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useShow } from "@refinedev/core";
import { Alert, Table, Modal, Form } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { ApiError } from "@/types/api.types";
import { crudScaffoldText } from "@constants/ui";
import { getResourceCapabilities } from "./resources/resourceCapabilities";
import { ResourceCreateModal } from "./ResourceCreateModal";
import { ResourceActionContext } from "./ResourceActionContext";
import { ResourceFormFields } from "./resources/ResourceFormFields";
import {
  isEditableResourceName,
  resourceFormDefinitions,
  type EditableResourceName,
} from "./resources/resourceForms";

interface ResourceListPageProps<TData extends BaseRecord> {
  columns: ColumnsType<TData>;
  resource: string;
}

export const ResourceListPage = <TData extends BaseRecord>({
  columns,
  resource,
}: ResourceListPageProps<TData>) => {
  const capabilities = getResourceCapabilities(resource);
  
  const { tableProps, tableQueryResult } = useTable<TData, ApiError>({
    pagination: { mode: "server" },
    resource,
    syncWithLocation: true,
  });

  const editModal = useModalForm<BaseRecord, ApiError, Record<string, unknown>>({
    action: "edit",
    resource,
  });

  const { queryResult: showQueryResult, showId, setShowId } = useShow<BaseRecord, ApiError>({
    resource,
  });

  const isEditable = isEditableResourceName(resource);
  const definition = isEditable ? resourceFormDefinitions[resource as EditableResourceName] : null;

  return (
    <ResourceActionContext.Provider
      value={{
        showEdit: (id) => editModal.show(id),
        showView: (id) => setShowId(id),
      }}
    >
      <List
        headerButtons={
          capabilities.create ? (
            <ResourceCreateModal
              resource={resource}
              trigger={(show) => (
                <CreateButton onClick={(e) => { e.preventDefault(); show(); }} />
              )}
            />
          ) : null
        }
      >
        {tableQueryResult.error ? (
          <Alert
            description={tableQueryResult.error.message}
            message={crudScaffoldText.loadError}
            showIcon
            type="error"
          />
        ) : null}
        <Table<TData> {...tableProps} columns={columns} rowKey="id" />
      </List>

      {isEditable && definition && (
        <Modal
          {...editModal.modalProps}
          title={`Edit ${resource}`}
          okText="Save"
          confirmLoading={editModal.formLoading}
        >
          <Form {...editModal.formProps} layout="vertical">
            <ResourceFormFields definition={definition} />
          </Form>
        </Modal>
      )}

      {isEditable && definition && (
        <Modal
          open={!!showId}
          onCancel={() => setShowId(undefined)}
          title={`View ${resource}`}
          footer={null}
        >
          {showQueryResult?.isFetching ? (
            <p>Loading...</p>
          ) : (
            <Form initialValues={showQueryResult?.data?.data} layout="vertical" disabled>
               <ResourceFormFields definition={definition} />
            </Form>
          )}
        </Modal>
      )}
    </ResourceActionContext.Provider>
  );
};
