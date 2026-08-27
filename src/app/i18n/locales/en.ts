/**
 * English copy for application bootstrap and public diagnostics.
 */

export const enAppMessages = {
  bootstrap: {
    loadingConfig: "Loading application configuration",
    probingHealth: "Checking API availability",
    unreachable: {
      title: "API is unreachable",
      description:
        "The application could not connect to the API. Check the service and try again.",
    },
    corsBlocked: {
      title: "Browser access is blocked",
      description:
        "The API is reachable, but its CORS policy does not allow this application origin.",
    },
    unhealthy: {
      title: "API is not ready",
      description:
        "The API responded but did not report a healthy status.",
    },
    databaseDisabled: {
      title: "Business features are unavailable",
      description:
        "The API is running without database access, so business navigation remains locked.",
    },
    requestId: {
      label: "Request ID",
      copy: "Copy request ID",
      copied: "Request ID copied",
    },
    httpStatus: "HTTP status: {{status}}",
  },
  diagnostics: {
    title: "System diagnostics",
    description:
      "Public, non-sensitive runtime and API availability metadata.",
    fields: {
      environment: "Environment",
      application: "API application",
      profiles: "Active profiles",
      status: "API status",
      database: "Database",
      requestId: "Request ID",
    },
  },
} as const;
