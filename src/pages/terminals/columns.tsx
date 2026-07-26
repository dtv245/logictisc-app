/** Định nghĩa columns cho Terminal resource. */
import { createCrudColumns } from "../../components";
import type { Terminal } from "../../types/load";
export const terminalColumns = createCrudColumns<Terminal>("terminals", [
  { dataIndex: "code", title: "Mã", sorter: true },
  { dataIndex: "name", title: "Tên terminal", sorter: true },
  { dataIndex: "type", title: "Loại", sorter: true },
  { dataIndex: "countryCode", title: "Quốc gia", sorter: true },
]);
