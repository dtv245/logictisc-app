import { Button } from "antd";
import { Plus } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";

import { routes } from "@/constants/routes";
import "@/styles/tms-flow.scss";

/** Real `/tms` shell: no demo provider, no fixture chrome. */
export function TmsFlowLayout() {
  const navigate = useNavigate();

  return (
    <div className="tms-flow">
      <div className="tms-workspace-actions">
        <Button
          icon={<Plus size={15} aria-hidden="true" />}
          onClick={() => navigate(routes.resources.loads.create)}
          type="primary"
        >
          Tạo lô hàng
        </Button>
      </div>
      <Outlet />
    </div>
  );
}
