/**
 * Khởi tạo React root và các global stylesheet của ứng dụng.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { initializeAppI18n } from "./locales";
import "@refinedev/antd/dist/reset.css";
import "./styles/global.scss";
import "./styles/app.scss";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Không tìm thấy phần tử #root.");
}

const i18n = await initializeAppI18n({
  locale: "vi",
  fallbackLocale: "en",
});

createRoot(rootElement).render(
  <StrictMode>
    <App i18n={i18n} />
  </StrictMode>,
);
