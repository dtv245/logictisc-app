import { useRef, useState } from "react";
import type { ReactElement } from "react";
import { Alert, Button, Dropdown, Modal } from "antd";
import { Check, ChevronRight, MoreHorizontal, Route, Send, Sparkles, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { routes } from "@/constants/routes";
import type { ProposedAction } from "@/features/dashboard/types/primitives.types";
import type { OperationsBriefProps } from "@/types/dashboard/operations-panels.types";
import "@/features/dashboard/components/OperationsBrief.scss";

export type { CauseItem, OperationsBriefProps } from "@/types/dashboard/operations-panels.types";

const copy = {
  vi: { title: "Operations brief", causes: "VÌ SAO · NGUYÊN NHÂN ĐÓNG GÓP", proposed: "ĐỀ XUẤT · CẦN BẠN PHÊ DUYỆT", review: "Xem đề xuất", activity: "Hoạt động AI", empty: "Chưa có bản tin điều phối.", noCauses: "Chưa có phân tích nguyên nhân.", noActions: "Chưa có đề xuất mới.", pending: "Đang phân tích hoạt động…", retry: "Thử lại", confidence: "độ tin cậy", noAnalysis: "Chưa có kết quả phân tích", more: "Tùy chọn bản tin", modal: "Xem xét đề xuất điều phối", approve: "Phê duyệt", reject: "Từ chối", failed: "Không xử lý được đề xuất. Vui lòng thử lại.", noHandler: "Mở trang điều phối để thực hiện đề xuất này." },
  en: { title: "Operations brief", causes: "WHY · CONTRIBUTING CAUSES", proposed: "PROPOSED · NEEDS YOUR APPROVAL", review: "Review recommendations", activity: "View AI activity", empty: "No operations brief available.", noCauses: "No contributing causes available.", noActions: "No new recommendations.", pending: "Analyzing operations…", retry: "Retry", confidence: "confidence", noAnalysis: "No analysis available", more: "Brief options", modal: "Review dispatch recommendation", approve: "Approve", reject: "Reject", failed: "Unable to process this recommendation. Please try again.", noHandler: "Open dispatch to act on this recommendation." },
};

export function OperationsBrief({ summary, causes = [], actions = [], confidenceScore, agentCount, updatedAtLabel, canViewRuns = true, onApproveAction, onRejectAction, isLoading = false, error, onRetry, locale = "vi", className = "" }: OperationsBriefProps): ReactElement {
  const text = copy[locale];
  const navigate = useNavigate();
  const [selectedAction, setSelectedAction] = useState<ProposedAction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(false);
  const submittingRef = useRef(false);
  const metadata = [agentCount != null ? `${agentCount} agents` : undefined, confidenceScore != null ? `${confidenceScore}% ${text.confidence}` : undefined, updatedAtLabel].filter(Boolean).join(" · ");

  const submit = async (handler?: (action: ProposedAction) => Promise<void>): Promise<void> => {
    if (!selectedAction || !handler || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setActionError(false);
    try {
      await handler(selectedAction);
      setSelectedAction(null);
    } catch {
      setActionError(true);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <section className={`ops-brief-card ${className}`} aria-label={text.title} aria-busy={isLoading}>
      <header className="ops-brief-header">
        <span className="ops-brief-agent" aria-hidden="true"><Sparkles size={11} /></span>
        <div className="ops-brief-header__identity"><h2>{text.title}</h2><span>{metadata || text.noAnalysis}</span></div>
        {canViewRuns && <Dropdown menu={{ items: [{ key: "activity", label: text.activity, onClick: () => navigate(routes.aiDispatch) }] }} trigger={["click"]}>
          <button className="ops-brief-more" type="button" aria-label={text.more}><MoreHorizontal size={16} /></button>
        </Dropdown>}
      </header>
      {isLoading ? <p className="ops-brief-state" role="status">{text.pending}</p> : error ? <div className="ops-brief-state" role="alert"><p>{error}</p>{onRetry && <button type="button" onClick={onRetry}>{text.retry}</button>}</div> : <>
        <p className={`ops-brief-summary${summary ? "" : " ops-brief-summary--empty"}`}>{summary || text.empty}</p>
        <div className="ops-brief-causes">
          <h3>{text.causes}</h3>
          {causes.length ? <ul>{causes.map((cause) => {
            const share = Number.isFinite(cause.share) ? Math.max(0, Math.min(1, cause.share)) : 0;
            return <li className="ops-cause-row" key={cause.label}>
              <span className="ops-cause-row__count">{String(cause.count).padStart(2, "0")}</span>
              <span className="ops-cause-row__label" title={cause.label}>{cause.label}</span>
              <span className="ops-cause-row__meter" role="progressbar" aria-label={cause.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share * 100)}><i style={{ width: `${share * 100}%` }} /></span>
            </li>;
          })}</ul> : <p className="ops-brief-empty">{text.noCauses}</p>}
        </div>
        <div className="ops-brief-actions"><h3>{text.proposed}</h3>
          {actions.length ? <ul>{actions.map((action) => <li key={action.id}><button type="button" className="ops-action-item" onClick={() => { setActionError(false); setSelectedAction(action); }}>
            <span className="ops-action-item__icon" aria-hidden="true">{action.kind === "reroute" ? <Route size={13} /> : action.kind === "reassign" ? <UsersRound size={13} /> : <Send size={13} />}</span>
            <span className="ops-action-item__content"><strong>{action.title}</strong>{action.hint && <small>{action.hint}</small>}</span>
            <ChevronRight size={12} aria-hidden="true" />
          </button></li>)}</ul> : <p className="ops-brief-empty">{text.noActions}</p>}
        </div>
      </>}
      <footer className="ops-brief-footer">
        <button type="button" className="ops-brief-review" onClick={() => navigate(routes.aiDispatch)}><Check size={12} />{text.review}</button>
        {canViewRuns && <button type="button" className="ops-brief-activity" onClick={() => navigate(routes.aiDispatch)}>{text.activity}</button>}
      </footer>
      <Modal open={Boolean(selectedAction)} title={text.modal} onCancel={() => { if (!submitting) setSelectedAction(null); }} closable={!submitting} maskClosable={!submitting}
        footer={<><Button aria-label={text.reject} disabled={!onRejectAction || submitting} onClick={() => void submit(onRejectAction)}>{text.reject}</Button><Button type="primary" aria-label={text.approve} aria-busy={submitting} loading={submitting} disabled={!onApproveAction || submitting} onClick={() => void submit(onApproveAction)}>{text.approve}</Button></>}>
        <p>{selectedAction?.title}</p>{selectedAction?.hint && <p>{selectedAction.hint}</p>}
        {!onApproveAction && <p>{text.noHandler}</p>}
        {actionError && <Alert type="error" showIcon message={text.failed} />}
      </Modal>
    </section>
  );
}
