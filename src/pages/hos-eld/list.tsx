/** Hiển thị danh sách HOS/ELD bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { HosLog } from "../../types/hos-eld";
import { hosEldColumns } from "./columns";
export const HosEldList = () => <ResourceListPage<HosLog> columns={hosEldColumns} resource="hos-eld" />;
