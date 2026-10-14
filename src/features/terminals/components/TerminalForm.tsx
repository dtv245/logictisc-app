import {
  Col,
  Form,
  type FormInstance,
  Input,
  Row,
  Select,
  type ButtonProps,
} from "antd";
import { useEffect } from "react";
import { FormFooterBar } from "@/forms/FormFooterBar";
import { FormSection } from "@/forms/FormSection";
import type {
  CreateTerminalRequest,
  Terminal,
  TerminalType,
} from "@/types/terminal.types";
import { TERMINAL_TYPE_OPTIONS } from "../config/terminal.constants";

export interface TerminalFormProps {
  form: FormInstance;
  initialValues?: Partial<Terminal>;
  onFinish?: (values: CreateTerminalRequest) => void;
  saveButtonProps?: ButtonProps;
  isEdit?: boolean;
  onCancel?: () => void;
}

/**
 * TerminalForm — Form quản lý thông tin Bến bãi / Cảng (Terminal).
 * Bố cục 2 cột trên desktop, 1 cột trên mobile; chia 2 nhóm Thông tin chung và Địa chỉ.
 */
export const TerminalForm = ({
  form,
  initialValues,
  onFinish,
  saveButtonProps,
  isEdit = false,
  onCancel,
}: TerminalFormProps) => {
  // Chuẩn hóa initial values cho cả flat fields lẫn nested address object
  useEffect(() => {
    if (initialValues) {
      const address = initialValues.address;
      form.setFieldsValue({
        name: initialValues.name,
        code: initialValues.code,
        countryCode: initialValues.countryCode,
        type: initialValues.type,
        notes: initialValues.notes,
        addressLine1: initialValues.addressLine1 ?? address?.line1,
        addressLine2: initialValues.addressLine2 ?? address?.line2,
        addressCity: initialValues.addressCity ?? address?.city,
        addressState: initialValues.addressState ?? address?.state,
        addressZipCode: initialValues.addressZipCode ?? address?.zipCode,
        addressCountry: initialValues.addressCountry ?? address?.country ?? initialValues.countryCode,
      });
    }
  }, [form, initialValues]);

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = (e.target.value ?? "").toUpperCase();
    const currentAddressCountry = form.getFieldValue("addressCountry");
    // Tự động điền quốc gia địa chỉ nếu người dùng chưa nhập hoặc đang trùng giá trị cũ
    if (!currentAddressCountry || currentAddressCountry === form.getFieldValue("countryCode")) {
      form.setFieldValue("addressCountry", nextVal);
    }
  };

  const handleFinish = (values: Record<string, unknown>) => {
    const payload: CreateTerminalRequest = {
      name: String(values.name ?? "").trim(),
      code: String(values.code ?? "").trim().toUpperCase(),
      countryCode: String(values.countryCode ?? "").trim().toUpperCase(),
      type: values.type as TerminalType,
      notes: values.notes ? String(values.notes).trim() : null,
      addressLine1: String(values.addressLine1 ?? "").trim(),
      addressLine2: values.addressLine2 ? String(values.addressLine2).trim() : null,
      addressCity: String(values.addressCity ?? "").trim(),
      addressState: String(values.addressState ?? "").trim(),
      addressZipCode: String(values.addressZipCode ?? "").trim(),
      addressCountry: String(values.addressCountry ?? "").trim().toUpperCase(),
    };
    onFinish?.(payload);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      validateTrigger="onBlur"
      scrollToFirstError
      onFinish={handleFinish}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Nhóm 1: Thông tin chung */}
        <FormSection
          id="general-info"
          title="Thông tin chung"
          description="Định danh cảng / bến bãi, phân loại và mã UN/LOCODE"
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tên cảng / bến bãi"
                name="name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên cảng / bến bãi" },
                  { max: 200, message: "Tên không được vượt quá 200 ký tự" },
                ]}
              >
                <Input placeholder="Ví dụ: Cat Lai Port" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Phân loại bến bãi"
                name="type"
                rules={[{ required: true, message: "Vui lòng chọn loại bến bãi" }]}
              >
                <Select
                  placeholder="Chọn phân loại bến bãi"
                  options={TERMINAL_TYPE_OPTIONS}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Mã UN/LOCODE (Code)"
                name="code"
                normalize={(val: unknown) => (typeof val === "string" ? val.toUpperCase() : val)}
                rules={[
                  { required: true, message: "Vui lòng nhập mã UN/LOCODE" },
                  {
                    pattern: /^[A-Za-z]{5}$/,
                    message: "Mã UN/LOCODE phải đúng 5 chữ cái (Ví dụ: VNSGN, USNYC)",
                  },
                ]}
                extra="Mã chuẩn 5 chữ cái, tự động in hoa"
              >
                <Input
                  maxLength={5}
                  placeholder="Ví dụ: VNSGN"
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Mã quốc gia (Country Code)"
                name="countryCode"
                normalize={(val: unknown) => (typeof val === "string" ? val.toUpperCase() : val)}
                rules={[
                  { required: true, message: "Vui lòng nhập mã quốc gia" },
                  {
                    pattern: /^[A-Za-z]{2}$/,
                    message: "Mã quốc gia phải đúng 2 chữ cái ISO (Ví dụ: VN, US)",
                  },
                ]}
                extra="Mã chuẩn 2 chữ cái (ISO 3166-1 alpha-2)"
              >
                <Input
                  maxLength={2}
                  placeholder="Ví dụ: VN"
                  style={{ textTransform: "uppercase" }}
                  onChange={handleCountryCodeChange}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="Ghi chú" name="notes">
                <Input.TextArea
                  rows={3}
                  placeholder="Ghi chú thêm về cổng nhận cont, quy định giờ giấc..."
                />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        {/* Nhóm 2: Địa chỉ */}
        <FormSection
          id="address-info"
          title="Địa chỉ bến bãi"
          description="Địa chỉ chi tiết phục vụ điều phối và dẫn đường phương tiện"
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Địa chỉ dòng 1"
                name="addressLine1"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ dòng 1" }]}
              >
                <Input placeholder="Số nhà, tên đường, khu vực cảng..." />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Địa chỉ dòng 2 (tùy chọn)" name="addressLine2">
                <Input placeholder="Cổng số, cầu tàu, phân khu..." />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Thành phố / Quận huyện"
                name="addressCity"
                rules={[{ required: true, message: "Vui lòng nhập thành phố / quận huyện" }]}
              >
                <Input placeholder="Ví dụ: Ho Chi Minh City, Newark" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Tỉnh / Bang"
                name="addressState"
                rules={[{ required: true, message: "Vui lòng nhập tỉnh / bang" }]}
              >
                <Input placeholder="Ví dụ: SG, NJ" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Mã bưu chính (Zip/Postal Code)"
                name="addressZipCode"
                rules={[{ required: true, message: "Vui lòng nhập mã bưu chính" }]}
              >
                <Input placeholder="Ví dụ: 700000, 07114" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Quốc gia"
                name="addressCountry"
                normalize={(val: unknown) => (typeof val === "string" ? val.toUpperCase() : val)}
                rules={[{ required: true, message: "Vui lòng nhập quốc gia" }]}
                extra="Mã quốc gia theo địa chỉ (Ví dụ: VN, US)"
              >
                <Input
                  maxLength={2}
                  placeholder="Ví dụ: VN"
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>
      </div>

      <FormFooterBar
        onCancel={onCancel}
        saveButtonProps={saveButtonProps}
        saveText={
          saveButtonProps?.children ??
          (isEdit ? "Cập nhật bến bãi" : "Tạo mới bến bãi")
        }
      />
    </Form>
  );
};
