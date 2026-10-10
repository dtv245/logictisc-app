#!/usr/bin/env python3
"""Produce an exhaustive operation/schema matrix from the verified, immutable frontend handoff."""
import collections
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "docs/frontend-backend-handoff/docs/frontend"
API = json.loads((BUNDLE / "openapi-backend-remediation.json").read_text())
RUNTIME = json.loads((ROOT / "docs/frontend-backend-runtime-evidence.json").read_text())
METHODS = {"get", "post", "put", "patch", "delete", "head", "options", "trace"}


def mapping(method, path):
    """Mappings represent real consumers or dormant command adapters, never inferred endpoints."""
    group = path.split("/")[2] if path.startswith("/api/") else "health"
    if path == "/api/me":
        return ["src/providers/auth/currentUser.ts"], "ACTIVE", "MATCHED", "Existing loader already matches; real bearer identity pending"
    if path == "/api/auth/lark/callback":
        return ["src/providers/authProvider.ts"], "ACTIVE", "MATCHED", "Public POST; old bearer omitted; provider error handled locally"
    if path == "/api/auth/lark/login":
        return ["src/providers/authProvider.ts", "src/App.tsx"], "ACTIVE", "FE_PATCHED", "302 redirect; runtime-base login URL corrected"
    if path == "/api/health":
        return ["src/providers/api/apiClient.ts"], "ACTIVE", "MATCHED", "RAW public health; liveness only"
    if path.startswith("/api/messages"):
        return ["src/features/messaging/messaging.api.ts", "src/features/messaging/MessagingPanel.tsx"], "DORMANT", "FE_PATCHED", "Mapped employee/self reads; omit sender/participants; membership gate remains runtime-unverified"
    if path.startswith("/api/payments"):
        if method == "DELETE": return [], "NOT_USED_BY_FE", "NOT_USED_BY_FE", "Deprecated: authorized server command always rejects PAYMENT_DELETE_FORBIDDEN; UI delete removed"
        return ["src/features/payments/paymentCommands.ts", "src/features/payments/PaymentCommandForm.tsx", "src/types/payment.dto.ts"], "ACTIVE" if method == "GET" else "DORMANT", "FE_PATCHED", "Flat view/create; PENDING/invoice/key; frozen replay; metadata omission/null; query cancellation"
    if "/requested-pickup-business-date" in path:
        return ["src/features/loads/PickupBusinessDateForm.tsx"], "DORMANT", "FE_PATCHED", "Independent LocalDate/provenance/expectedChangeId; never appointment conversion"
    if path.endswith("/rating/preview"):
        return ["src/features/rates/FscPreview.tsx", "src/types/rateRule.dto.ts"], "ACTIVE", "FE_PATCHED", "Ephemeral preview; optional selectors omitted; freeze request/server hashes for acceptance"
    if path.endswith("/rating/accept"):
        return ["src/features/invoices/billingCommands.ts", "src/features/rates/RatingAcceptance.tsx"], "DORMANT", "FE_PATCHED", "Frozen preview request and server hashes; actor from identity"
    if path.startswith("/api/invoices/billing"):
        return ["src/features/invoices/billingCommands.ts", "src/features/invoices/PrimaryInvoiceForm.tsx"], "DORMANT", "FE_PATCHED", "Snapshot identity invoiceId; explicit tax evidence; 120-character invoice key; typed correction commands"
    if group in ["customers", "employees", "trucks", "loads", "trips", "invoices", "roles", "drivers", "documents", "notifications"] and re.fullmatch(r"/api/[\w-]+(?:/\{id\})?", path):
        status = "FE_PATCHED" if group in ["customers", "employees", "trucks", "loads", "trips", "invoices"] else "MATCHED"
        note = "Flat projection/request; schema string vocabulary; exact role grants" if status == "FE_PATCHED" else "Retain existing envelope adapter and query contract; new authority matrix applied"
        if method == "PUT" and group in ["loads", "trips", "trucks"]: return ["src/pages/resourceRegistry.ts", "src/components/resources/useResourceEditContract.tsx", "src/components/resources/resourceMutation.ts"], "DORMANT", status, "Full required PUT + original expectedVersion; preserve 409 draft and explicit server comparison"
        if method in ["PUT", "DELETE"] and group == "invoices":
            if method == "DELETE": return [], "NOT_USED_BY_FE", "NOT_USED_BY_FE", "Physical financial-history delete hidden"
            note += "; authoritative pre-read permits legacy DRAFT only, rated/issued guarded"
        return ["src/pages/resourceRegistry.ts", "src/providers/dataProvider.ts"], "ACTIVE", status, note
    if path.startswith("/api/trips/") and path.endswith(("/drivers", "/unassign", "/stops")) or path.startswith("/api/trip-stops/") and "calculate-detention" not in path:
        return ["src/features/trips/tripExecution.api.ts", "src/features/trips/useTripDriverAssignments.ts", "src/features/trips/useTripStopActions.ts"], "ACTIVE", "MATCHED", "Existing execution commands; no collection creation/nested stop mutation"
    if path.endswith("/timeline"):
        return ["src/features/loads/LoadTimelinePanel.tsx"], "ACTIVE", "MATCHED", "Tenant/Load scoped read; original occurrence times"
    if "accessorial" in path or "calculate-detention" in path:
        return ["src/features/accessorials/accessorials.api.ts"], "ACTIVE", "MATCHED", "Independent customer/company/driver amounts; explicit approve and measured detention"
    if "/costs" in path and path.startswith("/api/loads/"):
        return ["src/features/shipment-costs/shipmentCosts.api.ts"], "ACTIVE", "MATCHED", "Load ledger only; estimate/actual and source evidence kept separate"
    if path.startswith("/api/reports/profitability") or path.endswith("/financial-summary"):
        return ["src/features/profitability/profitability.api.ts", "src/features/profitability/financialDisplay.ts"], "ACTIVE", "MATCHED", "Authoritative availability/currency/unit/reason; no zero/FX/attribution reconstruction"
    if path in ["/api/reports/fleet/health", "/api/reports/fleet/utilization-history"]:
        return ["src/features/fleet/fleetReport.api.ts"], "ACTIVE" if path.endswith("utilization-history") else "NOT_USED_BY_FE", "MATCHED", "Explicit policy/trucks/period/zone; report roles; historical DONE remains distinct from new certification"
    if path.startswith("/api/reports/") or path.endswith("/balance"):
        return ["src/features/executive/executive.queries.ts"], "DORMANT", "CONTRACT_BLOCKED", "Executive foundation retained; legacy DTO/parameter compatibility and summary missing"
    if path.startswith("/api/driver-settlements"):
        if path.endswith(("/recalculate-revenue", "/billing-adjustments")):
            return ["src/features/settlements/settlementRevenue.api.ts"], "DORMANT", "FE_PATCHED", "Distinct Recalculate expectedSnapshotId and Adjustment affectedDocumentId; separate outcomes/intent"
        return ["src/features/settlements/settlement.query.ts", "src/features/settlements/useSettlementActions.ts"], "ACTIVE", "MATCHED", "List is envelope array; exposed commands only; immutable correction history"
    if path.startswith("/api/driver-pay-policies"):
        return ["src/features/settlements/driverPayPolicy.query.ts"], "ACTIVE", "FE_PATCHED", "Existing versioned policy contract; tenant/permission query scope added"
    if path.startswith("/api/pay-periods"):
        return ["src/features/settlements/settlement.query.ts"], "ACTIVE" if method == "GET" else "NOT_USED_BY_FE", "MATCHED", "Explicit period read for calculation; no inferred period"
    if path.startswith("/api/payroll/"):
        if "/configuration/" in path or "provider-callbacks" in path or "no-payment-required" in path:
            return [], "NOT_USED_BY_FE", "NOT_USED_BY_FE", "Configuration editor reads absent; provider callback is server-only; no-payment command has no current UI"
        if path.endswith("/payslips"): return [], "NOT_USED_BY_FE", "NOT_USED_BY_FE", "Lock issues slips atomically; no standalone browser reissuance"
        return ["src/features/payroll/payroll.api.ts", "src/features/payroll/usePayrollActions.ts", "src/features/payroll/usePayrollPaymentActions.ts"], "ACTIVE", "FE_PATCHED", "Explicit RAW adapter; run/item/payment semantics distinct; keyed commands frozen; reconciliation Spring page 0-based"
    if path.startswith("/api/payslips") or path == "/api/driver/me/payslips":
        return ["src/features/payslips/payslip.api.ts", "src/pages/payslips/MyPayslipsPage.tsx", "src/pages/payslips/PayslipShow.tsx"], "ACTIVE", "FE_PATCHED", "RAW metadata/self list; PDF blob/no-store; employee ownership; no current payment claim"
    if path.startswith("/api/optimization/runs"):
        return ["src/features/optimization/optimization.api.ts", "src/features/optimization/useOptimizationActions.ts"], "ACTIVE", "FE_PATCHED", "Server rank/score/fingerprint; frozen command; scoped resource/version refresh; conflict guard"
    if path == "/api/notifications/mark-all-read":
        return ["src/features/notifications/useNotificationActions.ts"], "ACTIVE", "MATCHED", "Existing tenant-wide command; no per-object read-receipt API"
    return [], "NOT_USED_BY_FE", "NOT_USED_BY_FE", "No current frontend consumer; catalog records backend surface only"


