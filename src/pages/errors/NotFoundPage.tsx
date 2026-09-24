/**
 * Hiển thị trạng thái 404 và điều hướng về dashboard.
 */

import { Button, Result } from "antd";
import { useGo } from "@refinedev/core";
import { useTranslation } from "react-i18next";

import { routes } from "@constants/routes";

export const NotFoundPage = () => {
  const go = useGo();
  const { t } = useTranslation();

  return (
    <Result
      status="404"
      title="404"
      subTitle={t("errors.notFound")}
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
