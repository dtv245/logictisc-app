/** Định nghĩa columns cho Terminal resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { Terminal } from "@/types/terminal.types";
export const terminalColumns = createCrudColumns<Terminal>("terminals", [
  { dataIndex: "code", titleKey: "columns.terminals.code", sorter: true },
  { dataIndex: "name", titleKey: "columns.terminals.name", sorter: true },
  { dataIndex: "type", titleKey: "columns.terminals.type", options: true, sorter: true },
  { dataIndex: "countryCode", titleKey: "columns.terminals.countryCode", sorter: true },
]);
