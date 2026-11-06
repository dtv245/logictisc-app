/**
 * Ô nhập cho filter dạng chuỗi (`kind: "search"` hoặc `kind: "text"`).
 *
 * Tách khỏi `FilterBar` vì `ResourceListToolbar` cũng cần render đúng loại control
 * này. Trước đây toolbar coi mọi control không phải `select` là quan hệ, nên filter
 * văn bản (ví dụ `customers.status`, `terminals.countryCode`) bị dựng thành
 * `EntityPicker` với `resource=""` — data provider ném `RESOURCE_NOT_CONFIGURED`.
 *
 * Gõ phím chỉ cập nhật bản nháp; sau khi debounce mới đẩy giá trị lên cha, để mỗi
 * phím gõ không kéo theo một request danh sách.
 */
import { Input } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedSearch } from "@hooks/useDebouncedSearch";
import type { ResourceFilterControl } from "./resources/resourceFilterControls";

export interface SearchFieldProps {
  control: ResourceFilterControl;
  onChange: (value: string | undefined) => void;
  value: string | undefined;
}

export const SearchField = ({ control, onChange, value }: SearchFieldProps) => {
  const { t } = useTranslation();
  const applied = value ?? "";
  const [draft, setDraft] = useState(applied);
  const debounced = useDebouncedSearch(draft);

  // Điều chỉnh state ngay trong lúc render khi cha đổi giá trị từ bên ngoài
  const [lastApplied, setLastApplied] = useState(applied);
  if (applied !== lastApplied) {
    setLastApplied(applied);
    setDraft(applied);
  }

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
      placeholder={control.kind === "search" ? t("filters.searchPlaceholder") : label}
      style={{ width: "100%" }}
      value={draft}
    />
  );
};
