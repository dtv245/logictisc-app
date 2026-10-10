import React from "react";
import { Alert, Button, Card, Empty, Skeleton, Space, Tooltip, Typography } from "antd";
import { InfoCircleOutlined, LockOutlined, ReloadOutlined } from "@ant-design/icons";
import type { WidgetError } from "../types";

export interface WidgetContainerProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
  tooltip?: string;
  warningBadge?: React.ReactNode;
  isLoading?: boolean;
  error?: WidgetError | null;
  isForbidden?: boolean;
  isEmpty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  minHeight?: number | string;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  title,
  subtitle,
  extra,
  tooltip,
  warningBadge,
  isLoading = false,
  error = null,
  isForbidden = false,
  isEmpty = false,
  emptyText = "Không có dữ liệu trong khoảng thời gian này",
  onRetry,
  children,
  className,
  style,
  bodyStyle,
  minHeight = 160,
}) => {
  const cardTitle = (title || subtitle) && (
    <Space direction="vertical" size={2} style={{ width: "100%" }}>
      <Space align="center" wrap size={6}>
        {typeof title === "string" ? (
          <Typography.Text strong style={{ fontSize: 15, color: "#1f2937" }}>
            {title}
          </Typography.Text>
        ) : (
          title
        )}
        {tooltip && (
          <Tooltip title={tooltip}>
            <InfoCircleOutlined style={{ color: "#9ca3af", cursor: "help", fontSize: 13 }} />
          </Tooltip>
        )}
        {warningBadge}
      </Space>
      {subtitle && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {subtitle}
        </Typography.Text>
      )}
    </Space>
  );

  return (
    <Card
      title={cardTitle}
      extra={extra}
      className={className}
      bordered
      style={{
        borderRadius: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
      bodyStyle={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: 16,
        minHeight,
        ...bodyStyle,
      }}
    >
      {isForbidden ? (
        <div style={{ margin: "auto 0", padding: "16px 0" }}>
          <Alert
            type="warning"
            showIcon
            icon={<LockOutlined />}
            message="Không có quyền xem"
            description="Tài khoản của bạn không có quyền xem thông tin tài chính hoặc chỉ số này."
          />
        </div>
      ) : error ? (
        <div style={{ margin: "auto 0", padding: "8px 0" }}>
          <Alert
            type="error"
            showIcon
            message={error.message || "Không thể tải dữ liệu"}
            description={
              error.requestId ? (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Mã yêu cầu: {error.requestId}
                </Typography.Text>
              ) : undefined
            }
            action={
              onRetry && (
                <Button
                  size="small"
                  danger
                  icon={<ReloadOutlined />}
                  onClick={onRetry}
                >
                  Thử lại
                </Button>
              )
            }
          />
        </div>
      ) : isLoading ? (
        <div style={{ padding: "8px 0" }}>
          <Skeleton active paragraph={{ rows: 3 }} title={{ width: "40%" }} />
        </div>
      ) : isEmpty ? (
        <div style={{ margin: "auto 0", padding: "16px 0" }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
        </div>
      ) : (
        children
      )}
    </Card>
  );
};
