/** Browser-only fixture using the real Refine table, serializer and error adapter. */
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router-v6";
import { App, ConfigProvider } from "antd";
import { initializeAppI18n } from "../../src/locales";
import { createApiClient } from "../../src/providers/api/apiClient";
import { createLogisticsDataProvider } from "../../src/providers/dataProvider";
import { ResourceListPage } from "../../src/components/ResourceListPage";

const i18n=await initializeAppI18n({locale:"en",fallbackLocale:"en"});
const apiClient=createApiClient({runtimeConfig:{apiBaseUrl:window.location.origin,healthPath:"/api/health",requestTimeoutMs:5000},
  tokenProvider:{getAccessToken:async()=>null,refreshAccessToken:async()=>null}});
const provider=createLogisticsDataProvider({apiClient,resources:{documents:{collectionPath:"/api/documents",allowedFilterFields:[],allowedSortFields:["fileName"]}}});
createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode><I18nextProvider i18n={i18n}><ConfigProvider><App><BrowserRouter>
    <Refine dataProvider={provider} routerProvider={routerProvider} resources={[{name:"documents",list:"/e2e/fixtures/error-contracts.html"}]}
      options={{disableTelemetry:true,syncWithLocation:true,reactQuery:{clientConfig:{defaultOptions:{queries:{retry:false}}}}}}>
      <ResourceListPage resource="documents" columns={[{title:i18n.t("columns.documents.fileName"),dataIndex:"fileName",key:"fileName"}]} />
    </Refine>
  </BrowserRouter></App></ConfigProvider></I18nextProvider></React.StrictMode>,
);
