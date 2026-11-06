import { Form, Tooltip, type FormInstance } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo } from "react";

import { useRouteEstimate } from "@/hooks/useRouteEstimate";
import { estimateDeliveryAt, formatDurationMinutes } from "@/utils/loadSchedule";
import { isUsableCoordinate } from "@/utils/routeEstimate";
import "@/styles/load-summary.scss";

export interface LoadSummaryPanelProps {
  form: FormInstance;
}

const toCoordinate = (latitude: unknown, longitude: unknown) => {
  const candidate = { latitude: Number(latitude), longitude: Number(longitude) };
  return isUsableCoordinate(candidate) ? candidate : null;
};

const placeLabel = (city?: string, state?: string, line1?: string) =>
  [city, state].filter(Boolean).join(", ") || line1 || "Chưa nhập";

const formatMoney = (value: unknown): string => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return amount.toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Panel tóm tắt tuyến bên phải form tạo Load.
 *
 * - Khoảng cách/thời gian lấy từ OSRM theo toạ độ thật của hai đầu (cache 10 phút).
 * - Tự điền `distance` khi người dùng chưa sửa field này và đang để 0.
 * - Không bịa giá cước/giá vốn: API tạo Load chưa có dữ liệu hợp đồng hay giá vốn.
 */
export function LoadSummaryPanel({ form }: LoadSummaryPanelProps) {
  const originLatitude = Form.useWatch("originLocationLatitude", form);
  const originLongitude = Form.useWatch("originLocationLongitude", form);
  const destinationLatitude = Form.useWatch("destinationLocationLatitude", form);
  const destinationLongitude = Form.useWatch("destinationLocationLongitude", form);
  const originCity = Form.useWatch("originAddressCity", form) as string | undefined;
  const originState = Form.useWatch("originAddressState", form) as string | undefined;
  const originLine1 = Form.useWatch("originAddressLine1", form) as string | undefined;
  const destinationCity = Form.useWatch("destinationAddressCity", form) as string | undefined;
  const destinationState = Form.useWatch("destinationAddressState", form) as string | undefined;
  const destinationLine1 = Form.useWatch("destinationAddressLine1", form) as string | undefined;
  const distance = Form.useWatch("distance", form);
  const cost = Form.useWatch("deliveryCostAmount", form);
  const currency = Form.useWatch("deliveryCostCurrency", form) as string | undefined;
  const pickupDate = Form.useWatch("requestedPickupDate", form);

  const origin = useMemo(
    () => toCoordinate(originLatitude, originLongitude),
    [originLatitude, originLongitude],
  );
  const destination = useMemo(
    () => toCoordinate(destinationLatitude, destinationLongitude),
    [destinationLatitude, destinationLongitude],
  );
  const { estimate, isLoading, isError } = useRouteEstimate(origin, destination);

  useEffect(() => {
    if (!estimate) return;
    if (form.isFieldTouched("distance")) return;
    const current = Number(form.getFieldValue("distance") ?? 0);
    if (Number.isFinite(current) && current > 0) return;
    form.setFieldValue("distance", estimate.distanceMiles);
  }, [estimate, form]);

  const suggestedEta = estimate
    ? estimateDeliveryAt(pickupDate as Date | string | number | null | undefined, estimate.durationMinutes)
    : null;
  const shownDistance = Number(distance) > 0 ? Number(distance) : estimate?.distanceMiles;

  const rows: Array<{ label: string; value: string }> = [
    {
      label: "Tuyến",
      value: `${placeLabel(originCity, originState, originLine1)} → ${placeLabel(
        destinationCity,
        destinationState,
        destinationLine1,
      )}`,
    },
    {
      label: "Khoảng cách",
      value: shownDistance ? `${shownDistance} mi${estimate ? " (OSRM)" : ""}` : "—",
    },
    {
      label: "Thời gian chạy",
      value: formatDurationMinutes(estimate?.durationMinutes),
    },
    {
      label: "ETA dự kiến",
      value: suggestedEta ? dayjs(suggestedEta).format("DD/MM/YYYY HH:mm") : "—",
    },
    {
      label: "Cước phí",
      value: `${formatMoney(cost)} ${currency || "USD"}`,
    },
  ];

  return (
    <section className="load-summary" aria-label="Tóm tắt lô hàng">
      <div className="load-summary__title">Tóm tắt lô hàng</div>

      {isLoading && <div aria-live="polite" className="load-summary__hint">Đang tính tuyến…</div>}
      {isError && (
        <div className="load-summary__hint load-summary__hint--error" role="status">
          Không tính được tuyến. Kiểm tra tọa độ GPS hoặc kết nối dịch vụ tuyến đường.
        </div>
      )}
      {!isLoading && !isError && !estimate ? (
        <div className="load-summary__hint">Nhập tọa độ lấy hàng và giao hàng để xem ước tính tuyến.</div>
      ) : null}

      {rows.map((row) => (
        <div className="load-summary__row" key={row.label}>
          <span>{row.label}</span>
          <Tooltip title={row.value}>
            <strong className="table-cell-ellipsis">{row.value}</strong>
          </Tooltip>
        </div>
      ))}

      {suggestedEta && (
        <button
          className="load-summary__use-eta"
          onClick={() =>
            form.setFields([{ name: "requestedDeliveryDate", value: dayjs(suggestedEta) }])
          }
          type="button"
        >
          Dùng giờ giao dự kiến
        </button>
      )}

      <div className="load-summary__notice">
        <strong>Biên lợi nhuận</strong>
        <span>Chưa có dữ liệu giá vốn từ hệ thống.</span>
      </div>
    </section>
  );
}
