/** Immutable own/finance detail, backend ownership rejection and authenticated PDF single-flight. */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PayslipShow } from "@/pages/payslips/PayslipShow";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { payslip, payslipId } from "@/tests/fixtures/payslip";
import { ApiHttpError } from "@/providers/api/httpError";
import type { PayslipDownloader } from "@/features/payslips/payslip.api";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser: () => ({ data: { employeeId: "own-employee" } }) }));
const options = { role: "DRIVER", initialEntries: [`/payslips/${payslipId}`] };
const page = (download?: PayslipDownloader) => <Routes><Route path="/payslips/:id" element={<PayslipShow download={download} />} /></Routes>;
afterEach(() => vi.unstubAllGlobals());
describe("PayslipShow", () => {
  it("preserves authoritative net and distinguishes issuance/payment with no edit action", async () => {
    await renderFinance(page(), async () => payslip, options); expect(await screen.findByTestId("payslip-netAmount")).toHaveTextContent("811.21");
    expect(screen.getByText("Current payment status unavailable")).toBeInTheDocument(); expect(screen.getByText("Payslip issuance does not prove that payment succeeded.")).toBeInTheDocument(); expect(screen.queryByRole("button", { name: /edit|pay|retry/i })).not.toBeInTheDocument();
    expect(screen.getByText("SG")).toBeInTheDocument(); expect(screen.getByText("Employee Profile")).toBeInTheDocument();
  });
  it("honors forbidden access to another employee's payslip and never downloads it", async () => {
    const download = vi.fn<PayslipDownloader>(); await renderFinance(page(download), async () => { throw new ApiHttpError({ statusCode: 403, code: "FORBIDDEN", message: "Payslip belongs to another employee", requestId: "ownership-error" }); }, options);
    expect(await screen.findByText("Access denied")).toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Download PDF" })).not.toBeInTheDocument(); expect(download).not.toHaveBeenCalled();
  });
  it("downloads once through the injected existing client path and revokes the saved blob URL", async () => {
    let finish: (value: Awaited<ReturnType<PayslipDownloader>>) => void = () => undefined;
    const download = vi.fn<PayslipDownloader>(() => new Promise((resolve) => { finish = resolve; })); const objectUrl = vi.fn(() => "blob:payslip-test"); const revoke = vi.fn(); const NativeURL = URL;
    vi.stubGlobal("URL", class extends NativeURL { static createObjectURL = objectUrl; static revokeObjectURL = revoke; }); const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    await renderFinance(page(download), async () => payslip, options); const button = await screen.findByRole("button", { name: "Download PDF" }); fireEvent.click(button); fireEvent.click(button);
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1)); expect(button).toBeDisabled(); expect(download).toHaveBeenCalledWith({ path: `/api/payslips/${payslipId}/pdf` });
    finish({ data: new Blob(["%PDF-test"], { type: "application/pdf" }), status: 200, statusText: "OK", headers: {}, config: { headers: new AxiosHeaders() } });
    await waitFor(() => expect(button).toBeEnabled()); expect(objectUrl).toHaveBeenCalledTimes(1); expect(click).toHaveBeenCalledTimes(1); await waitFor(() => expect(revoke).toHaveBeenCalledWith("blob:payslip-test")); click.mockRestore();
  });
  it("shows actionable unavailable PDF error without pretending a download succeeded", async () => {
    const download = vi.fn<PayslipDownloader>().mockRejectedValue(new ApiHttpError({ statusCode: 409, code: "PAYSLIP_PDF_UNAVAILABLE", message: "No persisted artifact", requestId: "pdf-request" }));
    await renderFinance(page(download), async () => payslip, options); fireEvent.click(await screen.findByRole("button", { name: "Download PDF" })); expect(await screen.findByText("The persisted PDF is unavailable for this payslip.")).toBeInTheDocument(); expect(screen.getByText(/pdf-request/)).toBeInTheDocument();
  });
  it("does not invent values from missing or malformed immutable snapshots", async () => {
    await renderFinance(page(), async () => ({ ...payslip, snapshotJson: "{}" }), options); expect(await screen.findByText("The immutable payslip snapshot is unavailable or invalid.")).toBeInTheDocument(); expect(screen.queryByTestId("payslip-netAmount")).not.toBeInTheDocument();
  });
});
