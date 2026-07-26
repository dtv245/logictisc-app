import { LoginOutlined } from "@ant-design/icons";
import { Button, Card, Space, Typography } from "antd";

import { useLarkLogin } from "../../hooks/auth/useLarkLogin";

export const LoginPage = () => {
  const { startLogin, isPending } = useLarkLogin();

  return (
    <main className="auth-page">
      <Card className="auth-card">
        <Space direction="vertical" size="large" className="full-width">
          <div>
            <Typography.Title level={2}>Đăng nhập Logictics</Typography.Title>
            <Typography.Text type="secondary">
              Sử dụng tài khoản Lark của công ty để tiếp tục.
            </Typography.Text>
          </div>
          <Button
            block
            icon={<LoginOutlined />}
            loading={isPending}
            onClick={startLogin}
            size="large"
            type="primary"
          >
            Đăng nhập với Lark
          </Button>
        </Space>
      </Card>
    </main>
  );
};
