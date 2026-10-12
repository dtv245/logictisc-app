/**
 * Cho phép người dùng chọn một tenant đã được backend cấp quyền.
 */

import { BankOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";

import { useApiError } from "@hooks/useApiError";
import { useSwitchTenant } from "@hooks/useSwitchTenant";
import { useTenantList } from "@hooks/useTenantList";

export const SelectTenantPage = () => {
  const { t } = useTranslation();
  const { tenants, isLoading } = useTenantList();
  const tenantSwitch = useSwitchTenant();
  const { showApiError } = useApiError();

  return (
    <main className="auth-page">
      <Card className="tenant-card">
        <Space direction="vertical" size="large" className="full-width">
          <div className="tenant-card-header">
            <Typography.Title level={2}>{t("tenant.title")}</Typography.Title>
            <Typography.Text type="secondary">
              {t("tenant.description")}
            </Typography.Text>
          </div>
          {tenants.length === 0 && !isLoading ? (
            <Alert
              message={t("tenant.none")}
              type="warning"
              showIcon
            />
          ) : isLoading ? (
            <Card loading size="small" className="tenant-item-card" />
          ) : (
            <div className="tenant-items-list">
              {tenants.map((tenant) => (
                <Card key={tenant.tenantKey} size="small" className="tenant-item-card">
                  <div className="tenant-item-content">
                    <div className="tenant-item-info">
                      <BankOutlined className="tenant-item-icon" aria-hidden="true" />
                      <div className="tenant-item-meta">
                        <Typography.Text
                          strong
                          className="tenant-item-name"
                          ellipsis={{ tooltip: tenant.tenantName }}
                        >
                          {tenant.tenantName}
                        </Typography.Text>
                        <Typography.Text type="secondary" className="tenant-item-key">
                          {tenant.tenantKey}
                        </Typography.Text>
                      </div>
                    </div>
                    <Button
                      className="tenant-switch-btn"
                      loading={tenantSwitch.isLoading}
                      onClick={() =>
                        void tenantSwitch.switchTenant().catch(showApiError)
                      }
                      type="primary"
                    >
                      {t("tenant.reauthenticate")}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Space>
      </Card>
    </main>
  );
};
