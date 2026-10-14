/** Khung widget dashboard với nền trắng, be hoặc tối và các trạng thái dữ liệu dùng chung. */
import React from "react";
import { Alert, Button, Card, ConfigProvider, Empty, Skeleton, Space, Tooltip, Typography } from "antd";
import { InfoCircleOutlined, LockOutlined, ReloadOutlined } from "@ant-design/icons";
import type { WidgetError } from "../types";
import "./WidgetContainer.scss";

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
  tone?: "default" | "beige" | "dark";
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
  tone = "default",
}) => {
  const cardTitle = (title || subtitle) && (
    <Space direction="vertical" size={2} style={{ width: "100%" }}>
      <Space align="center" wrap size={6}>
        {typeof title === "string" ? (
          <Typography.Text strong className="widget-container__title">
            {title}
          </Typography.Text>
        ) : (
          title
        )}
        {tooltip && (
          <Tooltip title={tooltip}>
            <InfoCircleOutlined className="widget-container__info" />
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
    <ConfigProvider theme={tone === "dark" ? {
      token: {
        colorBgContainer: "#24292b",
        colorText: "#f7f5ee",
        colorTextSecondary: "#c7cbc9",
        colorTextDescription: "#c7cbc9",
        colorTextHeading: "#f7f5ee",
        colorPrimary: "#ffe16a",
        colorLink: "#ffe16a",
        colorLinkHover: "#fff0a3",
        colorBorderSecondary: "#43494b",
        colorFillContent: "#43494b",
      },
    } : undefined}>
      <Card
        title={cardTitle}
        extra={extra}
        className={`widget-container widget-container--${tone} ${className ?? ""}`.trim()}
        variant="outlined"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          ...style,
        }}
        styles={{
          body: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight,
            ...bodyStyle,
          },
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
    </ConfigProvider>
  );
};
