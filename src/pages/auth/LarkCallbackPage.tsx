/**
 * Hoàn tất callback đăng nhập Lark đúng một lần cho mỗi mount.
 */

import { useEffect, useRef } from "react";
import { Result, Spin } from "antd";

import { useLarkLogin } from "../../hooks/useLarkLogin";

export const LarkCallbackPage = () => {
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
