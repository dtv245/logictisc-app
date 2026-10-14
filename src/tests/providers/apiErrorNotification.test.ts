/** Regression coverage for structured error classification and locale fallbacks. */
import { AxiosError, AxiosHeaders } from "axios";
import { createInstance, type i18n } from "i18next";
import { beforeAll, describe, expect, it } from "vitest";

import { enMessages } from "@/locales/en";
import { viMessages } from "@/locales/vi";
import { jaMessages } from "@/locales/ja";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";
import { ApiHttpError } from "@/utils/httpError";

let translations: i18n;
beforeAll(async () => {
  translations = createInstance();
  await translations.init({
    lng: "en", resources: {
      en: { translation: enMessages }, vi: { translation: viMessages }, ja: { translation: jaMessages },
    }, interpolation: { escapeValue: false },
  });
});
const format = (error: unknown, locale = "en") =>
  createApiErrorNotification(error, translations.getFixedT(locale));
const error = (statusCode: number, code: string, message: string) =>
  new ApiHttpError({ statusCode, code, message, requestId: "request-id" });

describe("API error notifications", () => {
  it.each([400, 401, 403, 404, 409, 422, 500, 503, 504])("preserves meaningful backend messages for HTTP %s", (statusCode) => {
    const message = "  Invoice 401: amount=1500; remaining=1000; PAYMENT_EXCEEDS_INVOICE_BALANCE  ";
    expect(format(error(statusCode, "PAYMENT_EXCEEDS_INVOICE_BALANCE", message)).description).toBe(message);
  });

  it("does not infer authentication or timeouts from message text", () => {
    expect(format(error(400, "CUSTOM_RULE", "Invoice 401 cannot use the timeout policy."))).toEqual(expect.objectContaining({
      message: "Invalid data", description: "Invoice 401 cannot use the timeout policy.",
    }));
    expect(format(new Error("The timeout policy is invalid."))).toEqual(expect.objectContaining({
      message: "Unable to complete the action", description: "The timeout policy is invalid.",
    }));
  });

  it("keeps messages for unknown backend codes and plain Refine HttpError objects", () => {
    expect(format(error(409, "NEW_BACKEND_CODE", "Verify account ABC-409.")).description).toBe("Verify account ABC-409.");
    expect(format({ statusCode: 403, message: "Driver 403 cannot access this truck." })).toEqual(expect.objectContaining({
      message: "Action not permitted", description: "Driver 403 cannot access this truck.",
    }));
  });

  it.each(["en", "vi", "ja"])("uses the current %s locale for standalone codes and missing content", (locale) => {
    const t = translations.getFixedT(locale);
    expect(format(error(409, "PAYMENT_EXCEEDS_INVOICE_BALANCE", "PAYMENT_EXCEEDS_INVOICE_BALANCE"), locale).description)
      .toBe(t("contractErrors.PAYMENT_EXCEEDS_INVOICE_BALANCE"));
    expect(format(error(409, "UNMAPPED_CODE", ""), locale).description).toBe(t("notifications.apiFallback.conflict"));
    expect(format(error(409, "UNMAPPED_CODE", "UNMAPPED_CODE"), locale).description).toBe(t("notifications.apiFallback.conflict"));
    const notification = createApiErrorNotification(error(400, "INVALID_RECORD_ID", "INVALID_RECORD_ID"), t, {
      operation: "create", resourceLabel: "Truck", key: "truck-error",
    });
    expect(notification.message).toBe(t("notifications.apiTitles.create", { resource: "Truck" }));
    expect(notification.description).toBe(t("notifications.apiCodes.INVALID_RECORD_ID"));
    expect(notification.key).toBe("truck-error");
    expect(notification.description).not.toMatch(/^notifications\./);
  });

  it("interpolates safe backend params only for standalone codes", () => {
    const failure = new ApiHttpError({ statusCode: 429, code: "LARK_RATE_LIMITED",
      message: "LARK_RATE_LIMITED", params: { retryAfterSeconds: 15 }, requestId: null });
    expect(format(failure).description).toBe("Lark is receiving too many requests. Wait 15 seconds before trying again.");
    const missingParams = error(429, "LARK_RATE_LIMITED", "LARK_RATE_LIMITED");
    expect(format(missingParams).description).not.toContain("{{");
  });

  it.each([
    ["ERR_NETWORK", "network"], ["ECONNABORTED", "timeout"], ["ETIMEDOUT", "timeout"],
  ])("recognizes actual transport code %s", (code, fallback) => {
    const notification = format(new AxiosError("Technical Axios text", code));
    expect(notification.message).toBe(translations.t(`notifications.apiTitles.${fallback}`));
    expect(notification.description).toBe(translations.t(`notifications.apiFallback.${fallback}`));
  });

  it("uses structured HTTP status when Axios has no backend envelope", () => {
    const config = { headers: new AxiosHeaders() };
    const failure = new AxiosError("Request failed with status code 503", "ERR_BAD_RESPONSE", config, undefined, {
      config, data: "<html>Service unavailable</html>", headers: new AxiosHeaders(), status: 503, statusText: "Unavailable",
    });
    expect(format(failure).description).toBe(translations.t("notifications.apiFallback.server"));
  });

  it("only recommends rereading data for the confirmed concurrency code", () => {
    const conflict = format(error(409, "OTHER_CONFLICT", ""));
    expect(conflict.description).toBe(translations.t("notifications.apiFallback.conflict"));
    const concurrency = format(error(409, "CONCURRENT_MODIFICATION_CONFLICT", "CONCURRENT_MODIFICATION_CONFLICT"));
    expect(concurrency.description).toContain("Reload");
  });

  it("does not treat object prototype properties as known error codes", () => {
    expect(format(error(409, "constructor", "constructor")).description).toBe(translations.t("notifications.apiFallback.conflict"));
  });
});
