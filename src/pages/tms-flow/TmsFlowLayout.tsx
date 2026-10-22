import { Button } from "antd";
import { Plus } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { routes } from "@/constants/routes";
import "@/styles/tms-flow.scss";

const LINKS = [
  { to: routes.tmsFlow.root, label: "Dashboard", end: true },
  { to: routes.tmsFlow.dispatch, label: "Dispatch", end: false },
  { to: routes.tmsFlow.approvals, label: "AI approvals", end: false },
] as const;

/** Real `/tms` shell: no demo provider, no fixture chrome. */
export function TmsFlowLayout() {
  const navigate = useNavigate();

  return (
    <div className="tms-flow">
      <div className="tms-row">
        <nav aria-label="TMS sections" className="tms-subnav">
          {LINKS.map((link) => (
            <NavLink
              className={({ isActive }) =>
                `tms-subnav__link${isActive ? " is-active" : ""}`
              }
              end={link.end}
              key={link.to}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <Button
          icon={<Plus size={15} aria-hidden="true" />}
          onClick={() => navigate(routes.resources.loads.create)}
          type="primary"
        >
          New shipment
        </Button>
      </div>
      <Outlet />
    </div>
  );
}
