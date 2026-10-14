/**
 * Verifies backend messages survive the Refine-to-Ant Design boundary, including
 * default notifications, custom error callbacks, and undoable mutations.
 */
import { Refine, useCreate, type BaseRecord, type DataProvider, type OpenNotificationParams } from "@refinedev/core";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { App } from "antd";
import { createInstance, type i18n } from "i18next";
import { isValidElement, type ReactNode } from "react";
import { I18nextProvider, initReactI18next, useTranslation } from "react-i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { enMessages } from "@/locales/en";
import { createApiErrorNotification } from "@/providers/apiErrorNotification";
import { ApiHttpError, toRefineHttpError } from "@/providers/api/httpError";
import { useAntdNotificationProvider } from "@/providers/notificationProvider";

let translations: i18n;
beforeAll(async () => {
  translations = createInstance();
  await translations.use(initReactI18next).init({
    lng: "en", resources: { en: { translation: enMessages } },
    interpolation: { escapeValue: false },
  });
});
afterEach(() => vi.restoreAllMocks());

const wrapper = ({ children }: { children: ReactNode }) =>
  <I18nextProvider i18n={translations}>{children}</I18nextProvider>;

describe("notification provider", () => {
  const notification = { success: vi.fn(), error: vi.fn(), open: vi.fn(), destroy: vi.fn(), info: vi.fn(), warning: vi.fn() };
  beforeEach(() => {
    Object.values(notification).forEach((mock) => mock.mockClear());
    vi.spyOn(App, "useApp").mockReturnValue({ notification, message: {} as never, modal: {} as never });
  });

  it.each([
    { type: "error", key: "create-payments", message: "Error (status code: 409)", description: "Amount 1500 exceeds invoice balance 1000." },
    { type: "error", key: "create-trucks", message: "License plate 51C-12345 already exists." },
    { type: "error", message: "Error (status code: 400)", description: "Invoice 401 is closed." },
    { type: "error", message: "Update failed", description: "PAYMENT_EXCEEDS_INVOICE_BALANCE: amount=1500; remaining=1000" },
    { type: "success", key: "create-trucks", message: "Custom success title", description: "Custom success details" },
  ] satisfies OpenNotificationParams[])("preserves caller content: $message", (params) => {
    const { result } = renderHook(useAntdNotificationProvider, { wrapper });
    act(() => result.current.open(params));
    const method = params.type === "success" ? notification.success : notification.error;
    expect(method).toHaveBeenCalledWith(expect.objectContaining({
      message: params.message, description: params.description,
    }));
  });

  it("preserves progress timing, key, undo callback and close", () => {
    const cancel = vi.fn();
    const { result } = renderHook(useAntdNotificationProvider, { wrapper });
    act(() => result.current.open({
      type: "progress", key: "undo-load", message: "Deleting load",
      description: "You can undo", undoableTimeout: 9000, cancelMutation: cancel,
    }));
    expect(notification.open).toHaveBeenCalledWith(expect.objectContaining({
      key: "undo-load", message: "Deleting load", description: "You can undo", duration: 9,
    }));
    const button = notification.open.mock.calls[0][0].btn;
    expect(isValidElement(button)).toBe(true);
    render(button);
    fireEvent.click(screen.getByRole("button", { name: translations.t("common.undo") }));
    expect(cancel).toHaveBeenCalledTimes(1);
    act(() => result.current.close("undo-load"));
    expect(notification.destroy).toHaveBeenCalledWith("undo-load");
  });
});

function Mutation({ custom }: { custom: boolean }) {
  const { t } = useTranslation();
  const { mutate } = useCreate<BaseRecord, ApiHttpError>({
    errorNotification: custom
      ? (error) => createApiErrorNotification(error, t, { operation: "create", resourceLabel: "Truck" })
      : undefined,
  });
  return <button onClick={() => mutate({ resource: "trucks", values: {} })}>Create</button>;
}

function RefineRuntime({ provider, custom }: { provider: DataProvider; custom: boolean }) {
  const notificationProvider = useAntdNotificationProvider();
  return <Refine dataProvider={provider} notificationProvider={notificationProvider}
    resources={[{ name: "trucks" }]} options={{ disableTelemetry: true }}>
    <Mutation custom={custom} />
  </Refine>;
}

describe.each([false, true])("Refine mutation integration, custom callback: %s", (custom) => {
  it.each([
    [401, "UNAUTHORIZED", "This account is disabled for tenant 401."],
    [403, "FORBIDDEN", "Only the payroll owner can approve employee 403."],
    [404, "RESOURCE_NOT_FOUND", "Truck 51C-12345 was not found."],
    [409, "PAYMENT_EXCEEDS_INVOICE_BALANCE", "Amount 1500 exceeds invoice balance 1000."],
    [422, "VALIDATION_FAILED", "License plate 51C-12345 already exists."],
    [500, "INTERNAL_ERROR", "Unable to complete this operation. Request ID: backend-500."],
  ])("keeps backend details for HTTP %s", async (statusCode, code, backendMessage) => {
    const provider: DataProvider = {
      getApiUrl: () => "",
      getList: async () => ({ data: [], total: 0 }),
      getOne: async () => { throw new Error("unused"); },
      update: async () => { throw new Error("unused"); },
      deleteOne: async () => { throw new Error("unused"); },
      create: async () => {
        throw toRefineHttpError(statusCode, {
          success: false, code, message: backendMessage, data: null, errors: [],
          meta: { timestamp: "2026-10-13T00:00:00Z", path: "/api/trucks", requestId: "backend-request" },
        });
      },
    };
    render(<I18nextProvider i18n={translations}><App><RefineRuntime provider={provider} custom={custom} /></App></I18nextProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText(backendMessage)).toBeInTheDocument();
    expect(screen.queryByText(/updated by another|password is incorrect/i)).not.toBeInTheDocument();
  });
});
