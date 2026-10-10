/** Issuance is immutable evidence, not evidence that a transfer succeeded. */
import { Alert } from "antd";
import { useTranslation } from "react-i18next";
export function PayslipPaymentStatus() {
  const { t } = useTranslation();
  return <Alert type="info" showIcon message={t("payslips.paymentUnavailable")} description={t("payslips.issuanceSeparate")} />;
}
