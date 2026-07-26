/** Định nghĩa columns cho Accident resource. */
import { createCrudColumns } from "../../components";
import type { AccidentReport } from "../../types/accident";
export const accidentColumns = createCrudColumns<AccidentReport>("accidents", [
  { dataIndex: "accidentDateTime", title: "Thời điểm", sorter: true },
  { dataIndex: "accidentType", title: "Loại", sorter: true },
  { dataIndex: "severity", title: "Mức độ", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
]);
