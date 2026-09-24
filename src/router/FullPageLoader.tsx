/**
 * Hiển thị loading state toàn màn hình cho lazy route và auth guard.
 */

import { Flex, Spin, Typography } from "antd";
import { useTranslation } from "react-i18next";

export const FullPageLoader = () => {
  const { t } = useTranslation();

  return (
  <Flex
    align="center"
    justify="center"
    gap="small"
    vertical
    className="full-page-loader"
  >
    <Spin size="large" />
    <Typography.Text type="secondary">{t("common.loading")}</Typography.Text>
  </Flex>
  );
};
