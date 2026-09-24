import { useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Form, Modal } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import { ResourceFormFields } from "./resources/ResourceFormFields";
import {
  createResourceFormInitialValues,
  isEditableResourceName,
  resourceFormDefinitions,
} from "./resources/resourceForms";

interface ResourceCreateModalProps {
  resource: string;
  trigger: (show: () => void) => ReactNode;
}

export const ResourceCreateModal = ({ resource, trigger }: ResourceCreateModalProps) => {
  const { t } = useTranslation();

  const { form, modalProps, formProps, show, formLoading, close } = useModalForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    resource,
    warnWhenUnsavedChanges: true,
    // 400 kèm `errors[].field` phải hiện **tại field**, không chỉ một toast chung: người
    // dùng cần biết sửa ô nào. Trước đây `applyBackendFieldErrors` có sẵn mà không nơi
    // nào gọi, nên mọi lỗi validation của backend đều đổ về một thông báo chung.
    onMutationError: (error) => {
      applyBackendFieldErrors(form, error.errors ?? {});
    },
  });

  // Refine hỏi bằng `window.confirm` khi đóng form còn thay đổi; thay bằng modal antd.
  // Dùng `close` (Refine khai `() => void`) chứ không `modalProps.onCancel`, vì antd
  // khai `onCancel` là hàm **cần** một event nên không truyền thẳng vào đây được.
  const discardConfirm = useDiscardConfirm(close);

  if (!isEditableResourceName(resource)) {
    return <>{trigger(() => {})}</>;
  }

  // `isEditableResourceName` là type predicate nên `resource` đã được thu hẹp, không cần ép kiểu.
  const definition = resourceFormDefinitions[resource];

  return (
    <>
      {trigger(show)}
      <Modal
        {...modalProps}
        onCancel={discardConfirm.onCancel}
        title={t("crud.createTitle", { resource: t(`resources.${resource}`) })}
        okText={t("actions.create")}
        confirmLoading={formLoading}
      >
        <Form
          {...formProps}
          initialValues={createResourceFormInitialValues(definition)}
          layout="vertical"
        >
          <ResourceFormFields definition={definition} />
        </Form>
      </Modal>
    </>
  );
};
