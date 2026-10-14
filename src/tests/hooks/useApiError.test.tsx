/** Checks the direct Ant Design error path uses the same message policy as Refine. */
import { act, renderHook } from "@testing-library/react";
import { App } from "antd";
import { AxiosError } from "axios";
import { createInstance, type i18n } from "i18next";
import type { ReactNode } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { useApiError } from "@/hooks/useApiError";
import { enMessages } from "@/locales/en";
import { ApiHttpError } from "@/providers/api/httpError";

let translations: i18n;
beforeAll(async () => {
  translations = createInstance();
  await translations.use(initReactI18next).init({ lng: "en", resources: { en: { translation: enMessages } } });
});
afterEach(() => vi.restoreAllMocks());
const wrapper = ({ children }: { children: ReactNode }) =>
  <I18nextProvider i18n={translations}>{children}</I18nextProvider>;

describe("useApiError", () => {
  it.each([
    new ApiHttpError({ statusCode: 409, code: "PAYMENT_EXCEEDS_INVOICE_BALANCE", message: "Amount 1500 exceeds balance 1000.", requestId: "request-409" }),
    new AxiosError("Technical timeout text", "ECONNABORTED"),
  ])("keeps backend messages and localizes actual transport errors", (error) => {
    const show = vi.fn();
    vi.spyOn(App, "useApp").mockReturnValue({ notification: { error: show } as never, message: {} as never, modal: {} as never });
    const { result } = renderHook(useApiError, { wrapper });
    act(() => {
      const normalized = result.current.showApiError(error);
      expect(normalized).toBeInstanceOf(ApiHttpError);
      if (error instanceof ApiHttpError) expect(normalized).toBe(error);
    });
    expect(show).toHaveBeenCalledWith(expect.objectContaining({
      description: error instanceof ApiHttpError ? error.message : translations.t("notifications.apiFallback.timeout"),
    }));
  });
});
