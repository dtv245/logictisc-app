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

import { EntityPicker } from "@/components/EntityPicker";
import { ResourceModalFrame } from "@/components/resources/ResourceModalFrame";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { AddressFields } from "@/forms/AddressFields";
import { FormSection } from "@/forms/FormSection";
import { applyBackendFieldErrors, hasBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import type { CreateEmployeeRequest, EmployeeView } from "@/types/handoff.generated";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";

const EMPLOYEE_STATUS_OPTIONS = [
  { label: "Đang làm việc (Active)", value: "active" },
  { label: "Nghỉ phép (On Leave)", value: "on_leave" },
  { label: "Đã nghỉ việc (Terminated)", value: "terminated" },
];

const SALARY_TYPE_OPTIONS = [
  { label: "Theo tháng (Monthly)", value: "MONTHLY" },
  { label: "Theo giờ (Hourly)", value: "HOURLY" },
  { label: "Theo dặm (Per Mile)", value: "PER_MILE" },
  { label: "Theo chuyến (Per Trip)", value: "PER_TRIP" },
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

export interface EmployeeCreateModalProps {
  trigger: (show: () => void) => ReactNode;
  /** Callback nhận đúng đối tượng EmployeeView trả về từ POST /api/employees */
  onCreated?: (employee: EmployeeView) => void;
}

/**
 * EmployeeCreateModal — Popup tạo mới Nhân viên theo hợp đồng Swagger:
 * - Request: CreateEmployeeRequest (firstName*, lastName*, email*, joinedDate*, status*, salaryType*, salaryAmount*, salaryCurrency*, phoneNumber, roleId, addressLine1..Country)
 * - Response: ApiResponseEmployeeView -> EmployeeView (kèm roleName)
 */
export const EmployeeCreateModal = ({ trigger, onCreated }: EmployeeCreateModalProps) => {
  const { t } = useTranslation();
  const resourceLabel = t("resources.employees", { defaultValue: "Nhân viên" });
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const [addressExpanded, setAddressExpanded] = useState(false);

  const { form, modalProps, formProps, show, formLoading, close } = useModalForm<
    EmployeeView & BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    resource: "employees",
    mutationMode: "pessimistic",
    warnWhenUnsavedChanges: true,
    onMutationSuccess: (data) => {
      if (data?.data) {
        onCreated?.(data.data);
      }
    },
    successNotification: () => ({
      key: "create-employees",
      message: t("notifications.createSuccess", { resource: resourceLabel }),
      description: t("notifications.success"),
      type: "success",
    }),
    errorNotification: (error) => {
      if (hasBackendFieldErrors(error)) {
        return false;
      }
      return createApiErrorNotification(error, t, {
        key: "create-employees",
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

  const formId = "create-employees-form";

  const initialValues = {
    status: "active",
    salaryType: "MONTHLY",
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
        okText={t("actions.create", "Thêm nhân viên")}
        onCancel={discardConfirm.onCancel}
        onOk={() => {
          if (formLoading) return;
          form.submit();
        }}
        open={modalProps.open}
        subtitle={t("crud.createSubtitle", {
          resource: resourceLabel,
          defaultValue: "Điền thông tin hồ sơ nhân sự, phân quyền và chế độ lương.",
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
              const payload: CreateEmployeeRequest = buildResourceMutation(
                "employees",
                values,
              ) as unknown as CreateEmployeeRequest;
              await formProps.onFinish?.(payload as unknown as Record<string, unknown>);
            } catch {
              // Đã được xử lý bởi onMutationError và errorNotification của Refine
            }
          }}
          scrollToFirstError
          validateTrigger="onBlur"
        >
          <FormSection
            title="Thông tin nhân sự & Vai trò"
            description="Họ tên, thông tin liên hệ và vai trò phân quyền trong hệ thống"
          >
            <Row gutter={[24, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Họ và tên đệm (First Name)"
                  name="firstName"
                  rules={[{ required: true, whitespace: true, message: "Vui lòng nhập họ và tên đệm" }]}
                >
                  <Input placeholder="Ví dụ: Nguyễn Văn" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Tên (Last Name)"
                  name="lastName"
                  rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên nhân viên" }]}
                >
                  <Input placeholder="Ví dụ: An" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Email công việc"
                  name="email"
                  rules={[
                    { required: true, whitespace: true, message: "Vui lòng nhập email" },
                    { type: "email", message: "Email không đúng định dạng" },
                  ]}
                >
                  <Input placeholder="employee@company.com" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Số điện thoại" name="phoneNumber">
                  <Input placeholder="+84 901 234 567" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Vai trò hệ thống (Role)" name="roleId">
                  <EntityPicker
                    labelFormat={(r) => String(r.displayName || r.name || r.id || "")}
                    placeholder="Chọn vai trò phân quyền (tùy chọn)"
                    resource="roles"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Trạng thái làm việc"
                  name="status"
                  rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                >
                  <Select options={EMPLOYEE_STATUS_OPTIONS} placeholder="Chọn trạng thái" />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection
            title="Hợp đồng & Chế độ lương"
            description="Ngày gia nhập và cấu hình mức lương cơ bản"
          >
            <Row gutter={[24, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  getValueProps={(value: unknown) => {
                    if (!value) return { value: undefined };
                    const parsed = dayjs.isDayjs(value) ? value : dayjs(String(value));
                    return { value: parsed.isValid() ? parsed : undefined };
                  }}
                  label="Ngày gia nhập"
                  name="joinedDate"
                  normalize={(value: unknown) =>
                    dayjs.isDayjs(value) && value.isValid() ? value.toISOString() : value
                  }
                  rules={[{ required: true, message: "Vui lòng chọn ngày gia nhập" }]}
                >
                  <DatePicker
                    format="YYYY-MM-DD"
                    placeholder="Chọn ngày gia nhập"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Hình thức trả lương"
                  name="salaryType"
                  rules={[{ required: true, message: "Vui lòng chọn hình thức trả lương" }]}
                >
                  <Select options={SALARY_TYPE_OPTIONS} placeholder="Chọn hình thức lương" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Mức lương cơ bản"
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

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Đơn vị tiền tệ"
                  name="salaryCurrency"
                  rules={[{ required: true, message: "Vui lòng chọn đơn vị tiền tệ" }]}
                >
                  <Select options={CURRENCY_OPTIONS} placeholder="Chọn tiền tệ" />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection
            title="Địa chỉ liên hệ"
            description="Địa chỉ thường trú của nhân viên (tùy chọn)"
          >
            <Collapse
              activeKey={addressExpanded ? ["address"] : []}
              ghost
              items={[
                {
                  key: "address",
                  forceRender: true,
                  label: <span style={{ color: "#666" }}>▸ Chi tiết địa chỉ liên hệ</span>,
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
