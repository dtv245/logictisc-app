import React from "react";
import { Tag, Tooltip } from "antd";
import { useTranslation } from "react-i18next";

export interface RejectionCodeInfo {
  label: string;
  description: string;
  color?: string;
}

/**
 * Bảng ánh xạ mã từ chối (rejectionCodes) sang tiếng Việt dễ hiểu, có giải thích chi tiết.
 */
const REJECTION_CODE_MAP: Record<string, RejectionCodeInfo> = {
  // Lỗi ràng buộc cứng & Ngữ cảnh
  INVALID_OPTIMIZATION_CONTEXT: {
    label: "Ngữ cảnh không hợp lệ",
    description: "Ngữ cảnh tối ưu thiếu mục tiêu, tài xế, xe hoặc khung thời gian 72h không hợp lệ.",
    color: "volcano",
  },
  OPTIMIZATION_CONTEXT_UNAVAILABLE: {
    label: "Thiếu dữ liệu ngữ cảnh",
    description: "Không thể nạp thông tin thực thể hiện tại từ hệ thống.",
    color: "volcano",
  },
  OPTIMIZATION_STATUS_NOT_ALLOWED: {
    label: "Trạng thái không hợp lệ",
    description: "Trạng thái của Load/Trip không được phép điều phối (chỉ chấp nhận trước khi phát lệnh pre-dispatch).",
    color: "volcano",
  },
  OPTIMIZATION_CONTEXT_MISMATCH: {
    label: "Ngữ cảnh không khớp",
    description: "Sai lệch thông tin tenant hoặc Load và Trip không thuộc cùng một chuyến hàng.",
    color: "volcano",
  },
  OPTIMIZATION_ASSIGNMENT_CONFLICT: {
    label: "Xung đột phân công",
    description: "Tài xế hoặc xe đã có phân công công việc khác đang hoạt động trong khung giờ này.",
    color: "red",
  },

  // Lỗi Định giá & Lộ trình
  RATING_PRICING_DATE_REQUIRED: {
    label: "Thiếu ngày định giá",
    description: "Chưa có ngày định giá nghiệp vụ độc lập cho chuyến hàng.",
    color: "orange",
  },
  OPTIMIZATION_ACCEPTED_RATING_REQUIRED: {
    label: "Chưa duyệt giá",
    description: "Chuyến hàng chưa có snapshot giá được phê duyệt (accepted rating snapshot).",
    color: "orange",
  },
  OPTIMIZATION_ROUTING_CONTEXT_REQUIRED: {
    label: "Thiếu dữ liệu lộ trình",
    description: "Không đủ thông tin tọa độ/địa điểm để xác định tuyến đường.",
    color: "orange",
  },
  OPTIMIZATION_ROUTE_EVIDENCE_INVALID: {
    label: "Lộ trình không hợp lệ",
    description: "Chứng cứ kế hoạch tuyến đường hoặc cự ly di chuyển không hợp lệ.",
    color: "orange",
  },
  PICKUP_UNREACHABLE: {
    label: "Không tới được điểm lấy hàng",
    description: "Xe không thể đến điểm nhận hàng trước hoặc trong thời gian hẹn.",
    color: "red",
  },
  PICKUP_WINDOW_UNREACHABLE: {
    label: "Trễ khung giờ lấy hàng",
    description: "Dự kiến đến sau khi khung giờ mở cửa nhận hàng đã kết thúc.",
    color: "red",
  },
  PICKUP_OUTSIDE_PLANNING_HORIZON: {
    label: "Ngoài hạn 72h",
    description: "Thời gian nhận hàng nằm ngoài khung giờ lập kế hoạch 72 giờ của hệ thống.",
    color: "warning",
  },
  ON_TIME_UTILITY_UNAVAILABLE: {
    label: "Thiếu dự báo đúng giờ",
    description: "Thiếu giờ hẹn hoặc dự báo thời gian đến điểm lấy hàng để tính độ khả thi.",
    color: "orange",
  },

  // Lỗi Năng lực & Tài xế / Xe
  DRIVER_UNAVAILABLE: {
    label: "Tài xế bận",
    description: "Tài xế không sẵn sàng hoặc không bao quát toàn bộ khung giờ lập kế hoạch.",
    color: "red",
  },
  TRUCK_UNAVAILABLE: {
    label: "Xe bận / Không khả dụng",
    description: "Xe không sẵn sàng hoặc không bao quát toàn bộ khung giờ lập kế hoạch.",
    color: "red",
  },
  CAPACITY_EVIDENCE_UNAVAILABLE: {
    label: "Thiếu chứng cứ tải trọng",
    description: "Không có dữ liệu xác thực tải trọng của xe hoặc trọng lượng hàng.",
    color: "volcano",
  },
  CAPACITY_INFEASIBLE: {
    label: "Quá tải trọng",
    description: "Khối lượng hàng vượt quá sức chở định mức tối đa của phương tiện.",
    color: "red",
  },
  CAPACITY_INSUFFICIENT: {
    label: "Xe thiếu tải trọng",
    description: "Phương tiện không đủ sức chứa yêu cầu của đơn hàng.",
    color: "red",
  },
  QUALIFICATION_EVIDENCE_UNAVAILABLE: {
    label: "Thiếu chứng cứ điều kiện",
    description: "Không có dữ liệu chứng chỉ, hoặc thời hạn chứng chỉ không bao quát 72h kế hoạch.",
    color: "volcano",
  },
  DRIVER_QUALIFICATION_INFEASIBLE: {
    label: "Tài xế không đủ điều kiện",
    description: "Tài xế chưa đủ chứng chỉ yêu cầu hoặc bằng lái hết hạn / không hợp lệ.",
    color: "red",
  },
  EQUIPMENT_INFEASIBLE: {
    label: "Thiết bị không phù hợp",
    description: "Quy cách rơ-moóc / thùng xe không tương thích với loại hàng hóa.",
    color: "red",
  },
  EQUIPMENT_MISMATCH: {
    label: "Lệch quy cách thiết bị",
    description: "Thiết bị xe không khớp với yêu cầu vận chuyển của Load.",
    color: "red",
  },
  HAZMAT_INFEASIBLE: {
    label: "Lỗi Hazmat (Hàng nguy hiểm)",
    description: "Đơn hàng yêu cầu chứng chỉ vận chuyển hàng nguy hiểm nhưng tài xế hoặc xe chưa đạt chuẩn Hazmat.",
    color: "magenta",
  },
  HAZMAT_EVIDENCE_CONTEXT_MISMATCH: {
    label: "Lệch điều kiện Hazmat",
    description: "Dữ liệu chứng cứ Hazmat không khớp với cấu hình của chuyến hàng.",
    color: "magenta",
  },
  MAINTENANCE_BLOCK: {
    label: "Xe đang bảo dưỡng",
    description: "Xe đang có lịch bảo dưỡng định kỳ hoặc sửa chữa, không được xuất bến.",
    color: "red",
  },
  VEHICLE_LOCATION_INVALID: {
    label: "Tọa độ GPS sai",
    description: "Tọa độ GPS của xe không hợp lệ hoặc nằm ngoài dải chuẩn WGS84.",
    color: "volcano",
  },

  // Lỗi HOS (Hours of Service)
  HOS_INFEASIBLE: {
    label: "Vi phạm HOS",
    description: "Vi phạm quy định giờ lái xe, thời gian làm việc, thời gian nghỉ ngơi hoặc chu kỳ tuần.",
    color: "magenta",
  },
  HOS_CYCLE_LIMIT_EXCEEDED: {
    label: "Vi phạm HOS (Quá chu kỳ)",
    description: "Thời gian lái xe vượt quá giới hạn chu kỳ quy định (70h/8 ngày hoặc 60h/7 ngày).",
    color: "magenta",
  },
  HOS_EVIDENCE_CONTEXT_MISMATCH: {
    label: "Lệch kế hoạch HOS",
    description: "Kế hoạch lộ trình của chứng cứ HOS không khớp với lộ trình mô phỏng.",
    color: "magenta",
  },
  HOS_UTILITY_EVIDENCE_REQUIRED: {
    label: "Thiếu dữ liệu dự trữ HOS",
    description: "Thiếu chỉ số tỷ lệ dự trữ thời gian HOS (headroom ratio) để đánh giá an toàn.",
    color: "magenta",
  },

  // Lỗi Chứng cứ & Dữ liệu quá hạn
  OPTIMIZATION_INPUT_EVIDENCE_REQUIRED: {
    label: "Thiếu chứng cứ đầu vào",
    description: "Ứng viên chưa được liên kết đầy đủ chứng cứ hợp lệ (tải trọng, điều kiện, dự báo).",
    color: "volcano",
  },
  OPTIMIZATION_INPUT_EVIDENCE_INVALID: {
    label: "Chứng cứ không hợp lệ",
    description: "Chứng cứ đầu vào không khớp nguồn đăng ký hoặc sai định dạng xác thực.",
    color: "volcano",
  },
  OPTIMIZATION_INPUT_VALIDITY_REQUIRED: {
    label: "Thiếu thời hạn chứng cứ",
    description: "Chứng cứ đầu vào không có thời hạn hiệu lực (expiresAt) hoặc giới hạn tuổi tối đa.",
    color: "volcano",
  },
  VEHICLE_LOCATION_STALE: {
    label: "Vị trí xe quá hạn",
    description: "Tọa độ vị trí xe đã cũ vượt quá giới hạn thời gian (tối đa 5 phút).",
    color: "volcano",
  },
  ETA_FORECAST_STALE: {
    label: "Dự báo ETA quá hạn",
    description: "Dự báo thời gian di chuyển đã quá hạn (vượt quá 15 phút).",
    color: "volcano",
  },
  OPTIMIZATION_INPUT_STALE: {
    label: "Chứng cứ đã hết hạn",
    description: "Dữ liệu chứng cứ đầu vào đã quá thời hạn hiệu lực tối đa.",
    color: "volcano",
  },
  OPTIMIZATION_CANDIDATE_STALE: {
    label: "Dữ liệu đã thay đổi",
    description: "Dữ liệu trạng thái xe, tài xế hoặc chứng cứ đã bị thay đổi ở nơi khác kể từ khi tính toán.",
    color: "orange",
  },
  OPTIMIZATION_INPUT_ALREADY_SUPERSEDED: {
    label: "Chứng cứ bị thay thế",
    description: "Chứng cứ đầu vào đã có phiên bản mới hơn trong hệ thống.",
    color: "volcano",
  },
  OPTIMIZATION_SOURCE_UNAVAILABLE: {
    label: "Nguồn chứng cứ không khả dụng",
    description: "Không thể kết nối hoặc không tìm thấy nguồn chứng cứ đã đăng ký.",
    color: "volcano",
  },

  // Lỗi Dự báo tài chính & Chấm điểm
  FORECAST_COST_INCOMPLETE: {
    label: "Thiếu dự báo chi phí",
    description: "Chưa hoàn thiện đầy đủ các hạng mục chi phí dự báo được duyệt.",
    color: "orange",
  },
  OPTIMIZATION_CURRENCY_MISMATCH: {
    label: "Lệch loại tiền tệ",
    description: "Loại tiền tệ trong chứng cứ dự báo không khớp với tiền tệ định giá của Load.",
    color: "orange",
  },
  DEADHEAD_UTILITY_UNAVAILABLE: {
    label: "Thiếu điểm chạy rỗng",
    description: "Không đủ dữ liệu cự ly chạy rỗng để tính điểm utility.",
    color: "orange",
  },
  MARGIN_UTILITY_UNAVAILABLE: {
    label: "Thiếu điểm biên lợi nhuận",
    description: "Không đủ dữ liệu tài chính dự báo để tính điểm biên lợi nhuận.",
    color: "orange",
  },
  INVALID_OPTIMIZATION_CANDIDATE: {
    label: "Ứng viên không hợp lệ",
    description: "Dữ liệu ứng viên không thể đưa vào mô hình chấm điểm.",
    color: "volcano",
  },
  INVALID_OPTIMIZATION_POLICY: {
    label: "Chính sách không hợp lệ",
    description: "Cấu hình chính sách chấm điểm không đúng chuẩn.",
    color: "volcano",
  },
  OPTIMIZATION_SCORE_INVALID: {
    label: "Điểm số không hợp lệ",
    description: "Kết quả chấm điểm vượt quá giới hạn hoặc sai quy cách.",
    color: "volcano",
  },

  // Lỗi Phạm vi & Chấp nhận
  OPTIMIZATION_SCOPE_TOO_LARGE: {
    label: "Phạm vi quá lớn",
    description: "Số lượng tổ hợp ứng viên vượt quá giới hạn kỹ thuật 200 tổ hợp.",
    color: "volcano",
  },
  INVALID_OPTIMIZATION_SCOPE: {
    label: "Phạm vi không hợp lệ",
    description: "Danh sách mục tiêu trùng lặp hoặc thiếu thông tin định giá / điểm lấy hàng.",
    color: "volcano",
  },
  OPTIMIZATION_ALREADY_ACCEPTED: {
    label: "Lần chạy đã được duyệt",
    description: "Lần chạy này đã có một ứng viên được chấp nhận. Kết quả tối ưu là bất biến.",
    color: "blue",
  },
  OPTIMIZATION_IDEMPOTENCY_CONFLICT: {
    label: "Trùng lặp khóa lệnh",
    description: "Khóa lệnh (idempotency key) đã được sử dụng cho một yêu cầu khác.",
    color: "orange",
  },
  OPTIMIZATION_INFEASIBLE: {
    label: "Không khả thi",
    description: "Ứng viên không thỏa mãn các điều kiện ràng buộc cứng để chấp nhận.",
    color: "red",
  },
};

export interface RejectionCodeTagProps {
  code: string;
}

export const RejectionCodeTag: React.FC<RejectionCodeTagProps> = ({ code }) => {
  const { t } = useTranslation();
  const info = REJECTION_CODE_MAP[code];

  // Lấy bản dịch i18n nếu có, fallback về info.label, fallback cuối là chính mã code
  const translated = t(`optimization.errors.${code}`, {
    defaultValue: info?.label || code,
  });

  const label = translated;
  const tooltip = info ? `${info.description} (${code})` : `Mã kiểm tra: ${code}`;
  const color = info?.color || "default";

  return (
    <Tooltip title={tooltip}>
      <Tag color={color} style={{ margin: "2px 4px" }}>
        {label}
      </Tag>
    </Tooltip>
  );
};
