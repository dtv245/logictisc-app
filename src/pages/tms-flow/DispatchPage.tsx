import { Alert, Button, Checkbox, Collapse, Input, Skeleton, Spin, Tooltip } from "antd";
import {
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
  type WheelEvent,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ApproveSuggestionModal } from "@/components/tms-flow/ApproveSuggestionModal";
import { DispatchMapLayers } from "@/components/map/DispatchMapLayers";
import { MapShell } from "@/components/map/MapShell";
import { ApproveSelectedSuggestionsModal } from "@/components/tms-flow/ApproveSelectedSuggestionsModal";
import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { LoadCreateModal } from "@/components/loads/LoadCreateModal";
import { ShipmentCard } from "@/components/tms-flow/ShipmentCard";
import { StatusTag } from "@/components/StatusTag";
import { TmsTimeline } from "@/components/tms-flow/TmsTimeline";
import { routes } from "@/constants/routes";
import { useTmsTimeline } from "@/hooks/tms-flow/useTmsQueries";
import {
  selectMostUrgentDispatchShipment,
  useDispatchSelection,
} from "@/hooks/tms-flow/useDispatchSelection";
import { useTmsWorkspace } from "@/hooks/tms-flow/useTmsWorkspace";
import { useMapboxRoute } from "@/hooks/tms-flow/useMapboxRoute";
import type {
  TmsApproval,
  TmsQueueCounts,
  TmsQueueFilter,
  TmsShipmentView,
} from "@/types/tms-flow/tmsFlow.types";
import type { DispatchLoadStopSource } from "@/utils/tms-flow/mapbox";
import { extractLoadStopInfo } from "@/utils/tms-flow/mapbox";
import {
  describeTmsError,
  formatTmsDateTime,
  formatTmsDistance,
  formatTmsMoney,
  formatTmsRiskReason,
  operationalStatusMeta,
  riskMeta,
} from "@/utils/tms-flow/presentation";
import {
  assessSuggestionConfidence,
  assessSuggestionScore,
  summarizeSuggestionReasoning,
  type SuggestionAssessmentLevel as SuggestionLevel,
} from "@/utils/tms-flow/suggestionAssessment";
import {
  matchesTmsQuery,
  selectTmsCounts,
  selectTmsQueue,
} from "@/utils/tms-flow/status";

const FILTERS: Array<{
  value: TmsQueueFilter;
  labelKey: string;
  countKey?: keyof TmsQueueCounts;
}> = [
  { value: "all", labelKey: "all", countKey: "all" },
  { value: "at-risk", labelKey: "atRisk", countKey: "atRisk" },
  { value: "unassigned", labelKey: "unassigned", countKey: "unassigned" },
  { value: "approvals", labelKey: "approvals", countKey: "approvals" },
  { value: "overdue", labelKey: "overdue" },
  { value: "ai-pending", labelKey: "aiPending", countKey: "approvals" },
  { value: "in-transit", labelKey: "inTransit" },
];

const VALID_FILTERS: readonly TmsQueueFilter[] = [
  "all", "at-risk", "unassigned", "approvals", "overdue", "ai-pending", "in-transit",
];

const parseFilter = (value: string | null): TmsQueueFilter =>
  value && VALID_FILTERS.includes(value as TmsQueueFilter)
    ? value as TmsQueueFilter
    : "all";

const QUEUE_SCROLL_THRESHOLD_PX = 120;

const assessmentTone: Record<SuggestionLevel, "success" | "processing" | "warning" | "neutral"> = {
  verySuitable: "success",
  suitable: "processing",
  consider: "warning",
  unknown: "neutral",
};

function SuggestionAssessmentTags({ suggestion }: { suggestion: TmsApproval["suggestion"] }) {
  const { t } = useTranslation();
  const scoreLevel = assessSuggestionScore(suggestion.score);
  const confidenceLevel = assessSuggestionConfidence(suggestion.confidence);

  return (
    <div className="tms-assessment-tags">
      <StatusTag
        className="tms-assessment-tag"
        label={t("tmsDispatch.assessment.fitLabel", { level: t(`tmsDispatch.assessment.levels.${scoreLevel}`) })}
        tone={assessmentTone[scoreLevel]}
      />
      <StatusTag
        className="tms-assessment-tag"
        label={t("tmsDispatch.assessment.confidenceLabel", { level: t(`tmsDispatch.assessment.levels.${confidenceLevel}`) })}
        tone={assessmentTone[confidenceLevel]}
      />
    </div>
  );
}

