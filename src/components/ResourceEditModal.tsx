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

  const { form, modalProps, formProps, formLoading, close, queryResult } = useModalForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "edit",
    resource,
    id: id ?? undefined,
    warnWhenUnsavedChanges: true,
    // When id is null, we shouldn't fetch
    queryOptions: {
      enabled: visible && id !== null,
    },
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
      destroyOnClose
      width={860}
      open={visible}
      onCancel={discardConfirm.onCancel}
      title={t("crud.editTitle", { resource: t(`resources.${resource}`) })}
      okText={t("actions.save")}
      confirmLoading={formLoading}
    >
      {contract.feedback}
      <Form
        {...formProps}
        onValuesChange={(changed, values) => { contract.onValuesChange(changed, values); formProps.onValuesChange?.(changed, values); }}
        onFinish={(values) => formProps.onFinish?.(contract.prepare(values))}
        layout="vertical"
      >
        <ResourceFormFields columns={2} definition={definition} />
      </Form>
    </Modal>
  );
};
