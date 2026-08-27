/**
 * Nội dung tiếng Việt cho bootstrap ứng dụng và trang chẩn đoán public.
 */

export const viAppMessages = {
  bootstrap: {
    loadingConfig: "Đang tải cấu hình ứng dụng",
    probingHealth: "Đang kiểm tra khả dụng của API",
    unreachable: {
      title: "Không thể kết nối API",
      description:
        "Ứng dụng không thể kết nối tới API. Hãy kiểm tra dịch vụ và thử lại.",
    },
    corsBlocked: {
      title: "Trình duyệt đang bị chặn truy cập",
      description:
        "API có thể truy cập được nhưng chính sách CORS chưa cho phép origin của ứng dụng này.",
    },
    unhealthy: {
      title: "API chưa sẵn sàng",
      description:
        "API đã phản hồi nhưng không báo trạng thái hoạt động bình thường.",
    },
    databaseDisabled: {
      title: "Chức năng nghiệp vụ chưa khả dụng",
      description:
        "API đang chạy mà không có kết nối cơ sở dữ liệu nên điều hướng nghiệp vụ tiếp tục bị khóa.",
    },
    requestId: {
      label: "Mã yêu cầu",
      copy: "Sao chép mã yêu cầu",
      copied: "Đã sao chép mã yêu cầu",
    },
    httpStatus: "Trạng thái HTTP: {{status}}",
  },
  diagnostics: {
    title: "Chẩn đoán hệ thống",
    description:
      "Thông tin runtime và khả dụng API công khai, không chứa dữ liệu nhạy cảm.",
    fields: {
      environment: "Môi trường",
      application: "Ứng dụng API",
      profiles: "Profile đang chạy",
      status: "Trạng thái API",
      database: "Cơ sở dữ liệu",
      requestId: "Mã yêu cầu",
    },
  },
} as const;
