/** Định nghĩa columns cho DVIR resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { DvirReport } from "@/types/dvir.types";
export const dvirColumns = createCrudColumns<DvirReport>("dvir", [
  { dataIndex: "inspectionDate", titleKey: "columns.dvir.inspectionDate", sorter: true },
  { dataIndex: "type", titleKey: "columns.dvir.type", sorter: true },
  { dataIndex: "status", titleKey: "columns.dvir.status", status: true, sorter: true },
  { dataIndex: "truckId", titleKey: "columns.dvir.truckId" },
]);
