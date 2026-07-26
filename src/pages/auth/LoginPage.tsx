/**
 * Hiển thị trang đăng nhập bằng mật khẩu hoặc Lark.
 */

import { LoginOutlined } from "@ant-design/icons";
import { useLogin } from "@refinedev/core";
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  Space,
  Typography,
} from "antd";

import { useLarkLogin } from "../../hooks/useLarkLogin";
import type { PasswordLoginParams } from "../../types/auth";

export const LoginPage = () => {
  const passwordLogin = useLogin<PasswordLoginParams>();
  const larkLogin = useLarkLogin();

  return (
    <main className="auth-page">
      <Card className="auth-card">
        <Space direction="vertical" size="large" className="full-width">
          <div>
            <Typography.Title level={2}>Đăng nhập Logictics</Typography.Title>
            <Typography.Text type="secondary">
              Đăng nhập bằng tài khoản hệ thống hoặc Lark của công ty.
            </Typography.Text>
          </div>
          <Form<PasswordLoginParams>
            layout="vertical"
            onFinish={(values) => passwordLogin.mutate(values)}
          >
            <Form.Item
              label="Tên đăng nhập"
              name="username"
              rules={[{ required: true, message: "Nhập tên đăng nhập." }]}
            >
              <Input autoComplete="username" />
            </Form.Item>
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Nhập mật khẩu." }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Button
              block
              htmlType="submit"
              loading={passwordLogin.isLoading}
              size="large"
              type="primary"
            >
              Đăng nhập
            </Button>
          </Form>
          <Divider>hoặc</Divider>
          <Button
            block
            icon={<LoginOutlined />}
            loading={larkLogin.isLoading}
            onClick={larkLogin.startLogin}
            size="large"
          >
            Đăng nhập với Lark
          </Button>
        </Space>
      </Card>
    </main>
  );
};
