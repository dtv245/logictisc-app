/**
 * Cung cấp create page an toàn khi request DTO chưa được backend xác nhận.
 */

import { Create } from "@refinedev/antd";
import { Result } from "antd";

import { crudScaffoldText } from "../constants/ui";

export const ResourceCreatePage = () => (
  <Create saveButtonProps={{ disabled: true }}>
    <Result
      status="info"
      subTitle={crudScaffoldText.createNotConfigured}
      title={crudScaffoldText.notConfiguredTitle}
    />
  </Create>
);
