// TEMP: Authoritative fieldKey to form field mapping for AI Gap navigation.

export interface FieldMappingInfo {
  fieldKey: string;
  formField: string;
  label: string;
  sectionId?: string;
}

export const FIELD_KEY_TO_FORM_MAP: Record<string, FieldMappingInfo> = {
  name: {
    fieldKey: "name",
    formField: "name",
    label: "Tên đơn hàng",
    sectionId: "general",
  },
  customerId: {
    fieldKey: "customerId",
    formField: "customerId",
    label: "Khách hàng",
    sectionId: "general",
  },
  type: {
    fieldKey: "type",
    formField: "type",
    label: "Loại đơn hàng",
    sectionId: "general",
  },
  notes: {
    fieldKey: "notes",
    formField: "notes",
    label: "Ghi chú đơn hàng",
    sectionId: "general",
  },
  requestedPickupDate: {
    fieldKey: "requestedPickupDate",
    formField: "requestedPickupDate",
    label: "Ngày hẹn lấy hàng",
    sectionId: "pickup",
  },
  pickupDate: {
    fieldKey: "pickupDate",
    formField: "requestedPickupDate",
    label: "Ngày hẹn lấy hàng",
    sectionId: "pickup",
  },
  "originAddress.line1": {
    fieldKey: "originAddress.line1",
    formField: "originAddress_line1",
    label: "Địa chỉ lấy hàng",
    sectionId: "pickup",
  },
  originAddress: {
    fieldKey: "originAddress",
    formField: "originAddress_line1",
    label: "Địa chỉ lấy hàng",
    sectionId: "pickup",
  },
  originTerminalId: {
    fieldKey: "originTerminalId",
    formField: "originTerminalId",
    label: "Trạm xuất phát",
    sectionId: "pickup",
  },
  requestedDeliveryDate: {
    fieldKey: "requestedDeliveryDate",
    formField: "requestedDeliveryDate",
    label: "Ngày hẹn giao hàng",
    sectionId: "delivery",
  },
  deliveryDate: {
    fieldKey: "deliveryDate",
    formField: "requestedDeliveryDate",
    label: "Ngày hẹn giao hàng",
    sectionId: "delivery",
  },
  "destinationAddress.line1": {
    fieldKey: "destinationAddress.line1",
    formField: "destinationAddress_line1",
    label: "Địa chỉ giao hàng",
    sectionId: "delivery",
  },
  destinationAddress: {
    fieldKey: "destinationAddress",
    formField: "destinationAddress_line1",
    label: "Địa chỉ giao hàng",
    sectionId: "delivery",
  },
  destinationTerminalId: {
    fieldKey: "destinationTerminalId",
    formField: "destinationTerminalId",
    label: "Trạm đích",
    sectionId: "delivery",
  },
  isHazmat: {
    fieldKey: "isHazmat",
    formField: "isHazmat",
    label: "Hàng nguy hiểm (Hazmat)",
    sectionId: "cargo-safety",
  },
  hazmatClass: {
    fieldKey: "hazmatClass",
    formField: "hazmatClass",
    label: "Phân loại nguy hiểm",
    sectionId: "cargo-safety",
  },
  unNumber: {
    fieldKey: "unNumber",
    formField: "unNumber",
    label: "Mã số nhận diện UN",
    sectionId: "cargo-safety",
  },
  containerId: {
    fieldKey: "containerId",
    formField: "containerId",
    label: "Container",
    sectionId: "cargo-safety",
  },
  grossWeight: {
    fieldKey: "grossWeight",
    formField: "grossWeight",
    label: "Khối lượng hàng hóa",
    sectionId: "cargo-safety",
  },
  weight: {
    fieldKey: "weight",
    formField: "grossWeight",
    label: "Khối lượng hàng hóa",
    sectionId: "cargo-safety",
  },
  // GapRuleEngine backend field names
  originLocationLatitude: {
    fieldKey: "originLocationLatitude",
    formField: "originAddress_line1",
    label: "Tọa độ điểm lấy hàng (Latitude)",
    sectionId: "pickup",
  },
  originLocationLongitude: {
    fieldKey: "originLocationLongitude",
    formField: "originAddress_line1",
    label: "Tọa độ điểm lấy hàng (Longitude)",
    sectionId: "pickup",
  },
  destinationLocationLatitude: {
    fieldKey: "destinationLocationLatitude",
    formField: "destinationAddress_line1",
    label: "Tọa độ điểm giao hàng (Latitude)",
    sectionId: "delivery",
  },
  destinationLocationLongitude: {
    fieldKey: "destinationLocationLongitude",
    formField: "destinationAddress_line1",
    label: "Tọa độ điểm giao hàng (Longitude)",
    sectionId: "delivery",
  },
  originAddressCity: {
    fieldKey: "originAddressCity",
    formField: "originAddress_line1",
    label: "Thành phố lấy hàng",
    sectionId: "pickup",
  },
  originAddressState: {
    fieldKey: "originAddressState",
    formField: "originAddress_line1",
    label: "Bang/tỉnh lấy hàng",
    sectionId: "pickup",
  },
  destinationAddressCity: {
    fieldKey: "destinationAddressCity",
    formField: "destinationAddress_line1",
    label: "Thành phố giao hàng",
    sectionId: "delivery",
  },
  destinationAddressState: {
    fieldKey: "destinationAddressState",
    formField: "destinationAddress_line1",
    label: "Bang/tỉnh giao hàng",
    sectionId: "delivery",
  },
  deliveryCostAmount: {
    fieldKey: "deliveryCostAmount",
    formField: "deliveryCostAmount",
    label: "Giá cước/doanh thu",
    sectionId: "financial",
  },
  distance: {
    fieldKey: "distance",
    formField: "distance",
    label: "Khoảng cách vận chuyển",
    sectionId: "general",
  },
  assignedDispatcher: {
    fieldKey: "assignedDispatcher",
    formField: "assignedDispatcher",
    label: "Người điều phối phụ trách",
    sectionId: "general",
  },
};

/**
 * Trả về thông tin trường form tương ứng với fieldKey, hoặc undefined nếu chưa ánh xạ.
 */
export function getFieldMapping(fieldKey: string): FieldMappingInfo | undefined {
  if (!fieldKey) return undefined;
  return FIELD_KEY_TO_FORM_MAP[fieldKey];
}
