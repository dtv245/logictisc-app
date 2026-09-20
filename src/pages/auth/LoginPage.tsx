/** Trang đăng nhập tối giản cho demo local hoặc OIDC production. */

import {
  LockOutlined,
  LoginOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useLogin } from "@refinedev/core";
import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Input,
  Space,
  Typography,
} from "antd";
import { useSearchParams } from "react-router-dom";

import { APP_I18N_NAMESPACE } from "@locales";
import { env } from "../../config/env";
import { useLarkLogin } from "@hooks/useLarkLogin";
import type { PasswordLoginParams } from "@/types/auth.types";
import { useTranslation } from "react-i18next";

const readErrorMessage = (error: unknown): string | undefined => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = Reflect.get(error, "message");
    return typeof message === "string" ? message : undefined;
  }

  return undefined;
};

const readLoginError = (
  login: ReturnType<typeof useLogin<PasswordLoginParams>>,
): { message: string } | undefined => {
  // Provider có thể báo lỗi theo hai cách: ném exception (isError) hoặc trả về
  // `{ success: false, error }` (mutation thành công với data.error). Hiển thị
  // cả hai để người dùng thấy lý do ngay trên form, không chỉ ở toast.
  if (login.isError) {
    const message = readErrorMessage(login.error);
    return message ? { message } : undefined;
  }

  const data = login.data;
  const failedResult =
    login.isSuccess && typeof data === "object" && data !== null
      ? (data as { success?: boolean; error?: unknown })
      : null;

  if (failedResult?.success === false) {
    const message = readErrorMessage(failedResult.error);
    return message ? { message } : undefined;
  }

  return undefined;
};

const CredentialsForm = ({ returnTo }: { returnTo?: string }) => {
  const { t } = useTranslation(APP_I18N_NAMESPACE);
  const passwordLogin = useLogin<PasswordLoginParams>();
  const loginError = readLoginError(passwordLogin);

  return (
    <>
      {loginError ? (
        <Alert
          className="login-error-alert"
          message={loginError.message}
          showIcon
          type="error"
        />
      ) : null}
      <Form<PasswordLoginParams>
        className="login-form"
        initialValues={env.demoAuth ?? undefined}
        layout="vertical"
        onFinish={(values) =>
          passwordLogin.mutate(
            returnTo ? { ...values, returnTo } : values,
          )
        }
        requiredMark={false}
      >
      <Form.Item
        label={t("auth.username")}
        name="username"
        rules={[{ required: true, message: t("auth.usernameRequired") }]}
      >
        <Input
          autoComplete="username"
          placeholder={t("auth.usernamePlaceholder")}
          prefix={<MailOutlined aria-hidden="true" />}
          size="large"
        />
      </Form.Item>

      <Form.Item
        label={t("auth.password")}
        name="password"
        rules={[{ required: true, message: t("auth.passwordRequired") }]}
      >
        <Input.Password
          autoComplete="current-password"
          placeholder={t("auth.passwordPlaceholder")}
          prefix={<LockOutlined aria-hidden="true" />}
          size="large"
        />
      </Form.Item>

      <Button
        block
        htmlType="submit"
        icon={<LoginOutlined aria-hidden="true" />}
        loading={passwordLogin.isLoading}
        size="large"
        type="primary"
      >
        {t("auth.signIn")}
      </Button>
      </Form>
    </>
  );
};

const OidcLogin = ({ returnTo }: { returnTo?: string }) => {
  const { t } = useTranslation(APP_I18N_NAMESPACE);
  const larkLogin = useLarkLogin();

  return (
    <Space className="login-oidc" direction="vertical" size="middle">
      <Button
        block
        icon={<LoginOutlined aria-hidden="true" />}
        loading={larkLogin.isLoading}
        onClick={() => larkLogin.startLogin(returnTo)}
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
  const { t } = useTranslation(APP_I18N_NAMESPACE);
  // `createAuthProvider.check()` dựng link `/login?returnTo=<path>` khi chặn
  // deep-link hoặc phiên hết hạn; đọc lại để trả người dùng đúng trang ban đầu.
  const [searchParams] = useSearchParams();
  const pendingReturnTo = searchParams.get("returnTo") ?? undefined;

  return (
    <main className="login-page">
      <Card className="login-card">
        {env.demoAuth ? (
          <Alert
            className="login-demo-alert"
            message={t("auth.demoReady")}
            showIcon
            type="info"
          />
        ) : null}

        {env.demoAuth ? (
          <>
            <CredentialsForm returnTo={pendingReturnTo} />
            <Divider className="login-divider" plain>
              {t("auth.continueWith")}
            </Divider>
          </>
        ) : null}

        <OidcLogin returnTo={pendingReturnTo} />

        <Typography.Text className="login-footer" type="secondary">
          {t("auth.copyright")}
        </Typography.Text>
      </Card>
    </main>
  );
};
