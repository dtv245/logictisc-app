/**
 * Mounts the minimal public router available after a successful health gate.
 */

import {
  DiagnosticsPage,
  type ReadyBootstrapState,
} from "@app/diagnostics";
import { NotFoundState } from "@shared/components";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import { routes } from "./routes";

export interface AppRouterProps {
  state: ReadyBootstrapState;
}

function NotFoundRoute() {
  const navigate = useNavigate();

  return (
    <NotFoundState
      onGoHome={() => {
        navigate(routes.diagnostics, { replace: true });
      }}
    />
  );
}

export function AppRoutes({ state }: AppRouterProps) {
  return (
    <Routes>
      <Route
        element={
          <Navigate replace to={routes.diagnostics} />
        }
        path={routes.root}
      />
      <Route
        element={<DiagnosticsPage state={state} />}
        path={routes.diagnostics}
      />
      <Route element={<NotFoundRoute />} path="*" />
    </Routes>
  );
}

export function AppRouter({ state }: AppRouterProps) {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes state={state} />
    </BrowserRouter>
  );
}
