/**
 * Declares only backend-supported generic CRUD resources for the unified
 * runtime. Messaging remains behind a dedicated feature adapter.
 */

import type { IResourceItem } from "@refinedev/core";
import type { TFunction } from "i18next";

import type { ApiResourceDefinition } from "../providers/dataProvider";
import {
  appResourcePageRoutes,
  appResources,
  type ResourcePageRoute,
} from "./index";

export const foundationApiResources = {
  customers: {
    collectionPath: "/api/customers",
    allowedFilterFields: ["search", "status"],
    allowedSortFields: ["name", "email", "status"],
  },
  employees: {
    collectionPath: "/api/employees",
    allowedFilterFields: ["search", "status", "roleId"],
    allowedSortFields: ["firstName", "lastName", "email", "status"],
  },
  terminals: {
    collectionPath: "/api/terminals",
    allowedFilterFields: ["search", "type", "countryCode"],
    allowedSortFields: ["code", "name", "type", "countryCode"],
  },
  trucks: {
    collectionPath: "/api/trucks",
    allowedFilterFields: ["search", "status", "type"],
    allowedSortFields: ["number", "type", "status", "licensePlate"],
  },
  loads: {
    collectionPath: "/api/loads",
    allowedFilterFields: [
      "search",
      "status",
      "customerId",
      "truckId",
      "dispatcherId",
    ],
    allowedSortFields: ["number", "name", "status", "customerId"],
  },
  trips: {
    collectionPath: "/api/trips",
    allowedFilterFields: ["search", "status", "truckId"],
    allowedSortFields: ["number", "name", "status", "totalDistance"],
  },
  invoices: {
    collectionPath: "/api/invoices",
    allowedFilterFields: ["status", "type", "customerId", "employeeId"],
    allowedSortFields: ["number", "type", "status", "dueDate"],
  },
  payments: {
    collectionPath: "/api/payments",
    allowedFilterFields: ["status", "invoiceId"],
    allowedSortFields: ["recordedAt", "status", "referenceNumber"],
  },
  documents: {
    collectionPath: "/api/documents",
    allowedFilterFields: ["type", "status", "loadId", "truckId", "employeeId"],
    allowedSortFields: ["fileName", "type", "status"],
  },
  notifications: {
    collectionPath: "/api/notifications",
    allowedFilterFields: [],
    allowedSortFields: [],
  },
  drivers: {
    collectionPath: "/api/drivers",
    allowedFilterFields: ["search", "status"],
    allowedSortFields: ["firstName", "lastName", "email", "status"],
  },
  roles: {
    collectionPath: "/api/roles",
    allowedFilterFields: ["search"],
    allowedSortFields: ["name"],
  },
} as const satisfies Readonly<Record<string, ApiResourceDefinition>>;

// Đây là allowlist chung cho cả Refine navigation và router. Resource chỉ có
// UI nhưng backend chưa hỗ trợ sẽ không vô tình xuất hiện trong runtime mới.
const supportedNames = new Set([
  "dashboard",
  ...Object.keys(foundationApiResources),
]);
const readOnlyResourceNames = new Set(["documents", "notifications", "drivers"]);

export const createFoundationResources = (
  translate: TFunction,
): IResourceItem[] =>
  appResources
    .filter((resource) => supportedNames.has(resource.name))
    .map((resource) => {
      const runtimeResource: IResourceItem = {
        ...resource,
        meta: {
          ...resource.meta,
          label: translate(`resources.${resource.name}`),
        },
      };

      // These endpoints are not generic JSON CRUD: documents require a
      // multipart upload adapter and notifications expose read/actions only.
      if (readOnlyResourceNames.has(resource.name)) {
        delete runtimeResource.create;
        delete runtimeResource.edit;
      }
      if (resource.name === "notifications") {
        runtimeResource.meta = {
          ...runtimeResource.meta,
          canDelete: false,
        };
      }

      return runtimeResource;
    });

export const foundationResourcePageRoutes: ResourcePageRoute[] =
  appResourcePageRoutes.filter((route) => {
    // Một resource có nhiều route con (create/edit/show), nên segment đầu tiên
    // là khóa ổn định để lọc toàn bộ route của resource đó.
    const firstSegment = route.path.split("/").filter(Boolean)[0];
    return Boolean(
      firstSegment &&
      supportedNames.has(firstSegment) &&
      !(
        readOnlyResourceNames.has(firstSegment) &&
        (route.action === "create" || route.action === "edit")
      ),
    );
  });
