import { isLegacyDraftInvoice } from "@/features/invoices/invoiceMutability";
import { DeleteButton, EditButton, ShowButton } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Button, Dropdown, type MenuProps, Popconfirm, Space, Tooltip } from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { createApiErrorNotification } from "@/providers/apiErrorNotification";
import { getResourceCapabilities } from "./resources/resourceCapabilities";
import { useResourceAction } from "./ResourceActionContext";

export interface ExtraActionItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  onClick?: (record: BaseRecord) => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface ActionButtonsProps {
  record: BaseRecord;
  resource: string;
  extraActions?: ExtraActionItem[];
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

export const ActionButtons = ({ record, resource, extraActions = [] }: ActionButtonsProps) => {
  const { t } = useTranslation();
  const capabilities = getResourceCapabilities(resource);
  const actionContext = useResourceAction();

  const recordName = getRecordDisplayName(record);
  const resourceLabel = t(`resources.${resource}`);

  const canEdit = capabilities.edit && (resource !== "invoices" || isLegacyDraftInvoice(record));
  const canDelete = Boolean(capabilities.delete);

  const viewLabel = t("actions.view", "Xem");
  const editLabel = t("actions.edit", "Sửa");
  const deleteLabel = t("actions.delete", "Xóa");
  const moreLabel = t("actions.more", "Thao tác khác");

  const viewAriaLabel = recordName ? `${viewLabel} ${recordName}` : viewLabel;
  const editAriaLabel = recordName ? `${editLabel} ${recordName}` : editLabel;
  const deleteAriaLabel = recordName ? `${deleteLabel} ${recordName}` : deleteLabel;

  const showNode = (
    <Tooltip key="show" title={viewLabel}>
      <span>
        <ShowButton
          hideText
          aria-label={viewAriaLabel}
          className="refine-show-button table-action-btn table-action-btn--show"
          recordItemId={record.id}
          resource={resource}
          style={{ minWidth: 32, minHeight: 32 }}
          onClick={(e) => {
            if (actionContext) {
              e.preventDefault();
              actionContext.showView(record.id!);
            }
          }}
        />
      </span>
    </Tooltip>
  );

  const editNode = canEdit ? (
    <Tooltip key="edit" title={editLabel}>
      <span>
        <EditButton
          hideText
          aria-label={editAriaLabel}
          className="refine-edit-button table-action-btn table-action-btn--edit"
          recordItemId={record.id}
          resource={resource}
          style={{ minWidth: 32, minHeight: 32 }}
          onClick={(e) => {
            if (actionContext) {
              e.preventDefault();
              actionContext.showEdit(record.id!);
            }
          }}
        />
      </span>
    </Tooltip>
  ) : null;

  const deleteNode = canDelete ? (
    <Tooltip key="delete" title={deleteLabel}>
      <span>
        <DeleteButton
          hideText
          aria-label={deleteAriaLabel}
          className="refine-delete-button table-action-btn table-action-btn--delete"
          recordItemId={record.id}
          resource={resource}
          mutationMode="pessimistic"
          style={{ minWidth: 32, minHeight: 32 }}
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
          errorNotification={(error) => createApiErrorNotification(error, t, {
            key: `delete-${resource}-${record.id}`,
            operation: "delete",
            resourceLabel,
          })}
        />
      </span>
    </Tooltip>
  ) : null;

  // Tổng số hành động khả dụng
  const primaryNodes: ReactNode[] = [
    showNode,
    ...(editNode ? [editNode] : []),
    ...(deleteNode ? [deleteNode] : []),
  ];

  const totalActions = primaryNodes.length + extraActions.length;

  // Nếu <= 3 hành động: hiển thị trực tiếp tất cả nút
  if (totalActions <= 3) {
    return (
      <Space size={4}>
        {primaryNodes}
        {extraActions.map((action) => (
          <Tooltip key={action.key} title={action.label}>
            <span>
              <Button
                aria-label={String(action.label)}
                className={`table-action-btn ${action.danger ? "table-action-btn--delete" : ""}`}
                danger={action.danger}
                disabled={action.disabled}
                icon={action.icon}
                style={{ minWidth: 32, minHeight: 32 }}
                onClick={() => action.onClick?.(record)}
              />
            </span>
          </Tooltip>
        ))}
      </Space>
    );
  }

  // Nếu > 3 hành động: giữ 2 hành động đầu tiên, gom các hành động còn lại vào menu "..."
  const visibleButtons = primaryNodes.slice(0, 2);
  const remainingPrimary = primaryNodes.slice(2);

  const menuItems: MenuProps["items"] = [
    ...extraActions.map((action) => ({
      key: action.key,
      label: action.label,
      icon: action.icon,
      danger: action.danger,
      disabled: action.disabled,
      onClick: () => action.onClick?.(record),
    })),
    // Nếu nút Xóa bị rơi vào menu phụ
    ...(remainingPrimary.length > 0 && canDelete
      ? [
          {
            key: "delete",
            danger: true,
            label: (
              <Popconfirm
                cancelText={t("actions.cancel")}
                okText={t("actions.confirm")}
                title={
                  recordName
                    ? t("crud.deleteConfirm", { record: recordName })
                    : t("crud.deleteConfirmGeneric")
                }
              >
                <span>{deleteLabel}</span>
              </Popconfirm>
            ),
          },
        ]
      : []),
  ];

  return (
    <Space size={4}>
      {visibleButtons}
      <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={["click"]}>
        <Tooltip title={moreLabel}>
          <span>
            <Button
              aria-label={recordName ? `${moreLabel} ${recordName}` : moreLabel}
              className="table-action-btn"
              icon={<EllipsisOutlined />}
              style={{ minWidth: 32, minHeight: 32 }}
            />
          </span>
        </Tooltip>
      </Dropdown>
    </Space>
  );
};

