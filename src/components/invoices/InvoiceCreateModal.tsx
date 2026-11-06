import { useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useWarnAboutChange } from "@refinedev/core";
import {
  Col,
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
import { FormSection } from "@/forms/FormSection";
import { applyBackendFieldErrors, hasBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import type { CreateInvoiceRequest, InvoiceView } from "@/types/handoff.generated";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";

const INVOICE_TYPE_OPTIONS = [
  { label: "Hóa đơn khách hàng (Customer)", value: "CUSTOMER" },
  { label: "Hóa đơn thương mại (Commercial)", value: "COMMERCIAL" },
  { label: "Hóa đơn điều chỉnh (Adjustment)", value: "ADJUSTMENT" },
];

const INVOICE_STATUS_OPTIONS = [
  { label: "Bản nháp (Draft)", value: "draft" },
  { label: "Đã phát hành (Issued)", value: "issued" },
  { label: "Thanh toán một phần (Partially Paid)", value: "partially_paid" },
  { label: "Đã thanh toán (Paid)", value: "paid" },
  { label: "Đã hủy (Cancelled)", value: "cancelled" },
];

const TAX_BEHAVIOR_OPTIONS = [
  { label: "Chưa gồm thuế (Exclusive)", value: "EXCLUSIVE" },
  { label: "Đã gồm thuế (Inclusive)", value: "INCLUSIVE" },
  { label: "Miễn thuế (Exempt)", value: "EXEMPT" },
];

const CURRENCY_OPTIONS = [
  { label: "USD ($)", value: "USD" },
  { label: "VND (₫)", value: "VND" },
  { label: "EUR (€)", value: "EUR" },
];

export interface InvoiceCreateModalProps {
  trigger: (show: () => void) => ReactNode;
  /** Callback nhận đúng đối tượng InvoiceView trả về từ POST /api/invoices */
  onCreated?: (invoice: InvoiceView) => void;
}

/**
 * InvoiceCreateModal — Popup tạo mới Hóa đơn (Invoice) theo hợp đồng Swagger:
 * - Request: CreateInvoiceRequest (type*, status*, subtotalAmount*, subtotalCurrency*, taxTotalAmount*, taxTotalCurrency*, totalAmount*, totalCurrency*, customerId, loadId, dueDate, taxBehavior, notes)
 * - Response: ApiResponseInvoiceView -> InvoiceView (kèm number, customerName, billingChainId, invoicePurpose, parentInvoiceId, ratingSnapshotId, economicSign)
 */
export const InvoiceCreateModal = ({ trigger, onCreated }: InvoiceCreateModalProps) => {
  const { t } = useTranslation();
  const resourceLabel = t("resources.invoices", { defaultValue: "Hóa đơn" });
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const { form, modalProps, formProps, show, formLoading, close } = useModalForm<
    InvoiceView & BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    resource: "invoices",
    mutationMode: "pessimistic",
    warnWhenUnsavedChanges: true,
    onMutationSuccess: (data) => {
      if (data?.data) {
        onCreated?.(data.data);
      }
    },
    successNotification: () => ({
      key: "create-invoices",
      message: t("notifications.createSuccess", { resource: resourceLabel }),
      description: t("notifications.success"),
      type: "success",
    }),
    errorNotification: (error) => {
      if (hasBackendFieldErrors(error)) {
        return false;
      }
      return createApiErrorNotification(error, t, {
        key: "create-invoices",
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

  // Tự động đồng bộ tiền tệ và tính tổng tiền bằng Decimal (không dùng float)
  const handleValuesChange = (
    changedValues: Record<string, unknown>,
    allValues: Record<string, unknown>,
  ) => {
    if ("subtotalCurrency" in changedValues && changedValues.subtotalCurrency) {
      const currency = String(changedValues.subtotalCurrency);
      form.setFieldsValue({
        taxTotalCurrency: currency,
        totalCurrency: currency,
      });
    }

    if ("subtotalAmount" in changedValues || "taxTotalAmount" in changedValues) {
      try {
        const sub = new Decimal(Number(allValues.subtotalAmount ?? 0) || 0);
        const tax = new Decimal(Number(allValues.taxTotalAmount ?? 0) || 0);
        form.setFieldValue("totalAmount", sub.plus(tax).toDecimalPlaces(2).toNumber());
      } catch {
        // Bỏ qua nếu giá trị đang nhập dở
      }
    }

    formProps.onValuesChange?.(changedValues, allValues);
  };

  const formId = "create-invoices-form";

  const initialValues = {
    type: "CUSTOMER",
    status: "draft",
    taxBehavior: "EXCLUSIVE",
    subtotalAmount: 0,
    subtotalCurrency: "USD",
    taxTotalAmount: 0,
    taxTotalCurrency: "USD",
    totalAmount: 0,
    totalCurrency: "USD",
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
        okText={t("actions.create", "Tạo hóa đơn")}
        onCancel={discardConfirm.onCancel}
        onOk={() => {
          if (formLoading) return;
          form.submit();
        }}
        open={modalProps.open}
        subtitle={t("crud.createSubtitle", {
          resource: resourceLabel,
          defaultValue: "Tạo mới chứng từ hóa đơn liên kết khách hàng, vận đơn và cấu trúc thuế.",
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
              const sanitized: Record<string, unknown> = { ...values };
              if (dayjs.isDayjs(sanitized.dueDate)) {
                sanitized.dueDate = sanitized.dueDate.toISOString();
              }
              const currency = String(sanitized.subtotalCurrency || "USD");
              sanitized.subtotalCurrency = currency;
              sanitized.taxTotalCurrency = String(sanitized.taxTotalCurrency || currency);
              sanitized.totalCurrency = String(sanitized.totalCurrency || currency);

              const payload: CreateInvoiceRequest = buildResourceMutation(
                "invoices",
                sanitized,
              ) as unknown as CreateInvoiceRequest;
              await formProps.onFinish?.(payload as unknown as Record<string, unknown>);
            } catch {
              // Đã được xử lý bởi onMutationError và errorNotification của Refine
            }
          }}
          onValuesChange={handleValuesChange}
          scrollToFirstError
          validateTrigger="onBlur"
        >
          {/* Đồng bộ tiền tệ cho tax và total */}
          <Form.Item hidden name="taxTotalCurrency">
            <Input />
          </Form.Item>
          <Form.Item hidden name="totalCurrency">
            <Input />
          </Form.Item>

          <FormSection
            title="Phân loại & Liên kết nghiệp vụ"
            description="Loại hóa đơn, trạng thái chứng từ, khách hàng và vận đơn gắn kèm"
          >
            <Row gutter={[24, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Loại hóa đơn"
                  name="type"
                  rules={[{ required: true, message: "Vui lòng chọn loại hóa đơn" }]}
                >
                  <Select options={INVOICE_TYPE_OPTIONS} placeholder="Chọn loại hóa đơn" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Trạng thái hóa đơn"
                  name="status"
                  rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                >
                  <Select options={INVOICE_STATUS_OPTIONS} placeholder="Chọn trạng thái" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Khách hàng (Customer)" name="customerId">
                  <EntityPicker
                    labelFormat={(r) => String(r.name || r.id || "")}
                    placeholder="Tìm và chọn khách hàng (tùy chọn)"
                    resource="customers"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Vận đơn liên kết (Load)" name="loadId">
                  <EntityPicker
                    infiniteScroll
                    labelFormat={(r) =>
                      r.name ? `Load #${r.number ?? ""} ${r.name}` : String(r.id ?? "")
                    }
                    placeholder="Tìm và chọn vận đơn (tùy chọn)"
                    resource="loads"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  getValueProps={(value: unknown) => {
                    if (!value) return { value: undefined };
                    const parsed = dayjs.isDayjs(value) ? value : dayjs(String(value));
                    return { value: parsed.isValid() ? parsed : undefined };
                  }}
                  label="Hạn thanh toán (Due Date)"
                  name="dueDate"
                  normalize={(value: unknown) =>
                    dayjs.isDayjs(value) && value.isValid() ? value.toISOString() : value
                  }
                >
                  <DatePicker
                    format="YYYY-MM-DD"
                    placeholder="Chọn ngày đến hạn"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Chế độ tính thuế (Tax Behavior)" name="taxBehavior">
                  <Select
                    allowClear
                    options={TAX_BEHAVIOR_OPTIONS}
                    placeholder="Chọn chế độ thuế"
                  />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection
            title="Giá trị hóa đơn & Tiền tệ"
            description="Tiền trước thuế, tiền thuế và tổng thanh toán (tự động cộng chính xác)"
          >
            <Row gutter={[24, 0]}>
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Đơn vị tiền tệ"
                  name="subtotalCurrency"
                  rules={[{ required: true, message: "Vui lòng chọn tiền tệ" }]}
                >
                  <Select options={CURRENCY_OPTIONS} placeholder="Tiền tệ" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={6}>
                <Form.Item
                  label="Tiền trước thuế (Subtotal)"
                  name="subtotalAmount"
                  rules={[{ required: true, message: "Vui lòng nhập tiền trước thuế" }]}
                >
                  <InputNumber
                    min={0}
                    placeholder="0.00"
                    precision={2}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={6}>
                <Form.Item
                  label="Tiền thuế (Tax Total)"
                  name="taxTotalAmount"
                  rules={[{ required: true, message: "Vui lòng nhập tiền thuế" }]}
                >
                  <InputNumber
                    min={0}
                    placeholder="0.00"
                    precision={2}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={6}>
                <Form.Item
                  label="Tổng cộng (Total)"
                  name="totalAmount"
                  rules={[{ required: true, message: "Vui lòng nhập tổng tiền" }]}
                >
                  <InputNumber
                    min={0}
                    placeholder="0.00"
                    precision={2}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item label="Ghi chú hóa đơn" name="notes">
                  <Input.TextArea
                    placeholder="Điều khoản thanh toán, số hợp đồng, lưu ý xuất hóa đơn..."
                    rows={3}
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
