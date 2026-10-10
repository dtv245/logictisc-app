/** Trang đăng nhập tiêu chuẩn hỗ trợ Lark SSO và OIDC. */

import {
  LoginOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useLogin } from "@refinedev/core";
import {
  Button,
  Card,
  Space,
  Typography,
} from "antd";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useLarkLogin } from "@hooks/useLarkLogin";

const SsoLogin = ({ returnTo }: { returnTo?: string }) => {
  const { t } = useTranslation();
  const larkLogin = useLarkLogin();
  const oidcLogin = useLogin();

  return (
    <Space className="login-oidc" direction="vertical" size="middle">
      <Button
        block
        className="login-lark-btn"
        icon={<LoginOutlined aria-hidden="true" />}
        loading={larkLogin.isLoading}
        onClick={() => larkLogin.startLogin(returnTo)}
        size="large"
        type="primary"
      >
        {t("auth.larkSignIn")}
      </Button>
      <Button
        block
        className="login-oidc-btn"
        icon={<LoginOutlined aria-hidden="true" />}
        loading={oidcLogin.isLoading}
        onClick={() =>
          oidcLogin.mutate(returnTo ? { returnTo } : {})
        }
        size="large"
      >
        {t("auth.oidcSignIn")}
      </Button>
      <Typography.Text type="secondary">
        <SafetyCertificateOutlined aria-hidden="true" /> {t("auth.protectedBy")}
      </Typography.Text>
    </Space>
  );
};

export const LoginPage = () => {
  const { t } = useTranslation();
  // `createAuthProvider.check()` dựng link `/login?returnTo=<path>` khi chặn
  // deep-link hoặc phiên hết hạn; đọc lại để trả người dùng đúng trang ban đầu.
  const [searchParams] = useSearchParams();
  const pendingReturnTo = searchParams.get("returnTo") ?? undefined;

  return (
    <main className="login-page">
      <Card className="login-card">
        <SsoLogin returnTo={pendingReturnTo} />

        <Typography.Text className="login-footer" type="secondary">
          {t("auth.copyright")}
        </Typography.Text>
      </Card>
    </main>
  );
};
