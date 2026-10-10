import { useEffect, useRef } from "react";
import { Button, Card, Result, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import { routes } from "@constants/routes";
import { useLarkLogin } from "@hooks/useLarkLogin";

export const LarkCallbackPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Ref ngăn callback chạy trùng khi React StrictMode mount effect lại.
  const callbackStarted = useRef(false);
  const { completeLogin, data, error, isError } = useLarkLogin();

  const code = searchParams.get("code") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const urlError = searchParams.get("error") ?? undefined;
  const urlErrorDescription =
    searchParams.get("error_description") ?? undefined;

  // Callback phụ thuộc completeLogin mới nhất và không cần cleanup vì đây là
  // mutation HTTP một lần, không phải subscription.
  useEffect(() => {
    if (!callbackStarted.current) {
      callbackStarted.current = true;
      completeLogin({
        code,
        state,
        error: urlError,
        errorDescription: urlErrorDescription,
      });
    }
  }, [completeLogin, code, state, urlError, urlErrorDescription]);

  const callbackError = isError
    ? error
    : data?.success === false
      ? data.error
      : undefined;

  const isCancelled =
    urlError === "access_denied" ||
    (typeof callbackError === "object" &&
      callbackError !== null &&
      "name" in callbackError &&
      (callbackError as { name: string }).name === "LARK_AUTH_CANCELLED");

  if (callbackError || urlError) {
    const errorMessage =
      typeof callbackError === "object" &&
      callbackError !== null &&
      "message" in callbackError &&
      typeof (callbackError as { message?: unknown }).message === "string"
        ? (callbackError as { message: string }).message
        : urlErrorDescription ?? t("auth.callbackError");

    return (
      <main className="login-page">
        <Card className="login-callback-card">
          <Result
            status={isCancelled ? "warning" : "error"}
            title={
              isCancelled
                ? t("auth.callbackCancelled")
                : t("auth.callbackError")
            }
            subTitle={errorMessage}
            extra={
              <Button
                type="primary"
                onClick={() => navigate(routes.login)}
              >
                {t("auth.backToLogin")}
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
