/** Định nghĩa columns cho Truck resource. */
import { Link } from "react-router-dom";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import type { Truck } from "@/types/truck.types";

export const truckColumns = createCrudColumns<Truck>("trucks", [
  {
    dataIndex: "number",
    titleKey: "columns.trucks.number",
    sorter: true,
    render: (value: unknown, record: Truck) => (
      <Link to={routes.resources.trucks.show.replace(":id", String(record.id))}>
        <strong>{displayValue(value)}</strong>
      </Link>
    ),
  },
  { dataIndex: "type", titleKey: "columns.trucks.type", options: true, sorter: true },
  { dataIndex: "status", titleKey: "columns.trucks.status", status: true, sorter: true },
  { dataIndex: "licensePlate", titleKey: "columns.trucks.licensePlate" },
  {
    dataIndex: "mainDriverName",
    titleKey: "columns.trucks.mainDriverName",
    render: (value: unknown) => displayValue(value),
  },
]);
