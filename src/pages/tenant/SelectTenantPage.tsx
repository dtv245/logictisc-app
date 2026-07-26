/**
 * Cho phép người dùng chọn một tenant đã được backend cấp quyền.
 */

import { BankOutlined } from "@ant-design/icons";
import { Alert, Button, Card, List, Space, Typography } from "antd";

import { useApiError } from "../../hooks/useApiError";
import { useSwitchTenant } from "../../hooks/useSwitchTenant";
import { useTenantList } from "../../hooks/useTenantList";

export const SelectTenantPage = () => {
  const { tenants, isLoading } = useTenantList();
  const tenantSwitch = useSwitchTenant();
  const { showApiError } = useApiError();

  return (
    <main className="auth-page">
      <Card className="tenant-card">
        <Space direction="vertical" size="large" className="full-width">
          <div>
            <Typography.Title level={2}>Chọn công ty</Typography.Title>
            <Typography.Text type="secondary">
              Backend sẽ xác nhận quyền thành viên trước khi chuyển công ty.
            </Typography.Text>
          </div>
          {tenants.length === 0 && !isLoading ? (
            <Alert
              message="Tài khoản chưa được cấp quyền vào công ty nào."
              type="warning"
              showIcon
            />
          ) : (
            <List
              dataSource={tenants}
              loading={isLoading}
              renderItem={(tenant) => (
                <List.Item
                  actions={[
                    <Button
                      key={tenant.tenantKey}
                      loading={tenantSwitch.isLoading}
                      onClick={() =>
                        void tenantSwitch
                          .switchTenant(tenant.tenantKey)
                          .catch(showApiError)
                      }
                      type="primary"
                    >
                      Chọn
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<BankOutlined />}
                    title={tenant.tenantName}
                    description={tenant.tenantKey}
                  />
                </List.Item>
              )}
            />
          )}
        </Space>
      </Card>
    </main>
  );
};
