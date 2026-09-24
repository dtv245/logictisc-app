/**
 * Cung cấp show page chuẩn dùng Refine useShow cho resource chưa có UI riêng.
 */

import { Show, TextField } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useShow } from "@refinedev/core";
import { Alert, Button, Descriptions, Empty } from "antd";

import { useTranslation } from "react-i18next";

import type { ApiError } from "@/types/api.types";

interface ResourceShowPageProps {
  resource: string;
}

const getRecordEntries = (
  value: unknown,
): Array<[string, unknown]> =>
  typeof value === "object" && value !== null ? Object.entries(value) : [];

const formatValue = (value: unknown, emptyValue: string): string => {
  if (value === null || value === undefined || value === "") {
    return emptyValue;
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

export const ResourceShowPage = ({ resource }: ResourceShowPageProps) => {
  const { t } = useTranslation();
  // useShow giữ query key, loading và error lifecycle đồng nhất với Refine.
  const { queryResult } = useShow<BaseRecord, ApiError>({ resource });
  const entries = getRecordEntries(queryResult.data?.data);
  const emptyValue = t("crud.emptyValue");

  // Trước đây chỉ có `isLoading`: query lỗi thì trang hiện khung rỗng mãi, người dùng
  // không biết vì sao và không có cách thử lại.
  if (queryResult.isError) {
    return (
      <Alert
        action={
          <Button onClick={() => void queryResult.refetch()} size="small">
            {t("actions.retry")}
          </Button>
        }
        description={queryResult.error?.message}
        message={t("crud.loadError")}
        showIcon
        type="error"
      />
    );
  }

  // `Empty` lấy chữ mô tả từ locale của antd (xem AntdLocaleProvider), không cần khoá riêng.
  const isEmpty = !queryResult.isLoading && entries.length === 0;

  return (
    <Show isLoading={queryResult.isLoading}>
      {isEmpty ? (
        <Empty />
      ) : (
        <Descriptions bordered column={1}>
          {entries.map(([field, value]) => (
            <Descriptions.Item key={field} label={field}>
              <TextField value={formatValue(value, emptyValue)} />
            </Descriptions.Item>
          ))}
        </Descriptions>
      )}
    </Show>
  );
};
