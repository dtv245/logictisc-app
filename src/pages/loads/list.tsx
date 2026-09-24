/** Hiển thị danh sách load bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { Load } from "@/types/load.types";
import { loadColumns } from "@features/loads/components/columns";

export const LoadList = () => (
  <ResourceListPage<Load> columns={loadColumns} resource="loads" />
);
