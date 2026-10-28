import { EnvironmentOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Empty,
  List,
  Space,
  Tag,
  Typography,
} from "antd";
import type { PaginationConfig } from "antd/es/pagination";
import React from "react";
import { useTranslation } from "react-i18next";

import { ActionButtons } from "@/components/ActionButtons";
import { translateOptional } from "@/locales";
import type { Terminal } from "@/types/terminal.types";
import { formatTerminalAddress } from "@/utils/terminals/formatTerminalAddress";

const terminalGrid = {
  gutter: 16,
  xs: 1,
  sm: 2,
  md: 4,
  lg: 4,
  xl: 6,
  xxl: 3,
};

interface TerminalCardGridProps {
  isLoading: boolean;
  isMockPreview: boolean;
  onRetry: () => void;
  pagination: false | PaginationConfig;
  queryError: unknown;
  terminals: Terminal[];
}

export const TerminalCardGrid: React.FC<TerminalCardGridProps> = ({
  isLoading,
  isMockPreview,
  onRetry,
  pagination,
  queryError,
  terminals,
}: TerminalCardGridProps) => {
  const { i18n, t } = useTranslation();

  const renderTerminalCard = (terminal: Terminal) => {
    const typeLabel = translateOptional(
      i18n,
      (key) => t(key),
      `forms.options.${terminal.type}`,
      terminal.type.replaceAll("_", " "),
    );
    const address = formatTerminalAddress(terminal);

    return (
      <List.Item key={terminal.id}>
        <Card
          className="terminal-grid-card"
          hoverable
          style={{ height: "100%" }}
          title={
            <Typography.Text ellipsis={{ tooltip: terminal.name }} strong>
              {terminal.name}
            </Typography.Text>
          }
        >
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <div>
              <Typography.Text type="secondary">
                {t("columns.terminals.code", { defaultValue: "Mã bến bãi" })}
              </Typography.Text>
              <br />
              <Typography.Text code>{terminal.code}</Typography.Text>
            </div>
            <Space wrap size={[4, 4]}>
              <Tag color="blue">{typeLabel}</Tag>
              <Tag bordered={false}>{terminal.countryCode}</Tag>
            </Space>
            <Space align="start" size={8}>
              <EnvironmentOutlined aria-hidden="true" style={{ marginTop: 4 }} />
              <Typography.Paragraph
                ellipsis={{ rows: 2, tooltip: address || undefined }}
                style={{ marginBottom: 0 }}
                type={address ? "secondary" : undefined}
              >
                {address || t("asyncState.emptyDescription")}
              </Typography.Paragraph>
            </Space>
            {terminal.notes ? (
              <Typography.Paragraph
                ellipsis={{ rows: 2, tooltip: terminal.notes }}
                style={{ marginBottom: 0 }}
              >
                {terminal.notes}
              </Typography.Paragraph>
            ) : null}
          </Space>
          {!isMockPreview ? (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <ActionButtons record={terminal} resource="terminals" />
            </div>
          ) : null}
        </Card>
      </List.Item>
    );
  };

  return (
    <>
      {isMockPreview ? (
        <Alert
          message="Bản xem trước với dữ liệu minh họa"
          description="Các thẻ bên dưới chỉ dùng để xem bố cục; dữ liệu không được gửi lên máy chủ."
          showIcon
          style={{ margin: "0 16px 16px" }}
          type="info"
        />
      ) : null}

      {queryError && !isMockPreview ? (
        <Alert
          action={
            <Button onClick={onRetry}>
              {t("actions.retry", { defaultValue: "Thử lại" })}
            </Button>
          }
          message={t("queryError.title")}
          showIcon
          style={{ margin: 16 }}
          type="error"
        />
      ) : (
        <List<Terminal>
          dataSource={terminals}
          grid={terminalGrid}
          loading={isLoading}
          locale={{
            emptyText: (
              <Empty
                description={t("asyncState.emptyDescription")}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          pagination={pagination}
          renderItem={renderTerminalCard}
        />
      )}
    </>
  );
};
