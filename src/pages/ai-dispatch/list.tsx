/** Hiển thị danh sách phiên AI Dispatch bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { AiDispatchSession } from "../../types/ai-dispatch";
import { aiDispatchColumns } from "./columns";
export const AiDispatchList = () => <ResourceListPage<AiDispatchSession> columns={aiDispatchColumns} resource="ai-dispatch" />;
