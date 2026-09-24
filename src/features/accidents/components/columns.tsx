/** Định nghĩa columns cho Accident resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { AccidentReport } from "@/types/accident.types";
export const accidentColumns = createCrudColumns<AccidentReport>("accidents", [
  { dataIndex: "accidentDateTime", titleKey: "columns.accidents.accidentDateTime", sorter: true },
  { dataIndex: "accidentType", titleKey: "columns.accidents.accidentType", sorter: true },
  { dataIndex: "severity", titleKey: "columns.accidents.severity", status: true, sorter: true },
  { dataIndex: "status", titleKey: "columns.accidents.status", status: true, sorter: true },
]);
