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
 * Hỗ trợ nạp 100 bản ghi đầu tiên và tìm kiếm phía server (debounce 300ms) theo search query param.
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
        pageSize={100}
        labelFormat={(r) => (r.name ? `${r.name} (${r.code ?? ""})` : String(r.id ?? ""))}
      />
    </div>
  );
};
