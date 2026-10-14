/** Hiển thị danh sách DVIR bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { DvirReport } from "@/features/dvir/types";
import { dvirColumns } from "@features/dvir/components/columns";
export const DvirList = () => <ResourceListPage<DvirReport> columns={dvirColumns} resource="dvir" />;
