/** Contracts for code-based messages, interpolation and legacy error envelopes. */
import { beforeAll, describe, expect, it } from "vitest";
import { initializeAppI18n } from "@locales";
import { resolveApiErrorMessage } from "@/utils/errorMessages";
import { toRefineHttpError } from "@/utils/httpError";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;
beforeAll(async () => { i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" }); });
describe("API code translations", () => {
  it("translates field params and updates cached errors after a locale change", async () => {
    const error = toRefineHttpError(409, { success: false, code: "DATA_CONFLICT", message: "Fallback",
      data: null, params: {}, errors: [{ field: "email", code: "UNIQUE", message: "Fallback unique", params: {} }],
      meta: { timestamp: "2026-10-13T00:00:00Z", path: "/api/employees", requestId: "test-id" } });
    expect(error.errors?.email).toEqual(["Giá trị này đã được sử dụng."]);
    expect(resolveApiErrorMessage("Min", { value: 1 }, "fallback", i18n.t, "fields")).toContain("1");
    await i18n.changeLanguage("en");
    expect(error.errors?.email).toEqual(["This value is already in use."]);
    await i18n.changeLanguage("vi");
  });
  it("keeps fallback text for unknown codes and old envelopes", () => {
    expect(resolveApiErrorMessage("UNKNOWN_FUTURE_CODE", {}, "Safe fallback", i18n.t)).toBe("Safe fallback");
    const error=toRefineHttpError(400,{success:false,code:"CUSTOM_DOMAIN",message:"Legacy message",data:null,
      errors:[],meta:{timestamp:"2026-10-13T00:00:00Z",path:"/api/test",requestId:null}});
    expect(error.message).toBe("Legacy message");
  });
  it("translates new machine envelopes while preserving older domain detail", () => {
    const envelope={success:false,code:"DATA_INTEGRITY_VIOLATION",message:"Detailed legacy explanation",data:null,
      errors:[],meta:{timestamp:"2026-10-13T00:00:00Z",path:"/api/trucks",requestId:"contract-id"}};
    const current=toRefineHttpError(409,{...envelope,params:{}});
    expect(current.hasMachineParams).toBe(true);
    expect(createApiErrorNotification(current,i18n.t).description).toBe("Dữ liệu xung đột với bản ghi đã tồn tại.");
    const legacy=toRefineHttpError(409,envelope);
    expect(legacy.hasMachineParams).toBe(false);
    expect(createApiErrorNotification(legacy,i18n.t).description).toBe("Detailed legacy explanation");
  });
});
