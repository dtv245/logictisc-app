import { Col, Collapse, DatePicker, Form, Input, InputNumber, Row } from "antd";
import type { ReactNode } from "react";
import { EntityPicker } from "@/components/EntityPicker";

export interface AddressFieldsProps {
  /**
   * Tiền tố cho các field địa chỉ, ví dụ "originAddress" hoặc "destinationAddress".
   * Sẽ sinh ra: [prefix]Line1, [prefix]Line2, [prefix]City, [prefix]State, [prefix]ZipCode, [prefix]Country
   */
  prefix: string;
  required?: boolean;
  /** Tiền tố cho tọa độ GPS, ví dụ "originLocation" hoặc "destinationLocation" */
  coordinatePrefix?: string;
  includeCoordinates?: boolean;
  /** Cho phép chọn Terminal trung chuyển gắn kèm */
  includeTerminal?: boolean;
  terminalName?: string;
  terminalLabel?: ReactNode;
  /** Cho phép chọn ngày đón/giao hàng cùng khối địa chỉ */
  dateFieldName?: string;
  dateLabel?: ReactNode;
  dateRequired?: boolean;
}

/**
 * AddressFields — Khối trường địa chỉ tái sử dụng cho Lấy hàng (Origin),
 * Giao hàng (Destination), Khách hàng, Trạm trung chuyển.
 * Áp dụng lưới 24 cột AntD, gom tọa độ kỹ thuật vào phần thu gọn.
 */
export const AddressFields = ({
  prefix,
  required = true,
  coordinatePrefix,
  includeCoordinates = true,
  includeTerminal = false,
  terminalName,
  terminalLabel = "Trạm trung chuyển (Terminal)",
  dateFieldName,
  dateLabel = "Ngày thực hiện",
  dateRequired = false,
}: AddressFieldsProps) => {
  const line1Name = `${prefix}Line1`;
  const line2Name = `${prefix}Line2`;
  const cityName = `${prefix}City`;
  const stateName = `${prefix}State`;
  const zipCodeName = `${prefix}ZipCode`;
  const countryName = `${prefix}Country`;

  const latName = coordinatePrefix ? `${coordinatePrefix}Latitude` : undefined;
  const lngName = coordinatePrefix ? `${coordinatePrefix}Longitude` : undefined;

  return (
    <Row gutter={[24, 0]}>
      {/* Hàng 1: Địa chỉ dòng 1 (chiếm cả hàng) */}
      <Col span={24}>
        <Form.Item
          label="Địa chỉ dòng 1"
          name={line1Name}
          rules={required ? [{ required: true, message: "Vui lòng nhập địa chỉ" }] : undefined}
          extra="Số nhà, tên đường"
        >
          <Input placeholder="Ví dụ: 123 Main Street" />
        </Form.Item>
      </Col>

      {/* Hàng 2: Địa chỉ dòng 2 (tùy chọn) */}
      <Col span={24}>
        <Form.Item label="Địa chỉ dòng 2" name={line2Name} extra="Tòa nhà, tầng, căn hộ (nếu có)">
          <Input placeholder="Ví dụ: Suite 400 / Building B" />
        </Form.Item>
      </Col>

      {/* Hàng 3: Thành phố, Bang, ZIP, Quốc gia */}
      <Col xs={24} sm={12} md={8}>
        <Form.Item
          label="Thành phố"
          name={cityName}
          rules={required ? [{ required: true, message: "Vui lòng nhập thành phố" }] : undefined}
        >
          <Input placeholder="Ví dụ: Dallas" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item
          label="Bang / Tỉnh"
          name={stateName}
          rules={required ? [{ required: true, message: "Vui lòng nhập bang/tỉnh" }] : undefined}
        >
          <Input placeholder="Ví dụ: TX" maxLength={50} />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item
          label="Mã bưu chính (ZIP)"
          name={zipCodeName}
          rules={required ? [{ required: true, message: "Vui lòng nhập mã bưu chính" }] : undefined}
        >
          <Input placeholder="Ví dụ: 75001" maxLength={20} />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item
          label="Quốc gia"
          name={countryName}
          rules={required ? [{ required: true, message: "Vui lòng nhập quốc gia" }] : undefined}
        >
          <Input placeholder="Ví dụ: USA" />
        </Form.Item>
      </Col>

      {/* Ngày đi kèm (Lấy hàng / Giao hàng) */}
      {dateFieldName && (
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            label={dateLabel}
            name={dateFieldName}
            rules={dateRequired ? [{ required: true, message: `Vui lòng chọn ${String(dateLabel)}` }] : undefined}
          >
            <DatePicker showTime style={{ width: "100%" }} placeholder="Chọn ngày & giờ" />
          </Form.Item>
        </Col>
      )}

      {/* Terminal gắn kèm */}
      {includeTerminal && terminalName && (
        <Col xs={24} sm={12} md={8}>
          <Form.Item label={terminalLabel} name={terminalName}>
            <EntityPicker
              resource="terminals"
              placeholder="Chọn trạm trung chuyển (nếu có)"
              labelFormat={(r) => (r.name ? `${r.name} (${r.code ?? ""})` : String(r.id ?? ""))}
            />
          </Form.Item>
        </Col>
      )}

      {/* Tọa độ GPS thu gọn (Kỹ thuật/Hệ thống) */}
      {includeCoordinates && latName && lngName && (
        <Col span={24} style={{ marginTop: 8, marginBottom: 16 }}>
          <Collapse
            ghost
            size="small"
            items={[
              {
                key: "coordinates",
                label: <span style={{ color: "#666", fontSize: 13 }}>▸ Tọa độ GPS (Vĩ độ / Kinh độ - tùy chọn)</span>,
                children: (
                  <Row gutter={[16, 0]}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Vĩ độ (Latitude)"
                        name={latName}
                        rules={required ? [{ required: true, message: "Vui lòng nhập vĩ độ" }] : undefined}
                      >
                        <InputNumber
                          style={{ width: "100%" }}
                          min={-90}
                          max={90}
                          precision={6}
                          placeholder="0.000000"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Kinh độ (Longitude)"
                        name={lngName}
                        rules={required ? [{ required: true, message: "Vui lòng nhập kinh độ" }] : undefined}
                      >
                        <InputNumber
                          style={{ width: "100%" }}
                          min={-180}
                          max={180}
                          precision={6}
                          placeholder="0.000000"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
            ]}
          />
        </Col>
      )}
    </Row>
  );
};
