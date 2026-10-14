import type { BaseRecord } from "@refinedev/core";
import type { ColumnsType } from "antd/es/table";
import { Tooltip } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { StatusTag, type StatusStyleConfig, type StatusTone } from "../components/StatusTag";
import { statusTone } from "../components/statusTone";

type LocalizableColumn<TData extends BaseRecord> = ColumnsType<TData>[number] & {
  titleKey?: string;
  options?: boolean;
  status?: boolean | Record<string, StatusTone | "info" | "default" | StatusStyleConfig>;
  numeric?: boolean;
};

export const useLocalizedColumns = <TData extends BaseRecord>(
  columns: LocalizableColumn<TData>[],
): ColumnsType<TData> => {
  const { t } = useTranslation();

  return useMemo(
    () =>
      columns.map((column) => {
        // Columns thô (không sinh từ createCrudColumns) giữ nguyên tiêu đề.
        if (!("titleKey" in column) || typeof column.titleKey !== "string") {
          return column;
        }

        // Bỏ `titleKey`/`options`/`status` để khoá locale không lọt xuống DOM qua antd Table.
        const { titleKey, options, status, numeric, ...rest } = column;
        const title = t(titleKey);

        const originalRender = rest.render;

        // Render mặc định cho cell trống: "—" màu nhạt thống nhất
        const defaultEmptyRender = (
          <span className="table-cell-empty">{t("crud.emptyValue", "—")}</span>
        );

        if (!options && !status) {
          if (!originalRender) {
            return {
              ...rest,
              title,
              render: (value: unknown) => {
                if (value === null || value === undefined || value === "") {
                  return defaultEmptyRender;
                }
                const text = String(value);
                if (rest.ellipsis) {
                  return (
                    <Tooltip title={text}>
                      <span className="table-cell-ellipsis">{text}</span>
                    </Tooltip>
                  );
                }
                return numeric ? <span className="tabular-nums">{text}</span> : text;
              },
            };
          }
          return { ...rest, title };
        }

        // Cột enum hoặc status:
        return {
          ...rest,
          title,
          render: (value: unknown, record: TData, index: number) => {
            if (originalRender) {
              return originalRender(value, record, index);
            }
            if (value === null || value === undefined || value === "") {
              return defaultEmptyRender;
            }
            const label = t(`forms.options.${String(value)}`, {
              defaultValue: String(value),
            });

            // Cột trạng thái: bọc trong StatusTag với màu ngữ nghĩa
            if (status) {
              const customMap = typeof status === "object" ? status : undefined;
              return (
                <StatusTag
                  label={label}
                  tone={statusTone(value)}
                  statusKey={String(value)}
                  statusMap={customMap}
                />
              );
            }

            return label;
          },
        };
      }),
    [columns, t],
  );
};
