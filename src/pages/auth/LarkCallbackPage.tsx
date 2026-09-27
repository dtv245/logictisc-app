/**
 * Hoàn tất callback đăng nhập Lark đúng một lần cho mỗi mount.
 */

import { useEffect, useRef } from "react";
import { Card, Result, Spin, Button } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useLarkLogin } from "@hooks/useLarkLogin";
import { routes } from "@constants/routes";

const getCallbackErrorMessage = (
  error: unknown,
  t: ReturnType<typeof useTranslation>["t"],
): string => {
  const msg =
    error instanceof Error ? error.message : String(error ?? "");

  if (
    msg.includes("STATE_MISMATCH") ||
    msg.includes("LARK_CALLBACK_STATE_MISMATCH")
  ) {
    return t("auth.callbackErrorState");
  }

  if (
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("UNAUTHORIZED") ||
    msg.includes("FORBIDDEN")
  ) {
    return t("auth.callbackErrorUnauthorized");
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return t("auth.callbackError");
};

export const LarkCallbackPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Ref ngăn callback chạy trùng khi React StrictMode mount effect lại.
  const callbackStarted = useRef(false);
  const { completeLogin, data, error, isError } = useLarkLogin();

  // Callback phụ thuộc completeLogin mới nhất và không cần cleanup vì đây là
  // mutation HTTP một lần, không phải subscription.
  useEffect(() => {
    if (!callbackStarted.current) {
      callbackStarted.current = true;
      completeLogin();
    }
  }, [completeLogin]);

  const callbackError = isError ? error : data?.success === false ? data.error : undefined;

  if (callbackError) {
    const errorMessage = getCallbackErrorMessage(callbackError, t);
    return (
      <main className="login-page">
        <Card className="login-callback-card">
          <Result
            status="error"
            title={t("auth.callbackError")}
            subTitle={errorMessage}
            extra={
              <Button
                type="primary"
                onClick={() => navigate(routes.login)}
              >
                {t("actions.retry")}
              </Button>
            }
          />
        </Card>
      </main>
    );
  }

  return (
    <main className="login-page">
      <Card className="login-callback-card">
        <Result
          icon={<Spin size="large" />}
          title={t("auth.callbackLoading")}
        />
      </Card>
    </main>
  );
};
