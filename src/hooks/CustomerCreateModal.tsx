import { useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Modal } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import { CustomerForm } from "./CustomerForm";

export interface CustomerCreateModalProps {
  trigger: (show: () => void) => ReactNode;
}

/**
 * CustomerCreateModal — Modal thêm nhanh khách hàng (≤ 6 trường chính, 1 cột).
 * Tuân thủ quy tắc:
 * - Dùng Modal cho entity ít trường (thay vì bắt mở trang riêng)
 * - Chiều rộng vừa phải (~600px), 1 cột dọc dễ quét mắt
 * - Xác nhận khi người dùng hủy lúc form có thay đổi
 */
export const CustomerCreateModal = ({ trigger }: CustomerCreateModalProps) => {
  const { t } = useTranslation();

  const { form, modalProps, formProps, show, formLoading, close } = useModalForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    resource: "customers",
    warnWhenUnsavedChanges: true,
    onMutationError: (error) => {
      applyBackendFieldErrors(form, error.errors ?? {});
    },
  });

  const discardConfirm = useDiscardConfirm(close);

  return (
    <>
      {trigger(show)}
      <Modal
        {...modalProps}
        destroyOnClose
        width={640}
        onCancel={discardConfirm.onCancel}
        title={t("crud.createTitle", { resource: "Khách hàng" })}
        okText={t("actions.create", "Thêm khách hàng")}
        cancelText={t("actions.cancel", "Hủy")}
        confirmLoading={formLoading}
      >
        <CustomerForm
          form={form}
          isModal={true}
          onFinish={(values) =>
            formProps.onFinish?.(buildResourceMutation("customers", values))
          }
        />
      </Modal>
    </>
  );
};
