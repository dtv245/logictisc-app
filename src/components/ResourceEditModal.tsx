import { useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Form, Modal } from "antd";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useResourceEditContract } from "./resources/useResourceEditContract";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import { ResourceFormFields } from "./resources/ResourceFormFields";
import {
  isEditableResourceName,
  resourceFormDefinitions,
} from "./resources/resourceForms";

interface ResourceEditModalProps {
  resource: string;
  id: string | number | null;
  visible: boolean;
  onClose: () => void;
}

export const ResourceEditModal = ({ resource, id, visible, onClose }: ResourceEditModalProps) => {
  const { t } = useTranslation();
  const resourceLabel = t(`resources.${resource}`);

  const { form, modalProps, formProps, formLoading, close, queryResult } = useModalForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "edit",
    resource,
    id: id ?? undefined,
    mutationMode: "pessimistic",
    warnWhenUnsavedChanges: true,
    // When id is null, we shouldn't fetch
    queryOptions: {
      enabled: visible && id !== null,
    },
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
      applyBackendFieldErrors(form, error.errors ?? {});
      contract.reportError(error);
    },
  });

  const contract = useResourceEditContract(resource, form, queryResult?.data?.data, visible);

  // Đóng thật gồm hai phần: `close` để Refine dọn state nội bộ và reset form, còn
  // `onClose` báo cho cha. Cả hai chỉ được chạy **sau** khi người dùng xác nhận bỏ thay
  // đổi — trước đây `onClose()` chạy vô điều kiện, nên huỷ hộp thoại xác nhận vẫn làm
  // modal đóng.
  const closeModal = useCallback(() => {
    close();
    onClose();
  }, [close, onClose]);

  // Refine hỏi bằng `window.confirm` khi đóng form còn thay đổi; thay bằng modal antd.
  const discardConfirm = useDiscardConfirm(closeModal);

  if (!isEditableResourceName(resource)) {
    return null;
  }

  // `isEditableResourceName` là type predicate nên `resource` đã được thu hẹp.
  const definition = resourceFormDefinitions[resource];

  return (
    <Modal
      {...modalProps}
      open={visible}
      onCancel={discardConfirm.onCancel}
      title={t("crud.editTitle", { resource: resourceLabel })}
      okText={t("actions.save")}
      cancelText={t("actions.cancel")}
      confirmLoading={formLoading}
      cancelButtonProps={{ disabled: formLoading }}
      okButtonProps={{ disabled: formLoading, loading: formLoading }}
      destroyOnHidden
      width={720}
    >
      {contract.feedback}
      <Form
        {...formProps}
        onValuesChange={(changed, values) => { contract.onValuesChange(changed, values); formProps.onValuesChange?.(changed, values); }}
        onFinish={(values) => formProps.onFinish?.(contract.prepare(values))}
        layout="vertical"
        disabled={formLoading}
      >
        <ResourceFormFields columns={2} definition={definition} />
      </Form>
    </Modal>
  );
};
