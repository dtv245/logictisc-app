/** Định nghĩa columns cho HOS/ELD resource. */
import { createCrudColumns } from "../../components";
import type { HosLog } from "../../types/hos-eld";
export const hosEldColumns = createCrudColumns<HosLog>("hos-eld", [
  { dataIndex: "logDate", title: "Ngày log", sorter: true },
  { dataIndex: "employeeId", title: "Tài xế" },
  { dataIndex: "dutyStatus", title: "Duty status", sorter: true },
  { dataIndex: "durationMinutes", title: "Số phút", sorter: true },
]);
