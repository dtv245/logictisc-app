import { useOne } from "@refinedev/core";
import { Form, type FormInstance } from "antd";
import { useEffect } from "react";

import { buildTerminalAddressValues } from "@/features/loads/utils/terminalAutofill";
import type { Terminal } from "@/types/terminal.types";

export interface TerminalAddressAutofillProps {
  addressPrefix: string;
  /** Tiền tố toạ độ, ví dụ "originLocation" — điền khi Terminal có toạ độ dùng được. */
  coordinatePrefix?: string;
  form: FormInstance;
  terminalField: string;
}

/**
 * Khi chọn bến bãi, điền địa chỉ (và toạ độ nếu có) còn trống từ dữ liệu Terminal.
 *
 * Quy tắc: field người dùng đã chạm (`isFieldTouched`) không bị ghi đè.
 */
export function TerminalAddressAutofill({
  addressPrefix,
  coordinatePrefix,
  form,
  terminalField,
}: TerminalAddressAutofillProps) {
  const terminalId = Form.useWatch(terminalField, form) as string | undefined;
  const query = useOne<Terminal>({
    resource: "terminals",
    id: terminalId ?? "",
    queryOptions: { enabled: Boolean(terminalId), staleTime: 5 * 60 * 1000 },
  });

  const terminal = query.data?.data;

  useEffect(() => {
    if (!terminal || !terminalId) return;
    if (String(terminal.id) !== String(terminalId)) return;

    const values = buildTerminalAddressValues(terminal, addressPrefix, coordinatePrefix);
    for (const [name, value] of Object.entries(values)) {
      if (form.isFieldTouched(name)) continue;
      form.setFieldValue(name, value);
    }
  }, [addressPrefix, coordinatePrefix, form, terminal, terminalId]);

  return null;
}
