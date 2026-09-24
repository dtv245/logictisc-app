/** Định nghĩa columns cho Load resource. */
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import type { Load } from "@/types/load.types";

export const loadColumns = createCrudColumns<Load>("loads", [
  { dataIndex: "number", titleKey: "columns.loads.number", sorter: true },
  { dataIndex: "name", titleKey: "columns.loads.name", sorter: true },
  { dataIndex: "status", titleKey: "columns.loads.status", status: true, sorter: true },
  {
    dataIndex: "customerName",
    titleKey: "columns.loads.customerName",
    render: (value: unknown, record: Load) => displayValue(value, record.customerId),
  },
  {
    dataIndex: "assignedTruckNumber",
    titleKey: "columns.loads.assignedTruckNumber",
    render: (value: unknown) => displayValue(value),
  },
]);

