/**
 * Khu vực Tuổi nợ phải thu.
 *
 * Trả lời câu hỏi "trong số tiền khách còn nợ, bao nhiêu đã quá hạn và quá hạn
 * bao lâu" — câu hỏi mà chỉ số DSO một mình không trả lời được, vì hai công ty
 * cùng DSO 45 ngày có thể có phân bố rủi ro hoàn toàn khác nhau.
 *
 * Khu vực này KHÔNG tính toán gì thêm. Sáu nhóm, số tiền và tỉ trọng đều là
 * nguyên văn những gì endpoint trả về:
 *
 * - không gộp nhóm nhỏ lại thành "khác" — mất đúng phần đáng lo nhất;
 * - không tự cộng `amount` của sáu nhóm rồi gọi đó là tổng còn phải thu: mẫu số
 *   của backend là toàn bộ hoá đơn, kể cả phần không rơi vào nhóm nào;
 * - không suy tỉ trọng từ `amount`, vì làm vậy là dựng lại một con số mà backend
 *   đã gửi sẵn, và hai cách tính chỉ cần lệch một chút là màn hình tự mâu thuẫn.
 *
 * Nhóm `noDueDate` là nhóm riêng, không gộp vào `current`: hoá đơn không có ngày
 * đến hạn thì không biết là trong hạn hay quá hạn, và xếp nó vào "trong hạn" là
 * một khẳng định không có cơ sở.
 */

import { Typography } from "antd";
import { useTranslation } from "react-i18next";

import type {
  AgingBucketPoint,
  MetricValue,
  ReceivablesAging,
} from "@/types/executive.types";
import { formatMetricOrDash, metricNumber } from "../executive.format";
import { unavailableReasonKey } from "../executive.metrics";
import { useIntlLocale } from "../useIntlLocale";
import { SectionCard } from "./SectionCard";
import { UnavailableNotice } from "./UnavailableNotice";

/**
 * Mức rủi ro của từng nhóm, theo mã nhóm backend trả về.
 *
 * Màu chỉ là kênh phụ: mỗi thanh luôn đi kèm nhãn nhóm do backend đặt, nên
 * người đọc mù màu vẫn nhận ra nhóm nào là nhóm nào. Nhóm chưa có trong bảng
 * (backend thêm nhóm mới) rơi về màu trung tính, tuyệt đối không rơi về màu của
 * một mức rủi ro nào — tô đỏ một nhóm chưa phân loại là bịa ra rủi ro.
 */
const BUCKET_SEVERITY: Readonly<Record<string, string>> = {
  current: "good",
  days1To30: "warning",
  days31To60: "warning",
  days61To90: "critical",
  over90: "critical",
  noDueDate: "neutral",
};

const severityOf = (bucketId: string): string =>
  BUCKET_SEVERITY[bucketId] ?? "neutral";

interface AgingSectionProps {
  aging: ReceivablesAging | null;
  /** Lý do cả khu vực trống, dùng khi `aging` null. */
  reasonKey: string;
  currency: string;
}

export const AgingSection = ({
  aging,
  reasonKey,
  currency,
}: AgingSectionProps) => {
  const { t } = useTranslation();
  const locale = useIntlLocale();

  const buckets: readonly AgingBucketPoint[] = aging?.buckets ?? [];

  const money = (value: MetricValue): string =>
    formatMetricOrDash(value, "currency", locale, currency);

  const percent = (value: MetricValue): string =>
    formatMetricOrDash(value, "percent", locale, currency);

  const asOf = aging ? formatAsOf(aging.asOf, locale) : null;

  // Có dòng nhưng không dòng nào ra số — đúng tình trạng hiện tại khi dữ liệu
  // seed toàn VND còn màn hình yêu cầu USD. Sáu dấu gạch mà không nói vì sao sẽ
  // bị đọc thành "không có nợ"; lý do thật nằm ở mã backend trả về.
  const allUnavailable =
    buckets.length > 0 &&
    buckets.every((bucket) => metricNumber(bucket.amount) === null);
  const firstAmount = buckets[0]?.amount;
  const moneyReasonKey =
    allUnavailable && firstAmount?.status === "unavailable"
      ? unavailableReasonKey(firstAmount.reasonCode)
      : null;

  const sourceNote = [
    asOf ? t("executive.receivables.asOf", { date: asOf }) : null,
    moneyReasonKey ? t(moneyReasonKey) : null,
  ]
    .filter((part): part is string => part !== null)
    .join(" · ");

  return (
    <SectionCard
      question={t("executive.sections.aging.question")}
      sourceNote={sourceNote === "" ? undefined : sourceNote}
      title={t("executive.sections.aging.title")}
    >
      {aging === null || buckets.length === 0 ? (
        <UnavailableNotice reasonKey={reasonKey} />
      ) : (
        <>
          <dl className="exec-summary">
            <div className="exec-summary__item">
              <dt className="exec-summary__label">
                {t("executive.receivables.outstanding")}
              </dt>
              <dd className="exec-summary__value">
                {money(aging.outstandingTotal)}
              </dd>
            </div>
            <div className="exec-summary__item">
              <dt className="exec-summary__label">
                {t("executive.receivables.overdue")}
              </dt>
              <dd className="exec-summary__value">
                {money(aging.overdueTotal)}
              </dd>
            </div>
          </dl>

          <ul className="exec-bar-list">
            {buckets.map((bucket) => {
              const share = metricNumber(bucket.shareOfOutstanding);
              return (
                <li
                  className={`exec-bar exec-bar--${severityOf(bucket.id)}`}
                  key={bucket.id}
                >
                  <span className="exec-bar__label">
                    {/* Nhãn do backend chọn khoá, không viết cứng ở đây: thêm
                        một nhóm mới ở backend không cần sửa giao diện. */}
                    <span>{t(bucket.labelKey)}</span>
                    <span className="exec-bar__count">
                      {t("executive.receivables.invoiceCount", {
                        count: bucket.invoiceCount,
                      })}
                    </span>
                  </span>
                  <span className="exec-bar__track">
                    {/* Chưa có tỉ trọng thì để rãnh trống. Vẽ thanh 0% là khẳng
                        định nhóm này không có gì, trong khi sự thật là chưa đo
                        được nó. */}
                    {share === null ? null : (
                      <span
                        className="exec-bar__fill"
                        style={{ width: `${share}%` }}
                      />
                    )}
                  </span>
                  <span className="exec-bar__value">{money(bucket.amount)}</span>
                  <span className="exec-bar__share">
                    {percent(bucket.shareOfOutstanding)}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Vấn đề chất lượng dữ liệu chỉ hiện khi có: hai cách suy số dư cho ra
              hai kết quả khác nhau. Không phải lỗi của người đọc, nên không đẩy
              nó lên thành cảnh báo đỏ, nhưng phải nhìn thấy được. */}
          {aging.invoicesWithStatusPaymentMismatch > 0 ? (
            <Typography.Text className="exec-card__footnote" type="secondary">
              {t("executive.receivables.statusMismatch", {
                count: aging.invoicesWithStatusPaymentMismatch,
              })}
            </Typography.Text>
          ) : null}
        </>
      )}
    </SectionCard>
  );
};

/**
 * Mốc chốt số liệu, định dạng theo ngôn ngữ đang dùng.
 *
 * Chuỗi hỏng hoặc thiếu thì trả `null` để dòng nguồn gọn lại, thay vì in ra
 * "Invalid Date" trên màn hình ban điều hành.
 */
const formatAsOf = (value: string, locale: string): string | null => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
};
