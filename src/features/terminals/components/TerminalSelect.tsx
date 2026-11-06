import { Button } from "antd";
import { useState } from "react";

import { AutoOpen } from "@/components/AutoOpen";
import { EntityPicker } from "@/components/EntityPicker";
import { TerminalCreateModal } from "@/components/terminals/TerminalCreateModal";
import type { Terminal } from "@/types/terminals/terminal.types";
import {
  readRecentSelections,
  rememberRecentSelection,
  type SelectionStorage,
} from "@/utils/recentSelections";

const RECENT_TERMINALS_KEY = "logistics.recentTerminals";

const browserStorage = (): SelectionStorage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

export interface TerminalSelectProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  required?: boolean;
  style?: React.CSSProperties;
  className?: string;
  excludeIds?: readonly string[];
  /** Hiện lối tắt tạo bến bãi mới ngay dưới dropdown. */
  allowCreate?: boolean;
}

/**
 * TerminalSelect — Dropdown chọn Terminal dùng lại cho các form (Load form SCR-T02 cho origin/destination).
 * Hỗ trợ tìm kiếm phía server, giới hạn 50 lựa chọn và debounce 300ms.
 */
export const TerminalSelect = ({
  value,
  onChange,
  placeholder = "Chọn bến bãi / cảng (Terminal)...",
  disabled = false,
  required = false,
  style,
  className,
  excludeIds,
  allowCreate = false,
}: TerminalSelectProps) => {
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    const storage = browserStorage();
    return storage ? readRecentSelections(storage, RECENT_TERMINALS_KEY) : [];
  });
  // Mỗi lần bấm "tạo mới" tăng key để modal remount và tự mở lại sau khi hủy.
  const [createRequest, setCreateRequest] = useState(0);

  const handleChange = (next: string | undefined) => {
    onChange?.(next);
    const storage = browserStorage();
    if (storage && next) {
      setRecentIds(rememberRecentSelection(storage, RECENT_TERMINALS_KEY, next));
    }
  };

  const handleCreated = (terminal: Terminal) => {
    handleChange(terminal.id);
    setCreateRequest(0);
  };

  return (
    <div style={style} className={className}>
      <EntityPicker
        resource="terminals"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        excludeValues={excludeIds}
        pageSize={50}
        preferredValues={recentIds}
        labelFormat={(r) => (r.name ? `${r.name} (${r.code ?? ""})` : String(r.id ?? ""))}
      />
      {allowCreate && (
        <Button
          onClick={() => setCreateRequest((current) => current + 1)}
          size="small"
          style={{ paddingInline: 0 }}
          type="link"
        >
          + Tạo bến bãi mới
        </Button>
      )}
      {allowCreate && createRequest > 0 && (
        <TerminalCreateModal
          key={createRequest}
          onCreated={handleCreated}
          trigger={(show) => <AutoOpen show={show} />}
        />
      )}
    </div>
  );
};
