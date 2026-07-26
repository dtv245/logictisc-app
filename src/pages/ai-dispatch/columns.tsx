/** Định nghĩa columns cho AI Dispatch resource. */
import { createCrudColumns } from "../../components";
import type { AiDispatchSession } from "../../types/ai-dispatch";
export const aiDispatchColumns = createCrudColumns<AiDispatchSession>("ai-dispatch", [
  { dataIndex: "number", title: "Số phiên", sorter: true },
  { dataIndex: "mode", title: "Chế độ", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
  { dataIndex: "startedAt", title: "Bắt đầu", sorter: true },
]);
