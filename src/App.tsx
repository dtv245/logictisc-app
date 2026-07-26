/**
 * Ghép Refine với providers, resource registry, router và Ant Design theme.
 */

import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router-v6";
import { App as AntdApp } from "antd";
import { BrowserRouter } from "react-router-dom";

import "./styles/app.scss";
import { accessControlProvider } from "./providers/accessControlProvider";
import { authProvider } from "./providers/authProvider";
import { dataProvider } from "./providers/dataProvider";
import { useAntdNotificationProvider } from "./providers/notificationProvider";
import { appResources } from "./pages";
import { AppRouter } from "./routes/AppRouter";

const RefineApplication = () => {
  // Provider cần Ant Design App context nên được khởi tạo bên trong AntdApp.
  const notificationProvider = useAntdNotificationProvider();

  return (
    <Refine
      accessControlProvider={accessControlProvider}
      authProvider={authProvider}
      dataProvider={dataProvider}
      notificationProvider={notificationProvider}
      resources={appResources}
      routerProvider={routerProvider}
      options={{
        disableTelemetry: true,
        syncWithLocation: true,
      }}
    >
      <AppRouter />
    </Refine>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AntdApp>
        <RefineApplication />
      </AntdApp>
    </BrowserRouter>
  );
}

export default App;
