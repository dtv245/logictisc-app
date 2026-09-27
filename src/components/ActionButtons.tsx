import { DeleteButton, EditButton, ShowButton } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Space } from "antd";
import { useTranslation } from "react-i18next";

import type { ApiError } from "@/types/api.types";
import { getResourceCapabilities } from "./resources/resourceCapabilities";
import { useResourceAction } from "./ResourceActionContext";

interface ActionButtonsProps {
  record: BaseRecord;
  resource: string;
}

const getRecordDisplayName = (record: BaseRecord): string => {
  const candidate =
    record.name ??
    record.legalName ??
    record.title ??
    record.number ??
    record.code ??
    record.licensePlate ??
    record.fileName ??
    record.id;

  return candidate !== undefined && candidate !== null ? String(candidate).trim() : "";
};

export const ActionButtons = ({ record, resource }: ActionButtonsProps) => {
  const { t } = useTranslation();
  const capabilities = getResourceCapabilities(resource);
  const actionContext = useResourceAction();

  const recordName = getRecordDisplayName(record);
  const resourceLabel = t(`resources.${resource}`);

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
          mutationMode="pessimistic"
          confirmTitle={
            recordName
              ? t("crud.deleteConfirm", { record: recordName })
              : t("crud.deleteConfirmGeneric")
          }
          confirmOkText={t("actions.confirm")}
          confirmCancelText={t("actions.cancel")}
          successNotification={() => ({
            key: `delete-${resource}-${record.id}`,
            message: t("notifications.deleteSuccess", { resource: resourceLabel }),
            description: t("notifications.success"),
            type: "success",
          })}
          errorNotification={(error) => ({
            key: `delete-${resource}-${record.id}`,
            message: t("notifications.deleteError", {
              resource: resourceLabel,
              statusCode: (error as ApiError)?.statusCode ?? 500,
            }),
            description: (error as Error)?.message,
            type: "error",
          })}
        />
      ) : null}
    </Space>
  );
};

