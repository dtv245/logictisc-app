import { Tooltip } from "antd";
import { payrollReasonDescription } from "@/constants/payrollReasons";

export function PayrollReason({ reason }: { reason: string | null }) {
  if (!reason) return <>—</>;
  const isCode = /^[A-Z][A-Z0-9_]*$/.test(reason);
  const text = payrollReasonDescription(reason);
  return isCode ? <Tooltip title={`Mã hỗ trợ: ${reason}`}><span tabIndex={0}>{text}</span></Tooltip> : <>{text}</>;
}
