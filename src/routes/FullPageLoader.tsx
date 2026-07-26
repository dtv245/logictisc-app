import { Flex, Spin } from "antd";

export const FullPageLoader = () => (
  <Flex align="center" justify="center" className="full-page-loader">
    <Spin size="large" tip="Đang tải..." />
  </Flex>
);
