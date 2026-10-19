import React from "react";
import { Alert, Button, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

export interface WidgetErrorAlertProps {
  error?: {
    message?: string;
    requestId?: string | null;
    statusCode?: number;
    code?: string;
  } | Error | string | null;
  onRetry?: () => void;
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}

/**
 * Reusable error alert component for dashboard and summary widgets.
 * Renders a localized Ant Design <Alert type="error"> with error message,
 * optional backend requestId, and a retry action button.
 */
export const WidgetErrorAlert: React.FC<WidgetErrorAlertProps> = ({
  error,
  onRetry,
  className,
  style,
  compact = false,
}) => {
  if (!error) return null;

  const message =
    typeof error === "string"
      ? error
      : "message" in error && error.message
      ? error.message
      : "Không thể tải dữ liệu";

  const requestId =
    typeof error === "object" && error !== null && "requestId" in error
      ? error.requestId
      : null;

  return (
    <div
      className={className}
      style={{
        margin: compact ? 0 : "auto 0",
        padding: compact ? "4px 0" : "8px 0",
        width: "100%",
        ...style,
      }}
    >
      <Alert
        type="error"
        showIcon
        message={message}
        description={
          !compact && requestId ? (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Mã yêu cầu: {requestId}
            </Typography.Text>
          ) : undefined
        }
        action={
          onRetry ? (
            <Button
              size="small"
              danger
              icon={<ReloadOutlined />}
              onClick={onRetry}
            >
              Thử lại
            </Button>
          ) : undefined
        }
      />
    </div>
  );
};
