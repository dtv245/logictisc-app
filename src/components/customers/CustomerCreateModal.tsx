import { useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useWarnAboutChange } from "@refinedev/core";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ResourceModalFrame } from "@/components/resources/ResourceModalFrame";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { CustomerForm } from "@/features/customers/components/CustomerForm";
import { applyBackendFieldErrors, hasBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import type { CreateCustomerRequest, CustomerView } from "@/types/handoff.generated";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";

const ADDRESS_SECTION_FIELDS = new Set([
  "addressLine1",
  "addressLine2",
  "addressCity",
  "addressState",
  "addressZipCode",
  "addressCountry",
  "notes",
]);

export interface CustomerCreateModalProps {
  trigger: (show: () => void) => ReactNode;
  /** Callback nhận đúng đối tượng CustomerView trả về từ POST /api/customers */
  onCreated?: (customer: CustomerView) => void;
}

/**
 * CustomerCreateModal — Popup tạo mới Khách hàng theo hợp đồng Swagger:
 * - Request: CreateCustomerRequest (name*, status*, isVatExempt*, email, phone, taxId, notes, addressLine1..Country)
 * - Response: ApiResponseCustomerView -> CustomerView
 */
export const CustomerCreateModal = ({ trigger, onCreated }: CustomerCreateModalProps) => {
  const { t } = useTranslation();
  const resourceLabel = t("resources.customers", { defaultValue: "Khách hàng" });
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const [addressExpanded, setAddressExpanded] = useState(false);

  const { form, modalProps, formProps, show, formLoading, close } = useModalForm<
    CustomerView & BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    resource: "customers",
    mutationMode: "pessimistic",
    warnWhenUnsavedChanges: true,
    onMutationSuccess: (data) => {
      if (data?.data) {
        onCreated?.(data.data);
      }
    },
    successNotification: () => ({
      key: "create-customers",
      message: t("notifications.createSuccess", { resource: resourceLabel }),
      description: t("notifications.success"),
      type: "success",
    }),
    errorNotification: (error) => {
      if (hasBackendFieldErrors(error)) {
        return false;
      }
      return createApiErrorNotification(error, t, {
        key: "create-customers",
        operation: "create",
        resourceLabel,
      });
    },
    onMutationError: (error) => {
      const backendErrors = error.errors ?? {};
      if (Object.keys(backendErrors).some((field) => ADDRESS_SECTION_FIELDS.has(field))) {
        setAddressExpanded(true);
      }
      applyBackendFieldErrors(form, backendErrors);
    },
  });

  const { warnWhen } = useWarnAboutChange();
  const discardConfirm = useDiscardConfirm(close);

  const handleShow = () => {
    if (document.activeElement instanceof HTMLElement) {
      setTriggerElement(document.activeElement);
    }
    setAddressExpanded(false);
    show();
  };

  const formId = "create-customers-form";

  return (
    <>
      {trigger(handleShow)}
      <ResourceModalFrame
        cancelText={t("actions.cancel", "Hủy")}
        confirmLoading={formLoading}
        destroyOnHidden
        formId={formId}
        maskClosable={!warnWhen}
        okText={t("actions.create", "Thêm khách hàng")}
        onCancel={discardConfirm.onCancel}
        onOk={() => {
          if (formLoading) return;
          form.submit();
        }}
        open={modalProps.open}
        subtitle={t("crud.createSubtitle", {
          resource: resourceLabel,
          defaultValue: "Điền thông tin đối tác khách hàng để thêm mới vào hệ thống.",
        })}
        title={t("crud.createTitle", { resource: resourceLabel })}
        triggerElement={triggerElement}
        width={680}
      >
        <CustomerForm
          addressExpanded={addressExpanded}
          form={form}
          formId={formId}
          isModal={true}
          onAddressExpandedChange={setAddressExpanded}
          onFinish={async (values) => {
            try {
              const payload: CreateCustomerRequest = buildResourceMutation(
                "customers",
                values,
              ) as unknown as CreateCustomerRequest;
              await formProps.onFinish?.(payload as unknown as Record<string, unknown>);
            } catch {
              // Đã được xử lý bởi onMutationError và errorNotification của Refine
            }
          }}
        />
      </ResourceModalFrame>
    </>
  );
};
