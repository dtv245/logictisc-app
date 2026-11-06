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
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ResourceModalFrame } from "@/components/resources/ResourceModalFrame";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { AddressFields } from "@/forms/AddressFields";
import { FormSection } from "@/forms/FormSection";
import { applyBackendFieldErrors, hasBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import type { CreateEmployeeRequest, EmployeeView } from "@/types/handoff.generated";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";

export type CreateDriverRequest = Omit<CreateEmployeeRequest, "roleId">;

const DRIVER_STATUS_OPTIONS = [
  { label: "Sẵn sàng / Đang hoạt động (Active)", value: "active" },
  { label: "Đang nghỉ phép (On Leave)", value: "on_leave" },
  { label: "Ngừng hợp tác (Terminated)", value: "terminated" },
];

const DRIVER_SALARY_TYPE_OPTIONS = [
  { label: "Theo dặm (Per Mile)", value: "PER_MILE" },
  { label: "Theo chuyến (Per Trip)", value: "PER_TRIP" },
  { label: "Theo tháng (Monthly)", value: "MONTHLY" },
  { label: "Theo giờ (Hourly)", value: "HOURLY" },
];

const CURRENCY_OPTIONS = [
  { label: "USD ($)", value: "USD" },
  { label: "VND (₫)", value: "VND" },
  { label: "EUR (€)", value: "EUR" },
];

const ADDRESS_SECTION_FIELDS = new Set([
  "addressLine1",
  "addressLine2",
  "addressCity",
  "addressState",
  "addressZipCode",
  "addressCountry",
]);

export interface DriverCreateModalProps {
  trigger: (show: () => void) => ReactNode;
  /** Callback nhận đúng đối tượng EmployeeView của tài xế vừa tạo */
  onCreated?: (driver: EmployeeView) => void;
}

/**
 * DriverCreateModal — Popup tạo mới Tài xế theo hợp đồng Swagger (driverMutationContract):
 * - Request: CreateDriverRequest = Omit<CreateEmployeeRequest, "roleId">
 *   (firstName*, lastName*, email*, joinedDate*, status*, salaryType*, salaryAmount*, salaryCurrency*, phoneNumber, addressLine1..Country)
 * - Response: ApiResponseEmployeeView -> EmployeeView
 */
export const DriverCreateModal = ({ trigger, onCreated }: DriverCreateModalProps) => {
  const { t } = useTranslation();
  const resourceLabel = t("resources.drivers", { defaultValue: "Tài xế" });
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const [addressExpanded, setAddressExpanded] = useState(false);

  const { form, modalProps, formProps, show, formLoading, close } = useModalForm<
    EmployeeView & BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    resource: "drivers",
    mutationMode: "pessimistic",
    warnWhenUnsavedChanges: true,
    onMutationSuccess: (data) => {
      if (data?.data) {
        onCreated?.(data.data);
      }
    },
    successNotification: () => ({
      key: "create-drivers",
      message: t("notifications.createSuccess", { resource: resourceLabel }),
      description: t("notifications.success"),
      type: "success",
    }),
    errorNotification: (error) => {
      if (hasBackendFieldErrors(error)) {
        return false;
      }
      return createApiErrorNotification(error, t, {
        key: "create-drivers",
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

  const formId = "create-drivers-form";

  const initialValues = {
    status: "active",
    salaryType: "PER_MILE",
    salaryAmount: 0,
    salaryCurrency: "USD",
    joinedDate: dayjs().startOf("day").toISOString(),
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
        okText={t("actions.create", "Thêm tài xế")}
        onCancel={discardConfirm.onCancel}
        onOk={() => {
          if (formLoading) return;
          form.submit();
        }}
        open={modalProps.open}
        subtitle={t("crud.createSubtitle", {
          resource: resourceLabel,
          defaultValue: "Điền hồ sơ tài xế và đơn giá tính lương chuyến hàng.",
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
              const payload: CreateDriverRequest = buildResourceMutation(
                "drivers",
                values,
              ) as unknown as CreateDriverRequest;
              await formProps.onFinish?.(payload as unknown as Record<string, unknown>);
            } catch {
              // Đã được xử lý bởi onMutationError và errorNotification của Refine
            }
          }}
          scrollToFirstError
          validateTrigger="onBlur"
        >
          <FormSection
            title="Hồ sơ tài xế"
            description="Thông tin cá nhân, liên lạc và trạng thái điều phối của tài xế"
          >
            <Row gutter={[24, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Họ và tên đệm (First Name)"
                  name="firstName"
                  rules={[{ required: true, whitespace: true, message: "Vui lòng nhập họ và tên đệm" }]}
                >
                  <Input placeholder="Ví dụ: Trần Văn" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Tên tài xế (Last Name)"
                  name="lastName"
                  rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên tài xế" }]}
                >
                  <Input placeholder="Ví dụ: Bình" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Email tài xế"
                  name="email"
                  rules={[
                    { required: true, whitespace: true, message: "Vui lòng nhập email" },
                    { type: "email", message: "Email không đúng định dạng" },
                  ]}
                >
                  <Input placeholder="driver@company.com" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Số điện thoại liên hệ" name="phoneNumber">
                  <Input placeholder="+84 909 123 456" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Trạng thái hoạt động"
                  name="status"
                  rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                >
                  <Select options={DRIVER_STATUS_OPTIONS} placeholder="Chọn trạng thái" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  getValueProps={(value: unknown) => {
                    if (!value) return { value: undefined };
                    const parsed = dayjs.isDayjs(value) ? value : dayjs(String(value));
                    return { value: parsed.isValid() ? parsed : undefined };
                  }}
                  label="Ngày bắt đầu làm việc"
                  name="joinedDate"
                  normalize={(value: unknown) =>
                    dayjs.isDayjs(value) && value.isValid() ? value.toISOString() : value
                  }
                  rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu" }]}
                >
                  <DatePicker
                    format="YYYY-MM-DD"
                    placeholder="Chọn ngày bắt đầu"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection
            title="Chế độ lương & Quyết toán chuyến"
            description="Cấu hình hình thức tính lương tài xế (theo dặm, theo chuyến, tháng hoặc giờ)"
          >
            <Row gutter={[24, 0]}>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Hình thức tính lương"
                  name="salaryType"
                  rules={[{ required: true, message: "Vui lòng chọn hình thức lương" }]}
                >
                  <Select options={DRIVER_SALARY_TYPE_OPTIONS} placeholder="Chọn hình thức" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item
                  label="Đơn giá / Mức lương"
                  name="salaryAmount"
                  rules={[{ required: true, message: "Vui lòng nhập mức lương" }]}
                >
                  <InputNumber
                    min={0}
                    placeholder="0"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item
                  label="Đơn vị tiền tệ"
                  name="salaryCurrency"
                  rules={[{ required: true, message: "Vui lòng chọn tiền tệ" }]}
                >
                  <Select options={CURRENCY_OPTIONS} placeholder="Chọn tiền tệ" />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection
            title="Địa chỉ thường trú"
            description="Địa chỉ liên lạc của tài xế (tùy chọn)"
          >
            <Collapse
              activeKey={addressExpanded ? ["address"] : []}
              ghost
              items={[
                {
                  key: "address",
                  forceRender: true,
                  label: <span style={{ color: "#666" }}>▸ Chi tiết địa chỉ thường trú</span>,
                  children: (
                    <AddressFields
                      includeCoordinates={false}
                      prefix="address"
                      required={false}
                    />
                  ),
                },
              ]}
              onChange={(keys) => {
                const active = Array.isArray(keys) ? keys.includes("address") : keys === "address";
                setAddressExpanded(active);
              }}
            />
          </FormSection>
        </Form>
      </ResourceModalFrame>
    </>
  );
};
