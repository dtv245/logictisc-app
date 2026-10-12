import { Alert, Button, Space } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ApiHttpError } from "@/providers/api/httpError";
import { routes } from "@/constants/routes";
import type { OptimizationOutcome } from "@/types/optimization.dto";

export interface OptimizationErrorProps {
  error: Error | null;
  outcome?: OptimizationOutcome;
  onRetry?: () => void;
}

export function OptimizationError({ error, outcome, onRetry }: OptimizationErrorProps) {
  const { t, i18n } = useTranslation();
  if (!error) return null;

  let message = error.message;
  let isStale = false;
  let isScopeTooLarge = false;
  let isServerOrNetwork = false;

  if (error instanceof ApiHttpError) {
    if (error.code === "OPTIMIZATION_CANDIDATE_STALE") {
      isStale = true;
      message = t("optimization.errors.OPTIMIZATION_CANDIDATE_STALE");
    } else if (error.code === "OPTIMIZATION_SCOPE_TOO_LARGE") {
      isScopeTooLarge = true;
      message = t("optimization.errors.OPTIMIZATION_SCOPE_TOO_LARGE");
    } else if (error.statusCode === 403) {
      message = t("forbidden.description", {
        defaultValue: "Không có quyền thực hiện thao tác này. Cần quyền điều phối hoặc OPTIMIZATION_ACCEPT.",
      });
    } else if (error.statusCode >= 500) {
      isServerOrNetwork = true;
    } else if (error.code && i18n.exists(`optimization.errors.${error.code}`)) {
      message = t(`optimization.errors.${error.code}`);
    } else if (error.statusCode === 409) {
      message = t("optimization.errors.CONFLICT_409");
    }
  } else {
    isServerOrNetwork = true;
  }

  // Cấu hình action button cho từng loại lỗi
  const action = (
    <Space wrap>
      {isStale && (
        <Link to={routes.optimization} state={{ replayRequest: outcome?.run.requestSnapshot }}>
          <Button type="primary" size="small">
            {t("optimization.rerunOptimization", { defaultValue: "Chạy tối ưu lại" })}
          </Button>
        </Link>
      )}
      {isScopeTooLarge && (
        <Link to={routes.optimization}>
          <Button size="small">
            {t("optimization.backToForm", { defaultValue: "Quay lại form tối ưu" })}
          </Button>
        </Link>
      )}
      {isServerOrNetwork && onRetry && (
        <Button size="small" onClick={onRetry}>
          {t("common.retry", { defaultValue: "Thử lại" })}
        </Button>
      )}
    </Space>
  );

  const errorDetails = error instanceof ApiHttpError
    ? `${error.code}${error.requestId ? ` / ${t("bootstrap.requestId.label")}: ${error.requestId}` : ""}`
    : undefined;

  return (
    <Alert
      type={isStale ? "warning" : "error"}
      showIcon
      message={message}
      description={
        errorDetails || isScopeTooLarge ? (
          <div>
            {isScopeTooLarge && (
              <div style={{ marginBottom: 4 }}>
                {t("optimization.scopeTooLargeHelp", {
                  defaultValue: "Vui lòng giảm số lượng tài xế, xe hoặc mục tiêu Load/Trip xuống tối đa 200 tổ hợp.",
                })}
              </div>
            )}
            {errorDetails && <div style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}>{errorDetails}</div>}
          </div>
        ) : undefined
      }
      action={action}
      style={{ marginBottom: 16 }}
    />
  );
}
