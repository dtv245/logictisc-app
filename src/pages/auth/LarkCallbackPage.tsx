import { useEffect, useRef } from "react";
import { Result, Spin } from "antd";

import { useLarkLogin } from "../../hooks/auth/useLarkLogin";

export const LarkCallbackPage = () => {
  const callbackStarted = useRef(false);
  const { completeLogin, data, error, isError } = useLarkLogin();

  useEffect(() => {
    if (!callbackStarted.current) {
      callbackStarted.current = true;
      completeLogin();
    }
  }, [completeLogin]);

  const callbackError = isError ? error : data?.success === false ? data.error : undefined;

  if (callbackError) {
    return (
      <Result
        status="error"
        title="Không thể hoàn tất đăng nhập Lark"
        subTitle={callbackError.message}
      />
    );
  }

  return (
    <main className="auth-page">
      <Spin size="large" tip="Đang xác thực phiên đăng nhập..." />
    </main>
  );
};
