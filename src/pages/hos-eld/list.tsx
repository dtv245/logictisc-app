/** Hiển thị danh sách HOS/ELD bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { HosLog } from "@/types/hos-eld.types";
import { hosEldColumns } from "@features/hos-eld/components/columns";
export const HosEldList = () => <ResourceListPage<HosLog> columns={hosEldColumns} resource="hos-eld" />;
