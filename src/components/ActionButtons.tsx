import { DeleteButton, EditButton, ShowButton } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Space } from "antd";
import { getResourceCapabilities } from "./resources/resourceCapabilities";
import { useResourceAction } from "./ResourceActionContext";

interface ActionButtonsProps {
  record: BaseRecord;
  resource: string;
}

export const ActionButtons = ({ record, resource }: ActionButtonsProps) => {
  const capabilities = getResourceCapabilities(resource);
  const actionContext = useResourceAction();

  return (
    <Space>
      <ShowButton
        hideText
        recordItemId={record.id}
        resource={resource}
        onClick={(e) => {
          if (actionContext) {
            e.preventDefault();
            actionContext.showView(record.id!);
          }
        }}
      />
      {capabilities.edit ? (
        <EditButton
          hideText
          recordItemId={record.id}
          resource={resource}
          onClick={(e) => {
            if (actionContext) {
              e.preventDefault();
              actionContext.showEdit(record.id!);
            }
          }}
        />
      ) : null}
      {capabilities.delete ? (
        <DeleteButton
          hideText
          recordItemId={record.id}
          resource={resource}
        />
      ) : null}
    </Space>
  );
};
