/**
 * Hoàn tất callback đăng nhập Lark đúng một lần cho mỗi mount.
 */

import { useEffect, useRef } from "react";
import { Card, Result, Spin } from "antd";
import { useTranslation } from "react-i18next";

import { useLarkLogin } from "@hooks/useLarkLogin";

export const LarkCallbackPage = () => {
  const { t } = useTranslation();
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
    return (
      <main className="login-page">
        <Card className="login-callback-card">
          <Result
            status="error"
            title={t("auth.callbackError")}
            subTitle={callbackError.message}
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
