import { driverProfileApi } from "@/api/drivers/driver-profile.api";
import type {
  DriverProfileRecordKey,
  DriverRecordCreateRequestMap,
  DriverRecordUpdateRequestMap,
  DriverSelfRecordKey,
  UpsertDriverProfileRequest,
  UpdateDriverOperationalStatusRequest,
  DriverRecordViewMap,
  PagedResponse,
} from "@/types/drivers/driver-profile.types";

export type DriverProfileFieldKind = "text" | "textarea" | "date" | "datetime" | "number" | "boolean" | "select";

export interface DriverProfileField {
  key: string;
  kind?: DriverProfileFieldKind;
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  precision?: number;
  pattern?: RegExp;
  pastOrPresent?: boolean;
  options?: readonly string[];
  createOnly?: boolean;
  editOnly?: boolean;
}

export interface DriverProfileSectionDefinition {
  key: string;
  labelKey: string;
  group: "personal" | "operations" | "hr";
  recordKey?: DriverProfileRecordKey;
  selfRecordKey?: DriverSelfRecordKey;
  isSingle?: boolean;
  fields: readonly DriverProfileField[];
  columns: readonly string[];
  list?: (driverId: string, page: number, pageSize: number, signal: AbortSignal) => Promise<PagedResponse<ProfileRow>>;
  listMine?: (page: number, pageSize: number, signal: AbortSignal) => Promise<PagedResponse<ProfileRow>>;
  getSingle?: (driverId: string, signal: AbortSignal) => Promise<ProfileRow>;
  getSingleMine?: (signal: AbortSignal) => Promise<ProfileRow>;
  getOne?: (driverId: string, recordId: string, signal: AbortSignal) => Promise<ProfileRow>;
  create?: (driverId: string, body: Record<string, unknown>) => Promise<unknown>;
  update?: (driverId: string, recordId: string, body: Record<string, unknown>) => Promise<unknown>;
  saveSingle?: (driverId: string, body: Record<string, unknown>) => Promise<unknown>;
  deactivate?: (driverId: string, recordId: string) => Promise<void>;
  sensitive?: (driverId: string, recordId: string | undefined, signal: AbortSignal) => Promise<Record<string, unknown>>;
  deactivateLabelKey?: string;
}

export type ProfileRow = Record<string, unknown> & { id?: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const asRow = <TData extends object>(value: TData): ProfileRow => value as TData & ProfileRow;
const asPage = <TData extends object>(value: PagedResponse<TData>): PagedResponse<ProfileRow> => ({
  ...value,
  items: value.items.map(asRow),
});

const getRecordPage = <TKey extends DriverProfileRecordKey>(resource: TKey) =>
  async (driverId: string, page: number, pageSize: number, signal: AbortSignal): Promise<PagedResponse<ProfileRow>> =>
    asPage(await driverProfileApi.listRecords(driverId, resource, { page, pageSize }, signal));

const getMinePage = <TKey extends DriverSelfRecordKey>(resource: TKey) =>
  async (page: number, pageSize: number, signal: AbortSignal): Promise<PagedResponse<ProfileRow>> =>
    asPage(await driverProfileApi.listMyRecords(resource, { page, pageSize }, signal));

const getRecord = <TKey extends DriverProfileRecordKey>(resource: TKey) =>
  async (driverId: string, recordId: string, signal: AbortSignal): Promise<ProfileRow> =>
    asRow(await driverProfileApi.getRecord(driverId, resource, recordId, signal));

const createRecord = <TKey extends DriverProfileRecordKey>(resource: TKey) =>
  (driverId: string, body: Record<string, unknown>): Promise<DriverRecordViewMap[TKey]> =>
    driverProfileApi.createRecord(driverId, resource, body as unknown as DriverRecordCreateRequestMap[TKey]);

const updateRecord = <TKey extends DriverProfileRecordKey>(resource: TKey) =>
  (driverId: string, recordId: string, body: Record<string, unknown>): Promise<DriverRecordViewMap[TKey]> =>
    driverProfileApi.updateRecord(driverId, resource, recordId, body as unknown as DriverRecordUpdateRequestMap[TKey]);

const profileFields: DriverProfileField[] = [
  { key: "dateOfBirth", kind: "date", pastOrPresent: true },
  { key: "gender", kind: "select", options: ["MALE", "FEMALE", "OTHER", "UNSPECIFIED"] },
  { key: "nationality", maxLength: 80 },
  { key: "maritalStatus", kind: "select", options: ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "OTHER"] },
  { key: "educationLevel", maxLength: 80 },
  { key: "nationalIdNumber", maxLength: 12, pattern: /^(?:[0-9]{9}|[0-9]{12}|\*{4}[0-9]{4})$/ },
  { key: "nationalIdIssuedDate", kind: "date", pastOrPresent: true },
  { key: "nationalIdIssuedPlace", maxLength: 255 },
  { key: "personalTaxCode", maxLength: 13, pattern: /^(?:[0-9]{10}|[0-9]{13}|\*{4}[0-9]{4})$/ },
  { key: "avatarUrl", maxLength: 2048 },
  { key: "permanentAddress", kind: "textarea", maxLength: 1000 },
  { key: "temporaryAddress", kind: "textarea", maxLength: 1000 },
  { key: "hometown", maxLength: 255 },
];

