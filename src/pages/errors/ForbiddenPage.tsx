/**
 * Hiển thị trạng thái 403 và điều hướng về dashboard.
 */

import { Button, Result } from "antd";
import { useGo } from "@refinedev/core";

import { routes } from "../../constants/routes";

export const ForbiddenPage = () => {
  const go = useGo();

  return (
    <Result
      status="403"
      title="403"
      subTitle="Bạn không có quyền truy cập trang này."
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
