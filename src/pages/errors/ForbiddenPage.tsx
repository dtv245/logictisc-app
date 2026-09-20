/**
 * Hiển thị trạng thái 403 và điều hướng về dashboard.
 */

import { Button, Result } from "antd";
import { useGo } from "@refinedev/core";
import { useTranslation } from "react-i18next";

import { routes } from "@constants/routes";

export const ForbiddenPage = () => {
  const go = useGo();
  const { t } = useTranslation();

  return (
    <Result
      status="403"
      title="403"
      subTitle={t("errors.forbidden")}
      extra={
        <Button
          type="primary"
          onClick={() => go({ to: routes.dashboard, type: "replace" })}
        >
          {t("common.goDashboard")}
        </Button>
      }
    />
  );
};
