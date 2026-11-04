import { Alert, Button, Spin, Tooltip } from "antd";
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Truck as TruckIcon,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { LoadAiPanel } from "@/components/ai/LoadAiPanel";
import { ApproveSuggestionModal } from "@/components/tms-flow/ApproveSuggestionModal";
import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { StatusTag } from "@/components/StatusTag";
import { TmsFlowMap } from "@/components/tms-flow/TmsFlowMap";
import { TmsTimeline } from "@/components/tms-flow/TmsTimeline";
import { routes } from "@/constants/routes";
import { useAiFeatures } from "@/hooks/ai/useAiFeatures";
import { useTmsLoad, useTmsTimeline } from "@/hooks/tms-flow/useTmsQueries";
import { useTmsWorkspace } from "@/hooks/tms-flow/useTmsWorkspace";
import { useRouteEstimate } from "@/hooks/useRouteEstimate";
import { findApprovalForLoad } from "@/utils/tms-flow/approvals";
import {
  toNetworkVehicles,
  toShipmentMarkers,
  toShipmentRouteLine,
  toTruckMarker,
} from "@/utils/tms-flow/map";
import {
  describeTmsError,
  formatTmsDateTime,
  formatTmsDistance,
  formatTmsMoney,
  operationalStatusMeta,
  riskMeta,
} from "@/utils/tms-flow/presentation";

