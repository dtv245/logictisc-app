/** Centralizes UI capabilities that differ from generic JSON CRUD. */

import { PAYMENT_COMMANDS_RUNTIME_VERIFIED } from "@/features/payments/paymentCommands";

export interface ResourceCapabilities {
  create: boolean;
  delete: boolean;
  edit: boolean;
}

const genericCrudCapabilities: ResourceCapabilities = {
  create: true,
  delete: true,
  edit: true,
};

export const CORE_VERSIONED_WRITES_RUNTIME_VERIFIED = false;

const capabilityOverrides: Readonly<Record<string, ResourceCapabilities>> = {
  loads: { create: true, delete: true, edit: CORE_VERSIONED_WRITES_RUNTIME_VERIFIED },
  trips: { create: true, delete: true, edit: CORE_VERSIONED_WRITES_RUNTIME_VERIFIED },
  trucks: { create: true, delete: true, edit: CORE_VERSIONED_WRITES_RUNTIME_VERIFIED },
  payments: { create: PAYMENT_COMMANDS_RUNTIME_VERIFIED, delete: false, edit: PAYMENT_COMMANDS_RUNTIME_VERIFIED },
  invoices: { create: true, delete: false, edit: true },
  documents: { create: false, delete: true, edit: false },
  notifications: { create: false, delete: false, edit: false },
};

export const getResourceCapabilities = (
  resource: string,
): ResourceCapabilities =>
  capabilityOverrides[resource] ?? genericCrudCapabilities;
