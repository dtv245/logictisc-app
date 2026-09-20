/** Định nghĩa columns cho Trip resource. */
import { createCrudColumns } from "@components";
import type { Trip } from "@/types/trip.types";
export const tripColumns = createCrudColumns<Trip>("trips", [
  { dataIndex: "number", title: "Số trip", sorter: true },
  { dataIndex: "name", title: "Tên", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
  {
    dataIndex: "truckNumber",
    title: "Xe phụ trách",
    render: (value: unknown) => (value ? String(value) : "—"),
  },
  { dataIndex: "totalDistance", title: "Tổng quãng đường", sorter: true },
]);
