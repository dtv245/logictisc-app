import { BankOutlined, UserOutlined } from "@ant-design/icons";
import { Card, Col, Row, Space, Statistic, Typography } from "antd";

import { useCurrentUser } from "../../hooks/auth/useCurrentUser";
import { useCurrentTenant } from "../../hooks/tenant/useCurrentTenant";
import { useTenantList } from "../../hooks/tenant/useTenantList";

export const DashboardPage = () => {
  const currentUser = useCurrentUser();
  const { tenant } = useCurrentTenant();
  const { tenants } = useTenantList();

  return (
    <Space direction="vertical" size="large" className="full-width">
      <div>
        <Typography.Title level={2}>Tổng quan</Typography.Title>
        <Typography.Text type="secondary">
          Xin chào {currentUser.data?.name ?? "bạn"}.
        </Typography.Text>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              prefix={<BankOutlined />}
              title="Công ty hiện tại"
              value={tenant?.tenantName ?? "Chưa chọn"}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              prefix={<UserOutlined />}
              title="Số công ty có quyền truy cập"
              value={tenants.length}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};
