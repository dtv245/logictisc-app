/**
 * Khu vực gồm nhiều chỉ số dạng thanh đo (Vận hành, Sức khỏe đội xe).
 *
 * Mỗi chỉ số tự quyết định hiển thị được hay không dựa vào khai báo nguồn của
 * nó. Chỉ số chưa có nguồn vẫn giữ đúng vị trí trong danh sách — nhờ vậy người
 * đọc thấy được cấu trúc đầy đủ của khu vực, và khi backend bổ sung dữ liệu thì
 * không có gì phải sắp xếp lại.
 */

import { useTranslation } from "react-i18next";

import type {
  MetricDefinition,
  MetricReference,
  StatusLevel,
} from "@/types/executive.types";
import { unavailableReasonKey } from "../executive.metrics";
import { BulletMeter } from "./BulletMeter";
import { SectionCard } from "./SectionCard";
import { UnavailableNotice } from "./UnavailableNotice";

/**
 * Giá trị đã tính của một chỉ số.
 *
 * Hai nhánh loại trừ nhau. Chỉ số có endpoint nhưng kỳ này chưa đo được nằm ở
 * nhánh `unavailable` kèm mã lý do — thanh đo không có gì để vẽ, và một thanh
 * dài bằng 0 sẽ là lời khẳng định sai rằng chỉ số đang ở mức thấp nhất.
 */
export type MetricReading =
  | {
      status: "available";
      actual: number;
      /** Mức trạng thái so với ngưỡng nội bộ. */
      level: StatusLevel;
      target: MetricReference;
      historical?: MetricReference;
      /** Dải benchmark ngành. Chỉ có khi thật sự áp dụng được cho loại đội xe. */
      industryRange?: readonly [number, number];
      min: number;
      max: number;
    }
  | {
      status: "unavailable";
      /** Mã lý do backend nêu, hoặc null khi request không về được. */
      reasonCode: string | null;
    };

interface MetricGroupSectionProps {
  title: string;
  question: string;
  definitions: readonly MetricDefinition[];
  /** Khoá theo `definition.id`; thiếu khoá nghĩa là chưa tính được giá trị. */
  readings: Readonly<Record<string, MetricReading | undefined>>;
  currency: string;
}

export const MetricGroupSection = ({
  title,
  question,
  definitions,
  readings,
  currency,
}: MetricGroupSectionProps) => {
  const { t } = useTranslation();

  return (
    <SectionCard question={question} title={title}>
      <div className="exec-bullets">
        {definitions.map((definition) => {
          const label = t(definition.labelKey);
          const reading = readings[definition.id];

          // Thiếu endpoint là lý do gốc, nên nó được nêu trước: đây là việc
          // phải làm ở backend, không phải một kỳ dữ liệu rỗng.
          if (definition.availability.status === "unavailable") {
            return (
              <div
                className="exec-bullet exec-bullet--empty"
                key={definition.id}
              >
                <span className="exec-bullet__label">{label}</span>
                <UnavailableNotice
                  reasonKey={definition.availability.reasonKey}
                  requiredEndpoint={definition.availability.requiredEndpoint}
                />
              </div>
            );
          }

          // Endpoint đã có nhưng kỳ này không ra số. Không có endpoint nào để
          // chỉ ra nữa, nên chỉ nêu lý do — kèm `null` khi request thất bại.
          if (!reading || reading.status === "unavailable") {
            return (
              <div
                className="exec-bullet exec-bullet--empty"
                key={definition.id}
              >
                <span className="exec-bullet__label">{label}</span>
                <UnavailableNotice
                  reasonKey={unavailableReasonKey(reading?.reasonCode ?? null)}
                />
              </div>
            );
          }

          return (
            <BulletMeter
              actual={reading.actual}
              currency={currency}
              historical={reading.historical?.value}
              historicalSourceKey={reading.historical?.sourceKey}
              higherIsBetter={definition.higherIsBetter}
              industryRange={reading.industryRange}
              key={definition.id}
              label={label}
              max={reading.max}
              min={reading.min}
              status={reading.level}
              target={reading.target.value}
              targetSourceKey={reading.target.sourceKey}
              unit={definition.unit}
            />
          );
        })}
      </div>
    </SectionCard>
  );
};
