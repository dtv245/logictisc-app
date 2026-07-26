/**
 * Hiển thị trạng thái 404 và điều hướng về dashboard.
 */

import { Button, Result } from "antd";
import { useGo } from "@refinedev/core";

import { routes } from "../../constants/routes";

export const NotFoundPage = () => {
  const go = useGo();

  return (
    <Result
      status="404"
      title="404"
      subTitle="Trang bạn yêu cầu không tồn tại."
      extra={
        <Button
          type="primary"
          onClick={() => go({ to: routes.dashboard, type: "replace" })}
        >
          Về tổng quan
        </Button>
      }
    />
  );
};
