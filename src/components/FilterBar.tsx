/**
 * FilterBar — thanh lọc phía trên bảng list.
 *
 * Component này **thuần hiển thị**: nó không biết `useTable`, không biết URL, không
 * biết field nào được phép lọc (việc đó ở `resourceFilterControls.ts`). Nhờ vậy toàn
 * bộ logic "đổi filter thì reset trang" nằm ở một chỗ (`useEntityFilters`) và test
 * được mà không cần dựng cả bảng.
 *
 * Ô tìm kiếm là control duy nhất có state riêng, vì nó cần debounce: gọi `onChange`
 * theo từng phím gõ là mỗi ký tự một request, và request của tiền tố có thể về sau
 * request của chuỗi đầy đủ. Các control còn lại gọi `onChange` ngay.
 */
import { Button, Flex, Input, Select } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedSearch } from "@hooks/useDebouncedSearch";
import { EntityPicker } from "./EntityPicker";
import type { ResourceFilterControl } from "./resources/resourceFilterControls";

export interface FilterBarProps {
  controls: readonly ResourceFilterControl[];
  /** Gọi khi một filter đổi; `undefined` nghĩa là bỏ filter đó. */
  onChange: (field: string, value: string | undefined) => void;
  onReset: () => void;
  /** Giá trị đang áp dụng, khoá theo `field` (tên query param). */
  value: Readonly<Record<string, string | undefined>>;
}

interface SearchFieldProps {
  control: ResourceFilterControl;
  onChange: (value: string | undefined) => void;
  value: string | undefined;
}

const SearchField = ({ control, onChange, value }: SearchFieldProps) => {
  const { t } = useTranslation();
  const applied = value ?? "";
  const [draft, setDraft] = useState(applied);
  const debounced = useDebouncedSearch(draft);

  // Điều chỉnh state **ngay trong lúc render** (mẫu "adjusting state when a prop
  // changes" của React) chứ không trong effect: effect chỉ chạy sau khi commit, tức là
  // có một nhịp ô nhập hiện chữ cũ trong khi bảng đã bỏ lọc. Đây là nhánh chạy khi cha
  // đổi giá trị từ bên ngoài — bấm "Xoá bộ lọc", hoặc back/forward vì `useTable` đồng
  // bộ filter lên URL.
  const [lastApplied, setLastApplied] = useState(applied);
  if (applied !== lastApplied) {
    setLastApplied(applied);
    setDraft(applied);
  }

  // `appliedRef` và `onChangeRef` để effect dưới chỉ phụ thuộc `debounced`. Nếu phụ
  // thuộc `onChange` (call site truyền arrow mới mỗi render) thì effect chạy lại mỗi
  // render, và ngay sau một lần xoá filter từ bên ngoài nó sẽ đẩy `debounced` cũ —
  // chưa kịp theo `draft` mới — ngược lên cha, làm filter vừa xoá sống lại.
  const appliedRef = useRef(applied);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    appliedRef.current = applied;
  }, [applied]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (debounced === appliedRef.current) {
      return;
    }
    onChangeRef.current(debounced === "" ? undefined : debounced);
  }, [debounced]);

  const label = t(control.labelKey);

  return (
    <Input
      allowClear
      aria-label={label}
      onChange={(event) => setDraft(event.target.value)}
      placeholder={t("filters.searchPlaceholder")}
      style={{ minWidth: 220 }}
      value={draft}
    />
  );
};

export function FilterBar({
  controls,
  onChange,
  onReset,
  value,
}: FilterBarProps) {
  const { t } = useTranslation();

  if (controls.length === 0) {
    return null;
  }

  // Chỉ hiện nút xoá khi thật sự có gì để xoá — nút luôn hiện nhưng không làm gì là
  // cách chắc chắn nhất để người dùng ngừng tin nó.
  const hasActiveFilter = controls.some((control) => {
    const current = value[control.field];
    return current !== undefined && current !== "";
  });

  return (
    <Flex
      align="center"
      aria-label={t("filters.ariaLabel")}
      gap="small"
      role="group"
      style={{ marginBottom: 16 }}
      wrap
    >
      {controls.map((control) => {
        if (control.kind === "search") {
          return (
            <SearchField
              control={control}
              key={control.field}
              onChange={(next) => onChange(control.field, next)}
              value={value[control.field]}
            />
          );
        }

        const label = t(control.labelKey);

        if (control.kind === "select") {
          return (
            <Select
              allowClear
              aria-label={label}
              key={control.field}
              onChange={(next: string | undefined) =>
                onChange(control.field, next)
              }
              options={(control.options ?? []).map((option) => ({
                label: t(`forms.options.${option}`, { defaultValue: option }),
                value: option,
              }))}
              placeholder={label}
              style={{ minWidth: 180 }}
              value={value[control.field]}
            />
          );
        }

        return (
          <EntityPicker
            key={control.field}
            onChange={(next) => onChange(control.field, next)}
            placeholder={label}
            resource={control.relationResource ?? ""}
            value={value[control.field]}
          />
        );
      })}
      {hasActiveFilter ? (
        <Button onClick={onReset} type="link">
          {t("filters.clear")}
        </Button>
      ) : null}
    </Flex>
  );
}
