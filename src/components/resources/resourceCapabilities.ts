/** Centralizes UI capabilities that differ from generic JSON CRUD. */

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

const capabilityOverrides: Readonly<Record<string, ResourceCapabilities>> = {
  documents: { create: false, delete: true, edit: false },
  notifications: { create: false, delete: false, edit: false },
};

export const getResourceCapabilities = (
  resource: string,
): ResourceCapabilities =>
  capabilityOverrides[resource] ?? genericCrudCapabilities;
