/** Định nghĩa columns cho Load resource. */
import { createCrudColumns } from "../../components";
import type { Load } from "../../types/load";

export const loadColumns = createCrudColumns<Load>("loads", [
  { dataIndex: "number", title: "Số load", sorter: true },
  { dataIndex: "name", title: "Tên", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
  { dataIndex: "customerId", title: "Khách hàng" },
]);
