/** Hiển thị danh sách tai nạn bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { AccidentReport } from "@/types/accidents/accidents.types";
import { accidentColumns } from "@/components/accidents/columns";
export const AccidentList = () => <ResourceListPage<AccidentReport> columns={accidentColumns} resource="accidents" />;
