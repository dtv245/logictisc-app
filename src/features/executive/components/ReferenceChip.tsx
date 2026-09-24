/**
 * Hiển thị một ngưỡng tham chiếu kèm nguồn gốc.
 *
 * Ba loại ngưỡng được phân biệt bằng BA kênh cùng lúc — mẫu nét, độ đậm mực,
 * và ký hiệu chữ T/I/H — chứ không chỉ bằng màu. Nhờ vậy phân biệt được cả khi
 * in đen trắng, khi người đọc mù màu, và ở chế độ forced-colors.
 *
 * Quy tắc bắt buộc: KHÔNG BAO GIỜ hiển thị một ngưỡng mà thiếu nhãn nguồn.
 * Component này luôn render cả `sourceKey`, nên không có đường nào lách qua.
 *
 * Khi `applicability === "notApplicable"` (ngưỡng ngành không áp dụng trực
 * tiếp cho loại đội xe đang chọn), phần giá trị ngành bị ẩn và chỉ còn mục
 * tiêu nội bộ — không được để người đọc tưởng đó là benchmark ngành.
 */

import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import type { MetricReference } from "@/types/executive.types";
import { formatMetricValue } from "../executive.format";
import { useIntlLocale } from "../useIntlLocale";

interface ReferenceChipProps {
  reference: MetricReference;
  /** Đơn vị của chỉ số, để format giá trị ngưỡng cho đúng. */
  unit: Parameters<typeof formatMetricValue>[1];
  currency: string;
}

const KIND_LABEL_KEY: Record<MetricReference["kind"], string> = {
  internalTarget: "executive.reference.internalTarget",
  industryBenchmark: "executive.reference.industryBenchmark",
  historicalBaseline: "executive.reference.historicalBaseline",
};

const KIND_MARK: Record<MetricReference["kind"], string> = {
  internalTarget: "T",
  industryBenchmark: "I",
  historicalBaseline: "H",
};

export const ReferenceChip = ({
  reference,
  unit,
  currency,
}: ReferenceChipProps) => {
  const { t } = useTranslation();
  const locale = useIntlLocale();

  // Ngưỡng ngành không áp dụng cho loại đội xe này: không hiển thị giá trị,
  // chỉ nói rõ rằng chỉ có mục tiêu nội bộ là dùng được.
  const notApplicable =
    reference.kind === "industryBenchmark" &&
    reference.applicability === "notApplicable";

  const valueText = notApplicable
    ? t("executive.reference.notApplicableValue")
    : formatMetricValue(reference.value, unit, locale, currency);

  const tooltip = (
    <span className="exec-ref__tip">
      <strong>{t(KIND_LABEL_KEY[reference.kind])}</strong>
      <span>{t(reference.sourceKey)}</span>
      {reference.periodKey ? <span>{t(reference.periodKey)}</span> : null}
      {reference.scopeKey ? <span>{t(reference.scopeKey)}</span> : null}
      {notApplicable ? (
        <em>{t("executive.reference.notApplicableHint")}</em>
      ) : null}
    </span>
  );

  return (
    <Tooltip title={tooltip}>
      <span
        className={`exec-ref exec-ref--${reference.kind}${
          notApplicable ? " exec-ref--inapplicable" : ""
        }`}
      >
        <span aria-hidden="true" className="exec-ref__swatch" />
        <span className="exec-ref__mark" aria-hidden="true">
          {KIND_MARK[reference.kind]}
        </span>
        <span className="exec-ref__value">{valueText}</span>
        <span className="exec-ref__source">{t(reference.sourceKey)}</span>
      </span>
    </Tooltip>
  );
};

/** Chú giải dùng chung cho cả dashboard, đặt một lần ở đầu trang. */
export const ReferenceLegend = () => {
  const { t } = useTranslation();

  return (
    <div className="exec-ref-legend">
      <span className="exec-ref-legend__title">
        {t("executive.reference.legendTitle")}
      </span>
      {(["internalTarget", "industryBenchmark", "historicalBaseline"] as const).map(
        (kind) => (
          <span key={kind} className={`exec-ref exec-ref--${kind}`}>
            <span aria-hidden="true" className="exec-ref__swatch" />
            <span className="exec-ref__mark" aria-hidden="true">
              {KIND_MARK[kind]}
            </span>
            <span className="exec-ref__source">
              {t(KIND_LABEL_KEY[kind])}
            </span>
          </span>
        ),
      )}
    </div>
  );
};
