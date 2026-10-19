import { useMemo } from "react";
import { useAiFeatures } from "@/hooks/ai/useAiFeatures";
import { useLoadsAiOverview } from "@/hooks/ai/useLoadsAiOverview";
import { useTableData } from "@/components/TableDataContext";
import { LoadAiOverviewBadge } from "./LoadAiOverviewBadge";

export interface LoadAiOverviewCellProps {
  loadId: string | number;
}

export const LoadAiOverviewCell = ({ loadId }: LoadAiOverviewCellProps) => {
  const { enabled, isLoading: isFeaturesLoading } = useAiFeatures();
  const tableData = useTableData();

  // Thu thập danh sách ID của các load đang hiển thị trên trang hiện tại để gộp 1 request duy nhất
  const loadIds = useMemo(() => {
    if (tableData && tableData.length > 0) {
      return tableData.map((d) => String(d.id));
    }
    return [String(loadId)];
  }, [tableData, loadId]);

  const { getOverview, isLoading } = useLoadsAiOverview(
    loadIds,
    enabled
  );

  // Khi cờ tắt, ẩn toàn bộ UI AI theo yêu cầu
  if (!isFeaturesLoading && !enabled) {
    return null;
  }

  const overview = getOverview(String(loadId));

  if (isLoading && !overview) {
    return <span style={{ color: "#bfbfbf", fontSize: 12 }}>...</span>;
  }

  return <LoadAiOverviewBadge overview={overview} />;
};
