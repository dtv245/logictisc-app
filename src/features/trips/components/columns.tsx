/** Định nghĩa columns cho Trip resource. */
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import type { Trip } from "@/types/trip.types";
export const tripColumns = createCrudColumns<Trip>("trips", [
  { dataIndex: "number", titleKey: "columns.trips.number", sorter: true },
  { dataIndex: "name", titleKey: "columns.trips.name", sorter: true },
  { dataIndex: "status", titleKey: "columns.trips.status", status: true, sorter: true },
  {
    dataIndex: "truckNumber",
    titleKey: "columns.trips.truckNumber",
    render: (value: unknown) => displayValue(value),
  },
  { dataIndex: "totalDistance", titleKey: "columns.trips.totalDistance", sorter: true },
]);

