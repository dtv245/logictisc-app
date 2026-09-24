/**
 * Thẻ KPI của một chỉ số.
 *
 * Hai chế độ:
 *
 * - Có dữ liệu: hiện giá trị kỳ này, chênh lệch so với kỳ trước, các ngưỡng
 *   tham chiếu kèm nguồn, và nhãn trạng thái.
 * - Chưa có nguồn: giữ nguyên khung, hiện lý do và endpoint còn thiếu. TUYỆT
 *   ĐỐI không hiện số ước lượng — một con số sai trên màn hình ban điều hành
 *   tệ hơn một ô trống nói rõ vì sao nó trống.
 */

import { Typography } from "antd";
import { useTranslation } from "react-i18next";

import type { KpiCardModel } from "@/types/executive.types";
import { formatDeltaPercent, formatMetricValue } from "../executive.format";
import { unavailableReasonKey } from "../executive.metrics";
import { useIntlLocale } from "../useIntlLocale";
import { ReferenceChip } from "./ReferenceChip";
import { StatusPill } from "./StatusPill";

interface MetricCardProps {
  model: KpiCardModel;
  currency: string;
  /** Chỉ số lớn (North Star) dùng cỡ chữ lớn hơn. */
  emphasis?: boolean;
}

interface EmptyMetricCardProps {
  label: string;
  reasonKey: string;
  /** Chỉ có khi endpoint còn thiếu; xem `UnavailableNotice`. */
  requiredEndpoint?: string;
  emphasis?: boolean;
}

/**
 * Khung trống của một chỉ số.
 *
 * Giữ nguyên kích thước của thẻ có số — kể cả cỡ chữ lớn của nhóm North Star —
 * để một hàng thẻ không bị so le chỉ vì kỳ này thiếu dữ liệu.
 */
const EmptyMetricCard = ({
  label,
  reasonKey,
  requiredEndpoint,
  emphasis,
}: EmptyMetricCardProps) => {
  const { t } = useTranslation();

  return (
    <div
      className={`exec-metric exec-metric--empty${emphasis ? " exec-metric--emphasis" : ""}`}
    >
      <span className="exec-metric__label">{label}</span>
      <span className="exec-metric__placeholder">
        {t("executive.unavailable.value")}
      </span>
      <Typography.Text className="exec-metric__reason" type="secondary">
        {t(reasonKey)}
      </Typography.Text>
      {requiredEndpoint ? (
        <code className="exec-metric__endpoint">{requiredEndpoint}</code>
      ) : null}
    </div>
  );
};

export const MetricCard = ({ model, currency, emphasis }: MetricCardProps) => {
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const { definition, current, status, target, industry, historical } = model;

  const label = t(definition.labelKey);

  // Hai tầng độc lập, cùng dẫn tới một khung trống. Tầng khai báo đứng trước vì
  // thiếu endpoint là lý do gốc; chỉ số có endpoint mà kỳ này không ra số thì đã
  // hết việc ở backend, nên không nêu tên endpoint nào nữa.
  if (definition.availability.status === "unavailable") {
    return (
      <EmptyMetricCard
        emphasis={emphasis}
        label={label}
        reasonKey={definition.availability.reasonKey}
        requiredEndpoint={definition.availability.requiredEndpoint}
      />
    );
  }

  if (current.status === "unavailable") {
    return (
      <EmptyMetricCard
        emphasis={emphasis}
        label={label}
        reasonKey={unavailableReasonKey(current.reasonCode)}
      />
    );
  }

  const delta = formatDeltaPercent(
    current.value,
    current.previousValue,
    locale,
  );

  return (
    <div className={`exec-metric${emphasis ? " exec-metric--emphasis" : ""}`}>
      <div className="exec-metric__head">
        <span className="exec-metric__label">{label}</span>
        <StatusPill status={status} />
      </div>

      <div className="exec-metric__value">
        {formatMetricValue(current.value, definition.unit, locale, currency)}
      </div>

      {delta ? (
        <div className="exec-metric__delta">
          {t("executive.metric.vsPrevious", { delta })}
        </div>
      ) : null}

      <div className="exec-metric__refs">
        {target ? (
          <ReferenceChip
            currency={currency}
            reference={target}
            unit={definition.unit}
          />
        ) : null}
        {industry ? (
          <ReferenceChip
            currency={currency}
            reference={industry}
            unit={definition.unit}
          />
        ) : null}
        {historical ? (
          <ReferenceChip
            currency={currency}
            reference={historical}
            unit={definition.unit}
          />
        ) : null}
      </div>
    </div>
  );
};
