import { EntityPicker } from "@/components/EntityPicker";

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
}: TerminalSelectProps) => {
  return (
    <div style={style} className={className}>
      <EntityPicker
        resource="terminals"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        excludeValues={excludeIds}
        pageSize={50}
        labelFormat={(r) => (r.name ? `${r.name} (${r.code ?? ""})` : String(r.id ?? ""))}
      />
    </div>
  );
};
