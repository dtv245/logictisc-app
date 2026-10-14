import { useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useWarnAboutChange } from "@refinedev/core";
import { Form } from "antd";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { ResourceModalFrame } from "./resources/ResourceModalFrame";
import {
  ResourceFormFields,
  useResourceFormSections,
} from "./resources/ResourceFormFields";
import { buildResourceMutation } from "./resources/resourceMutation";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";
import {
  createResourceFormInitialValues,
  findSectionKeyForField,
  isEditableResourceName,
  resourceFormDefinitions,
} from "./resources/resourceForms";

interface ResourceCreateModalProps {
  resource: string;
  trigger: (show: () => void) => ReactNode;
}

export const ResourceCreateModal = ({ resource, trigger }: ResourceCreateModalProps) => {
  const { t } = useTranslation();
  const resourceLabel = t(`resources.${resource}`);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Lấy định nghĩa form nếu resource hợp lệ
  const isEditable = isEditableResourceName(resource);
  const definition = isEditable ? resourceFormDefinitions[resource] : undefined;

  // Quản lý trạng thái đóng/mở của các section (mặc định section ADR thu gọn)
  const { expandedKeys, toggleSection, openSection, setExpandedKeys } =
    useResourceFormSections(definition ?? { fields: [] });

  const { form, modalProps, formProps, show, formLoading, close } = useModalForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    resource,
    mutationMode: "pessimistic",
    warnWhenUnsavedChanges: true,
    successNotification: () => ({
      key: `create-${resource}`,
      message: t("notifications.createSuccess", { resource: resourceLabel }),
      description: t("notifications.success"),
      type: "success",
    }),
    errorNotification: (error) => {
      // Dùng form.setFields để hiện lỗi dưới đúng ô nhập, không hiện notification chung
      if (error?.errors && Object.keys(error.errors).length > 0) {
        return false;
      }
      return createApiErrorNotification(error, t, {
        key: `create-${resource}`,
        operation: "create",
        resourceLabel,
      });
    },
    // Khi nhận lỗi 400 kèm `errors[].field` từ backend:
    // Nếu field lỗi nằm trong section đang thu gọn (ví dụ ADR), tự động mở section đó ra,
    // sau đó gắn lỗi ngay dưới field và cuộn/focus vào field lỗi đầu tiên.
    onMutationError: (error) => {
      setSubmitting(false);
      const backendErrors = error.errors ?? {};
      const firstErrorField = Object.keys(backendErrors)[0];
      if (firstErrorField && definition) {
        const targetSection = findSectionKeyForField(definition, firstErrorField);
        if (targetSection) {
          openSection(targetSection);
        }
        const fieldDef = definition.fields.find((f) => f.name === firstErrorField);
        if (fieldDef?.dependsOn) {
          form.setFieldValue(fieldDef.dependsOn.field, fieldDef.dependsOn.value);
        }
      }
      applyBackendFieldErrors(form, backendErrors);
      setTimeout(() => {
        applyBackendFieldErrors(form, backendErrors);
      }, 0);
    },
  });

  const { warnWhen } = useWarnAboutChange();
  const discardConfirm = useDiscardConfirm(close);

  // Mở modal: Lưu phần tử trigger để hoàn trả focus sau khi đóng,
  // và khôi phục trạng thái thu gọn mặc định của các section.
  const handleShow = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      setTriggerElement(document.activeElement);
    }
    if (definition?.sections) {
      const initialKeys = definition.sections
        .filter((s) => !s.defaultCollapsed)
        .map((s) => s.key);
      setExpandedKeys(initialKeys);
    }
    show();
  }, [definition, setExpandedKeys, show]);

  // Xử lý khi validation submit phía client thất bại:
  // Tự động mở section thu gọn nếu field lỗi nằm trong đó, sau đó focus field đầu tiên.
  const handleFinishFailed = (errorInfo: { errorFields: Array<{ name: (string | number)[] | string }> }) => {
    const firstError = errorInfo.errorFields[0];
    if (firstError && definition) {
      const targetSection = findSectionKeyForField(definition, firstError.name);
      if (targetSection) {
        openSection(targetSection);
      }
      const fieldName = Array.isArray(firstError.name)
        ? String(firstError.name[firstError.name.length - 1])
        : String(firstError.name);
      const fieldDef = definition.fields.find((f) => f.name === fieldName);
      if (fieldDef?.dependsOn) {
        form.setFieldValue(fieldDef.dependsOn.field, fieldDef.dependsOn.value);
      }
      setTimeout(() => {
        form.scrollToField(firstError.name, {
          block: "center",
          focus: true,
        });
      }, 60);
    }
  };

  // Khi thay đổi giá trị trong form:
  // Nếu tắt chứng nhận ADR (adrEquipmentIsAdrCertified = false), dọn dẹp các field phụ thuộc
  // để dữ liệu không bị lưu đọng trong form store.
  const handleValuesChange = (
    changedValues: Record<string, unknown>,
    allValues: Record<string, unknown>,
  ) => {
    if (
      "adrEquipmentIsAdrCertified" in changedValues &&
      !changedValues.adrEquipmentIsAdrCertified
    ) {
      form.setFieldsValue({
        adrEquipmentAllowedClasses: undefined,
        adrEquipmentOrangePlateNumber: undefined,
      });
    }
    formProps.onValuesChange?.(changedValues, allValues);
  };

  // Xử lý gửi biểu mẫu:
  // Đảm bảo loại bỏ các trường phụ thuộc của ADR nếu chứng nhận ADR đang tắt (resetOnHide),
  // trước khi đưa qua buildResourceMutation chuẩn hóa payload.
  const handleFinish = useCallback(
    async (values: Record<string, unknown>) => {
      if (submitting) return;
      setSubmitting(true);
      try {
        const sanitized = { ...values };
        if (!sanitized.adrEquipmentIsAdrCertified) {
          delete sanitized.adrEquipmentAllowedClasses;
          delete sanitized.adrEquipmentOrangePlateNumber;
        }
        await formProps.onFinish?.(buildResourceMutation(resource, sanitized));
      } catch {
        // Handled by Refine onMutationError and notificationFailed
      } finally {
        setSubmitting(false);
      }
    },
    [formProps, resource, submitting],
  );

  if (!isEditable || !definition) {
    return <>{trigger(() => {})}</>;
  }

  const formId = `create-${resource}-form`;
  const modalTitle = t("crud.createTitle", { resource: resourceLabel });
  const modalSubtitle = t(`resources.${resource}.createSubtitle`, {
    defaultValue: t("crud.createSubtitle", { resource: resourceLabel }),
  });
  const okText =
    resource === "trucks"
      ? t("actions.create_trucks", {
          defaultValue: t("crud.createResourceButton", {
            resource: resourceLabel,
            defaultValue: "Tạo xe tải",
          }),
        })
      : t(`actions.create_${resource}`, {
          defaultValue: t("actions.create"),
        });

  return (
    <>
      {trigger(handleShow)}
      <ResourceModalFrame
        cancelText={t("actions.cancel")}
        confirmLoading={formLoading || submitting}
        destroyOnHidden
        formId={formId}
        maskClosable={!warnWhen}
        okText={okText}
        onCancel={discardConfirm.onCancel}
        onOk={() => {
          if (submitting || formLoading) return;
          form.submit();
        }}
        open={modalProps.open}
        subtitle={modalSubtitle}
        title={modalTitle}
        triggerElement={triggerElement}
        width={860}
      >
        <Form
          {...formProps}
          disabled={formLoading}
          form={form}
          id={formId}
          initialValues={createResourceFormInitialValues(definition)}
          layout="vertical"
          onFinish={handleFinish}
          onFinishFailed={handleFinishFailed}
          onValuesChange={handleValuesChange}
          validateTrigger={["onBlur", "onChange"]}
        >
          <ResourceFormFields
            columns={2}
            definition={definition}
            expandedKeys={expandedKeys}
            onToggleSection={toggleSection}
          />
        </Form>
      </ResourceModalFrame>
    </>
  );
};
