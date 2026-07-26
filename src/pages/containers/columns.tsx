/** Định nghĩa columns cho Container resource. */
import { createCrudColumns } from "../../components";
import type { Container } from "../../types/load";
export const containerColumns = createCrudColumns<Container>("containers", [
  { dataIndex: "number", title: "Số container", sorter: true },
  { dataIndex: "isoType", title: "ISO type", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
  { dataIndex: "grossWeight", title: "Trọng lượng", sorter: true },
]);
