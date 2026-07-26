/** Hiển thị danh sách tai nạn bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { AccidentReport } from "../../types/accident";
import { accidentColumns } from "./columns";
export const AccidentList = () => <ResourceListPage<AccidentReport> columns={accidentColumns} resource="accidents" />;
