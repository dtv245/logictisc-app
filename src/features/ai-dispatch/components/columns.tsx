/** Định nghĩa columns cho AI Dispatch resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { AiDispatchSession } from "@/types/ai-dispatch.types";
export const aiDispatchColumns = createCrudColumns<AiDispatchSession>("ai-dispatch", [
  { dataIndex: "number", titleKey: "columns.ai-dispatch.number", sorter: true },
  { dataIndex: "mode", titleKey: "columns.ai-dispatch.mode", sorter: true },
  { dataIndex: "status", titleKey: "columns.ai-dispatch.status", status: true, sorter: true },
  { dataIndex: "startedAt", titleKey: "columns.ai-dispatch.startedAt", sorter: true },
]);
