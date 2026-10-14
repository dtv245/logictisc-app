/**
 * Locale resources for the existing notification presentation. Its fixed Vietnamese
 * translator preserves the former hardcoded text even when the app uses EN or JA.
 * This isolated instance does not initialize or change the application's i18n state.
 */
import { createInstance } from "i18next";

export const notificationResourceLabels: Record<string, string> = {
  customers: "Khách hàng",
  employees: "Nhân viên",
  terminals: "Bến bãi",
  trucks: "Xe tải",
  loads: "Chuyến hàng",
  trips: "Chuyến đi",
  invoices: "Hóa đơn",
  payments: "Khoản thanh toán",
  documents: "Tài liệu",
  notifications: "Thông báo",
  "load-board": "Sàn giao dịch tải",
  containers: "Container",
  drivers: "Tài xế",
  "hos-eld": "Nhật ký HOS/ELD",
  dvir: "Báo cáo DVIR",
  maintenance: "Bảo trì",
  accidents: "Tai nạn & Sự cố",
  expenses: "Chi phí",
  products: "Sản phẩm",
  roles: "Vai trò & Quyền",
  settlements: "Quyết toán tài xế",
  payroll: "Bảng lương",
  payslips: "Phiếu lương",
};

export const notificationCodeMessages: Record<string, string> = {
  // Lỗi mạng, kết nối & máy chủ
  ERR_NETWORK: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng Internet.",
  ECONNABORTED: "Hết thời gian chờ kết nối máy chủ (Timeout). Vui lòng thử lại sau.",
  ETIMEDOUT: "Hết thời gian chờ kết nối máy chủ (Timeout). Vui lòng kiểm tra lại đường truyền mạng.",
  NETWORK_ERROR: "Mất kết nối với máy chủ. Vui lòng kiểm tra lại mạng Internet.",
  UNKNOWN_TRANSPORT_ERROR: "Lỗi kết nối truyền tải không xác định giữa trình duyệt và máy chủ.",
  INVALID_API_RESPONSE: "Phản hồi từ máy chủ không đúng định dạng chuẩn.",

  // Lỗi xác thực & đăng nhập
  LARK_AUTH_CANCELLED: "Đăng nhập qua Lark SSO đã bị hủy hoặc bạn đã từ chối cấp quyền.",
  LARK_CODE_MISSING: "Không nhận được mã xác thực từ Lark. Vui lòng thử đăng nhập lại.",
  LARK_API_CLIENT_REQUIRED: "Hệ thống chưa sẵn sàng cấu hình kết nối đăng nhập Lark.",
  AUTH_REQUEST_FAILED: "Yêu cầu xác thực tài khoản thất bại. Vui lòng kiểm tra lại thông tin.",
  TOKEN_REFRESH_RETURNED_NO_TOKEN: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn hoặc thông tin xác thực không hợp lệ.",
  FORBIDDEN: "Bạn không có quyền hạn thực hiện thao tác này.",

  // Lỗi CRUD, dữ liệu & xung đột
  VERSION_CONFLICT: "Dữ liệu đã bị thay đổi bởi người dùng khác hoặc phiên bản không khớp. Vui lòng tải lại trang.",
  CONCURRENT_MODIFICATION_CONFLICT: "Dữ liệu đã bị thay đổi bởi người dùng khác hoặc phiên bản không khớp. Vui lòng tải lại trang.",
  INVOICE_IMMUTABLE_HISTORY: "Hóa đơn đã chốt trong lịch sử tài chính, không thể chỉnh sửa trực tiếp. Vui lòng dùng lệnh điều chỉnh billing.",
  PAYMENT_AMOUNT_INVALID: "Số tiền thanh toán không hợp lệ. Vui lòng nhập số tiền dương với tối đa 2 chữ số thập phân.",
  PAYMENT_EXCEEDS_INVOICE_BALANCE: "Số tiền thanh toán vượt quá số dư còn lại của hóa đơn.",
  PAYMENT_IDEMPOTENCY_CONFLICT: "Khóa giao dịch này thuộc về một ý định thanh toán khác.",
  CURRENCY_MISMATCH: "Đơn vị tiền tệ thanh toán không khớp với hóa đơn.",
  DECIMAL_PRECISION_UNSUPPORTED: "Client không biểu diễn chính xác được số tiền này. Chưa gửi giá trị làm tròn.",
  CONTRACT_VERSION_UNAVAILABLE: "Backend chưa cung cấp phiên bản dữ liệu/hợp đồng để chỉnh sửa.",
  COMMAND_INTENT_FROZEN: "Lệnh trước đó chưa xác định kết quả. Vui lòng chờ trước khi gửi lệnh mới.",
  LOAD_PICKUP_DATE_CONFLICT: "Ngày lấy hàng nghiệp vụ đã thay đổi. Vui lòng đọc lại ngày và mã audit hiện tại.",
  INVALID_FLEET_REPORT_PERIOD: "Kiểm tra kỳ báo cáo, múi giờ và ngày kết thúc (không được nằm trong tương lai).",
  FLEET_VALIDATION_REQUIRED: "Kiểm tra policy đã công bố và danh sách xe khác nhau.",
  COMMAND_RESOURCE_REQUIRES_FEATURE_ADAPTER: "Thao tác này yêu cầu form nghiệp vụ chuyên biệt, không hỗ trợ CRUD trực tiếp.",
  CUSTOM_FILTERS_AND_SORTERS_REQUIRE_FEATURE_ADAPTER: "Bộ lọc và sắp xếp nâng cao cần bộ chuyển đổi nghiệp vụ chuyên biệt.",
  INVALID_RECORD_RESPONSE: "Dữ liệu bản ghi trả về từ máy chủ không hợp lệ.",
  INVALID_RECORD_ID: "Mã định danh (ID) bản ghi không hợp lệ.",
  INVALID_PAGED_RESPONSE: "Dữ liệu danh sách phân trang không hợp lệ.",
  EMPTY_CUSTOM_RESPONSE: "Dữ liệu phản hồi từ máy chủ bị trống.",
  SETTLEMENT_ALREADY_LOCKED: "Bảng quyết toán đã bị khóa sổ, không thể chỉnh sửa hoặc thao tác.",
  TRIP_ALREADY_DISPATCHED: "Chuyến xe đã được điều phối, không thể thay đổi thông tin hành trình.",
  HOS_VIOLATION: "Tài xế đã vượt quá số giờ làm việc cho phép theo quy định HOS/ELD.",
  DVIR_DEFECT_UNRESOLVED: "Phương tiện có lỗi kỹ thuật trong biên bản DVIR chưa được xác nhận sửa chữa.",
};

