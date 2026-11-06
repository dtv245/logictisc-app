import { useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useWarnAboutChange } from "@refinedev/core";
import dayjs from "dayjs";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ResourceModalFrame } from "@/components/resources/ResourceModalFrame";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { LoadForm } from "@/features/loads/components/LoadForm";
import { applyBackendFieldErrors, hasBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import type { CreateLoadRequest, LoadView } from "@/types/handoff.generated";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";

const HAZMAT_DEPENDENT_FIELDS = new Set(["hazmatClass", "unNumber"]);

export interface LoadCreateModalProps {
  trigger: (show: () => void) => ReactNode;
  /** Callback nhận đúng đối tượng LoadView trả về từ POST /api/loads */
  onCreated?: (load: LoadView) => void;
}

/**
 * LoadCreateModal — Popup tạo mới Vận đơn / Đơn hàng (Load) theo hợp đồng Swagger:
 * - Request: CreateLoadRequest (24 trường bắt buộc + 18 trường tùy chọn)
 * - Response: ApiResponseLoadView -> LoadView (kèm number, version, customerName, assignedTruckNumber, assignedDispatcherName)
 */
export const LoadCreateModal = ({ trigger, onCreated }: LoadCreateModalProps) => {
  const { t } = useTranslation();
  const resourceLabel = t("resources.loads", { defaultValue: "Đơn hàng" });
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const { form, modalProps, formProps, show, formLoading, close } = useModalForm<
    LoadView & BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    resource: "loads",
    mutationMode: "pessimistic",
    warnWhenUnsavedChanges: true,
    onMutationSuccess: (data) => {
      if (data?.data) {
        onCreated?.(data.data);
      }
    },
    successNotification: () => ({
      key: "create-loads",
      message: t("notifications.createSuccess", { resource: resourceLabel }),
      description: t("notifications.success"),
      type: "success",
    }),
    errorNotification: (error) => {
      if (hasBackendFieldErrors(error)) {
        return false;
      }
      return createApiErrorNotification(error, t, {
        key: "create-loads",
        operation: "create",
        resourceLabel,
      });
    },
    onMutationError: (error) => {
      const backendErrors = error.errors ?? {};
      if (Object.keys(backendErrors).some((field) => HAZMAT_DEPENDENT_FIELDS.has(field))) {
        form.setFieldValue("isHazmat", true);
      }
      applyBackendFieldErrors(form, backendErrors);
      setTimeout(() => {
        applyBackendFieldErrors(form, backendErrors);
      }, 0);
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

  const formId = "create-loads-form";

  return (
    <>
      {trigger(handleShow)}
      <ResourceModalFrame
        cancelText={t("actions.cancel", "Hủy")}
        confirmLoading={formLoading}
        destroyOnHidden
        forceRender
        formId={formId}
        maskClosable={!warnWhen}
        okText={t("actions.create", "Tạo đơn hàng")}
        onCancel={discardConfirm.onCancel}
        onOk={() => {
          if (formLoading) return;
          form.submit();
        }}
        open={modalProps.open}
        subtitle={t("crud.createSubtitle", {
          resource: resourceLabel,
          defaultValue: "Điền thông tin vận đơn, điểm lấy/giao hàng, cước phí và điều phối phương tiện.",
        })}
        title={t("crud.createTitle", { resource: resourceLabel })}
        triggerElement={triggerElement}
        width={960}
      >
        <LoadForm
          form={form}
          formId={formId}
          isModal={true}
          onFinish={async (values) => {
            try {
              const sanitized: Record<string, unknown> = {
                isInProximity: false,
                deliveryCostCurrency: "USD",
                isHazmat: false,
                status: "draft",
                type: "STANDARD",
                source: "MANUAL",
                deliveryCostAmount: 0,
                originAddressCountry: "USA",
                destinationAddressCountry: "USA",
                ...values,
              };

              if (dayjs.isDayjs(sanitized.requestedPickupDate)) {
                sanitized.requestedPickupDate = sanitized.requestedPickupDate.toISOString();
              }
              if (dayjs.isDayjs(sanitized.requestedDeliveryDate)) {
                sanitized.requestedDeliveryDate = sanitized.requestedDeliveryDate.toISOString();
              }
              if (!sanitized.isHazmat) {
                delete sanitized.hazmatClass;
                delete sanitized.unNumber;
              }

              const payload: CreateLoadRequest = buildResourceMutation(
                "loads",
                sanitized,
              ) as unknown as CreateLoadRequest;
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
