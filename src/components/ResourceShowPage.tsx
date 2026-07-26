/**
 * Cung cấp show page chuẩn dùng Refine useShow cho resource chưa có UI riêng.
 */

import { Show, TextField } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useShow } from "@refinedev/core";
import { Descriptions } from "antd";

import type { ApiError } from "../types/api";
import { crudScaffoldText } from "../constants/ui";

interface ResourceShowPageProps {
  resource: string;
}

const getRecordEntries = (
  value: unknown,
): Array<[string, unknown]> =>
  typeof value === "object" && value !== null ? Object.entries(value) : [];

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return crudScaffoldText.emptyValue;
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

export const ResourceShowPage = ({ resource }: ResourceShowPageProps) => {
  // useShow giữ query key, loading và error lifecycle đồng nhất với Refine.
  const { queryResult } = useShow<BaseRecord, ApiError>({ resource });
  const entries = getRecordEntries(queryResult.data?.data);

  return (
    <Show isLoading={queryResult.isLoading}>
      <Descriptions bordered column={1}>
        {entries.map(([field, value]) => (
          <Descriptions.Item key={field} label={field}>
            <TextField value={formatValue(value)} />
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Show>
  );
};
