/**
 * Dịch `titleKey` (và giá trị enum) của columns do `createCrudColumns` tạo ra.
 *
 * Phải chạy lúc render chứ không phải lúc import module: `AppBootstrap` chỉ gọi
 * `i18n.changeLanguage` sau khi tải xong runtime config, tức là sau khi các file
 * columns đã được import. Dịch ở cấp module sẽ luôn ra sai ngôn ngữ.
 *
 * Cột có cờ `status` được bọc thêm `StatusTag`: màu lấy từ `statusTone` (bảng tra
 * dùng chung), nhãn lấy từ cùng khoá `forms.options.*` mà form select dùng — nên
 * bảng và form không thể lệch chữ.
 */

import type { BaseRecord } from "@refinedev/core";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { StatusTag } from "./StatusTag";
import { statusTone } from "./statusTone";

/**
 * Column có thể mang thêm 3 khoá riêng của `createCrudColumns`. Khai báo dạng này
 * (thay vì `ColumnsType`) vì antd không biết `titleKey`/`options`/`status`; cả ba
 * đều optional nên `ColumnsType` vẫn gán được vào đây.
 */
type LocalizableColumn<TData extends BaseRecord> = ColumnsType<TData>[number] & {
  titleKey?: string;
  options?: boolean;
  status?: boolean;
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
        const { titleKey, options, status, ...rest } = column;
        const title = t(titleKey);

        if (!options && !status) {
          return { ...rest, title };
        }

        // Cột enum: dịch giá trị qua `forms.options.*` (cùng khoá mà form select dùng).
        // `defaultValue` giữ nguyên giá trị thô nếu backend trả về enum chưa có bản dịch.
        const originalRender = rest.render;
        return {
          ...rest,
          title,
          render: (value: unknown, record: TData, index: number) => {
            if (originalRender) {
              return originalRender(value, record, index);
            }
            if (value === null || value === undefined || value === "") {
              return t("crud.emptyValue");
            }
            const label = t(`forms.options.${String(value)}`, {
              defaultValue: String(value),
            });

            // Cột trạng thái hiện thêm màu; giá trị lạ vẫn ra Tag nhưng ở tone neutral.
            return status ? <StatusTag label={label} tone={statusTone(value)} /> : label;
          },
        };
      }),
    [columns, t],
  );
};
