/**
 * Thanh đo cho chỉ số vận hành: giá trị thực tế, vạch mục tiêu, dải ngành.
 *
 * Dùng thanh ngang thay vì đồng hồ đo. Đồng hồ đo chiếm nhiều chỗ mà chỉ truyền
 * được một con số; thanh ngang còn cho thấy khoảng cách tới mục tiêu, và xếp
 * nhiều thanh cạnh nhau thì so sánh được ngay.
 *
 * Thứ tự vẽ có ý nghĩa: dải ngành là BỐI CẢNH nên nằm dưới, thanh trạng thái
 * nằm trên. Vẽ đè lên nhau thì cả hai tín hiệu đều sai.
 */

import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import type { MetricUnit, StatusLevel } from "@/types/executive.types";
import { formatMetricValue } from "../executive.format";
import { useIntlLocale } from "../useIntlLocale";

interface BulletMeterProps {
  label: string;
  actual: number;
  target: number;
  /** Dải benchmark ngành, chỉ có khi thật sự áp dụng được cho loại đội xe. */
  industryRange?: readonly [number, number];
  historical?: number;
  /** Locale key tên nguồn của mục tiêu nội bộ. */
  targetSourceKey: string;
  /** Locale key tên nguồn của đường cơ sở lịch sử. */
  historicalSourceKey?: string;
  status: StatusLevel;
  unit: MetricUnit;
  currency: string;
  /** Giá trị nhỏ nhất / lớn nhất của thang đo. */
  min: number;
  max: number;
  higherIsBetter: boolean;
}

export const BulletMeter = ({
  label,
  actual,
  target,
  industryRange,
  historical,
  targetSourceKey,
  historicalSourceKey,
  status,
  unit,
  currency,
  min,
  max,
  higherIsBetter,
}: BulletMeterProps) => {
  const { t } = useTranslation();
  const locale = useIntlLocale();

  const span = max - min || 1;
  const toPercent = (value: number) =>
    Math.max(0, Math.min(100, ((value - min) / span) * 100));

  const fillWidth = toPercent(actual);
  const targetLeft = toPercent(target);
  const historicalLeft =
    historical === undefined ? undefined : toPercent(historical);

  const format = (value: number) => formatMetricValue(value, unit, locale, currency);

  const tooltip = (
    <span className="exec-bullet__tip">
      <span>
        {t("executive.bullet.actual")}: <strong>{format(actual)}</strong>
      </span>
      {/* Mỗi ngưỡng đi kèm TÊN NGUỒN, không chỉ tên loại ngưỡng — yêu cầu
          bắt buộc: không hiển thị ngưỡng nào mà thiếu nhãn nguồn gốc. */}
      <span>
        {t("executive.reference.internalTarget")}:{" "}
        <strong>{format(target)}</strong> · {t(targetSourceKey)}
      </span>
      {historical !== undefined ? (
        <span>
          {t("executive.reference.historicalBaseline")}:{" "}
          <strong>{format(historical)}</strong>
          {historicalSourceKey ? ` · ${t(historicalSourceKey)}` : null}
        </span>
      ) : null}
      {industryRange ? (
        <span>
          {t("executive.reference.industryBenchmark")}:{" "}
          <strong>
            {format(industryRange[0])} – {format(industryRange[1])}
          </strong>
        </span>
      ) : (
        <em>{t("executive.reference.noIndustryForFleet")}</em>
      )}
    </span>
  );

  return (
    <div className="exec-bullet">
      <div className="exec-bullet__head">
        <span className="exec-bullet__label">{label}</span>
        <span className="exec-bullet__value">
          {format(actual)}
          <span className="exec-bullet__target">
            {t("executive.bullet.targetShort", { value: format(target) })}
          </span>
        </span>
      </div>
      <Tooltip title={tooltip}>
        <span className={`exec-bullet__track exec-bullet__track--${status}`}>
          {industryRange ? (
            <span
              aria-hidden="true"
              className="exec-bullet__band"
              style={{
                left: `${toPercent(industryRange[0])}%`,
                width: `${toPercent(industryRange[1]) - toPercent(industryRange[0])}%`,
              }}
            />
          ) : null}
          <span
            aria-hidden="true"
            className="exec-bullet__fill"
            style={{ width: `${fillWidth}%` }}
          />
          {historicalLeft !== undefined ? (
            <span
              aria-hidden="true"
              className="exec-bullet__tick exec-bullet__tick--historical"
              style={{ left: `${historicalLeft}%` }}
            />
          ) : null}
          <span
            aria-hidden="true"
            className="exec-bullet__tick exec-bullet__tick--target"
            style={{ left: `${targetLeft}%` }}
          />
        </span>
      </Tooltip>
      <span className="exec-bullet__direction">
        {higherIsBetter
          ? t("executive.bullet.higherIsBetter")
          : t("executive.bullet.lowerIsBetter")}
      </span>
    </div>
  );
};
