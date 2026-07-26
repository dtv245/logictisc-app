/**
 * Khởi tạo React root và các global stylesheet của ứng dụng.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "@refinedev/antd/dist/reset.css";
import "./styles/global.scss";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Không tìm thấy phần tử #root.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
