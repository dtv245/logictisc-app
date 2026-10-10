/** Authorized paths are built from validated IDs, never from a server-provided arbitrary download URI. */
import type { LogisticsApiClient } from "@/types/apiClient.types";
import { isUuid } from "@/utils/uuid";
export const payslipApi = { mine: "/api/driver/me/payslips", get: (id: string) => `/api/payslips/${encodeURIComponent(id)}` };
export const payslipKeys = {
  mine: (tenant: string | undefined, employeeId: string | undefined) => ["payslips", tenant, "mine", employeeId] as const,
  detail: (tenant: string | undefined, employeeId: string | undefined, id: string) => ["payslips", tenant, "detail", employeeId, id] as const,
};
export type PayslipDownloader = LogisticsApiClient["download"];
export async function downloadPayslipPdf(id: string, download: PayslipDownloader): Promise<Blob> {
  if (!isUuid(id)) throw new Error("INVALID_PAYSLIP_ID");
  const result = await download({ path: `${payslipApi.get(id)}/pdf` });
  if (!(result.data instanceof Blob) || result.data.type.split(";")[0] !== "application/pdf") throw new Error("INVALID_PAYSLIP_PDF");
  return result.data;
}
export function savePayslipPdf(id: string, blob: Blob): void {
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `payslip-${id}.pdf`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  // Leave the object URL alive until the browser has consumed the anchor click.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
