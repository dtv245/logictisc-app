/**
 * Cung cấp edit page an toàn khi request DTO chưa được backend xác nhận.
 */

import { Edit } from "@refinedev/antd";
import { Result } from "antd";

import { crudScaffoldText } from "../constants/ui";

export const ResourceEditPage = () => (
  <Edit saveButtonProps={{ disabled: true }}>
    <Result
      status="info"
      subTitle={crudScaffoldText.editNotConfigured}
      title={crudScaffoldText.notConfiguredTitle}
    />
  </Edit>
);