export const notificationPresentationMessages = {
  "successCreate": "Tạo mới thành công",
  "successCreateResource": "Tạo mới {{resource}} thành công",
  "successUpdate": "Cập nhật thành công",
  "successUpdateResource": "Cập nhật {{resource}} thành công",
  "successDelete": "Xóa thành công",
  "successDeleteResource": "Xóa {{resource}} thành công",
  "successAuth": "Đăng nhập thành công",
  "successGeneric": "Thao tác thành công",
  "progress": "Đang thực hiện thao tác (có thể hoàn tác)",
  "networkTitle": "Mất kết nối với máy chủ",
  "networkDescription": "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng Internet hoặc máy chủ đang tạm ngừng hoạt động.",
  "timeoutTitle": "Hết thời gian chờ kết nối máy chủ",
  "timeoutDescription": "Yêu cầu vượt quá thời gian chờ phản hồi (Timeout). Vui lòng kiểm tra lại chất lượng đường truyền mạng hoặc thử lại sau.",
  "authFailedTitle": "Đăng nhập không thành công",
  "authCancelledDescription": "Quá trình đăng nhập qua Lark SSO đã bị hủy hoặc bạn đã từ chối cấp quyền.",
  "authMissingCodeDescription": "Không nhận được mã xác thực từ dịch vụ Lark. Vui lòng thử đăng nhập lại.",
  "authConfigTitle": "Lỗi cấu hình xác thực",
  "authConfigDescription": "Cấu hình kết nối đăng nhập Lark chưa sẵn sàng. Vui lòng liên hệ quản trị hệ thống.",
  "sessionExpiredTitle": "Hết hạn phiên đăng nhập",
  "sessionExpiredDescription": "Phiên làm việc đã hết hạn hoặc thông tin xác thực không hợp lệ. Vui lòng đăng nhập lại.",
  "forbiddenTitle": "Không có quyền truy cập",
  "forbiddenDescription": "Tài khoản của bạn không có quyền hạn thực hiện thao tác này. Vui lòng liên hệ quản trị viên.",
  "notFoundTitle": "Không tìm thấy dữ liệu",
  "notFoundDescription": "Bản ghi yêu cầu không tồn tại hoặc đã bị xóa trước đó.",
  "conflictTitle": "Xung đột dữ liệu",
  "conflictDescription": "Dữ liệu đã bị thay đổi bởi người dùng khác hoặc phiên bản không khớp. Vui lòng tải lại trang để lấy dữ liệu mới nhất.",
  "failureCreate": "Tạo mới thất bại",
  "failureCreateResource": "Tạo mới {{resource}} thất bại",
  "failureUpdate": "Cập nhật thất bại",
  "failureUpdateResource": "Cập nhật {{resource}} thất bại",
  "failureDelete": "Xóa dữ liệu thất bại",
  "failureDeleteResource": "Xóa {{resource}} thất bại",
  "serverCreate": "Tạo mới thất bại (Lỗi máy chủ)",
  "serverCreateResource": "Tạo mới {{resource}} thất bại (Lỗi máy chủ)",
  "serverUpdate": "Cập nhật thất bại (Lỗi máy chủ)",
  "serverUpdateResource": "Cập nhật {{resource}} thất bại (Lỗi máy chủ)",
  "serverDelete": "Xóa dữ liệu thất bại (Lỗi máy chủ)",
  "serverDeleteResource": "Xóa {{resource}} thất bại (Lỗi máy chủ)",
  "serverDescription": "Máy chủ đang gặp sự cố nội bộ (mã {{statusCode}}). Đội ngũ kỹ thuật đang xử lý, vui lòng thử lại sau giây lát."
};

const compatibilityI18n = createInstance();
void compatibilityI18n.init({
  lng: "vi",
  initAsync: false,
  resources: { vi: { translation: notificationPresentationMessages } },
  interpolation: { escapeValue: false },
});

export const compatibilityT = compatibilityI18n.getFixedT("vi");
