/** Hiển thị danh sách load bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { Load } from "../../types/load";
import { loadColumns } from "./columns";

export const LoadList = () => (
  <ResourceListPage<Load> columns={loadColumns} resource="loads" />
);
