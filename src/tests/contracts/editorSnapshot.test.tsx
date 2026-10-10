/** Real Ant Design form and transport prove stale reads cannot silently replace a draft's concurrency token. */
import { useDataProvider } from "@refinedev/core";
import { AxiosError, AxiosHeaders, type AxiosAdapter } from "axios";
import { Button, Form, Input } from "antd";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/providers/api/apiClient";
import { createLogisticsDataProvider } from "@/providers/dataProvider";
import { foundationApiResources } from "@/pages/resourceRegistry";
import { useResourceEditContract } from "@/components/resources/useResourceEditContract";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { normalizeHttpError } from "@/providers/api/httpError";
import { handoffExamples } from "@/tests/fixtures/handoffExamples";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";

const record: Record<string, unknown> = { ...handoffExamples.find((row) => row.name === "Update Load")!.body, id: "load", version: 2 };
function Editor() {
  const [form] = Form.useForm<Record<string, unknown>>(); const [read, setRead] = useState(record); const provider = useDataProvider();
  const contract = useResourceEditContract("loads", form, read);
  return <>{contract.feedback}<Form form={form} initialValues={record} onValuesChange={contract.onValuesChange} onFinish={async (values) => {
    try { await provider().update({ resource: "loads", id: "load", variables: contract.prepare(values) }); }
    catch (error) { contract.reportError(normalizeHttpError(error)); }
  }}><Form.Item name="name" label="Name"><Input /></Form.Item><Button htmlType="submit">Save</Button></Form>
    <Button onClick={() => { form.setFieldValue("name", "Server update"); setRead({ ...record, version: 4, name: "Server update" }); }}>Background refetch</Button></>;
}

describe("CORE read snapshot and request DTOs", () => {
  it("retains draft and version on 409 and an intervening server read until explicit resolution", async () => {
    const payloads: Record<string, unknown>[] = [];
    const adapter: AxiosAdapter = async (config) => {
      const server = { ...record, version: 4, name: "Server update" };
      if (config.method === "put") {
        payloads.push(JSON.parse(config.data));
        const data = { success: false, code: "CONCURRENT_MODIFICATION_CONFLICT", message: "stale", data: null, errors: [], meta: { timestamp: "2026-10-07T00:00:00Z", path: config.url, requestId: "conflict" } };
        throw new AxiosError("stale", "ERR_BAD_REQUEST", config, undefined, { config, data, headers: new AxiosHeaders(), status: 409, statusText: "409" });
      }
      return { config, data: { success: true, code: "OK", message: "OK", data: server, errors: [], meta: { timestamp: "2026-10-07T00:00:00Z", path: config.url, requestId: "read" } }, headers: new AxiosHeaders(), status: 200, statusText: "200" };
    };
    const apiClient = createApiClient({ runtimeConfig: { apiBaseUrl: "http://localhost:8080", healthPath: "/api/health", requestTimeoutMs: 5000 }, tokenProvider: { getAccessToken: () => "fixture", refreshAccessToken: async () => null }, adapter });
    await renderFinance(<Editor />, vi.fn(), { providerOverride: createLogisticsDataProvider({ apiClient, resources: foundationApiResources }) });
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "My draft" } }); fireEvent.click(screen.getByText("Save"));
    await screen.findByText("This record changed while you were editing.");
    expect(payloads[0]?.expectedVersion).toBe(2); expect(screen.getByLabelText("Name")).toHaveValue("My draft");
    fireEvent.click(screen.getByText("Background refetch")); await waitFor(() => expect(screen.getByLabelText("Name")).toHaveValue("My draft"));
    fireEvent.click(screen.getByText("Save")); await waitFor(() => expect(payloads).toHaveLength(2)); expect(payloads[1]?.expectedVersion).toBe(2);
    fireEvent.click(screen.getByText("Compare current values")); await screen.findByText("Discard draft and use current server values");
    expect(screen.getByLabelText("Name")).toHaveValue("My draft");
    fireEvent.click(screen.getByText("Discard draft and use current server values")); expect(screen.getByLabelText("Name")).toHaveValue("Server update");
    fireEvent.click(screen.getByText("Save")); await waitFor(() => expect(payloads).toHaveLength(3)); expect(payloads[2]?.expectedVersion).toBe(4);
  });

  it.each(["loads", "trips", "trucks"])("fails closed when %s has no server version", (resource) => {
    expect(() => buildResourceMutation(resource, {}, { id: "legacy-runtime" })).toThrow("CONTRACT_VERSION_UNAVAILABLE");
  });

  it("never invents absent Load selectors or sends nested stops/payroll invoice fields", () => {
    expect(buildResourceMutation("loads", { ...record, name: "draft" }, record)).not.toHaveProperty("containerId");
    expect(buildResourceMutation("trips", { name: "trip", status: "draft", totalDistance: 1, stops: [{ loadId: "load" }] }, { version: 2 })).toEqual({ name: "trip", status: "draft", totalDistance: 1, expectedVersion: 2 });
    expect(buildResourceMutation("invoices", { status: "DRAFT", type: "CUSTOMER", employeeId: "driver", periodStart: "2026-10-07", totalDistanceDriven: 100 })).toEqual({ status: "DRAFT", type: "CUSTOMER" });
  });
});
