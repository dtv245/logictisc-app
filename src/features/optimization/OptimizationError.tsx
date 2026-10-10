import { Alert } from "antd";
import { useTranslation } from "react-i18next";
import { ApiHttpError } from "@/providers/api/httpError";
export function OptimizationError({ error }: { error: Error | null }) {
  const { t, i18n } = useTranslation();
  if (!error) return null;

  let message = error.message;
  if (error instanceof ApiHttpError) {
    if (error.code && i18n.exists(`optimization.errors.${error.code}`)) {
      message = t(`optimization.errors.${error.code}`);
    } else if (error.statusCode === 409) {
      message = t("optimization.errors.CONFLICT_409");
    }
  }

  return (
    <Alert
      type="error"
      showIcon
      message={message}
      description={error instanceof ApiHttpError ? `${error.code}${error.requestId ? ` / ${t("bootstrap.requestId.label")}: ${error.requestId}` : ""}` : undefined}
      style={{ marginBottom: 16 }}
    />
  );
}
