/** Hiển thị danh sách tai nạn bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { AccidentReport } from "@/types/accident.types";
import { accidentColumns } from "@features/accidents/components/columns";
export const AccidentList = () => <ResourceListPage<AccidentReport> columns={accidentColumns} resource="accidents" />;