export function ShipmentDetailPage() {
  const navigate = useNavigate();
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const loadQuery = useTmsLoad(shipmentId);
  const workspace = useTmsWorkspace();
  const timeline = useTmsTimeline(shipmentId);
  const aiFeatures = useAiFeatures();
  const [reviewOpen, setReviewOpen] = useState(false);

  const load = loadQuery.data;
  const shipmentRoute = useRouteEstimate(
    load?.originLatitude != null && load.originLongitude != null
      ? { latitude: load.originLatitude, longitude: load.originLongitude }
      : null,
    load?.destinationLatitude != null && load.destinationLongitude != null
      ? { latitude: load.destinationLatitude, longitude: load.destinationLongitude }
      : null,
    { includeGeometry: true },
  );
  const mapRoutes = toShipmentRouteLine(load, shipmentRoute.estimate?.coordinates);
  const truckItems = workspace.trucks.data?.items ?? [];
  const assignedTruck = truckItems.find(
    (truck) => truck.id === load?.assignedTruckId,
  );
  const approval = findApprovalForLoad(workspace.approvals, load?.id);
  const assignedMarker = toTruckMarker(assignedTruck);
  const markers = [
    ...toShipmentMarkers(load),
    ...(assignedMarker ? [assignedMarker] : []),
  ];

  if (loadQuery.isLoading) {
    return (
      <div className="tms-page tms-flow--centered" aria-busy="true">
        <Spin size="large" />
        <p className="tms-muted">Đang tải lô hàng…</p>
      </div>
    );
  }

  if (loadQuery.error) {
    return (
      <div className="tms-page">
        <Alert
          action={
            <Button
              icon={<RefreshCw size={14} aria-hidden="true" />}
              onClick={() => void loadQuery.refetch()}
            >
              Thử lại
            </Button>
          }
          description={describeTmsError(loadQuery.error)}
          message="Không tải được lô hàng"
          showIcon
          type="error"
        />
        <div className="tms-row">
          <Button
            icon={<ArrowLeft size={14} aria-hidden="true" />}
            onClick={() => navigate(routes.tmsFlow.dispatch)}
          >
            Quay lại điều phối
          </Button>
        </div>
      </div>
    );
  }

  if (!load) {
    return (
      <div className="tms-page">
        <FlowPanel title="Không tìm thấy lô hàng">
          <p className="tms-muted">
            Không có lô hàng khớp với “{shipmentId}”. Lô hàng có thể thuộc công ty khác hoặc đã bị xóa.
          </p>
          <Button
            icon={<ArrowLeft size={14} aria-hidden="true" />}
            onClick={() => navigate(routes.tmsFlow.dispatch)}
          >
            Quay lại điều phối
          </Button>
        </FlowPanel>
      </div>
    );
  }

  const status = operationalStatusMeta[load.status];
  const risk = riskMeta[load.risk];

  return (
    <div className="tms-page">
      <div className="tms-row">
        <Button
          icon={<ArrowLeft size={14} aria-hidden="true" />}
          onClick={() => navigate(routes.tmsFlow.dispatch)}
          type="text"
        >
          Điều phối
        </Button>
        <div className="tms-hero__actions">
          {assignedTruck ? (
            <Button
              icon={<TruckIcon size={14} aria-hidden="true" />}
              onClick={() => navigate(`/trucks/show/${assignedTruck.id}`)}
            >
              Xem xe
            </Button>
          ) : null}
          <Button
            icon={<ExternalLink size={14} aria-hidden="true" />}
            onClick={() =>
              navigate(routes.resources.loads.show.replace(":id", load.id))
            }
          >
            Mở trong danh sách lô hàng
          </Button>
          {approval ? (
            <Button
              icon={<Sparkles size={14} aria-hidden="true" />}
              onClick={() => setReviewOpen(true)}
              type="primary"
            >
              Xem đề xuất AI
            </Button>
          ) : null}
        </div>
      </div>

      <div className="tms-detail">
        <div className="tms-stack">
          <FlowPanel>
            <div className="tms-hero">
              <div className="tms-hero__head">
                <div>
                  <h2 className="tms-hero__id" data-testid="shipment-detail-id">
                    #{load.number}
                  </h2>
                  <Tooltip title={`${load.name} · ${load.customerName}`}>
                    <p className="tms-hero__sub table-cell-ellipsis">
                      {load.name} · {load.customerName}
                    </p>
                  </Tooltip>
                </div>
                <div className="tms-row">
                  <StatusTag label={status.label} tone={status.tone} />
                  {load.risk !== "none" ? (
                    <StatusTag label={risk.label} tone={risk.tone} />
                  ) : null}
                  {load.isHazmat ? (
                    <StatusTag
                      label={load.hazmatClass ? `Hazmat ${load.hazmatClass}` : "Hazmat"}
                      tone="error"
                    />
                  ) : null}
                </div>
              </div>

              <div className="tms-hero__metrics">
                <div className="tms-hero__metric">
                  <dt>Giờ lấy hàng yêu cầu</dt>
                  <dd>{formatTmsDateTime(load.requestedPickupDate)}</dd>
                </div>
                <div className="tms-hero__metric">
                  <dt>Giờ giao yêu cầu</dt>
                  <dd data-testid="shipment-detail-delivery">
                    {formatTmsDateTime(load.requestedDeliveryDate)}
                  </dd>
                </div>
                <div className="tms-hero__metric">
                  <dt>Quãng đường</dt>
                  <dd>{formatTmsDistance(load.distance)}</dd>
                </div>
                <div className="tms-hero__metric">
                  <dt>Cước vận chuyển</dt>
                  <dd>
                    {formatTmsMoney(
                      load.deliveryCostAmount,
                      load.deliveryCostCurrency,
                    )}
                  </dd>
                </div>
              </div>
            </div>
          </FlowPanel>

          <FlowPanel title="Tuyến đường và địa chỉ">
            <dl className="tms-detail-list">
              <div>
                <dt>Điểm lấy hàng</dt>
                <Tooltip title={load.originAddress || load.originCity}>
                  <dd className="table-cell-ellipsis">{load.originAddress || load.originCity}</dd>
                </Tooltip>
              </div>
              <div>
                <dt>Điểm giao hàng</dt>
                <Tooltip title={load.destinationAddress || load.destinationCity}>
                  <dd className="table-cell-ellipsis">{load.destinationAddress || load.destinationCity}</dd>
                </Tooltip>
              </div>
              <div>
                <dt>Trạng thái hệ thống</dt>
                <dd>{load.rawStatus}</dd>
              </div>
              <div>
                <dt>Trạng thái vận hành</dt>
                <dd>{status.label}</dd>
              </div>
            </dl>
            {load.notes ? (
              <Tooltip title={load.notes}>
                <p className="tms-muted table-cell-ellipsis">{load.notes}</p>
              </Tooltip>
            ) : null}
          </FlowPanel>

          <TmsFlowMap
            markers={markers}
            routes={mapRoutes}
            isRouteLoading={shipmentRoute.isLoading}
            isRouteError={shipmentRoute.isError}
            subtitle={
              load.originCity !== "—"
                ? `${load.originCity} → ${load.destinationCity}`
                : undefined
            }
            testId="shipment-map"
            title="Điểm trên tuyến"
            vehicles={toNetworkVehicles(assignedTruck ? [assignedTruck] : [])}
          />

          {aiFeatures.enabled ? (
            <FlowPanel
              subtitle="Khoảng trống dữ liệu và đề xuất từ AI điều phối"
              title="Trợ lý AI"
            >
              <LoadAiPanel loadId={load.id} />
            </FlowPanel>
          ) : null}

          <FlowPanel title="Dòng thời gian vận hành">
            {timeline.isLoading ? (
              <Spin size="small" />
            ) : timeline.error ? (
              <Alert
                action={
                  <Button
                    icon={<RefreshCw size={14} aria-hidden="true" />}
                    onClick={() => void timeline.refetch()}
                    size="small"
                  >
                    Thử lại
                  </Button>
                }
                description={describeTmsError(timeline.error)}
                message="Không tải được dòng thời gian vận hành"
                showIcon
                type="warning"
              />
            ) : (
              <TmsTimeline
                emptyLabel="Chưa có sự kiện vận hành cho lô hàng này."
                events={timeline.data?.events ?? []}
              />
            )}
          </FlowPanel>
        </div>

        <div className="tms-stack">
          <FlowPanel
            action={
              assignedTruck ? (
                <Button
                  onClick={() => navigate(`/trucks/show/${assignedTruck.id}`)}
                  size="small"
                >
                  Xe
                </Button>
              ) : null
            }
            title="Phân công"
          >
            <dl className="tms-detail-list">
              <div>
                <dt>Xe</dt>
                <Tooltip title={load.assignedTruckNumber ?? assignedTruck?.number ?? "Chưa phân công"}>
                  <dd className="table-cell-ellipsis">
                    {load.assignedTruckNumber ?? assignedTruck?.number ?? "Chưa phân công"}
                  </dd>
                </Tooltip>
              </div>
              <div>
                <dt>Tài xế</dt>
                <Tooltip title={assignedTruck?.mainDriverName ?? "Chưa phân công"}>
                  <dd className="table-cell-ellipsis">
                    {assignedTruck?.mainDriverName ?? "Chưa phân công"}
                  </dd>
                </Tooltip>
              </div>
              {assignedTruck ? (
                <div>
                  <dt>Loại xe</dt>
                  <dd>{assignedTruck.type.replace("_", " ")}</dd>
                </div>
              ) : null}
              {assignedTruck ? (
                <div>
                  <dt>Trạng thái</dt>
                  <dd>{assignedTruck.status.replace("_", " ")}</dd>
                </div>
              ) : null}
            </dl>
          </FlowPanel>

          <FlowPanel title="Mốc vận hành">
            {load.dispatchedAt ||
            load.pickedUpAt ||
            load.deliveredAt ||
            load.cancelledAt ? (
              <dl className="tms-detail-list">
                {load.dispatchedAt ? (
                  <div>
                    <dt>Đã điều phối</dt>
                    <dd>{formatTmsDateTime(load.dispatchedAt)}</dd>
                  </div>
                ) : null}
                {load.pickedUpAt ? (
                  <div>
                    <dt>Đã lấy hàng</dt>
                    <dd>{formatTmsDateTime(load.pickedUpAt)}</dd>
                  </div>
                ) : null}
                {load.deliveredAt ? (
                  <div>
                    <dt>Đã giao hàng</dt>
                    <dd>{formatTmsDateTime(load.deliveredAt)}</dd>
                  </div>
                ) : null}
                {load.cancelledAt ? (
                  <div>
                    <dt>Đã hủy</dt>
                    <dd>{formatTmsDateTime(load.cancelledAt)}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="tms-empty">Chưa có mốc vận hành nào được ghi nhận.</p>
            )}
          </FlowPanel>

          <FlowPanel
            subtitle={
              approval
                ? `Decision ${approval.suggestion.decisionId.slice(0, 8)}`
                : undefined
            }
            title="Điều phối AI"
          >
            {approval ? (
              <div className="tms-stack">
                <div className="tms-row">
                  <StatusTag
                    label={approval.suggestion.confidence ?? "Cần xác minh"}
                    tone="neutral"
                  />
                  <span className="tms-muted">
                    Đề xuất · {approval.suggestion.rank == null ? "Chưa xếp hạng" : `Hạng #${approval.suggestion.rank}`} · {approval.suggestion.score == null
                      ? "chưa có điểm đánh giá"
                      : `điểm ${Number(approval.suggestion.score).toFixed(1)}`}
                  </span>
                </div>
                <Tooltip title={approval.suggestion.reasoning}>
                  <p className="tms-muted">{approval.suggestion.reasoning}</p>
                </Tooltip>
                <Button onClick={() => setReviewOpen(true)} type="primary">
                  Xem và quyết định
                </Button>
              </div>
            ) : (
              <p className="tms-empty">
                Lô hàng này không có đề xuất điều phối AI đang chờ duyệt.
              </p>
            )}
          </FlowPanel>

          <FlowPanel title="Theo dõi và trao đổi">
            <div className="tms-stack">
              <Alert
                message="Chia sẻ theo dõi chưa khả dụng"
                description="Hiện chưa thể tạo liên kết theo dõi cho lô hàng này."
                showIcon
                type="info"
              />
              <Alert
                message="Tin nhắn khách hàng chưa khả dụng"
                description="Kênh trao đổi khách hàng chưa được bật cho lô hàng này."
                showIcon
                type="info"
              />
            </div>
          </FlowPanel>
        </div>
      </div>

      {approval && reviewOpen ? (
        <ApproveSuggestionModal
          approval={approval}
          key={approval.suggestion.decisionId}
          onClose={() => setReviewOpen(false)}
          open
        />
      ) : null}
    </div>
  );
}
