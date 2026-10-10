import {
  Anchor,
  Col,
  Collapse,
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
import { AddressFields } from "@/forms/AddressFields";
import { FormFooterBar } from "@/forms/FormFooterBar";
import { FormSection } from "@/forms/FormSection";

export interface LoadFormProps {
  form: FormInstance;
  initialValues?: Record<string, unknown>;
  onFinish?: (values: Record<string, unknown>) => void;
  saveButtonProps?: ButtonProps;
  isEdit?: boolean;
  onCancel?: () => void;
}

const LOAD_STATUS_OPTIONS = [
  { label: "Bản nháp (Draft)", value: "draft" },
  { label: "Đã phân công (Dispatched)", value: "dispatched" },
  { label: "Đã lấy hàng (Picked Up)", value: "picked_up" },
  { label: "Đã giao hàng (Delivered)", value: "delivered" },
  { label: "Đã hủy (Cancelled)", value: "cancelled" },
];

const LOAD_TYPE_OPTIONS = [
  { label: "Tiêu chuẩn (Standard)", value: "STANDARD" },
  { label: "Hỏa tốc (Expedited)", value: "EXPEDITED" },
  { label: "Hàng lạnh (Reefer)", value: "REEFER" },
  { label: "Xe sàn phẳng (Flatbed)", value: "FLATBED" },
];

/**
 * LoadForm — Form quản lý thông tin đơn hàng (~40 trường) tuân thủ bộ quy tắc:
 * 1. Nhóm theo cách người dùng nghĩ (Thông tin chung, Lấy hàng, Giao hàng, Hàng hóa, Cước & xe, Tham chiếu).
 * 2. Ô phụ thuộc (Hazmat) chỉ hiện khi bật switch.
 * 3. Mục lục Anchor bám sát bên phải giúp điều hướng tức thì.
 * 4. Tái sử dụng AddressFields cho cả 2 đầu lấy/giao.
 * 5. Thanh thao tác dính đáy (Sticky Footer).
 */
export const LoadForm = ({
  form,
  initialValues,
  onFinish,
  saveButtonProps,
  isEdit = false,
  onCancel,
}: LoadFormProps) => {
  const { t } = useTranslation();
  const isHazmat = Form.useWatch("isHazmat", form);

  const defaultValues = {
    isInProximity: false,
    deliveryCostCurrency: "USD",
    isHazmat: false,
    status: "draft",
    type: "STANDARD",
    source: "MANUAL",
    distance: 0,
    deliveryCostAmount: 0,
    originAddressCountry: "USA",
    destinationAddressCountry: "USA",
    originLocationLatitude: 0,
    originLocationLongitude: 0,
    destinationLocationLatitude: 0,
    destinationLocationLongitude: 0,
    ...initialValues,
  };

  const anchorItems = [
    { key: "general", href: "#general", title: "1. Thông tin chung" },
    { key: "pickup", href: "#pickup", title: "2. Điểm lấy hàng" },
    { key: "delivery", href: "#delivery", title: "3. Điểm giao hàng" },
    { key: "cargo-safety", href: "#cargo-safety", title: "4. Hàng hóa & an toàn" },
    { key: "charges-assignment", href: "#charges-assignment", title: "5. Cước & phân công" },
    { key: "external-reference", href: "#external-reference", title: "6. Tham chiếu ngoài" },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      validateTrigger="onBlur"
      scrollToFirstError
      initialValues={defaultValues}
      onFinish={onFinish}
    >
      {/* Các trường kỹ thuật ẩn */}
      <Form.Item name="isInProximity" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="deliveryCostCurrency" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="expectedVersion" hidden>
        <Input />
      </Form.Item>

      <Row gutter={[24, 0]}>
        {/* Vùng nội dung form chính */}
        <Col xs={24} lg={18} xl={19}>
          {/* Section 1: Thông tin chung */}
          <FormSection
            id="general"
            title="Thông tin chung"
            description="Tên đơn hàng, khách hàng đối tác và phân loại nghiệp vụ"
          >
            <Row gutter={[24, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Tên đơn hàng"
                  name="name"
                  rules={[{ required: true, message: "Vui lòng nhập tên đơn hàng" }]}
                >
                  <Input placeholder="Ví dụ: Đơn chuyển hàng điện tử Dallas → Austin" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Khách hàng"
                  name="customerId"
                  rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
                >
                  <EntityPicker
                    resource="customers"
                    placeholder="Tìm và chọn khách hàng"
                    labelFormat={(r) => r.name || String(r.id)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Loại đơn hàng"
                  name="type"
                  rules={[{ required: true, message: "Vui lòng chọn loại đơn" }]}
                >
                  <Select options={LOAD_TYPE_OPTIONS} placeholder="Chọn loại đơn hàng" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Trạng thái đơn hàng"
                  name="status"
                  rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                >
                  <Select options={LOAD_STATUS_OPTIONS} placeholder="Chọn trạng thái" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Ghi chú đơn hàng" name="notes">
                  <Input.TextArea
                    rows={3}
                    placeholder="Nhập ghi chú yêu cầu giao nhận, lưu ý hàng hóa..."
                  />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          {/* Section 2: Điểm lấy hàng */}
          <FormSection
            id="pickup"
            title="Điểm lấy hàng (Origin)"
            description="Địa chỉ nơi nhận hàng, trạm xuất phát và ngày hẹn lấy hàng"
          >
            <AddressFields
              prefix="originAddress"
              coordinatePrefix="originLocation"
              includeCoordinates={true}
              includeTerminal={true}
              terminalName="originTerminalId"
              terminalLabel="Trạm xuất phát"
              dateFieldName="requestedPickupDate"
              dateLabel="Ngày hẹn lấy hàng"
            />
          </FormSection>

          {/* Section 3: Điểm giao hàng */}
          <FormSection
            id="delivery"
            title="Điểm giao hàng (Destination)"
            description="Địa chỉ nơi giao hàng, trạm đích và ngày hẹn giao hàng"
          >
            <AddressFields
              prefix="destinationAddress"
              coordinatePrefix="destinationLocation"
              includeCoordinates={true}
              includeTerminal={true}
              terminalName="destinationTerminalId"
              terminalLabel="Trạm đích"
              dateFieldName="requestedDeliveryDate"
              dateLabel="Ngày hẹn giao hàng"
            />
          </FormSection>

          {/* Section 4: Hàng hóa & an toàn */}
          <FormSection
            id="cargo-safety"
            title="Hàng hóa & an toàn"
            description="Quy chuẩn an toàn, hàng hóa nguy hiểm (Hazmat) và quy cách container"
          >
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  label="Hàng nguy hiểm (Hazmat)"
                  name="isHazmat"
                  valuePropName="checked"
                  extra="Bật nếu đơn hàng chứa chất độc hại, dễ cháy hoặc hàng hóa thuộc phân loại nguy hiểm"
                >
                  <Switch checkedChildren="Có" unCheckedChildren="Không" />
                </Form.Item>
              </Col>
              {isHazmat && (
                <>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Phân loại nguy hiểm (Hazmat Class)"
                      name="hazmatClass"
                      rules={[{ required: true, message: "Vui lòng nhập phân loại nguy hiểm" }]}
                      extra="Ví dụ: Class 3 (Chất lỏng dễ cháy), Class 8 (Chất ăn mòn)"
                    >
                      <Input placeholder="Ví dụ: Class 3" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Mã số nhận diện UN (UN Number)"
                      name="unNumber"
                      rules={[{ required: true, message: "Vui lòng nhập mã UN" }]}
                      extra="Mã định danh 4 chữ số do Liên Hợp Quốc cấp"
                    >
                      <Input placeholder="Ví dụ: UN1203" />
                    </Form.Item>
                  </Col>
                </>
              )}
              <Col xs={24} md={12}>
                <Form.Item label="Container gắn kèm" name="containerId">
                  <EntityPicker
                    resource="containers"
                    placeholder="Chọn container (nếu có)"
                    labelFormat={(r) => (r.number ? String(r.number) : String(r.id))}
                  />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          {/* Section 5: Cước & phân công */}
          <FormSection
            id="charges-assignment"
            title="Cước phí & phân công"
            description="Chi phí vận chuyển, cự ly và điều phối xe / tài xế ban đầu"
          >
            <Row gutter={[24, 0]}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Cước phí vận chuyển"
                  name="deliveryCostAmount"
                  rules={[{ required: true, message: "Vui lòng nhập cước phí" }]}
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    addonAfter="USD"
                    style={{ width: "100%" }}
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Cự ly vận chuyển"
                  name="distance"
                  rules={[{ required: true, message: "Vui lòng nhập khoảng cách" }]}
                >
                  <InputNumber
                    min={0}
                    precision={1}
                    addonAfter="mi"
                    style={{ width: "100%" }}
                    placeholder="0.0"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item label="Xe phân công" name="assignedTruckId">
                  <EntityPicker
                    resource="trucks"
                    placeholder="Chọn xe"
                    labelFormat={(r) => (r.number ? `${r.number} (${r.licensePlate ?? "Xe"})` : String(r.id))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={12}>
                <Form.Item label="Điều phối viên" name="assignedDispatcherId">
                  <EntityPicker
                    resource="employees"
                    placeholder="Chọn điều phối viên"
                    labelFormat={(r) =>
                      r.name ?? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() ?? String(r.id)
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          {/* Section 6: Tham chiếu ngoài (Thu gọn) */}
          <FormSection
            id="external-reference"
            title="Tham chiếu & tích hợp ngoài"
            description="Mã liên kết nguồn ngoài, hệ thống broker hoặc đối tác tích hợp (tùy chọn)"
          >
            <Collapse
              ghost
              items={[
                {
                  key: "ext",
                  label: <span style={{ color: "#666" }}>▸ Mở rộng thông tin tích hợp nguồn ngoài</span>,
                  children: (
                    <Row gutter={[24, 0]}>
                      <Col xs={24} md={12}>
                        <Form.Item label="Nguồn đơn hàng" name="source">
                          <Input placeholder="Ví dụ: MANUAL, EDI, DAT, TRUCKSTOP" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label="Nhà cung cấp nguồn ngoài" name="externalSourceProvider">
                          <Input placeholder="Ví dụ: BrokerX / Partner" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label="Mã định danh nguồn ngoài" name="externalSourceId">
                          <Input placeholder="ID đơn hàng từ hệ thống ngoài" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label="Mã tham chiếu broker" name="externalBrokerReference">
                          <Input placeholder="Số tham chiếu hợp đồng broker" />
                        </Form.Item>
                      </Col>
                    </Row>
                  ),
                },
              ]}
            />
          </FormSection>
        </Col>

        {/* Mục lục Anchor bên phải (cố định trên màn hình lớn) */}
        <Col xs={0} lg={6} xl={5}>
          <div
            style={{
              position: "sticky",
              top: 88,
              padding: "16px",
              background: "#fff",
              borderRadius: 8,
              border: "1px solid #f0f0f0",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
              Mục lục biểu mẫu
            </div>
            <Anchor affix={false} offsetTop={80} items={anchorItems} />
          </div>
        </Col>
      </Row>

      {/* Thanh thao tác dính đáy */}
      <FormFooterBar
        onCancel={onCancel}
        saveButtonProps={saveButtonProps}
        saveText={isEdit ? t("actions.save", "Cập nhật đơn hàng") : t("actions.create", "Tạo đơn hàng")}
      />
    </Form>
  );
};
