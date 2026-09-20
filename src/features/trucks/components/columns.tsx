/** Định nghĩa columns cho Truck resource. */
import { createCrudColumns } from "@components";
import type { Truck } from "@/types/truck.types";

export const truckColumns = createCrudColumns<Truck>("trucks", [
  { dataIndex: "number", title: "Số xe", sorter: true },
  { dataIndex: "type", title: "Loại xe", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
  { dataIndex: "licensePlate", title: "Biển số" },
  {
    dataIndex: "mainDriverName",
    title: "Tài xế chính",
    render: (value: unknown) => (value ? String(value) : "—"),
  },
]);
