import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import { BrowserRouter } from "react-router";

import "./App.css";
import { accessControlProvider } from "./providers/accessControlProvider";
import { authProvider } from "./providers/authProvider";
import { dataProvider } from "./providers/dataProvider";
import { useAntdNotificationProvider } from "./providers/notificationProvider";
import { AppRouter } from "./routes/AppRouter";
import { routes } from "./routes/routeConfig";

const resources = [
  {
    name: "dashboard",
    list: routes.dashboard,
    meta: { label: "Tổng quan" },
  },
];

const RefineApplication = () => {
  const notificationProvider = useAntdNotificationProvider();

  return (
    <Refine
      accessControlProvider={accessControlProvider}
      authProvider={authProvider}
      dataProvider={dataProvider}
      notificationProvider={notificationProvider}
      resources={resources}
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
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: "#2563eb",
            borderRadius: 8,
          },
        }}
      >
        <AntdApp>
          <RefineApplication />
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
