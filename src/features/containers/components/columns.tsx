/** Định nghĩa columns cho Container resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { Container } from "@/types/container.types";
export const containerColumns = createCrudColumns<Container>("containers", [
  { dataIndex: "number", titleKey: "columns.containers.number", sorter: true },
  { dataIndex: "isoType", titleKey: "columns.containers.isoType", sorter: true },
  { dataIndex: "status", titleKey: "columns.containers.status", status: true, sorter: true },
  { dataIndex: "grossWeight", titleKey: "columns.containers.grossWeight", sorter: true },
]);
