/** Định nghĩa columns cho HOS/ELD resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { HosLog } from "@/types/hos-eld.types";
export const hosEldColumns = createCrudColumns<HosLog>("hos-eld", [
  { dataIndex: "logDate", titleKey: "columns.hos-eld.logDate", sorter: true },
  { dataIndex: "employeeId", titleKey: "columns.hos-eld.employeeId" },
  { dataIndex: "dutyStatus", titleKey: "columns.hos-eld.dutyStatus", status: true, sorter: true },
  { dataIndex: "durationMinutes", titleKey: "columns.hos-eld.durationMinutes", sorter: true },
]);
