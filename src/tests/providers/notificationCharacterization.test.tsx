/** Records the existing notification text, timing and compatibility exports before refactoring. */
import type { OpenNotificationParams } from "@refinedev/core";
import { isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ERROR_CODE_TRANSLATIONS,
  RESOURCE_LABELS,
  formatDescriptionContent,
  resolveNotificationContent,
} from "@/providers/notificationProvider";

const failure = (status: number, description?: string): OpenNotificationParams => ({
  type: "error", message: `Error (status code: ${status})`, description,
});
const cases: Record<string, OpenNotificationParams> = {
  "401 empty": failure(401),
  "401 code": failure(401, "UNAUTHORIZED"),
  "401 backend detail": failure(401, "This account is disabled for tenant 401."),
  "403 empty": failure(403),
  "403 code": failure(403, "FORBIDDEN"),
  "403 access denied": failure(403, "ACCESS_DENIED"),
  "404 empty": failure(404),
  "404 not found": failure(404, "NOT_FOUND"),
  "404 resource not found": failure(404, "RESOURCE_NOT_FOUND"),
  "409 version": failure(409, "VERSION_CONFLICT"),
  "409 concurrent modification": failure(409, "CONCURRENT_MODIFICATION_CONFLICT"),
  "409 business detail": failure(409, "Amount 1500 exceeds invoice balance 1000."),
  "422 validation code": failure(422, "VALIDATION_FAILED"),
  "422 backend detail": failure(422, "License plate 51C-12345 already exists."),
  "500 empty": failure(500),
  "502 code": failure(502, "INTERNAL_SERVER_ERROR"),
  "503 internal error": failure(503, "INTERNAL_ERROR"),
  "504 without transport code": failure(504),
  "500 backend detail": failure(500, "Unable to complete this operation. Request ID: backend-500."),
  "network status zero": failure(0),
  "network message": { type: "error", message: "Network Error" },
  "network code": { type: "error", message: "Request failed", description: "ERR_NETWORK" },
  "timeout code": { type: "error", message: "Request failed", description: "ECONNABORTED" },
  "Lark cancelled": { type: "error", key: "login", message: "Login failed", description: "LARK_AUTH_CANCELLED" },
  "Lark missing code": { type: "error", message: "Login failed", description: "LARK_CODE_MISSING" },
  "Lark missing client": { type: "error", message: "Login failed", description: "LARK_API_CLIENT_REQUIRED" },
  "custom title and trimmed detail": { type: "error", message: "Custom title", description: "  Custom details  " },
  "invoice number is not a status": failure(400, "Invoice 401 is closed."),
  "success default": { type: "success", key: "create-trucks", message: "Successfully created" },
  "progress default": { type: "progress", message: "", undoableTimeout: 9000 },
};
for (const [operation, prefix] of [
  ["create", "There was an error creating"],
  ["update", "Error when updating"],
  ["delete", "Error when deleting"],
] as const) {
  for (const status of [422, 500]) {
    cases[`${operation} ${status}`] = {
      type: "error", key: `${operation}-trucks`,
      message: `${prefix} (status code: ${status})`,
      description: status === 500 ? "INTERNAL_ERROR" : "License plate already exists.",
    };
  }
}

const display = (value: ReactNode): unknown =>
  isValidElement(value) ? renderToStaticMarkup(value) : value;

describe("existing notification behavior", () => {
  it("preserves the public resource and error-code dictionaries", () => {
    expect({ RESOURCE_LABELS, ERROR_CODE_TRANSLATIONS }).toMatchSnapshot();
  });

  it.each(Object.entries(cases))("preserves %s", (_name, params) => {
    const content = resolveNotificationContent(params);
    expect({ ...content, message: display(content.message), description: display(content.description) }).toMatchSnapshot();
  });

  it.each([
    '{"errors":{"email":["Required","Already exists"],"name":"Invalid"}}',
    '{"message":"VERSION_CONFLICT"}',
    "{invalid json}",
    "UNMAPPED_CODE",
  ])("preserves description formatting: %s", (description) => {
    expect(display(formatDescriptionContent(description))).toMatchSnapshot();
  });
});
