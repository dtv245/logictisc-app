import { useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useWarnAboutChange } from "@refinedev/core";
import {
  Col,
  Collapse,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from "antd";
import dayjs from "dayjs";
import Decimal from "decimal.js";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { EntityPicker } from "@/components/EntityPicker";
import { ResourceModalFrame } from "@/components/resources/ResourceModalFrame";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { AddressFields } from "@/forms/AddressFields";
import { FormSection } from "@/forms/FormSection";
import { applyBackendFieldErrors, hasBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import type { CreatePaymentRequest, PaymentView } from "@/types/handoff.generated";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";
import { toWireDecimal } from "@/utils/decimal";

const PAYMENT_STATUS_OPTIONS = [
  { label: "Chờ xử lý (Pending)", value: "PENDING" },
];

const CURRENCY_OPTIONS = [
  { label: "USD ($)", value: "USD" },
  { label: "VND (₫)", value: "VND" },
  { label: "EUR (€)", value: "EUR" },
];

export interface PaymentCreateModalProps {
  trigger: (show: () => void) => ReactNode;
  /** Callback nhận đúng đối tượng PaymentView trả về từ POST /api/payments */
  onCreated?: (payment: PaymentView) => void;
}

/**
 * PaymentCreateModal — Popup tạo mới Thanh toán (Payment) theo hợp đồng Swagger:
 * - Request: CreatePaymentRequest (idempotencyKey*, invoiceId*, amountAmount*, amountCurrency*, status* ["PENDING"], billingAddressLine1*, billingAddressCity*, billingAddressState*, billingAddressZipCode*, billingAddressCountry*, billingAddressLine2, description, referenceNumber, recordedAt, stripePaymentIntentId, stripePaymentMethodId)
 * - Response: ApiResponsePaymentView -> PaymentView (kèm invoiceNumber)
 */
export const PaymentCreateModal = ({ trigger, onCreated }: PaymentCreateModalProps) => {
  const { t } = useTranslation();
  const resourceLabel = t("resources.payments", { defaultValue: "Thanh toán" });
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    globalThis.crypto.randomUUID(),
  );

  const { form, modalProps, formProps, show, formLoading, close } = useModalForm<
    PaymentView & BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    resource: "payments",
    mutationMode: "pessimistic",
    warnWhenUnsavedChanges: true,
    onMutationSuccess: (data) => {
      setIdempotencyKey(globalThis.crypto.randomUUID());
      if (data?.data) {
        onCreated?.(data.data);
      }
    },
    successNotification: () => ({
      key: "create-payments",
      message: t("notifications.createSuccess", { resource: resourceLabel }),
      description: t("notifications.success"),
      type: "success",
    }),
    errorNotification: (error) => {
      if (hasBackendFieldErrors(error)) {
        return false;
      }
      return createApiErrorNotification(error, t, {
        key: "create-payments",
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
    setIdempotencyKey(globalThis.crypto.randomUUID());
    show();
  };

  const formId = "create-payments-form";

  const initialValues = {
    status: "PENDING",
    amountCurrency: "USD",
    billingAddressCountry: "USA",
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
        okText={t("actions.create", "Ghi nhận thanh toán")}
        onCancel={discardConfirm.onCancel}
        onOk={() => {
          if (formLoading) return;
          form.submit();
        }}
        open={modalProps.open}
        subtitle={t("crud.createSubtitle", {
          resource: resourceLabel,
          defaultValue: "Ghi nhận giao dịch thanh toán gắn với hóa đơn và địa chỉ thanh toán chuẩn.",
        })}
        title={t("crud.createTitle", { resource: resourceLabel })}
        triggerElement={triggerElement}
        width={760}
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
              const rawAmount = values.amountAmount as string | number;
              const wireAmount = toWireDecimal(rawAmount);

              const sanitized: Record<string, unknown> = {
                ...values,
                amountAmount: wireAmount,
                status: String(values.status || "PENDING"),
                idempotencyKey,
              };

              if (dayjs.isDayjs(sanitized.recordedAt)) {
                sanitized.recordedAt = sanitized.recordedAt.toISOString();
              }

              const payload: CreatePaymentRequest = buildResourceMutation(
                "payments",
                sanitized,
              ) as unknown as CreatePaymentRequest;
              await formProps.onFinish?.(payload as unknown as Record<string, unknown>);
            } catch {
              // Đã được xử lý bởi onMutationError và errorNotification của Refine
            }
          }}
          scrollToFirstError
          validateTrigger="onBlur"
        >
          <FormSection
            title="Thông tin giao dịch thanh toán"
            description="Hóa đơn đối chiếu, số tiền thanh toán và mã tham chiếu chứng từ"
          >
            <Row gutter={[24, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Hóa đơn thanh toán (Invoice)"
                  name="invoiceId"
                  rules={[{ required: true, message: "Vui lòng chọn hóa đơn cần thanh toán" }]}
                >
                  <EntityPicker
                    labelFormat={(r) =>
                      r.number ? `Hóa đơn #${r.number}` : String(r.id ?? "")
                    }
                    placeholder="Tìm và chọn hóa đơn"
                    required
                    resource="invoices"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Trạng thái khởi tạo"
                  name="status"
                  rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                >
                  <Select disabled options={PAYMENT_STATUS_OPTIONS} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item
                  label="Số tiền thanh toán"
                  name="amountAmount"
                  rules={[
                    { required: true, message: "Vui lòng nhập số tiền thanh toán" },
                    {
                      validator: async (_, val) => {
                        if (val === undefined || val === null || val === "") return;
                        try {
                          const dec = new Decimal(String(val));
                          if (!dec.isFinite() || dec.lte(0)) {
                            throw new Error("Số tiền thanh toán phải lớn hơn 0");
                          }
                        } catch {
                          throw new Error("Số tiền thanh toán phải lớn hơn 0");
                        }
                      },
                    },
                  ]}
                >
                  <InputNumber
                    min={0.01}
                    placeholder="0.00"
                    precision={2}
                    stringMode
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item
                  label="Đơn vị tiền tệ"
                  name="amountCurrency"
                  rules={[{ required: true, message: "Vui lòng chọn đơn vị tiền tệ" }]}
                >
                  <Select options={CURRENCY_OPTIONS} placeholder="Tiền tệ" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item label="Số tham chiếu (Reference #)" name="referenceNumber">
                  <Input placeholder="Mã giao dịch ngân hàng / séc" />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item label="Nội dung / Diễn giải thanh toán" name="description">
                  <Input.TextArea
                    placeholder="Ghi chú nội dung thanh toán cho hóa đơn..."
                    rows={2}
                  />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection
            title="Địa chỉ thanh toán (Billing Address)"
            description="Địa chỉ xuất chứng từ thanh toán bắt buộc theo hợp đồng tài chính"
          >
            <AddressFields
              includeCoordinates={false}
              prefix="billingAddress"
              required={true}
            />
          </FormSection>

          <FormSection
            title="Thông tin cổng thanh toán & Thời điểm ghi nhận"
            description="Tích hợp Stripe hoặc thời gian hạch toán (tùy chọn)"
          >
            <Collapse
              ghost
              items={[
                {
                  key: "gateway",
                  forceRender: true,
                  label: (
                    <span style={{ color: "#666" }}>
                      ▸ Chi tiết Stripe Payment Intent & thời điểm ghi nhận
                    </span>
                  ),
                  children: (
                    <Row gutter={[24, 0]}>
                      <Col xs={24} sm={8}>
                        <Form.Item
                          getValueProps={(value: unknown) => {
                            if (!value) return { value: undefined };
                            const parsed = dayjs.isDayjs(value) ? value : dayjs(String(value));
                            return { value: parsed.isValid() ? parsed : undefined };
                          }}
                          label="Thời điểm ghi nhận"
                          name="recordedAt"
                          normalize={(value: unknown) =>
                            dayjs.isDayjs(value) && value.isValid() ? value.toISOString() : value
                          }
                        >
                          <DatePicker
                            placeholder="Chọn ngày & giờ"
                            showTime
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8}>
                        <Form.Item label="Stripe Payment Intent ID" name="stripePaymentIntentId">
                          <Input placeholder="pi_..." />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8}>
                        <Form.Item label="Stripe Payment Method ID" name="stripePaymentMethodId">
                          <Input placeholder="pm_..." />
                        </Form.Item>
                      </Col>
                    </Row>
                  ),
                },
              ]}
            />
          </FormSection>
        </Form>
      </ResourceModalFrame>
    </>
  );
};
