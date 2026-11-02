export const PAYROLL_RECONCILIATION_REASONS: Readonly<Record<string, string>> = {
  PAYMENT_LATE_OUTCOME_REQUIRES_RECONCILIATION: "Kết quả thanh toán đến muộn và cần đối soát. Kiểm tra chứng từ ngân hàng trước khi xử lý.",
  PAYMENT_CASE_UNRESOLVED: "Trường hợp thanh toán chưa được giải quyết. Kiểm tra bằng chứng và hoàn tất đối soát.",
};

export function payrollReasonDescription(reason: string): string {
  return PAYROLL_RECONCILIATION_REASONS[reason] ?? (/^[A-Z][A-Z0-9_]*$/.test(reason)
    ? "Chưa có mô tả cho lý do này. Vui lòng liên hệ bộ phận hỗ trợ."
    : reason);
}
