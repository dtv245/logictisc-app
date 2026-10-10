import {
  Col,
  Collapse,
  Form,
  type FormInstance,
  Input,
  Row,
  Segmented,
  Switch,
  type ButtonProps,
} from "antd";
import { useTranslation } from "react-i18next";
import { AddressFields } from "@/forms/AddressFields";
import { FormFooterBar } from "@/forms/FormFooterBar";
import { FormSection } from "@/forms/FormSection";

export interface CustomerFormProps {
  form: FormInstance;
  initialValues?: Record<string, unknown>;
  onFinish?: (values: Record<string, unknown>) => void;
  saveButtonProps?: ButtonProps;
  isEdit?: boolean;
  isModal?: boolean;
  onCancel?: () => void;
}

const CUSTOMER_STATUS_OPTIONS = [
  { label: "Đang hoạt động (Active)", value: "active" },
  { label: "Ngừng hoạt động (Inactive)", value: "inactive" },
];

/**
 * CustomerForm — Form thông tin khách hàng tuân thủ quy tắc:
 * 1. ≤ 6 ô nhập chính: Tên, Trạng thái, Email, Điện thoại, MST, Miễn VAT.
 * 2. 1 cột dọc (Form layout="vertical") gọn gàng, phù hợp cả Modal/Drawer lẫn trang riêng.
 * 3. Chọn 2 giá trị dùng `Segmented`.
 * 4. Ô địa chỉ & ghi chú mở rộng được thu gọn (Collapse).
 */
export const CustomerForm = ({
  form,
  initialValues,
  onFinish,
  saveButtonProps,
  isEdit = false,
  isModal = false,
  onCancel,
}: CustomerFormProps) => {
  const { t } = useTranslation();

  const defaultValues = {
    status: "active",
    isVatExempt: false,
    ...initialValues,
  };

  const formContent = (
    <>
      <FormSection
        title="Thông tin cơ bản"
        description="Thông tin định danh và liên hệ chính của đối tác khách hàng"
      >
        <Row gutter={[24, 0]}>
          <Col span={24}>
            <Form.Item
              label="Tên khách hàng / Doanh nghiệp"
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập tên khách hàng" }]}
            >
              <Input placeholder="Ví dụ: Công ty TNHH Tiếp vận Toàn Cầu" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Trạng thái hợp tác"
              name="status"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Segmented block options={CUSTOMER_STATUS_OPTIONS} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              label="Email liên hệ"
              name="email"
              rules={[{ type: "email", message: "Email không đúng định dạng" }]}
            >
              <Input placeholder="billing@example.com" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Số điện thoại" name="phone">
              <Input placeholder="+1 (555) 019-2834" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Mã số thuế / Tax ID" name="taxId">
              <Input placeholder="Ví dụ: TX-98234-9" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              label="Miễn thuế VAT"
              name="isVatExempt"
              valuePropName="checked"
              extra="Bật nếu khách hàng thuộc đối tượng miễn trừ thuế suất"
            >
              <Switch checkedChildren="Có" unCheckedChildren="Không" />
            </Form.Item>
          </Col>
        </Row>
      </FormSection>

      <FormSection
        title="Địa chỉ & ghi chú mở rộng"
        description="Địa chỉ trụ sở và lưu ý hợp đồng (tùy chọn)"
      >
        <Collapse
          ghost
          items={[
            {
              key: "address",
              label: <span style={{ color: "#666" }}>▸ Chi tiết địa chỉ trụ sở & ghi chú</span>,
              children: (
                <>
                  <AddressFields prefix="address" includeCoordinates={false} required={false} />
                  <Form.Item label="Ghi chú thêm" name="notes">
                    <Input.TextArea rows={3} placeholder="Điều khoản thanh toán, người nhận hóa đơn..." />
                  </Form.Item>
                </>
              ),
            },
          ]}
        />
      </FormSection>
    </>
  );

  return (
    <Form
      form={form}
      layout="vertical"
      validateTrigger="onBlur"
      scrollToFirstError
      initialValues={defaultValues}
      onFinish={onFinish}
    >
      <div style={{ maxWidth: 840, margin: "0 auto" }}>{formContent}</div>

      {!isModal && (
        <FormFooterBar
          onCancel={onCancel}
          saveButtonProps={saveButtonProps}
          saveText={saveButtonProps?.children ?? (isEdit ? t("actions.save", "Cập nhật khách hàng") : t("actions.create", "Tạo khách hàng"))}
        />
      )}
    </Form>
  );
};
