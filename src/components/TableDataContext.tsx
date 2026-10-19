import { createContext, useContext } from "react";
import type { BaseRecord } from "@refinedev/core";

export const TableDataContext = createContext<BaseRecord[]>([]);
export const useTableData = () => useContext(TableDataContext);
