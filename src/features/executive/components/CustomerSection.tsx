/**
 * Khu vực rủi ro tập trung khách hàng.
 *
 * Trả lời câu hỏi "có đang phụ thuộc quá mức vào một vài khách hàng không".
 *
 * Màn hình điều hành chỉ cần quét nhanh, nên khu vực này cố tình KHÔNG dùng
 * biểu đồ Pareto hai trục: hai thang đo trên cùng một hình là lỗi trình bày phổ
 * biến nhất và không giúp câu hỏi "có rủi ro không" được trả lời nhanh hơn. Ba
 * con số tỉ trọng cộng với một mức rủi ro là đủ; Pareto để dành cho màn phân
 * tích khách hàng chuyên sâu.
 *
 * Khách hàng dẫn đầu doanh thu KHÔNG nhất thiết dẫn đầu lợi nhuận — bảng có cả
 * hai cột để thấy điều đó, và đó thường là phát hiện đáng giá nhất của khu vực
 * này.
 */

import { Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type {
  CustomerConcentrationRow,
  MetricUnit,
  MetricValue,
} from "@/types/executive.types";
import {
  formatMetricOrDash,
  formatMetricValue,
  metricNumber,
} from "../executive.format";
import { unavailableReasonKey } from "../executive.metrics";
import { resolveConcentrationRisk } from "../executive.refs";
import { useIntlLocale } from "../useIntlLocale";
import { SectionCard } from "./SectionCard";
import { StatusPill } from "./StatusPill";
import { UnavailableNotice } from "./UnavailableNotice";

/** Số khách hàng lớn nhất được coi là nhóm mang rủi ro tập trung. */
const TOP_CUSTOMER_COUNT = 3;

/** Số thanh hiển thị. Nhiều hơn thì thanh nào cũng mảnh và khó đọc. */
const BAR_COUNT = 5;

interface CustomerSectionProps {
  rows: readonly CustomerConcentrationRow[] | null;
  /** Tỉ trọng doanh thu của Top 3, đơn vị %. */
  top3Share: MetricValue;
  /** Tỉ trọng doanh thu của khách lớn nhất, đơn vị %. */
  top1Share: MetricValue;
  /**
   * Tỉ trọng doanh thu của Top 5, đơn vị %.
   *
   * Nhận từ endpoint chứ không tự cộng `shareOfRevenue` của 5 dòng đầu: nếu
   * endpoint chỉ trả về 4 khách thì phép cộng đó ra một con số nhỏ hơn thực tế,
   * tức là báo rủi ro thấp hơn mức thật.
   */
  top5Share: MetricValue;
  /**
   * Chỉ số HHI (0–10.000).
   *
   * KHÔNG được suy diễn từ `rows`: HHI cần tỉ trọng của toàn bộ khách hàng, và
   * backend tính nó trên toàn bộ rồi mới cắt bớt số dòng trả về. Tự tính lại
   * trên tập đã cắt sẽ ra một con số thấp hơn thực tế — tức là báo rủi ro nhẹ
   * hơn mức thật, đúng chiều nguy hiểm.
   */
  hhi: MetricValue;
  concentrationThreshold: number;
  top1Threshold: number;
  reasonKey: string;
  currency: string;
}

export const CustomerSection = ({
  rows,
  top3Share,
  top1Share,
  top5Share,
  hhi,
  concentrationThreshold,
  top1Threshold,
  reasonKey,
  currency,
}: CustomerSectionProps) => {
  const { t } = useTranslation();
  const locale = useIntlLocale();

  const hasRows = rows !== null && rows.length > 0;

  // Sắp xếp MỘT LẦN rồi dùng chung cho cả thanh lẫn bảng. Trước đây thanh lấy
  // `rows.slice(0, 5)` theo đúng thứ tự endpoint trả về, nên thứ tự hiển thị phụ
  // thuộc backend chứ không phải mức độ tập trung — đúng thứ người đọc cần thấy.
  const sorted = useMemo(() => {
    if (rows === null) return [];
    // Khách chưa đo được doanh thu xếp cuối: `null` không so sánh được với số,
    // và đẩy họ lên đầu bảng sẽ là một khẳng định sai về thứ hạng.
    return [...rows].sort((a, b) => {
      const left = metricNumber(b.revenue);
      const right = metricNumber(a.revenue);
      if (left === null) return right === null ? 0 : 1;
      if (right === null) return -1;
      return left - right;
    });
  }, [rows]);

  const risk = resolveConcentrationRisk(
    metricNumber(top1Share),
    metricNumber(top3Share),
    {
      top1: top1Threshold,
      top3: concentrationThreshold,
    },
  );
  const breached = risk === "critical";

  // Thiếu số thì hiện gạch, không hiện "0%" — "0%" là một khẳng định về dữ liệu,
  // còn gạch chỉ nói rằng chưa có.
  const share = (value: MetricValue): string =>
    formatMetricOrDash(value, "percent", locale, currency);

  /**
   * Một ô số trong bảng.
   *
   * Gạch ("—") một mình vẫn còn mơ hồ: người đọc không biết đó là "chưa đo
   * được", "không có cơ sở để tính" hay "backend không trả trường này". Ô chưa
   * có số vì vậy mang thêm lý do ở dạng tooltip, và được tô mờ đi để nhìn là
   * thấy khác với một giá trị thật. Số 0 thật vẫn hiện là "0" — ba trạng thái
   * "chưa đo được" / "không có trong hợp đồng" / "bằng không" không được trộn.
   */
  const metricCell = (value: MetricValue, unit: MetricUnit) =>
    value.status === "available" ? (
      formatMetricOrDash(value, unit, locale, currency)
    ) : (
      <Tooltip title={t(unavailableReasonKey(value.reasonCode))}>
        <span className="exec-cell--unavailable">
          {formatMetricOrDash(value, unit, locale, currency)}
        </span>
      </Tooltip>
    );

  const summaryItems: { key: string; label: string; value: React.ReactNode }[] =
    [
      {
        key: "top1",
        label: t("executive.customer.top1Share"),
        value: share(top1Share),
      },
      {
        key: "top3",
        label: t("executive.customer.top3Share"),
        value: share(top3Share),
      },
      {
        key: "top5",
        label: t("executive.customer.top5Share"),
        value: share(top5Share),
      },
      {
        key: "risk",
        label: t("executive.customer.riskLevel"),
        value: (
          <StatusPill
            label={t(`executive.customer.riskLevels.${risk}`)}
            status={risk}
          />
        ),
      },
    ];

  // HHI luôn có mặt trong danh sách, kể cả khi chưa đo được — lúc đó nó hiện
  // gạch. Bỏ hẳn dòng đi sẽ khiến người đọc không biết chỉ số này tồn tại, còn
  // tự tính lại từ `rows` sẽ ra một con số thấp hơn thực tế.
  summaryItems.push({
    key: "hhi",
    label: t("executive.customer.hhi"),
    value: formatMetricOrDash(hhi, "count", locale, currency),
  });

  const columns: ColumnsType<CustomerConcentrationRow> = [
    {
      title: t("executive.customer.columns.customer"),
      dataIndex: "customerName",
      key: "customerName",
      render: (name: string, _row, index) =>
        // Ba khách hàng lớn nhất được đánh dấu vì đó là nhóm mang rủi ro tập trung.
        index < TOP_CUSTOMER_COUNT ? (
          <span className="exec-customer__top">
            <Tag color="blue">{index + 1}</Tag>
            {name}
          </span>
        ) : (
          name
        ),
    },
    {
      title: t("executive.customer.columns.revenue"),
      dataIndex: "revenue",
      key: "revenue",
      align: "right",
      render: (value: MetricValue) => metricCell(value, "currency"),
    },
    {
      title: t("executive.customer.columns.share"),
      dataIndex: "shareOfRevenue",
      key: "shareOfRevenue",
      align: "right",
      render: (value: MetricValue) => metricCell(value, "percent"),
    },
    {
      // Luôn chưa có số: `Expense` gắn với xe chứ không gắn với chuyến, nên
      // không có cơ sở nào để phân bổ chi phí về một khách hàng. Giới hạn cấu
      // trúc vĩnh viễn, không phải nguồn dữ liệu còn thiếu — và tuyệt đối không
      // được xấp xỉ bằng một tỉ lệ nào khác.
      title: t("executive.customer.columns.grossMargin"),
      dataIndex: "grossMarginPercent",
      key: "grossMarginPercent",
      align: "right",
      render: (value: MetricValue) => metricCell(value, "percent"),
    },
    {
      title: t("executive.customer.columns.onTime"),
      dataIndex: "onTimeDeliveryPercent",
      key: "onTimeDeliveryPercent",
      align: "right",
      render: (value: MetricValue) => metricCell(value, "percent"),
    },
    {
      title: t("executive.customer.columns.dso"),
      dataIndex: "dsoDays",
      key: "dsoDays",
      align: "right",
      render: (value: MetricValue) => metricCell(value, "days"),
    },
  ];

  return (
    <SectionCard
      extra={
        breached ? (
          <Tag color="error">{t("executive.customer.breachTag")}</Tag>
        ) : null
      }
      question={t("executive.sections.customer.question")}
      title={t("executive.sections.customer.title")}
    >
      {!hasRows ? (
        <UnavailableNotice reasonKey={reasonKey} />
      ) : (
        <>
          <Typography.Paragraph className="exec-customer__reading">
            {t("executive.customer.reading", {
              top3: share(top3Share),
              top1: share(top1Share),
              threshold: formatMetricValue(
                concentrationThreshold,
                "percent",
                locale,
                currency,
              ),
            })}
          </Typography.Paragraph>

          <dl className="exec-customer__summary">
            {summaryItems.map((item) => (
              <div className="exec-customer__summary-item" key={item.key}>
                <dt className="exec-customer__summary-label">{item.label}</dt>
                <dd className="exec-customer__summary-value">{item.value}</dd>
              </div>
            ))}
          </dl>

          <ul className="exec-customer__bars">
            {sorted.slice(0, BAR_COUNT).map((row, index) => {
              const rowShare = metricNumber(row.shareOfRevenue);
              return (
                <li
                  className={
                    index < TOP_CUSTOMER_COUNT
                      ? "exec-customer__bar exec-customer__bar--top"
                      : "exec-customer__bar"
                  }
                  key={row.customerId}
                >
                  <span className="exec-customer__name">
                    {/* Số thứ hạng chứ không chỉ độ đậm màu: người đọc mù màu hoặc
                      in đen trắng vẫn nhận ra đâu là nhóm Top 3. */}
                    {index < TOP_CUSTOMER_COUNT ? (
                      <Tag color="blue">{index + 1}</Tag>
                    ) : null}
                    {row.customerName}
                  </span>
                  <span className="exec-customer__track">
                    {/* Chưa có tỉ trọng thì để rãnh trống, không vẽ thanh 0%. */}
                    {rowShare === null ? null : (
                      <span
                        className="exec-customer__fill"
                        style={{ width: `${rowShare}%` }}
                      />
                    )}
                  </span>
                  <span className="exec-customer__pct">
                    {formatMetricOrDash(
                      row.shareOfRevenue,
                      "percent",
                      locale,
                      currency,
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          <Table
            columns={columns}
            dataSource={sorted}
            pagination={false}
            rowKey="customerId"
            scroll={{ x: "max-content" }}
            size="small"
          />
        </>
      )}
    </SectionCard>
  );
};