def refs(value):
    if isinstance(value, dict):
        for key, item in value.items():
            if key == "$ref": yield item
            else: yield from refs(item)
    elif isinstance(value, list):
        for item in value: yield from refs(item)


def main():
    manifest = json.loads((BUNDLE / "handoff-manifest.json").read_text())
    for name, digest in manifest["files"].items():
        assert hashlib.sha256((BUNDLE.parent.parent / name).read_bytes()).hexdigest() == digest, name
    for ref in refs(API):
        node = API
        for part in ref.removeprefix("#/").split("/"): node = node[part]
    modes = {}
    for line in (BUNDLE / "api-operation-index.md").read_text().splitlines():
        cells = [part.strip() for part in line.split("|")]
        if len(cells) >= 8 and cells[1] in {m.upper() for m in METHODS}: modes[(cells[1], cells[2].strip("`"))] = cells[6]
    operations = []
    runtime_missing = {(o["method"], o["path"]) for o in RUNTIME["missing_operations"]}
    for path, item in API["paths"].items():
        for method, operation in item.items():
            if method not in METHODS: continue
            method = method.upper()
            frontend, consumption, status, patch = mapping(method, path)
            # Do not claim a consumer merely because a path constant exists.
            if consumption == "NOT_USED_BY_FE": frontend, status = [], "NOT_USED_BY_FE"
            for source in frontend: assert (ROOT / source).exists(), source
            operations.append({"method": method, "path": path, "operation_id": operation["operationId"], "frontend": frontend or ["NOT_USED_BY_FE"], "consumption": consumption, "contract_status": status,
                "runtime_status": "RUNTIME_ABSENT" if (method, path) in runtime_missing else "RUNTIME_AVAILABLE_NOT_VERIFIED",
                "delivery_status": "CONTRACT_BLOCKED" if status == "CONTRACT_BLOCKED" else "NOT_USED_BY_FE" if status == "NOT_USED_BY_FE" else "CONTRACT_ALIGNED_RUNTIME_BLOCKED",
                "response_mode": modes[(method, path)], "parameters": operation.get("parameters", []), "request_body": operation.get("requestBody"), "responses": operation.get("responses", {}),
                "patch": patch, "contract_evidence": "docs/frontend-backend-handoff/docs/frontend-backend-integration-context.md; OpenAPI; contract-notes.json"})
    schemas = [{"name": name, "transport_declaration": "src/types/handoff.generated.ts#" + name, "required": value.get("required", []), "properties": value.get("properties", {}), "references": list(refs(value))} for name, value in API["components"]["schemas"].items()]
    assert len(operations) == 176 and len(schemas) == 291 and len(modes) == 176
    result = {"scope": "STATIC_FRONTEND_CONTRACT_AUDIT_NOT_INTEGRATION", "canonical_sha256": manifest["openapi_canonical_sha256"], "counts": {"paths": len(API["paths"]), "operations": len(operations), "schemas": len(schemas), "contract_status": dict(collections.Counter(o["contract_status"] for o in operations)), "consumption": dict(collections.Counter(o["consumption"] for o in operations)), "response_mode": dict(collections.Counter(o["response_mode"] for o in operations))}, "operations": operations, "schemas": schemas}
    (ROOT / "docs/frontend-backend-contract-inventory.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(result["counts"], indent=2))


if __name__ == "__main__": main()
