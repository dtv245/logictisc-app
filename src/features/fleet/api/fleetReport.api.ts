/** Spring accepts comma-separated UUID list; keep generic query/API foundation unchanged. */
import type { FleetReportQuery } from "@/types/fleetReport.dto";
export const fleetReportApi = { health: "/api/reports/fleet/health" };
export const fleetReportKey = (tenant: string | undefined, query: FleetReportQuery | null) => ["fleet-report", tenant, query] as const;