const sections: readonly DriverProfileSectionDefinition[] = [
  {
    key: "profile", labelKey: "driverProfile.tabs.personal", group: "personal", isSingle: true,
    fields: profileFields, columns: ["dateOfBirth", "gender", "nationality", "nationalIdNumber"],
    getSingle: async (driverId, signal) => asRow(await driverProfileApi.getProfile(driverId, signal)),
    getSingleMine: async (signal) => asRow(await driverProfileApi.getMyProfile(signal)),
    saveSingle: (driverId, body) => driverProfileApi.saveProfile(driverId, body as UpsertDriverProfileRequest),
    sensitive: async (driverId, _recordId, signal) => asRow(await driverProfileApi.getSensitiveProfile(driverId, signal)),
  },
  {
    key: "emergency-contacts", labelKey: "driverProfile.tabs.emergencyContacts", group: "personal", recordKey: "emergency-contacts", selfRecordKey: "emergency-contacts",
    fields: [
      { key: "fullName", required: true, maxLength: 255 }, { key: "relationship", required: true, maxLength: 64 },
      { key: "phoneNumber", required: true, maxLength: 24, pattern: /^\+?[0-9().\-\s]{8,24}$/ },
      { key: "address", kind: "textarea", maxLength: 1000 }, { key: "primary", kind: "boolean", required: true }, { key: "active", kind: "boolean", editOnly: true },
    ],
    columns: ["fullName", "relationship", "phoneNumber", "primary", "active"],
    list: getRecordPage("emergency-contacts"), listMine: getMinePage("emergency-contacts"), getOne: getRecord("emergency-contacts"),
    create: createRecord("emergency-contacts"), update: updateRecord("emergency-contacts"), deactivate: (id, record) => driverProfileApi.deactivateRecord(id, "emergency-contacts", record),
  },
  {
    key: "licenses", labelKey: "driverProfile.tabs.licenses", group: "operations", recordKey: "licenses", selfRecordKey: "licenses",
    fields: [
      { key: "licenseNumber", required: true, maxLength: 64 }, { key: "licenseClass", required: true, maxLength: 64 },
      { key: "endorsements", kind: "textarea", maxLength: 1000 }, { key: "issuingCountry", required: true, maxLength: 2, pattern: /^[A-Za-z]{2}$/ },
      { key: "issuingRegion", maxLength: 64 }, { key: "issuedDate", kind: "datetime", required: true, pastOrPresent: true }, { key: "expiryDate", kind: "datetime", required: true },
      { key: "issuedPlace", maxLength: 255 }, { key: "remainingPoints", kind: "number", min: 0, max: 12, precision: 0 }, { key: "medicalCertificateExpiryDate", kind: "datetime" },
      { key: "documentId", pattern: UUID_PATTERN }, { key: "frontImageDocumentId", pattern: UUID_PATTERN }, { key: "backImageDocumentId", pattern: UUID_PATTERN }, { key: "active", kind: "boolean", editOnly: true },
    ],
    columns: ["licenseNumber", "licenseClass", "expiryDate", "expiryStatus", "active"],
    list: getRecordPage("licenses"), listMine: getMinePage("licenses"), getOne: getRecord("licenses"),
    create: createRecord("licenses"), update: updateRecord("licenses"), deactivate: (id, record) => driverProfileApi.deactivateRecord(id, "licenses", record),
    sensitive: async (driverId, recordId, signal) => recordId ? asRow(await driverProfileApi.getSensitiveRecord(driverId, "licenses", recordId, signal)) : {},
  },
  {
    key: "health-checks", labelKey: "driverProfile.tabs.healthChecks", group: "operations", recordKey: "health-checks", selfRecordKey: "health-checks",
    fields: [
      { key: "checkedDate", kind: "date", required: true, pastOrPresent: true }, { key: "expiryDate", kind: "date", required: true },
      { key: "facility", required: true, maxLength: 255 }, { key: "conclusion", kind: "select", required: true, options: ["FIT", "UNFIT"] },
      { key: "documentId", pattern: UUID_PATTERN }, { key: "active", kind: "boolean", editOnly: true },
    ],
    columns: ["checkedDate", "expiryDate", "facility", "conclusion", "expiryStatus", "active"],
    list: getRecordPage("health-checks"), listMine: getMinePage("health-checks"), getOne: getRecord("health-checks"),
    create: createRecord("health-checks"), update: updateRecord("health-checks"), deactivate: (id, record) => driverProfileApi.deactivateRecord(id, "health-checks", record),
  },
  {
    key: "certifications", labelKey: "driverProfile.tabs.certifications", group: "operations", recordKey: "certifications", selfRecordKey: "certifications",
    fields: [
      { key: "type", kind: "select", required: true, options: ["TRANSPORT_OPERATIONS", "SAFETY", "DANGEROUS_GOODS", "OTHER"] },
      { key: "name", required: true, maxLength: 255 }, { key: "issuedDate", kind: "date", required: true, pastOrPresent: true },
      { key: "expiryDate", kind: "date" }, { key: "issuer", maxLength: 255 }, { key: "documentId", pattern: UUID_PATTERN }, { key: "active", kind: "boolean", editOnly: true },
    ],
    columns: ["name", "type", "issuedDate", "expiryDate", "expiryStatus", "active"],
    list: getRecordPage("certifications"), listMine: getMinePage("certifications"), getOne: getRecord("certifications"),
    create: createRecord("certifications"), update: updateRecord("certifications"), deactivate: (id, record) => driverProfileApi.deactivateRecord(id, "certifications", record),
  },
  {
    key: "contracts", labelKey: "driverProfile.tabs.contracts", group: "hr", recordKey: "contracts", selfRecordKey: "contracts",
    fields: [
      { key: "contractNumber", required: true, maxLength: 100 }, { key: "contractType", kind: "select", required: true, options: ["PROBATION", "FIXED_TERM", "INDEFINITE"] },
      { key: "signedDate", kind: "date", required: true }, { key: "effectiveDate", kind: "date", required: true }, { key: "expiryDate", kind: "date" },
      { key: "documentId", pattern: UUID_PATTERN }, { key: "terminationDate", kind: "date" }, { key: "terminationReason", kind: "textarea", maxLength: 1000 },
      { key: "active", kind: "boolean", editOnly: true },
    ],
    columns: ["contractNumber", "contractType", "effectiveDate", "expiryDate", "expiryStatus", "active"],
    list: getRecordPage("contracts"), listMine: getMinePage("contracts"), getOne: getRecord("contracts"),
    create: createRecord("contracts"), update: updateRecord("contracts"), deactivate: (id, record) => driverProfileApi.deactivateRecord(id, "contracts", record),
    deactivateLabelKey: "driverProfile.actions.endContract",
  },
  {
    key: "insurances", labelKey: "driverProfile.tabs.insurances", group: "hr", recordKey: "insurances", selfRecordKey: "insurances",
    fields: [
      { key: "socialInsuranceNumber", maxLength: 20, pattern: /^(?:[A-Za-z0-9 -]{8,20}|\*{4}[A-Za-z0-9]{4})$/ },
      { key: "healthInsuranceCardNumber", maxLength: 20, pattern: /^(?:[A-Za-z0-9 -]{8,20}|\*{4}[A-Za-z0-9]{4})$/ },
      { key: "registeredClinic", maxLength: 255 }, { key: "participationStartDate", kind: "date", required: true },
      { key: "participationEndDate", kind: "date" }, { key: "socialInsuranceStatus", maxLength: 32 },
      { key: "healthInsuranceStatus", maxLength: 32 }, { key: "unemploymentInsuranceStatus", maxLength: 32 },
      { key: "insuredSalary", kind: "number", min: 0, precision: 2 }, { key: "healthInsuranceExpiryDate", kind: "date" },
      { key: "note", kind: "textarea", maxLength: 1000 }, { key: "active", kind: "boolean", editOnly: true },
    ],
    columns: ["healthInsuranceCardNumber", "participationStartDate", "healthInsuranceExpiryDate", "expiryStatus", "active"],
    list: getRecordPage("insurances"), listMine: getMinePage("insurances"), getOne: getRecord("insurances"),
    create: createRecord("insurances"), update: updateRecord("insurances"), deactivate: (id, record) => driverProfileApi.deactivateRecord(id, "insurances", record),
    sensitive: async (driverId, recordId, signal) => recordId ? asRow(await driverProfileApi.getSensitiveRecord(driverId, "insurances", recordId, signal)) : {},
  },
  {
    key: "dependents", labelKey: "driverProfile.tabs.dependents", group: "hr", recordKey: "dependents", selfRecordKey: "dependents",
    fields: [
      { key: "fullName", required: true, maxLength: 255 }, { key: "relationship", required: true, maxLength: 64 }, { key: "dateOfBirth", kind: "date", pastOrPresent: true },
      { key: "nationalIdNumber", maxLength: 12, pattern: /^(?:[0-9]{9}|[0-9]{12}|\*{4}[0-9]{4})$/ },
      { key: "taxCode", maxLength: 13, pattern: /^(?:[0-9]{10}|[0-9]{13}|\*{4}[0-9]{4})$/ },
      { key: "deductionStartDate", kind: "date" }, { key: "deductionEndDate", kind: "date" }, { key: "active", kind: "boolean", editOnly: true },
    ],
    columns: ["fullName", "relationship", "dateOfBirth", "nationalIdNumber", "active"],
    list: getRecordPage("dependents"), listMine: getMinePage("dependents"), getOne: getRecord("dependents"),
    create: createRecord("dependents"), update: updateRecord("dependents"), deactivate: (id, record) => driverProfileApi.deactivateRecord(id, "dependents", record),
    sensitive: async (driverId, recordId, signal) => recordId ? asRow(await driverProfileApi.getSensitiveRecord(driverId, "dependents", recordId, signal)) : {},
  },
  {
    key: "bank-accounts", labelKey: "driverProfile.tabs.bankAccounts", group: "hr", recordKey: "bank-accounts", selfRecordKey: "bank-accounts",
    fields: [
      { key: "bankName", required: true, maxLength: 128 },
      { key: "accountNumber", required: true, maxLength: 34, pattern: /^(?:[A-Za-z0-9 -]{8,34}|\*{4}[A-Za-z0-9]{4})$/ },
      { key: "accountHolderName", required: true, maxLength: 255 }, { key: "primary", kind: "boolean", required: true }, { key: "active", kind: "boolean", editOnly: true },
    ],
    columns: ["bankName", "accountNumber", "accountHolderName", "primary", "active"],
    list: getRecordPage("bank-accounts"), listMine: getMinePage("bank-accounts"), getOne: getRecord("bank-accounts"),
    create: createRecord("bank-accounts"), update: updateRecord("bank-accounts"), deactivate: (id, record) => driverProfileApi.deactivateRecord(id, "bank-accounts", record),
    sensitive: async (driverId, recordId, signal) => recordId ? asRow(await driverProfileApi.getSensitiveRecord(driverId, "bank-accounts", recordId, signal)) : {},
  },
  {
    key: "operational-status", labelKey: "driverProfile.tabs.operationalStatus", group: "operations", isSingle: true,
    fields: [
      { key: "availability", kind: "select", required: true, options: ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "ON_LEAVE", "SUSPENDED"] },
      { key: "defaultVehicleId", pattern: UUID_PATTERN }, { key: "lastKnownLatitude", kind: "number", min: -90, max: 90, precision: 7 }, { key: "lastKnownLongitude", kind: "number", min: -180, max: 180, precision: 7 },
      { key: "lastKnownAt", kind: "datetime" }, { key: "leaveBalanceDays", kind: "number", min: 0, precision: 2 },
    ],
    columns: ["availability", "defaultVehicleId", "currentTripId", "leaveBalanceDays"],
    getSingle: async (driverId, signal) => asRow(await driverProfileApi.getOperationalStatus(driverId, signal)),
    getSingleMine: async (signal) => asRow(await driverProfileApi.getMyOperationalStatus(signal)),
    saveSingle: (driverId, body) => driverProfileApi.saveOperationalStatus(driverId, body as unknown as UpdateDriverOperationalStatusRequest),
  },
  {
    key: "violations", labelKey: "driverProfile.tabs.violations", group: "operations", recordKey: "violations",
    fields: [
      { key: "violationDate", kind: "datetime", required: true }, { key: "violationType", required: true, maxLength: 100 },
      { key: "description", kind: "textarea", required: true, maxLength: 4000 }, { key: "fineAmount", kind: "number", min: 0, precision: 2 },
      { key: "fineCurrency", maxLength: 3, pattern: /^[A-Za-z]{3}$/ }, { key: "tripId", pattern: UUID_PATTERN }, { key: "documentId", pattern: UUID_PATTERN },
      { key: "resolutionStatus", kind: "select", required: true, options: ["OPEN", "UNDER_REVIEW", "RESOLVED", "DISPUTED", "CANCELLED"] },
      { key: "active", kind: "boolean", editOnly: true },
    ],
    columns: ["violationDate", "violationType", "fineAmount", "resolutionStatus", "active"],
    list: getRecordPage("violations"), getOne: getRecord("violations"), create: createRecord("violations"), update: updateRecord("violations"),
    deactivate: (id, record) => driverProfileApi.deactivateRecord(id, "violations", record), deactivateLabelKey: "driverProfile.actions.deactivateViolation",
  },
  {
    key: "accidents", labelKey: "driverProfile.tabs.accidents", group: "operations", recordKey: "accidents",
    fields: [
      { key: "truckId", required: true, pattern: UUID_PATTERN }, { key: "tripId", pattern: UUID_PATTERN }, { key: "accidentType", required: true, maxLength: 100 }, { key: "severity", required: true, maxLength: 50 },
      { key: "accidentDateTime", kind: "datetime", required: true }, { key: "latitude", kind: "number", required: true, min: -90, max: 90 }, { key: "longitude", kind: "number", required: true, min: -180, max: 180 },
      { key: "address", maxLength: 500 }, { key: "description", kind: "textarea", maxLength: 4000 }, { key: "weatherConditions", maxLength: 200 }, { key: "roadConditions", maxLength: 200 },
      { key: "anyInjuries", kind: "boolean", required: true }, { key: "numberOfInjuries", kind: "number", min: 0, precision: 0 }, { key: "injuryDescription", kind: "textarea", maxLength: 2000 },
      { key: "vehicleDamaged", kind: "boolean", required: true }, { key: "vehicleDamageDescription", kind: "textarea", maxLength: 2000 },
      { key: "estimatedDamageCost", kind: "number", min: 0, precision: 2 }, { key: "vehicleDrivable", kind: "boolean", required: true }, { key: "policeReportFiled", kind: "boolean", required: true },
      { key: "policeReportNumber", maxLength: 100 }, { key: "insuranceNotified", kind: "boolean", required: true }, { key: "insuranceNotifiedAt", kind: "datetime" },
      { key: "insuranceClaimNumber", maxLength: 100 }, { key: "status", kind: "select", required: true, options: ["REPORTED", "UNDER_REVIEW", "RESOLVED", "CLOSED", "CANCELLED"] }, { key: "documentId", pattern: UUID_PATTERN },
    ],
    columns: ["accidentDateTime", "accidentType", "severity", "status", "anyInjuries", "vehicleDamaged"],
    list: getRecordPage("accidents"), getOne: getRecord("accidents"), create: createRecord("accidents"), update: updateRecord("accidents"),
    deactivate: (id, record) => driverProfileApi.deactivateRecord(id, "accidents", record), deactivateLabelKey: "driverProfile.actions.cancelAccident",
  },
];

export const driverProfileSections = sections;
