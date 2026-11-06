import { useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useWarnAboutChange } from "@refinedev/core";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ResourceModalFrame } from "@/components/resources/ResourceModalFrame";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { TerminalForm } from "@/features/terminals/components/TerminalForm";
import { applyBackendFieldErrors, hasBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import type { CreateTerminalRequest, Terminal } from "@/types/terminal.types";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";

export interface TerminalCreateModalProps {
  trigger: (show: () => void) => ReactNode;
  /** Callback nhận đúng đối tượng Terminal trả về sau khi tạo mới */
  onCreated?: (terminal: Terminal) => void;
}

/**
 * TerminalCreateModal — Popup tạo mới Cảng / Bến bãi (Terminal):
 * - Request: CreateTerminalRequest (name*, code*, countryCode*, type*, notes, addressLine1*, addressLine2, addressCity*, addressState*, addressZipCode*, addressCountry*)
 * - Response: Terminal
 */
export const TerminalCreateModal = ({ trigger, onCreated }: TerminalCreateModalProps) => {
  const { t } = useTranslation();
  const resourceLabel = t("resources.terminals", { defaultValue: "Cảng / Bến bãi" });
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const { form, modalProps, formProps, show, formLoading, close } = useModalForm<
    Terminal & BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    resource: "terminals",
    mutationMode: "pessimistic",
    warnWhenUnsavedChanges: true,
    onMutationSuccess: (data) => {
      if (data?.data) {
        onCreated?.(data.data);
      }
    },
    successNotification: () => ({
      key: "create-terminals",
      message: t("notifications.createSuccess", { resource: resourceLabel }),
      description: t("notifications.success"),
      type: "success",
    }),
    errorNotification: (error) => {
      if (
        error?.statusCode === 409 ||
        error?.code === "CONFLICT" ||
        hasBackendFieldErrors(error)
      ) {
        return false;
      }
      return createApiErrorNotification(error, t, {
        key: "create-terminals",
        operation: "create",
        resourceLabel,
      });
    },
    onMutationError: (error) => {
      if (error.statusCode === 409 || error.code === "CONFLICT") {
        form.setFields([
          {
            name: "code",
            errors: ["Mã UN/LOCODE này đã tồn tại trên hệ thống"],
          },
        ]);
      }
      applyBackendFieldErrors(form, error.errors ?? {});
    },
  });

  const { warnWhen } = useWarnAboutChange();
  const discardConfirm = useDiscardConfirm(close);

  const handleShow = () => {
    if (document.activeElement instanceof HTMLElement) {
      setTriggerElement(document.activeElement);
    }
    show();
  };

  const formId = "create-terminals-form";

  return (
    <>
      {trigger(handleShow)}
      <ResourceModalFrame
        cancelText={t("actions.cancel", "Hủy")}
        confirmLoading={formLoading}
        destroyOnHidden
        formId={formId}
        maskClosable={!warnWhen}
        okText={t("actions.create", "Tạo mới bến bãi")}
        onCancel={discardConfirm.onCancel}
        onOk={() => {
          if (formLoading) return;
          form.submit();
        }}
        open={modalProps.open}
        subtitle={t("crud.createSubtitle", {
          resource: resourceLabel,
          defaultValue: "Điền thông tin định danh cảng / bến bãi, mã UN/LOCODE và địa chỉ chi tiết.",
        })}
        title={t("crud.createTitle", { resource: resourceLabel })}
        triggerElement={triggerElement}
        width={860}
      >
        <TerminalForm
          form={form}
          formId={formId}
          isModal={true}
          onFinish={async (values) => {
            try {
              const payload: CreateTerminalRequest = buildResourceMutation(
                "terminals",
                values as unknown as Record<string, unknown>,
              ) as unknown as CreateTerminalRequest;
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
