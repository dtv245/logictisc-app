/** Reads explicit immutable resolution evidence without reconstructing payroll policy decisions. */
import { z } from "zod";
const resolutionSnapshot = z.object({ jurisdictionResolution: z.object({ source: z.string().nullable(), profileId: z.string().nullable(), profileVersion: z.number().nullable() }).optional() });
export function readPayrollResolution(snapshotJson: string | null) {
  if (!snapshotJson) return undefined;
  try { const result = resolutionSnapshot.safeParse(JSON.parse(snapshotJson)); return result.success ? result.data.jurisdictionResolution : undefined; }
  catch { return undefined; }
}
