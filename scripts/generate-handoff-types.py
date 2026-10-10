#!/usr/bin/env python3
"""Generate transport declarations from the immutable handoff, including its semantic overrides."""
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "docs/frontend-backend-handoff/docs/frontend"


def generate():
    manifest = json.loads((BUNDLE / "handoff-manifest.json").read_text())
    for name, digest in manifest["files"].items():
        assert hashlib.sha256((BUNDLE.parent.parent / name).read_bytes()).hexdigest() == digest, name
    api = json.loads((BUNDLE / "openapi-backend-remediation.json").read_text())
    notes = json.loads((BUNDLE / "contract-notes.json").read_text())
    schemas = api["components"]["schemas"]
    for name, override in notes["request_schema_overrides"].items():
        schemas[name]["properties"].update(override["properties"])
    current = schemas["CurrentUserResponse"]
    current["required"] = list(current["properties"])
    for name in notes["nullable_response_notes"]["CurrentUserResponse"]:
        current["properties"][name]["nullable"] = True

    def render(schema):
        if "$ref" in schema:
            result = schema["$ref"].split("/")[-1]
        elif "enum" in schema:
            result = " | ".join(json.dumps(x) for x in schema["enum"])
        elif "allOf" in schema:
            result = " & ".join(render(x) for x in schema["allOf"])
        elif "oneOf" in schema or "anyOf" in schema:
            result = " | ".join(render(x) for x in schema.get("oneOf", schema.get("anyOf", [])))
        elif isinstance(schema.get("type"), list):
            result = " | ".join(render({**schema, "type": x, "nullable": False}) for x in schema["type"])
        elif schema.get("type") == "array":
            result = f"Array<{render(schema.get('items', {}))}>"
        elif schema.get("type") == "object" or "properties" in schema:
            required = schema.get("required", [])
            fields = [f"{json.dumps(n)}{'' if n in required else '?'}: {render(v)};" for n, v in schema.get("properties", {}).items()]
            additional = schema.get("additionalProperties")
            if additional:
                fields.append(f"[key: string]: {render(additional) if isinstance(additional, dict) else 'unknown'};")
            result = "{ " + " ".join(fields) + " }" if fields else "Record<string, unknown>"
        else:
            result = {"string": "string", "boolean": "boolean", "integer": "number", "number": "number", "null": "null"}.get(schema.get("type"), "unknown")
        return result + " | null" if schema.get("nullable") and "null" not in result.split(" | ") else result

    lines = ["/** Generated transport catalog: 291 schemas. Run scripts/generate-handoff-types.py; do not edit.",
             " * Source canonical SHA256: " + manifest["openapi_canonical_sha256"],
             " * Required/optional follow OAS; optional alone does not prove response non-nullability.",
             " * Semantic notes apply to CurrentUserResponse and metadata clears; runtime validators remain separate. */"]
    for name, schema in schemas.items():
        assert re.fullmatch(r"[A-Za-z_$][\w$]*", name), name
        lines.append(f"export type {name} = {render(schema)};")
    resources = {"customers": "Customer", "employees": "Employee", "trucks": "Truck", "loads": "Load", "trips": "Trip", "invoices": "Invoice", "roles": "Role"}
    contracts = {}
    for resource, entity in resources.items():
        create = schemas[f"Create{entity}Request"]
        update = schemas.get(f"Update{entity}Request", create)
        contracts[resource] = {
            "createFields": [n for n, v in create["properties"].items() if not v.get("deprecated")],
            "updateFields": [n for n, v in update["properties"].items() if not v.get("deprecated")],
            "requiredCreate": create.get("required", []),
            "requiredUpdate": update.get("required", []),
            "versioned": "expectedVersion" in update["properties"],
        }
    lines.append("export const resourceMutationContracts = " + json.dumps(contracts, indent=2) + " as const;\n")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    target = ROOT / "src/types/handoff.generated.ts"
    result = generate()
    if args.check:
        assert target.read_text() == result, "Generated catalog drift"
        print("PASS: manifest hashes and 291 generated schemas")
    else:
        target.write_text(result)
