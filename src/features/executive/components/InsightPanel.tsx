/**
 * Panel "Kết luận nhanh" — phần trả lời trực tiếp câu hỏi của ban điều hành.
 *
 * Không có biểu đồ nào ở đây. Mỗi dòng là một câu: kết luận, nguyên nhân kèm
 * bằng chứng, và tác động. Thứ tự do rule engine quyết định theo tác động tài
 * chính, không theo mức độ đỏ trên màn hình.
 *
 * Khi một kết luận được gộp từ nhiều cảnh báo cùng nguyên nhân gốc, panel ghi
 * rõ số cảnh báo đã gộp — để người đọc biết đây là một vấn đề chứ không phải
 * bốn, và để không ai đi xử lý từng triệu chứng riêng lẻ.
 */

import { Alert, Empty, Skeleton, Tag } from "antd";
import { useTranslation } from "react-i18next";

import type { InsightModel, InsightSeverity } from "@/types/executive.types";

interface InsightPanelProps {
  insights: readonly InsightModel[];
  isLoading: boolean;
  /** true khi chưa chỉ số nào có dữ liệu, nên chưa thể kết luận được gì. */
  awaitingData: boolean;
}

const SEVERITY_TAG: Record<InsightSeverity, string> = {
  critical: "error",
  warning: "warning",
  good: "success",
};

export const InsightPanel = ({
  insights,
  isLoading,
  awaitingData,
}: InsightPanelProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} title={false} />;
  }

  if (awaitingData) {
    return (
      <Empty
        description={t("executive.insights.awaitingData")}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  if (insights.length === 0) {
    return (
      <Alert
        message={t("executive.insights.allClear")}
        showIcon
        type="success"
      />
    );
  }

  return (
    <ol className="exec-insights">
      {insights.map((insight) => (
        <li className="exec-insight" key={insight.id}>
          <div className="exec-insight__head">
            <Tag color={SEVERITY_TAG[insight.severity]}>
              {t(`executive.severity.${insight.severity}`)}
            </Tag>
            <span className="exec-insight__title">{t(insight.titleKey)}</span>
          </div>
          <p className="exec-insight__cause">{t(insight.causeKey)}</p>
          <p className="exec-insight__impact">{t(insight.impactKey)}</p>
          {insight.mergedFromKeys.length > 1 ? (
            <div className="exec-insight__merged">
              {t("executive.insights.mergedFrom", {
                count: insight.mergedFromKeys.length,
              })}
              <ul>
                {insight.mergedFromKeys.map((signalKey) => (
                  <li key={signalKey}>{t(signalKey)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
};
