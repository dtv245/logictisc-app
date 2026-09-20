/**
 * Cho phép người dùng chọn một tenant đã được backend cấp quyền.
 */

import { BankOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";

import { APP_I18N_NAMESPACE } from "@locales";
import { useApiError } from "@hooks/useApiError";
import { useSwitchTenant } from "@hooks/useSwitchTenant";
import { useTenantList } from "@hooks/useTenantList";

export const SelectTenantPage = () => {
  const { t } = useTranslation(APP_I18N_NAMESPACE);
  const { tenants, isLoading } = useTenantList();
  const tenantSwitch = useSwitchTenant();
  const { showApiError } = useApiError();

  return (
    <main className="auth-page">
      <Card className="tenant-card">
        <Space direction="vertical" size="large" className="full-width">
          <div>
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
          ) : (
            <Card loading={isLoading} size="small">
              <Space direction="vertical" size="middle">
                <Space>
                  <BankOutlined />
                  <Typography.Text strong>
                    {tenants[0]?.tenantName}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    {tenants[0]?.tenantKey}
                  </Typography.Text>
                </Space>
                <Button
                  loading={tenantSwitch.isLoading}
                  onClick={() =>
                    void tenantSwitch.switchTenant().catch(showApiError)
                  }
                  type="primary"
                >
                  {t("tenant.reauthenticate")}
                </Button>
              </Space>
            </Card>
          )}
        </Space>
      </Card>
    </main>
  );
};
