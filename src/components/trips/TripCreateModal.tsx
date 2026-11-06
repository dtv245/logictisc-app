import { useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useWarnAboutChange } from "@refinedev/core";
import { Col, Form, Input, InputNumber, Row, Select } from "antd";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { EntityPicker } from "@/components/EntityPicker";
import { ResourceModalFrame } from "@/components/resources/ResourceModalFrame";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { FormSection } from "@/forms/FormSection";
import { applyBackendFieldErrors, hasBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import type { CreateTripRequest, TripView } from "@/types/handoff.generated";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";

const TRIP_STATUS_OPTIONS = [
  { label: "Đã lên kế hoạch (Planned)", value: "planned" },
  { label: "Đang thực hiện (Active)", value: "active" },
  { label: "Đã hoàn thành (Completed)", value: "completed" },
  { label: "Đã hủy (Cancelled)", value: "cancelled" },
];

export interface TripCreateModalProps {
  trigger: (show: () => void) => ReactNode;
  /** Callback nhận đúng đối tượng TripView trả về từ POST /api/trips */
  onCreated?: (trip: TripView) => void;
}

/**
 * TripCreateModal — Popup tạo mới Chuyến xe (Trip) theo hợp đồng Swagger:
 * - Request: CreateTripRequest (name*, status*, totalDistance*, truckId)
 * - Response: ApiResponseTripView -> TripView (id, number, version, name, status, totalDistance, truckId, truckNumber, dispatchedAt, completedAt, cancelledAt)
 */
export const TripCreateModal = ({ trigger, onCreated }: TripCreateModalProps) => {
  const { t } = useTranslation();
  const resourceLabel = t("resources.trips", { defaultValue: "Chuyến xe" });
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const { form, modalProps, formProps, show, formLoading, close } = useModalForm<
    TripView & BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    resource: "trips",
    mutationMode: "pessimistic",
    warnWhenUnsavedChanges: true,
    onMutationSuccess: (data) => {
      if (data?.data) {
        onCreated?.(data.data);
      }
    },
    successNotification: () => ({
      key: "create-trips",
      message: t("notifications.createSuccess", { resource: resourceLabel }),
      description: t("notifications.success"),
      type: "success",
    }),
    errorNotification: (error) => {
      if (hasBackendFieldErrors(error)) {
        return false;
      }
      return createApiErrorNotification(error, t, {
        key: "create-trips",
        operation: "create",
        resourceLabel,
      });
    },
    onMutationError: (error) => {
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

  const formId = "create-trips-form";

  const initialValues = {
    status: "planned",
    totalDistance: 0,
  };

  return (
    <>
      {trigger(handleShow)}
      <ResourceModalFrame
        cancelText={t("actions.cancel", "Hủy")}
        confirmLoading={formLoading}
        destroyOnHidden
        formId={formId}
        maskClosable={!warnWhen}
        okText={t("actions.create", "Tạo chuyến xe")}
        onCancel={discardConfirm.onCancel}
        onOk={() => {
          if (formLoading) return;
          form.submit();
        }}
        open={modalProps.open}
        subtitle={t("crud.createSubtitle", {
          resource: resourceLabel,
          defaultValue: "Khởi tạo hành trình vận chuyển và gán phương tiện thực hiện.",
        })}
        title={t("crud.createTitle", { resource: resourceLabel })}
        triggerElement={triggerElement}
        width={600}
      >
        <Form
          {...formProps}
          disabled={formLoading}
          form={form}
          id={formId}
          initialValues={initialValues}
          layout="vertical"
          onFinish={async (values) => {
            try {
              const payload: CreateTripRequest = buildResourceMutation(
                "trips",
                values,
              ) as unknown as CreateTripRequest;
              await formProps.onFinish?.(payload as unknown as Record<string, unknown>);
            } catch {
              // Đã được xử lý bởi onMutationError và errorNotification của Refine
            }
          }}
          scrollToFirstError
          validateTrigger="onBlur"
        >
          <FormSection
            title="Thông tin hành trình (Trip)"
            description="Tên hành trình, trạng thái khởi tạo, tổng quãng đường dự kiến và xe tải phụ trách"
          >
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  label="Tên chuyến xe / Hành trình"
                  name="name"
                  rules={[
                    { required: true, whitespace: true, message: "Vui lòng nhập tên chuyến xe" },
                  ]}
                >
                  <Input placeholder="Ví dụ: Tuyến Bắc - Nam #108 (Dallas → Houston)" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Trạng thái hành trình"
                  name="status"
                  rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                >
                  <Select options={TRIP_STATUS_OPTIONS} placeholder="Chọn trạng thái" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Tổng quãng đường dự kiến"
                  name="totalDistance"
                  rules={[{ required: true, message: "Vui lòng nhập tổng quãng đường" }]}
                >
                  <InputNumber
                    addonAfter="mi"
                    min={0}
                    placeholder="0.0"
                    precision={1}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  extra="Có thể gán xe ngay hoặc phân công sau trên màn hình chi tiết chuyến xe"
                  label="Xe tải thực hiện (Truck)"
                  name="truckId"
                >
                  <EntityPicker
                    labelFormat={(r) =>
                      r.number ? `${r.number} (${r.licensePlate || "Xe"})` : String(r.id ?? "")
                    }
                    placeholder="Tìm và chọn xe tải (tùy chọn)"
                    resource="trucks"
                  />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>
        </Form>
      </ResourceModalFrame>
    </>
  );
};
