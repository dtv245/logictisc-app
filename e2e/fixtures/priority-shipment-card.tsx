import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { initializeAppI18n } from "../../src/locales";
import "@/styles/global.scss";
import { PriorityShipmentCard } from "@/components/dashboard/PriorityShipmentCard";

import { referenceShipment } from "./dashboard-reference.data";

const params = new URLSearchParams(window.location.search);
const state = params.get("state");
const locale = params.get("locale") === "vi" ? "vi" : "en";
const i18n = await initializeAppI18n({
  locale,
  fallbackLocale: "en",
  strictMissingKeys: true,
});
const root = document.getElementById("root");
if (root) createRoot(root).render(
  <I18nextProvider i18n={i18n}>
    <PriorityShipmentCard locale={locale}
      shipments={state === "empty" ? [] : [referenceShipment]}
      isLoading={state === "loading"}
      error={state === "error" ? "Unable to load shipments. Please try again." : undefined}
      onRetry={state === "error" ? () => window.location.reload() : undefined}
    />
  </I18nextProvider>,
);
