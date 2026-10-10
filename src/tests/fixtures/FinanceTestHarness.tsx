/** Real Refine/Query/i18n/Ant Design providers; only the HTTP boundary is simulated. */
import { Refine, type CustomParams, type DataProvider, type BaseRecord } from "@refinedev/core";
import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { App as AntdApp, ConfigProvider } from "antd";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { enMessages } from "@/locales/en";
import { createAccessControlProvider } from "@/providers/accessControlProvider";
import { normalizeJwtRoles } from "@/providers/permissions/jwtRoles";

export interface FinanceRenderOptions { initialEntries?: string[]; role?: string; client?: QueryClient; listRequest?: DataProvider["getList"]; providerOverride?: DataProvider }
export async function renderFinance(children: ReactNode, request: (options: CustomParams) => Promise<unknown>, { providerOverride, listRequest, initialEntries = ["/"], role = "ADMIN", client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }) }: FinanceRenderOptions = {}) {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({ lng: "en", resources: { en: { translation: enMessages } }, interpolation: { escapeValue: false } });
  const unused = async (): Promise<never> => { throw new Error("Unexpected CRUD call in finance test"); };
  const provider: DataProvider = { getList: listRequest ?? unused, getOne: unused, create: unused, update: unused, deleteOne: unused, getApiUrl: () => "",
    custom: async <TData extends BaseRecord>(options: CustomParams) => ({ data: await request(options) as TData }) };
  const notification = vi.fn();
  const result = render(<MemoryRouter initialEntries={initialEntries}><I18nextProvider i18n={i18n}><ConfigProvider theme={{ token: { motion: false } }}><AntdApp>
    <Refine dataProvider={providerOverride ?? provider} notificationProvider={{ open: notification, close: vi.fn() }}
      accessControlProvider={createAccessControlProvider({ getJwtRoles: async () => normalizeJwtRoles(null, [role]) })}
      options={{ reactQuery: { clientConfig: client } }}>{children}</Refine>
  </AntdApp></ConfigProvider></I18nextProvider></MemoryRouter>);
  return { ...result, client, notification };
}