function DispatchMapFallback({ load }: { load?: DispatchLoadStopSource | null }) {
  const { t } = useTranslation();
  const stopInfo = extractLoadStopInfo(load);
  if (!stopInfo) return null;

  return (
    <div className="map-shell__fallback-route" data-testid="tms-map-text-route">
      <strong>▲ A: {stopInfo.pickup.label} → ◆ B: {stopInfo.delivery.label}</strong>
      <p><b>A · {t("tmsDispatch.map.origin")}:</b> {stopInfo.pickup.address}</p>
      <p><b>B · {t("tmsDispatch.map.destination")}:</b> {stopInfo.delivery.address}</p>
    </div>
  );
}

export interface DispatchPageProps {
  /** `/tms/approvals` renders the same workspace locked to pending decisions. */
  approvalsOnly?: boolean;
}

export function DispatchPage({ approvalsOnly = false }: DispatchPageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const workspace = useTmsWorkspace();
  const [reviewed, setReviewed] = useState<TmsApproval | null>(null);
  const [selectedDecisionIds, setSelectedDecisionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkReviewOpen, setBulkReviewOpen] = useState(false);
  const [lastCompletedShipment, setLastCompletedShipment] =
    useState<TmsShipmentView | null>(null);

  const filter: TmsQueueFilter = approvalsOnly
    ? "approvals"
    : parseFilter(searchParams.get("filter"));
  const invalidFilter = !approvalsOnly && Boolean(
    searchParams.get("filter") && !VALID_FILTERS.includes(searchParams.get("filter") as TmsQueueFilter),
  );
  const query = searchParams.get("q") ?? "";
  const shipmentParam = searchParams.get("shipment");
  const decisionParam = searchParams.get("decision");
  const loadParam = searchParams.get("load");

  const {
    approvals,
    approvalIds,
    approvalsError,
    collection,
    loads,
    pending,
    riskCollection,
    riskError,
    riskLoads,
    riskShipments,
    shipments,
    statuses,
    trucks,
    trucksError,
    unassignedCollection,
    unassignedError,
    unassignedLoads,
    unassignedShipments,
  } = workspace;
  const fallbackCounts = selectTmsCounts(shipments, approvals.length);
  const counts: TmsQueueCounts = {
    all: collection?.totalItems ?? fallbackCounts.all,
    atRisk: riskCollection?.totalItems ?? fallbackCounts.atRisk,
    unassigned: unassignedCollection?.totalItems ?? fallbackCounts.unassigned,
    approvals: approvals.length,
  };
  const queue =
    (filter === "at-risk" || filter === "overdue") && riskShipments !== undefined
      ? selectTmsQueue(riskShipments, filter, query, approvalIds)
      : filter === "unassigned" && unassignedShipments !== undefined
      ? unassignedShipments.filter((shipment) => matchesTmsQuery(shipment, query))
      : filter === "ai-pending"
        ? selectTmsQueue(workspace.allKnownShipments ?? shipments, filter, query, approvalIds)
        : selectTmsQueue(shipments, filter, query, approvalIds);
  const defaultShipment = useMemo(
    () => selectMostUrgentDispatchShipment(queue),
    [queue],
  );
  const selection = useDispatchSelection({
    requestedId: approvalsOnly ? null : shipmentParam,
    visibleShipments: queue,
    knownShipments: workspace.allKnownShipments ?? [],
    defaultShipment,
    filter,
    query,
    approvalLoadIds: approvalIds,
  });
  const selected = selection.status === "selected" ? selection.shipment : undefined;

  const activeLoadsQuery =
    (filter === "at-risk" || filter === "overdue") && riskLoads
      ? riskLoads
      : filter === "unassigned" && unassignedLoads
      ? unassignedLoads
      : loads;
  const activeCollection =
    (filter === "at-risk" || filter === "overdue") && riskCollection !== undefined
      ? riskCollection
      : filter === "unassigned" && unassignedCollection !== undefined
      ? unassignedCollection
      : collection;

  const hasNextLoadsPage = Boolean(activeLoadsQuery.hasNextPage);
  const isFetchingNextLoadsPage = Boolean(activeLoadsQuery.isFetchingNextPage);
  const isLoadingMoreRef = useRef(false);

  const loadMoreShipments = useCallback(() => {
    if (
      !hasNextLoadsPage ||
      isFetchingNextLoadsPage ||
      isLoadingMoreRef.current ||
      typeof activeLoadsQuery.fetchNextPage !== "function"
    ) {
      return;
    }
    isLoadingMoreRef.current = true;
    Promise.resolve(activeLoadsQuery.fetchNextPage()).finally(() => {
      isLoadingMoreRef.current = false;
    });
  }, [activeLoadsQuery, hasNextLoadsPage, isFetchingNextLoadsPage]);

  const handleQueueScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const container = event.currentTarget;
      const remaining =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (remaining <= QUEUE_SCROLL_THRESHOLD_PX) {
        loadMoreShipments();
      }
    },
    [loadMoreShipments],
  );

  const handleQueueWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (event.deltaY <= 0) return;
      const container = event.currentTarget;
      const remaining =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (remaining <= QUEUE_SCROLL_THRESHOLD_PX) {
        loadMoreShipments();
      }
    },
    [loadMoreShipments],
  );

  // Explicit decision/load params never fall back to another pending decision:
  // doing so silently reviews the wrong load. Only the bare route picks the first.
  const selectedApproval = decisionParam
    ? approvals.find(
        (item) => item.suggestion.decisionId === decisionParam,
      )
    : loadParam
    ? approvals.find((item) => item.load?.id === loadParam)
    : approvals[0];
  const selectedDecision = approvalsOnly ? selectedApproval : undefined;
  const selectedApprovals = approvals.filter((approval) =>
    selectedDecisionIds.has(approval.suggestion.decisionId),
  );
  const selectedLoad = approvalsOnly ? selectedDecision?.load : selected;
  const shipmentRoute = useMapboxRoute(
    selectedLoad?.originLatitude != null && selectedLoad.originLongitude != null
      ? { latitude: selectedLoad.originLatitude, longitude: selectedLoad.originLongitude }
      : null,
    selectedLoad?.destinationLatitude != null && selectedLoad.destinationLongitude != null
      ? { latitude: selectedLoad.destinationLatitude, longitude: selectedLoad.destinationLongitude }
      : null,
    { enabled: Boolean(selectedLoad) },
  );
  const focusApprovals = selected
    ? approvals.filter((item) => item.load?.id === selected.id)
    : [];
  const selectedTruck = workspace.trucks.data?.items.find(
    (truck) => truck.id === selectedLoad?.assignedTruckId,
  );

  const timeline = useTmsTimeline(selectedLoad?.id);
  const renderTimeline = (limit: number, collapsible = false) =>
    timeline.isLoading ? (
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
        message={t("tmsDispatch.timeline.loadError")}
        showIcon
        type="warning"
      />
    ) : (
      <TmsTimeline
        events={timeline.data?.events ?? []}
        limit={limit}
        collapsible={collapsible}
      />
    );
  const truckItems = trucks.data?.items ?? [];
  const locatedTrucks = truckItems
    .filter(
      (truck) =>
        truck.currentLocationLatitude != null &&
        truck.currentLocationLongitude != null,
    );

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(key, value);
      else next.delete(key);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setFilter = (value: TmsQueueFilter) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("filter");
    else next.set("filter", value);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (approvalsOnly || shipmentParam || selection.status !== "selected") return;
    updateParam("shipment", selection.shipment.id);
  }, [approvalsOnly, selection, shipmentParam, updateParam]);

  const handleDecisionComplete = useCallback(
    (approval: TmsApproval) => {
      const completed = approval.load ?? selected;
      if (!completed) return;
      const actionableLoads = queue.filter(
        (shipment) =>
          shipment.id !== completed.id &&
          shipment.status !== "cancelled" &&
          shipment.status !== "delivered" &&
          (shipment.risk !== "none" ||
            (shipment.riskReasons?.length ?? 0) > 0 ||
            (!shipment.assignedTruckId && !shipment.assignedTruckNumber)),
      );
      const next = selectMostUrgentDispatchShipment(actionableLoads);
      if (!next) return;
      setLastCompletedShipment(completed);
      updateParam("shipment", next.id);
    },
    [queue, selected, updateParam],
  );

  if (workspace.isLoading) {
    return (
      <div className="tms-page tms-flow--centered" aria-busy="true">
        <Spin size="large" />
        <p className="tms-muted">Đang tải dữ liệu điều phối…</p>
      </div>
    );
  }

  if (workspace.error) {
    return (
      <div className="tms-page">
        <Alert
          action={
            <Button
              icon={<RefreshCw size={14} aria-hidden="true" />}
              onClick={() => {
                void workspace.loads.refetch();
                void workspace.riskLoads?.refetch();
                void workspace.unassignedLoads?.refetch();
                void workspace.pending.refetch();
                void workspace.trucks.refetch();
              }}
            >
              Thử lại
            </Button>
          }
          description={describeTmsError(workspace.error)}
          message="Không tải được dữ liệu điều phối"
          showIcon
          type="error"
        />
      </div>
    );
  }

  return (
    <div className="tms-page tms-map-page" data-testid="dispatch-map-page">
      <MapShell
        testId="dispatch-map"
        fallbackContent={<DispatchMapFallback load={selectedLoad ?? null} />}
        top={(
          <>
            <div className="tms-page__lead">
        <div className="tms-row">
          <LoadCreateModal
            onCreated={() => {
              void workspace.loads.refetch();
              void workspace.riskLoads?.refetch();
              void workspace.unassignedLoads?.refetch();
            }}
            trigger={(show) => (
              <Button onClick={show}>Tạo lô hàng</Button>
            )}
          />
          {approvalsOnly ? (
            <Button onClick={() => navigate(routes.tmsFlow.dispatch)}>Quay lại điều phối</Button>
          ) : null}
        </div>
        {workspace.updatedAt ? (
          <span className="tms-refresh-state" role="status">
            {workspace.isRefreshing ? <Spin size="small" aria-hidden="true" /> : null}
            {t("tmsDispatch.refresh.updatedAt", {
              time: new Intl.DateTimeFormat("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(workspace.updatedAt),
            })}
          </span>
        ) : null}
      </div>
          </>
        )}
        leftTitle={approvalsOnly ? t("tmsDispatch.approval.queueTitle") : t("tmsDispatch.queue.title")}
        left={(
          <div className="map-shell__flow-content">
      {!approvalsOnly && workspace.refreshFailed ? (
        <Alert
          className="tms-refresh-warning"
          message={t("tmsDispatch.refresh.failed")}
          showIcon
          type="warning"
        />
      ) : null}

      {approvalsError ? (
        <Alert
          action={
            <Button
              icon={<RefreshCw size={14} aria-hidden="true" />}
              onClick={() => {
                void pending.refetch();
                void statuses.refetch();
              }}
            >
              Thử lại
            </Button>
          }
          message="Không tải được đề xuất AI"
          description={`${describeTmsError(approvalsError)} Hàng đợi vẫn khả dụng; đề xuất chờ duyệt và trạng thái AI chưa được hiển thị.`}
          showIcon
          type="warning"
        />
      ) : null}

      {trucksError ? (
        <Alert
          action={
            <Button
              icon={<RefreshCw size={14} aria-hidden="true" />}
              onClick={() => void trucks.refetch()}
            >
              Thử lại
            </Button>
          }
          message="Không tải được vị trí xe"
          description={`${describeTmsError(trucksError)} Bản đồ tuyến chưa hiển thị xe cho đến khi có dữ liệu.`}
          showIcon
          type="warning"
        />
      ) : null}

      {!approvalsOnly && filter === "at-risk" && riskError ? (
        <Alert
          action={
            <Button
              icon={<RefreshCw size={14} aria-hidden="true" />}
              onClick={() => void riskLoads?.refetch()}
            >
              Thử lại
            </Button>
          }
          message="Không tải được danh sách lô hàng rủi ro"
          description={describeTmsError(riskError)}
          showIcon
          type="warning"
        />
      ) : null}

      {!approvalsOnly && filter === "unassigned" && unassignedError ? (
        <Alert
          action={
            <Button
              icon={<RefreshCw size={14} aria-hidden="true" />}
              onClick={() => void unassignedLoads?.refetch()}
            >
              Thử lại
            </Button>
          }
          message="Không tải được danh sách lô hàng chưa phân công"
          description={describeTmsError(unassignedError)}
          showIcon
          type="warning"
        />
      ) : null}

      {invalidFilter ? (
        <Alert
          data-testid="dispatch-invalid-filter"
          message={t("tmsDispatch.queue.invalidFilter", { defaultValue: "Bộ lọc không hợp lệ; đang hiển thị toàn bộ lô hàng." })}
          showIcon
          type="info"
        />
      ) : null}

      {!approvalsOnly && selection.status === "loading" ? (
        <Alert
          message={t("tmsDispatch.selection.loading", { defaultValue: "Đang tìm lô hàng này…" })}
          showIcon
          type="info"
        />
      ) : null}
      {!approvalsOnly && selection.status === "not-found" ? (
        <Alert
          message={t("tmsDispatch.selection.notFound", { defaultValue: "Không tìm thấy lô này. Có thể lô đã bị xóa hoặc bạn không có quyền xem." })}
          showIcon
          type="warning"
        />
      ) : null}
      {!approvalsOnly && selection.status === "hidden" ? (
        <Alert
          action={(
            <Button
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete("filter");
                next.delete("q");
                setSearchParams(next, { replace: true });
              }}
              size="small"
            >
              {t("tmsDispatch.selection.clearFilters", { defaultValue: "Bỏ lọc để xem" })}
            </Button>
          )}
          message={t("tmsDispatch.selection.hidden", { defaultValue: "Lô này đang bị ẩn do bộ lọc." })}
          showIcon
          type="info"
        />
      ) : null}
      {!approvalsOnly && selection.status === "error" ? (
        <Alert
          action={(
            <Button onClick={selection.retry} size="small">
              {t("tmsDispatch.selection.retry", { defaultValue: "Thử lại" })}
            </Button>
          )}
          description={describeTmsError(selection.error)}
          message={t("tmsDispatch.selection.error", { defaultValue: "Chưa tải được thông tin lô hàng này." })}
          showIcon
          type="error"
        />
      ) : null}
      {!approvalsOnly && selection.status === "selected" && selection.outsideQueue ? (
        <Alert
          message={t("tmsDispatch.selection.outsideQueue", { defaultValue: "Lô này đã mở nhưng chưa nằm trong phần danh sách hiện đang tải." })}
          showIcon
          type="info"
        />
      ) : null}

      {!approvalsOnly && lastCompletedShipment && selected?.id !== lastCompletedShipment.id ? (
        <Button
          className="tms-control-button"
          onClick={() => {
            updateParam("shipment", lastCompletedShipment.id);
            setLastCompletedShipment(null);
          }}
        >
          {t("tmsDispatch.summary.returnToCompleted")}
        </Button>
      ) : null}

      {!approvalsOnly && activeCollection?.truncated ? (
        <Alert
          message={`Hàng đợi đang hiển thị ${activeCollection.items.length.toLocaleString("vi-VN")}/${activeCollection.totalItems.toLocaleString("vi-VN")} lô hàng đầu tiên`}
          description="Kéo xuống cuối danh sách để tải thêm các trang tiếp theo từ hệ thống."
          showIcon
          type="warning"
        />
      ) : null}

        <FlowPanel
          action={approvalsOnly ? (
            <Button
              disabled={selectedApprovals.length === 0}
              onClick={() => setBulkReviewOpen(true)}
              size="small"
              type="primary"
            >
              Duyệt {selectedApprovals.length} đề xuất
            </Button>
          ) : null}
          testId={approvalsOnly ? "approvals-list" : "dispatch-queue"}
          title={approvalsOnly ? t("tmsDispatch.approval.queueTitle") : t("tmsDispatch.queue.title")}
        >
          {approvalsOnly ? (
            <div className="tms-decision-list">
              {approvals.length > 0 ? (
                <div className="tms-decision-list__toolbar">
                  <Checkbox
                    checked={approvals.every((item) => selectedDecisionIds.has(item.suggestion.decisionId))}
                    indeterminate={selectedApprovals.length > 0 && selectedApprovals.length < approvals.length}
                    onChange={(event) => {
                      setSelectedDecisionIds((current) => {
                        const next = new Set(current);
                        approvals.forEach((item) => {
                          if (event.target.checked) next.add(item.suggestion.decisionId);
                          else next.delete(item.suggestion.decisionId);
                        });
                        return next;
                      });
                    }}
                  >
                    Chọn tất cả ({approvals.length})
                  </Checkbox>
                </div>
              ) : null}
              {approvals.map((approval) => {
                const isSelected =
                  approval.suggestion.decisionId ===
                  selectedDecision?.suggestion.decisionId;
                return (
                  <div
                    className={`tms-decision-row-wrap${isSelected ? " is-focused" : ""}`}
                    key={approval.suggestion.decisionId}
                  >
                    <Checkbox
                      aria-label={`Chọn đề xuất ${approval.load?.number ?? approval.suggestion.decisionId}`}
                      checked={selectedDecisionIds.has(approval.suggestion.decisionId)}
                      onChange={(event) => {
                        setSelectedDecisionIds((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(approval.suggestion.decisionId);
                          else next.delete(approval.suggestion.decisionId);
                          return next;
                        });
                      }}
                    />
                    <button
                      className={`tms-decision-row${isSelected ? " is-selected" : ""}`}
                      data-testid={`decision-row-${approval.suggestion.decisionId}`}
                      onClick={() => updateParam("decision", approval.suggestion.decisionId)}
                      type="button"
                    >
                    <span className="tms-decision-row__main">
                      <Tooltip
                        title={
                          approval.load
                            ? `#${approval.load.number} · ${approval.load.originCity} → ${approval.load.destinationCity}`
                            : `Đề xuất ${approval.suggestion.decisionId.slice(0, 8)}`
                        }
                      >
                        <strong className="table-cell-ellipsis">
                          {approval.load
                            ? `#${approval.load.number} · ${approval.load.originCity} → ${approval.load.destinationCity}`
                            : `Đề xuất ${approval.suggestion.decisionId.slice(0, 8)}`}
                        </strong>
                      </Tooltip>
                      <Tooltip
                        title={`${approval.suggestion.truckNumber ?? approval.suggestion.truckId}${approval.suggestion.driverName ? ` · ${approval.suggestion.driverName}` : ""}`}
                      >
                        <small className="tms-muted table-cell-ellipsis">
                          {approval.suggestion.truckNumber ?? approval.suggestion.truckId}
                          {approval.suggestion.driverName
                            ? ` · ${approval.suggestion.driverName}`
                            : ""}
                        </small>
                      </Tooltip>
                    </span>
                    <span className="tms-decision-row__meta">
                      <SuggestionAssessmentTags suggestion={approval.suggestion} />
                    </span>
                    </button>
                  </div>
                );
              })}
              {approvals.length === 0 ? (
                <p className="tms-empty">Không có đề xuất điều phối AI đang chờ duyệt.</p>
              ) : null}
            </div>
          ) : (
            <>
              <div className="tms-filters" role="group" aria-label={t("tmsDispatch.queue.filterLabel")}>
                {FILTERS.map((item) => (
                  <button
                    aria-pressed={filter === item.value}
                    className={filter === item.value ? "is-active" : ""}
                    data-testid={`dispatch-filter-${item.value}`}
                    key={item.value}
                    onClick={() => setFilter(item.value)}
                    type="button"
                  >
                    {t(`tmsDispatch.queue.filters.${item.labelKey}`)}
                    {item.countKey ? ` ${counts[item.countKey]}` : ""}
                  </button>
                ))}
              </div>
              <Input
                allowClear
                onChange={(event) => updateParam("q", event.target.value)}
                placeholder={t("tmsDispatch.queue.search")}
                prefix={<Search size={14} aria-hidden="true" />}
                value={query}
              />
              <div
                className="tms-queue"
                data-testid="dispatch-load-queue"
                onScroll={handleQueueScroll}
                onWheel={handleQueueWheel}
              >
                {queue.map((shipment) => (
                  <ShipmentCard
                    compact
                    key={shipment.id}
                    onSelect={() => updateParam("shipment", shipment.id)}
                    selected={selected?.id === shipment.id}
                    shipment={shipment}
                  />
                ))}
                {queue.length === 0 && !isFetchingNextLoadsPage ? (
                  <p className="tms-empty">{t("tmsDispatch.queue.empty")}</p>
                ) : null}
                {isFetchingNextLoadsPage ? (
                  <div
                    className="tms-queue__more"
                    data-testid="dispatch-queue-loading-more"
                  >
                    <Spin size="small" />
                    <span className="tms-muted">Đang tải thêm lô hàng…</span>
                  </div>
                ) : hasNextLoadsPage ? (
                  <button
                    className="tms-queue__more tms-queue__more--action"
                    data-testid="dispatch-queue-load-more"
                    onClick={loadMoreShipments}
                    type="button"
                  >
                    <span>
                      Đã tải {(activeCollection?.items.length ?? queue.length).toLocaleString("vi-VN")}
                      {activeCollection?.totalItems
                        ? `/${activeCollection.totalItems.toLocaleString("vi-VN")}`
                        : ""}{" "}
                      lô hàng · Kéo xuống để tải thêm
                    </span>
                  </button>
                ) : null}
              </div>
            </>
          )}
        </FlowPanel>
          </div>
        )}
        rightTitle={approvalsOnly ? t("tmsDispatch.timeline.title") : t("tmsDispatch.assistant.title")}
        right={(
<div className="tms-stack tms-dispatch__agent">
          {approvalsOnly ? (
            <FlowPanel title={t("tmsDispatch.timeline.title")}>
              {renderTimeline(8)}
            </FlowPanel>
          ) : (
            <FlowPanel
              subtitle={selected ? `Load #${selected.number}` : undefined}
              title={t("tmsDispatch.assistant.title")}
            >
              {focusApprovals.length === 0 ? (
                <div className="tms-stack">
                  <p className="tms-empty">{t("tmsDispatch.assistant.empty")}</p>
                  <Button
                    icon={<Sparkles size={14} aria-hidden="true" />}
                    onClick={() => navigate(routes.tmsFlow.root)}
                  >
                    {t("tmsDispatch.assistant.openOverview")}
                  </Button>
                </div>
              ) : (
                <div className="tms-stack">
                  {focusApprovals.map((approval) => (
                    <div
                      className="tms-agent-card"
                      key={approval.suggestion.decisionId}
                    >
                      <span className="tms-agent-card__kicker">
                        <Sparkles size={14} aria-hidden="true" /> {t("tmsDispatch.assistant.recommendation")}
                      </span>
                      <Tooltip
                        title={approval.suggestion.truckNumber ?? approval.suggestion.truckId}
                      >
                        <h3 className="tms-agent-card__title table-cell-ellipsis">
                          {approval.suggestion.truckNumber ?? approval.suggestion.truckId}
                        </h3>
                      </Tooltip>
                      <SuggestionAssessmentTags suggestion={approval.suggestion} />
                      <ul className="tms-approval-reason tms-agent-card__body">
                        {summarizeSuggestionReasoning(approval.suggestion.reasoning).map((sentence, index) => (
                          <li key={`${index}-${sentence}`}>{sentence}</li>
                        ))}
                      </ul>
                      <div className="tms-agent-card__actions">
                        <Button
                          onClick={() => setReviewed(approval)}
                          type="primary"
                        >
                          Xem và quyết định
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FlowPanel>
          )}

          {!approvalsOnly ? (
            <FlowPanel title={t("tmsDispatch.timeline.title")}>
              {renderTimeline(3, true)}
            </FlowPanel>
          ) : null}

</div>
        )}
        bottomTitle={approvalsOnly ? t("tmsDispatch.approval.detailTitle") : t("tmsDispatch.loadFields.selectedLoad")}
        bottom={(
approvalsOnly ? (
            <FlowPanel
              action={
                selectedDecision?.load ? (
                  <Button
                    icon={<ExternalLink size={14} aria-hidden="true" />}
                    onClick={() =>
                      navigate(`/tms/shipments/${selectedDecision.load?.id ?? ""}`)
                    }
                  >
                    Mở lô hàng
                  </Button>
                ) : null
              }
              title={t("tmsDispatch.approval.detailTitle")}
            >
              {selectedDecision ? (
                <div className="tms-stack">
                  <SuggestionAssessmentTags suggestion={selectedDecision.suggestion} />
                  <dl className="tms-detail-list">
                    <div>
                      <dt>Xe</dt>
                      <Tooltip
                        title={
                          selectedDecision.suggestion.truckNumber ??
                          selectedDecision.truck?.number ??
                          selectedDecision.suggestion.truckId
                        }
                      >
                        <dd className="table-cell-ellipsis">
                          {selectedDecision.suggestion.truckNumber ??
                            selectedDecision.truck?.number ??
                            selectedDecision.suggestion.truckId}
                        </dd>
                      </Tooltip>
                    </div>
                    <div>
                      <dt>Tài xế</dt>
                      <Tooltip
                        title={
                          selectedDecision.suggestion.driverName ??
                          selectedDecision.suggestion.driverId
                        }
                      >
                        <dd className="table-cell-ellipsis">
                          {selectedDecision.suggestion.driverName ??
                            selectedDecision.suggestion.driverId}
                        </dd>
                      </Tooltip>
                    </div>
                    {selectedDecision.load ? (
                      <div>
                        <dt>Khách hàng</dt>
                        <Tooltip title={selectedDecision.load.customerName}>
                          <dd className="table-cell-ellipsis">{selectedDecision.load.customerName}</dd>
                        </Tooltip>
                      </div>
                    ) : null}
                    {selectedDecision.load ? (
                      <div>
                        <dt>Giờ giao yêu cầu</dt>
                        <dd>
                          {formatTmsDateTime(
                            selectedDecision.load.requestedDeliveryDate,
                          )}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  <ul className="tms-approval-reason">
                    {summarizeSuggestionReasoning(selectedDecision.suggestion.reasoning).map((sentence, index) => (
                      <li key={`${index}-${sentence}`}>{sentence}</li>
                    ))}
                  </ul>
                  <Collapse
                    items={[{
                      key: "technical",
                      label: t("tmsDispatch.assessment.technicalDetails"),
                      children: (
                        <dl className="tms-technical-details">
                          <div><dt>{t("tmsDispatch.approval.fields.rank")}</dt><dd>{selectedDecision.suggestion.rank ?? t("tmsDispatch.assessment.notAvailable")}</dd></div>
                          <div><dt>{t("tmsDispatch.approval.fields.rawScore")}</dt><dd>{selectedDecision.suggestion.score ?? t("tmsDispatch.assessment.notAvailable")}</dd></div>
                          <div><dt>{t("tmsDispatch.approval.fields.rawConfidence")}</dt><dd>{selectedDecision.suggestion.confidence ?? t("tmsDispatch.assessment.notAvailable")}</dd></div>
                          <div><dt>{t("tmsDispatch.approval.fields.metrics")}</dt><dd><pre>{JSON.stringify(selectedDecision.suggestion.metrics ?? {}, null, 2)}</pre></dd></div>
                          <div className="tms-technical-details__note">{t("tmsDispatch.assessment.thresholdNote")}</div>
                        </dl>
                      ),
                    }]}
                  />
                  <div className="tms-row">
                    <Button
                      onClick={() => setReviewed(selectedDecision)}
                      type="primary"
                    >
                      Xem và quyết định
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="tms-empty">
                  {decisionParam || loadParam
                    ? "Đề xuất được yêu cầu không còn trong hàng đợi chờ duyệt."
                    : "Chọn một đề xuất đang chờ duyệt."}
                </p>
              )}
            </FlowPanel>
          ) : (
            <FlowPanel
              action={
                selected ? (
                  <Button
                    icon={<ExternalLink size={14} aria-hidden="true" />}
                    onClick={() => navigate(`/tms/shipments/${selected.id}`)}
                  >
                    Mở lô hàng
                  </Button>
                ) : null
              }
              title={t("tmsDispatch.loadFields.selectedLoad")}
            >
              {selected ? (
                <dl className="tms-detail-list">
                  <div>
                    <dt>Lô hàng</dt>
                    <Tooltip title={`#${selected.number} · ${selected.name}`}>
                      <dd className="table-cell-ellipsis">
                        #{selected.number} · {selected.name}
                      </dd>
                    </Tooltip>
                  </div>
                  <div>
                    <dt>Khách hàng</dt>
                    <Tooltip title={selected.customerName}>
                      <dd className="table-cell-ellipsis">{selected.customerName}</dd>
                    </Tooltip>
                  </div>
                  <div>
                    <dt>Tuyến</dt>
                    <Tooltip title={`${selected.originCity} → ${selected.destinationCity}`}>
                      <dd className="table-cell-ellipsis">
                        {selected.originCity} → {selected.destinationCity}
                      </dd>
                    </Tooltip>
                  </div>
                  <div>
                    <dt>Giờ lấy hàng yêu cầu</dt>
                    <dd>{formatTmsDateTime(selected.requestedPickupDate)}</dd>
                  </div>
                  <div>
                    <dt>{t("tmsDispatch.loadFields.deliveryTime")}</dt>
                    <dd>{formatTmsDateTime(selected.requestedDeliveryDate)}</dd>
                  </div>
                  <div>
                    <dt>Trạng thái</dt>
                    <dd>
                      <StatusTag
                        label={operationalStatusMeta[selected.status].label}
                        tone={operationalStatusMeta[selected.status].tone}
                      />
                      {selected.risk !== "none" ? (
                        <StatusTag
                          label={riskMeta[selected.risk].label}
                          tone={riskMeta[selected.risk].tone}
                        />
                      ) : null}
                    </dd>
                  </div>
                  {selected.riskReasons && selected.riskReasons.length > 0 ? (
                    <div data-testid="selected-load-risk-reasons">
                      <dt>Lý do rủi ro</dt>
                      <Tooltip
                        title={selected.riskReasons.map(formatTmsRiskReason).join(" · ")}
                      >
                        <dd className="table-cell-ellipsis">
                          {selected.riskReasons.map(formatTmsRiskReason).join(" · ")}
                        </dd>
                      </Tooltip>
                    </div>
                  ) : null}
                  <div>
                    <dt>Xe</dt>
                    <Tooltip
                      title={
                        selected.assignedTruckNumber ??
                        selectedTruck?.number ??
                        t("tmsDispatch.queue.noTruck")
                      }
                    >
                      <dd className="table-cell-ellipsis">
                        {selected.assignedTruckNumber ??
                          selectedTruck?.number ??
                          t("tmsDispatch.queue.noTruck")}
                      </dd>
                    </Tooltip>
                  </div>
                  <div>
                    <dt>Tài xế</dt>
                    <Tooltip title={selectedTruck?.mainDriverName ?? t("tmsDispatch.queue.noDriver")}>
                      <dd className="table-cell-ellipsis">
                        {selectedTruck?.mainDriverName ?? t("tmsDispatch.queue.noDriver")}
                      </dd>
                    </Tooltip>
                  </div>
                  <div>
                    <dt>Quãng đường</dt>
                    <dd>{formatTmsDistance(selected.distance)}</dd>
                  </div>
                  <div>
                    <dt>Cước vận chuyển</dt>
                    <dd>
                      {formatTmsMoney(
                        selected.deliveryCostAmount,
                        selected.deliveryCostCurrency,
                      )}
                    </dd>
                  </div>
                </dl>
              ) : selection.status === "loading" ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : (
                <p className="tms-empty">Chọn một lô hàng trong hàng đợi.</p>
              )}
            </FlowPanel>
          )
        )}
      >
        <DispatchMapLayers
          distanceMeters={shipmentRoute.distanceMeters}
          durationSeconds={shipmentRoute.durationSeconds}
          focusVehicleId={approvalsOnly ? selectedDecision?.suggestion.truckId : selectedLoad?.assignedTruckId}
          focusVehicleNumber={approvalsOnly ? selectedDecision?.suggestion.truckNumber ?? selectedDecision?.truck?.number : selectedLoad?.assignedTruckNumber}
          isFallbackStraightLine={shipmentRoute.isFallbackStraightLine}
          isRouteError={shipmentRoute.isError}
          isRouteLoading={shipmentRoute.isLoading}
          load={selectedLoad ?? null}
          routeCoordinates={shipmentRoute.routeCoordinates}
          vehicles={locatedTrucks}
        />
      </MapShell>

      {reviewed ? (
        <ApproveSuggestionModal
          approval={reviewed}
          key={reviewed.suggestion.decisionId}
          onClose={() => setReviewed(null)}
          onDecisionComplete={approvalsOnly ? undefined : handleDecisionComplete}
          onSuggestionChanged={(suggestion) => {
            setReviewed((current) => current ? { ...current, suggestion } : current);
          }}
          open
        />
      ) : null}
      {bulkReviewOpen ? (
        <ApproveSelectedSuggestionsModal
          approvals={selectedApprovals}
          onClose={() => {
            setBulkReviewOpen(false);
            setSelectedDecisionIds(new Set());
          }}
          open
        />
      ) : null}
    </div>
  );
}
