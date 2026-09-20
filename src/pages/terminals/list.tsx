/** Hiển thị danh sách terminal bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { Terminal } from "@/types/terminal.types";
import { terminalColumns } from "@features/terminals/components/columns";
export const TerminalList = () => <ResourceListPage<Terminal> columns={terminalColumns} resource="terminals" />;
