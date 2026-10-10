import {
  Col,
  Form,
  type FormInstance,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  type ButtonProps,
} from "antd";
import { useTranslation } from "react-i18next";
import { EntityPicker } from "@/components/EntityPicker";
import { FormFooterBar } from "@/forms/FormFooterBar";
import { FormSection } from "@/forms/FormSection";

export interface TruckFormProps {
  form: FormInstance;
  initialValues?: Record<string, unknown>;
  onFinish?: (values: Record<string, unknown>) => void;
  saveButtonProps?: ButtonProps;
  isEdit?: boolean;
  onCancel?: () => void;
}

const TRUCK_STATUS_OPTIONS = [
  { label: "Sẵn sàng (Available)", value: "available" },
  { label: "Đang vận hành (In Use)", value: "in_use" },
  { label: "Đang bảo trì (Maintenance)", value: "maintenance" },
  { label: "Ngừng hoạt động (Out of Service)", value: "out_of_service" },
];

const TRUCK_TYPE_OPTIONS = [
  { label: "Đầu kéo (Semi Truck)", value: "SEMI_TRUCK" },
  { label: "Xe sàn phẳng (Flatbed)", value: "FLATBED" },
  { label: "Xe thùng kín (Box Truck)", value: "BOX_TRUCK" },
  { label: "Xe bồn (Tanker)", value: "TANKER" },
  { label: "Xe đông lạnh (Reefer)", value: "REEFER" },
];

/**
 * TruckForm — Form thông số xe tải (7–15 trường) tuân thủ quy tắc:
 * 1. Trang riêng, 2 cột dọc (md={12}) trên lưới 24 cột.
 * 2. Chia 3 Card section rõ ràng: Thông số xe, Phân công tài xế, Tiêu chuẩn an toàn & ADR.
 * 3. Ô phụ thuộc ADR (phân lớp, biển cam) chỉ xuất hiện khi bật công tắc chứng chỉ ADR.
 * 4. Đơn vị tải trọng gắn trực tiếp vào ô nhập (addonAfter="kg").
 * 5. Thanh thao tác dính đáy (Sticky Footer).
 */
export const TruckForm = ({
  form,
  initialValues,
  onFinish,
  saveButtonProps,
  isEdit = false,
  onCancel,
}: TruckFormProps) => {
  const { t } = useTranslation();
  const isAdrCertified = Form.useWatch("adrEquipmentIsAdrCertified", form);

  const currentYear = new Date().getFullYear();

  const defaultValues = {
    status: "available",
    type: "SEMI_TRUCK",
    vehicleCapacity: 20000,
    isHazmatPlacarded: false,
    adrEquipmentIsAdrCertified: false,
    ...initialValues,
  };

  return (
    <Form
      form={form}
      layout="vertical"
      validateTrigger="onBlur"
      scrollToFirstError
      initialValues={defaultValues}
      onFinish={onFinish}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Section 1: Thông số & Định danh phương tiện */}
        <FormSection
          title="Thông số & Định danh phương tiện"
          description="Mã số xe, loại phương tiện, tải trọng và thông số đăng kiểm"
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Số hiệu xe / Mã xe"
                name="number"
                rules={[{ required: true, message: "Vui lòng nhập số hiệu xe" }]}
              >
                <Input placeholder="Ví dụ: TRK-102" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Loại phương tiện"
                name="type"
                rules={[{ required: true, message: "Vui lòng chọn loại xe" }]}
              >
                <Select options={TRUCK_TYPE_OPTIONS} placeholder="Chọn loại xe" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Trạng thái vận hành"
                name="status"
                rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
              >
                <Select options={TRUCK_STATUS_OPTIONS} placeholder="Chọn trạng thái" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Tải trọng xe"
                name="vehicleCapacity"
                rules={[{ required: true, message: "Vui lòng nhập tải trọng" }]}
              >
                <InputNumber
                  min={0}
                  addonAfter="kg"
                  style={{ width: "100%" }}
                  placeholder="20000"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Hãng sản xuất" name="make">
                <Input placeholder="Ví dụ: Freightliner" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Dòng xe (Model)" name="model">
                <Input placeholder="Ví dụ: Cascadia" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Năm sản xuất" name="year">
                <InputNumber
                  min={1990}
                  max={currentYear + 1}
                  style={{ width: "100%" }}
                  placeholder={String(currentYear)}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Số khung (VIN)" name="vin">
                <Input
                  placeholder="17 ký tự VIN"
                  maxLength={17}
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Biển số đăng ký" name="licensePlate">
                <Input placeholder="Ví dụ: 29H-12345" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Bang / Tỉnh cấp biển" name="licensePlateState">
                <Input placeholder="TX" maxLength={50} />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        {/* Section 2: Phân công tài xế */}
        <FormSection
          title="Phân công tài xế phụ trách"
          description="Thiết lập tài xế chính và tài xế phụ gắn liền với phương tiện"
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item label="Tài xế chính" name="mainDriverId">
                <EntityPicker
                  resource="drivers"
                  placeholder="Tìm và chọn tài xế chính"
                  labelFormat={(r) =>
                    r.firstName
                      ? `${r.firstName} ${r.lastName ?? ""} (${r.email ?? r.id})`
                      : String(r.email ?? r.id)
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Tài xế phụ" name="secondaryDriverId">
                <EntityPicker
                  resource="drivers"
                  placeholder="Tìm và chọn tài xế phụ (tùy chọn)"
                  labelFormat={(r) =>
                    r.firstName
                      ? `${r.firstName} ${r.lastName ?? ""} (${r.email ?? r.id})`
                      : String(r.email ?? r.id)
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        {/* Section 3: Tiêu chuẩn an toàn & Chứng chỉ ADR */}
        <FormSection
          title="Tiêu chuẩn an toàn & Chứng chỉ ADR"
          description="Biển cảnh báo hàng nguy hiểm và thiết bị tiêu chuẩn chuyên chở hóa chất"
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Biển cảnh báo hàng nguy hiểm (Placard)"
                name="isHazmatPlacarded"
                valuePropName="checked"
                extra="Phương tiện được trang bị khung treo biển cảnh báo nguy hiểm"
              >
                <Switch checkedChildren="Có" unCheckedChildren="Không" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Chứng chỉ thiết bị ADR"
                name="adrEquipmentIsAdrCertified"
                valuePropName="checked"
                extra="Bật nếu phương tiện đạt tiêu chuẩn vận chuyển hàng nguy hiểm ADR"
              >
                <Switch checkedChildren="Đạt" unCheckedChildren="Không" />
              </Form.Item>
            </Col>

            {/* Ô phụ thuộc chỉ hiển thị khi bật chứng chỉ ADR */}
            {isAdrCertified && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Phân lớp ADR được phép chở"
                    name="adrEquipmentAllowedClasses"
                    extra="Các lớp hàng nguy hiểm được cấp phép, ví dụ: Class 1, 3, 8"
                  >
                    <Input placeholder="Ví dụ: Class 3, 4.1, 8" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Số biển cam ADR (Orange Plate)"
                    name="adrEquipmentOrangePlateNumber"
                    extra="Số hiệu trên bảng biển màu cam theo quy định ADR"
                  >
                    <Input placeholder="Ví dụ: 33/1203" />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
        </FormSection>
      </div>

      <FormFooterBar
        onCancel={onCancel}
        saveButtonProps={saveButtonProps}
        saveText={saveButtonProps?.children ?? (isEdit ? t("actions.save", "Cập nhật phương tiện") : t("actions.create", "Tạo mới phương tiện"))}
      />
    </Form>
  );
};
