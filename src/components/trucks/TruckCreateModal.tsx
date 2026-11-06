import { useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useWarnAboutChange } from "@refinedev/core";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ResourceModalFrame } from "@/components/resources/ResourceModalFrame";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { TruckForm } from "@/features/trucks/components/TruckForm";
import { applyBackendFieldErrors, hasBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import type { CreateTruckRequest, TruckView } from "@/types/handoff.generated";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";

const ADR_DEPENDENT_FIELDS = new Set([
  "adrEquipmentAllowedClasses",
  "adrEquipmentOrangePlateNumber",
]);

export interface TruckCreateModalProps {
  trigger: (show: () => void) => ReactNode;
  /** Callback nhận đúng đối tượng TruckView trả về từ POST /api/trucks */
  onCreated?: (truck: TruckView) => void;
}

/**
 * TruckCreateModal — Popup tạo mới Đội xe (Xe tải) theo hợp đồng Swagger:
 * - Request: CreateTruckRequest (number*, type*, status*, vehicleCapacity*, isHazmatPlacarded*, licensePlate, licensePlateState, vin, make, model, year, mainDriverId, secondaryDriverId, adrEquipmentIsAdrCertified, adrEquipmentAllowedClasses, adrEquipmentOrangePlateNumber)
 * - Response: ApiResponseTruckView -> TruckView (kèm version, mainDriverName, secondaryDriverName, currentLocationLatitude/Longitude)
 */
export const TruckCreateModal = ({ trigger, onCreated }: TruckCreateModalProps) => {
  const { t } = useTranslation();
  const resourceLabel = t("resources.trucks", { defaultValue: "Xe tải" });
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const { form, modalProps, formProps, show, formLoading, close } = useModalForm<
    TruckView & BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    resource: "trucks",
    mutationMode: "pessimistic",
    warnWhenUnsavedChanges: true,
    onMutationSuccess: (data) => {
      if (data?.data) {
        onCreated?.(data.data);
      }
    },
    successNotification: () => ({
      key: "create-trucks",
      message: t("notifications.createSuccess", { resource: resourceLabel }),
      description: t("notifications.success"),
      type: "success",
    }),
    errorNotification: (error) => {
      if (hasBackendFieldErrors(error)) {
        return false;
      }
      return createApiErrorNotification(error, t, {
        key: "create-trucks",
        operation: "create",
        resourceLabel,
      });
    },
    onMutationError: (error) => {
      const backendErrors = error.errors ?? {};
      if (Object.keys(backendErrors).some((field) => ADR_DEPENDENT_FIELDS.has(field))) {
        form.setFieldValue("adrEquipmentIsAdrCertified", true);
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

  const formId = "create-trucks-form";

  return (
    <>
      {trigger(handleShow)}
      <ResourceModalFrame
        cancelText={t("actions.cancel", "Hủy")}
        confirmLoading={formLoading}
        destroyOnHidden
        formId={formId}
        maskClosable={!warnWhen}
        okText={t("actions.create_trucks", {
          defaultValue: t("crud.createResourceButton", {
            resource: resourceLabel,
            defaultValue: "Tạo xe tải",
          }),
        })}
        onCancel={discardConfirm.onCancel}
        onOk={() => {
          if (formLoading) return;
          form.submit();
        }}
        open={modalProps.open}
        subtitle={t("crud.createSubtitle", {
          resource: resourceLabel,
          defaultValue: "Điền thông tin chi tiết để thêm mới Xe tải vào hệ thống.",
        })}
        title={t("crud.createTitle", { resource: resourceLabel })}
        triggerElement={triggerElement}
        width={860}
      >
        <TruckForm
          form={form}
          formId={formId}
          isModal={true}
          onFinish={async (values) => {
            try {
              const sanitized: Record<string, unknown> = { ...values };
              if (!sanitized.adrEquipmentIsAdrCertified) {
                delete sanitized.adrEquipmentAllowedClasses;
                delete sanitized.adrEquipmentOrangePlateNumber;
              }
              const payload: CreateTruckRequest = buildResourceMutation(
                "trucks",
                sanitized,
              ) as unknown as CreateTruckRequest;
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
