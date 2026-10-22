import { Button } from "antd";
import { FlaskConical, RotateCcw } from "lucide-react";

export interface FlowDemoBannerProps {
  onReset: () => void;
  resetting?: boolean;
}

export function FlowDemoBanner({ onReset, resetting = false }: FlowDemoBannerProps) {
  return (
    <div className="tms-demo-banner" role="status">
      <span className="tms-demo-banner__badge">
        <FlaskConical size={14} aria-hidden="true" />
        UI demo
      </span>
      <span className="tms-demo-banner__copy">
        Sample data (browser fixture) · nothing is sent to the backend · tracking tokens are fake
      </span>
      <Button
        className="tms-demo-banner__reset"
        disabled={resetting}
        icon={<RotateCcw size={14} aria-hidden="true" />}
        onClick={onReset}
        size="small"
        type="text"
      >
        Reset demo
      </Button>
    </div>
  );
}
