import { Button } from "antd";
import { ArrowLeft, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { FlowPanel } from "@/components/tms-flow/FlowPanel";

/**
 * Placeholder for S02 (Flow A). Flow A is Phase 2; this route exists so the
 * topbar action never lands on the generic 404 page.
 */
export function NewShipmentPage() {
  const navigate = useNavigate();

  return (
    <div className="tms-page">
      <FlowPanel testId="new-shipment-phase2" title="New shipment capture">
        <div className="tms-empty">
          <Truck aria-hidden="true" size={32} />
          <h3>S02 arrives with Flow A (Phase 2)</h3>
          <p className="tms-muted">
            This demo build covers Flow B: dashboard, dispatch, route approval, shipment detail,
            tracking share, and live tracking. Rate-confirmation intake is not wired yet.
          </p>
          <div className="tms-agent-card__actions">
            <Button icon={<ArrowLeft size={14} aria-hidden="true" />} onClick={() => navigate("/tms")}>
              Back to dashboard
            </Button>
            <Button onClick={() => navigate("/tms/dispatch")} type="primary">
              Open dispatch
            </Button>
          </div>
        </div>
      </FlowPanel>
    </div>
  );
}
