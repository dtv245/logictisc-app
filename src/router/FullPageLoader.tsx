/**
 * Hiển thị loading state toàn màn hình cho lazy route và auth guard.
 */

import { Flex, Spin, Typography } from "antd";

export const FullPageLoader = () => (
  <Flex
    align="center"
    justify="center"
    gap="small"
    vertical
    className="full-page-loader"
  >
    <Spin size="large" />
    <Typography.Text type="secondary">Đang tải...</Typography.Text>
  </Flex>
);
