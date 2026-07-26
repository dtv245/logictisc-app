/** Hiển thị danh sách terminal bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { Terminal } from "../../types/load";
import { terminalColumns } from "./columns";
export const TerminalList = () => <ResourceListPage<Terminal> columns={terminalColumns} resource="terminals" />;
