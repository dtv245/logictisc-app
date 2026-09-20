/** Định nghĩa columns cho Load resource. */
import { createCrudColumns } from "@components";
import { displayValue } from "@formatters/display";
import type { Load } from "@/types/load.types";

export const loadColumns = createCrudColumns<Load>("loads", [
  { dataIndex: "number", title: "Số load", sorter: true },
  { dataIndex: "name", title: "Tên", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
  {
    dataIndex: "customerName",
    title: "Khách hàng",
    render: (value: unknown, record: Load) => displayValue(value, record.customerId),
  },
  {
    dataIndex: "assignedTruckNumber",
    title: "Xe phụ trách",
    render: (value: unknown) => displayValue(value),
  },
]);

