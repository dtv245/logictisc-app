export interface PagedResponse<TItem> {
  items: TItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
}

export interface DriverDirectoryItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  salaryType: string;
  status: string;
  joinedDate: string;
  roleId: string | null;
  roleName: string | null;
  salaryAmount: number | string;
  salaryCurrency: string;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipCode: string | null;
  addressCountry: string | null;
}

export type DriverExpiryStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED";
export type DriverAvailability = "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "ON_LEAVE" | "SUSPENDED";
export type DriverExpiringType =
  | "LICENSE"
  | "LICENSE_MEDICAL_CERTIFICATE"
  | "HEALTH_CHECK"
  | "CERTIFICATION"
  | "CONTRACT"
  | "HEALTH_INSURANCE"
  | "DOCUMENT";

export interface DriverProfileView {
  id: string;
  driverId: string;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  maritalStatus: string | null;
  educationLevel: string | null;
  nationalIdNumber: string | null;
  nationalIdIssuedDate: string | null;
  nationalIdIssuedPlace: string | null;
  personalTaxCode: string | null;
  avatarUrl: string | null;
  permanentAddress: string | null;
  temporaryAddress: string | null;
  hometown: string | null;
  createdAt: string;
  lastModifiedAt: string;
}

export interface DriverEmergencyContactView {
  id: string;
  driverId: string;
  fullName: string;
  relationship: string;
  phoneNumber: string;
  address: string | null;
  primary: boolean;
  active: boolean;
  createdAt: string;
  lastModifiedAt: string;
}

export interface DriverLicenseView {
  id: string;
  driverId: string;
  licenseNumber: string;
  licenseClass: string;
  endorsements: string | null;
  issuingCountry: string;
  issuingRegion: string | null;
  issuedDate: string;
  expiryDate: string;
  medicalCertificateExpiryDate: string | null;
  issuedPlace: string | null;
  remainingPoints: number | null;
  documentId: string | null;
  frontImageDocumentId: string | null;
  backImageDocumentId: string | null;
  active: boolean;
  createdAt: string;
  lastModifiedAt: string;
  expiryStatus: DriverExpiryStatus;
  medicalCertificateExpiryStatus: DriverExpiryStatus | null;
}

export interface DriverHealthCheckView {
  id: string;
  driverId: string;
  checkedDate: string;
  expiryDate: string;
  facility: string;
  conclusion: "FIT" | "UNFIT";
  documentId: string | null;
  active: boolean;
  createdAt: string;
  lastModifiedAt: string;
  expiryStatus: DriverExpiryStatus;
}

export interface DriverCertificationView {
  id: string;
  driverId: string;
  type: "TRANSPORT_OPERATIONS" | "SAFETY" | "DANGEROUS_GOODS" | "OTHER";
  name: string;
  issuedDate: string;
  expiryDate: string | null;
  issuer: string | null;
  documentId: string | null;
  active: boolean;
  createdAt: string;
  lastModifiedAt: string;
  expiryStatus: DriverExpiryStatus | null;
}

export interface EmploymentContractView {
  id: string;
  driverId: string;
  contractNumber: string;
  contractType: "PROBATION" | "FIXED_TERM" | "INDEFINITE";
  signedDate: string;
  effectiveDate: string;
  expiryDate: string | null;
  documentId: string | null;
  terminationDate: string | null;
  terminationReason: string | null;
  active: boolean;
  createdAt: string;
  lastModifiedAt: string;
  expiryStatus: DriverExpiryStatus | null;
}

export interface DriverInsuranceView {
  id: string;
  driverId: string;
  socialInsuranceNumber: string | null;
  healthInsuranceCardNumber: string | null;
  registeredClinic: string | null;
  participationStartDate: string;
  participationEndDate: string | null;
  socialInsuranceStatus: string | null;
  healthInsuranceStatus: string | null;
  unemploymentInsuranceStatus: string | null;
  insuredSalary: number | string | null;
  healthInsuranceExpiryDate: string | null;
  note: string | null;
  active: boolean;
  createdAt: string;
  lastModifiedAt: string;
  expiryStatus: DriverExpiryStatus | null;
}

export interface DriverDependentView {
  id: string;
  driverId: string;
  fullName: string;
  relationship: string;
  dateOfBirth: string | null;
  nationalIdNumber: string | null;
  taxCode: string | null;
  deductionStartDate: string | null;
  deductionEndDate: string | null;
  active: boolean;
  createdAt: string;
  lastModifiedAt: string;
}

export interface DriverBankAccountView {
  id: string;
  driverId: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  primary: boolean;
  active: boolean;
  createdAt: string;
  lastModifiedAt: string;
}

export interface DriverOperationalStatusView {
  driverId: string;
  availability: DriverAvailability;
  defaultVehicleId: string | null;
  currentTripId: string | null;
  lastKnownLatitude: number | string | null;
  lastKnownLongitude: number | string | null;
  lastKnownAt: string | null;
  leaveBalanceDays: number | string | null;
  createdAt: string;
  lastModifiedAt: string;
}

export interface DriverViolationView {
  id: string;
  driverId: string;
  violationDate: string;
  violationType: string;
  description: string;
  fineAmount: number | string | null;
  fineCurrency: string | null;
  tripId: string | null;
  documentId: string | null;
  resolutionStatus: string;
  active: boolean;
}

export interface DriverAccidentView {
  id: string;
  driverId: string;
  truckId: string;
  tripId: string | null;
  accidentType: string;
  severity: string;
  accidentDateTime: string;
  latitude: number;
  longitude: number;
  address: string | null;
  description: string | null;
  weatherConditions: string | null;
  roadConditions: string | null;
  anyInjuries: boolean;
  numberOfInjuries: number | null;
  injuryDescription: string | null;
  vehicleDamaged: boolean;
  vehicleDamageDescription: string | null;
  estimatedDamageCost: number | string | null;
  vehicleDrivable: boolean;
  policeReportFiled: boolean;
  policeReportNumber: string | null;
  insuranceNotified: boolean;
  insuranceNotifiedAt: string | null;
  insuranceClaimNumber: string | null;
  status: string;
  documentIds: string[];
}

export interface DriverExpiringItemView {
  itemId: string;
  driverId: string;
  driverName: string;
  type: DriverExpiringType;
  itemName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  expiryStatus: DriverExpiryStatus;
}

export interface DriverComplianceStatusView {
  hasActiveRecord: boolean;
  expiryStatus: DriverExpiryStatus | null;
}

export interface DriverProfileCounts {
  personalProfiles: number;
  licenses: number;
  healthChecks: number;
  certifications: number;
  emergencyContacts: number;
  contracts: number;
  insurances: number;
  dependents: number;
  bankAccounts: number;
  operationalStatuses: number;
  violations: number;
  accidents: number;
  documents: number;
}

export interface DriverProfileSummaryView {
  driverId: string;
  counts: DriverProfileCounts;
  license: DriverComplianceStatusView;
  healthCheck: DriverComplianceStatusView;
  contract: DriverComplianceStatusView;
  healthInsurance: DriverComplianceStatusView;
  upcomingExpirations: DriverExpiringItemView[];
  upcomingExpirationsTruncated: boolean;
}

export interface UpsertDriverProfileRequest {
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  maritalStatus?: string | null;
  educationLevel?: string | null;
  nationalIdNumber?: string | null;
  nationalIdIssuedDate?: string | null;
  nationalIdIssuedPlace?: string | null;
  personalTaxCode?: string | null;
  avatarUrl?: string | null;
  permanentAddress?: string | null;
  temporaryAddress?: string | null;
  hometown?: string | null;
}

export interface CreateDriverEmergencyContactRequest {
  fullName: string;
  relationship: string;
  phoneNumber: string;
  address?: string | null;
  primary: boolean;
}
export interface UpdateDriverEmergencyContactRequest extends CreateDriverEmergencyContactRequest { active: boolean }

export interface CreateDriverLicenseRequest {
  licenseNumber: string;
  licenseClass: string;
  endorsements?: string | null;
  issuingCountry: string;
  issuingRegion?: string | null;
  issuedDate: string;
  expiryDate: string;
  issuedPlace?: string | null;
  remainingPoints?: number | null;
  medicalCertificateExpiryDate?: string | null;
  documentId?: string | null;
  frontImageDocumentId?: string | null;
  backImageDocumentId?: string | null;
}
export interface UpdateDriverLicenseRequest extends CreateDriverLicenseRequest { active: boolean }

export interface CreateDriverHealthCheckRequest {
  checkedDate: string;
  expiryDate: string;
  facility: string;
  conclusion: "FIT" | "UNFIT";
  documentId?: string | null;
}
export interface UpdateDriverHealthCheckRequest extends CreateDriverHealthCheckRequest { active: boolean }

export interface CreateDriverCertificationRequest {
  type: DriverCertificationView["type"];
  name: string;
  issuedDate: string;
  expiryDate?: string | null;
  issuer?: string | null;
  documentId?: string | null;
}
export interface UpdateDriverCertificationRequest extends CreateDriverCertificationRequest { active: boolean }

export interface CreateEmploymentContractRequest {
  contractNumber: string;
  contractType: EmploymentContractView["contractType"];
  signedDate: string;
  effectiveDate: string;
  expiryDate?: string | null;
  documentId?: string | null;
  terminationDate?: string | null;
  terminationReason?: string | null;
}
export interface UpdateEmploymentContractRequest extends CreateEmploymentContractRequest { active: boolean }

export interface CreateDriverInsuranceRequest {
  socialInsuranceNumber?: string | null;
  healthInsuranceCardNumber?: string | null;
  registeredClinic?: string | null;
  participationStartDate: string;
  participationEndDate?: string | null;
  socialInsuranceStatus?: string | null;
  healthInsuranceStatus?: string | null;
  unemploymentInsuranceStatus?: string | null;
  insuredSalary?: number | string | null;
  healthInsuranceExpiryDate?: string | null;
  note?: string | null;
}
export interface UpdateDriverInsuranceRequest extends CreateDriverInsuranceRequest { active: boolean }

export interface CreateDriverDependentRequest {
  fullName: string;
  relationship: string;
  dateOfBirth?: string | null;
  nationalIdNumber?: string | null;
  taxCode?: string | null;
  deductionStartDate?: string | null;
  deductionEndDate?: string | null;
}
export interface UpdateDriverDependentRequest extends CreateDriverDependentRequest { active: boolean }

export interface CreateDriverBankAccountRequest {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  primary: boolean;
}
export interface UpdateDriverBankAccountRequest extends CreateDriverBankAccountRequest { active: boolean }

export interface UpdateDriverOperationalStatusRequest {
  availability: DriverAvailability;
  defaultVehicleId?: string | null;
  lastKnownLatitude?: number | string | null;
  lastKnownLongitude?: number | string | null;
  lastKnownAt?: string | null;
  leaveBalanceDays?: number | string | null;
}

export interface CreateDriverViolationRequest {
  violationDate: string;
  violationType: string;
  description: string;
  fineAmount?: number | string | null;
  fineCurrency?: string | null;
  tripId?: string | null;
  documentId?: string | null;
  resolutionStatus?: string | null;
}
export interface UpdateDriverViolationRequest extends CreateDriverViolationRequest {
  resolutionStatus: string;
  active: boolean;
}

export interface CreateDriverAccidentRequest {
  truckId: string;
  tripId?: string | null;
  accidentType: string;
  severity: string;
  accidentDateTime: string;
  latitude: number | string;
  longitude: number | string;
  address?: string | null;
  description?: string | null;
  weatherConditions?: string | null;
  roadConditions?: string | null;
  anyInjuries: boolean;
  numberOfInjuries?: number | null;
  injuryDescription?: string | null;
  vehicleDamaged: boolean;
  vehicleDamageDescription?: string | null;
  estimatedDamageCost?: number | string | null;
  vehicleDrivable: boolean;
  policeReportFiled: boolean;
  policeReportNumber?: string | null;
  insuranceNotified: boolean;
  insuranceNotifiedAt?: string | null;
  insuranceClaimNumber?: string | null;
  status?: string | null;
  documentId?: string | null;
}
export interface UpdateDriverAccidentRequest extends Omit<CreateDriverAccidentRequest, "status"> { status: string }

export interface DriverRecordViewMap {
  "emergency-contacts": DriverEmergencyContactView;
  licenses: DriverLicenseView;
  "health-checks": DriverHealthCheckView;
  certifications: DriverCertificationView;
  contracts: EmploymentContractView;
  insurances: DriverInsuranceView;
  dependents: DriverDependentView;
  "bank-accounts": DriverBankAccountView;
  violations: DriverViolationView;
  accidents: DriverAccidentView;
}

export interface DriverRecordCreateRequestMap {
  "emergency-contacts": CreateDriverEmergencyContactRequest;
  licenses: CreateDriverLicenseRequest;
  "health-checks": CreateDriverHealthCheckRequest;
  certifications: CreateDriverCertificationRequest;
  contracts: CreateEmploymentContractRequest;
  insurances: CreateDriverInsuranceRequest;
  dependents: CreateDriverDependentRequest;
  "bank-accounts": CreateDriverBankAccountRequest;
  violations: CreateDriverViolationRequest;
  accidents: CreateDriverAccidentRequest;
}

export interface DriverRecordUpdateRequestMap {
  "emergency-contacts": UpdateDriverEmergencyContactRequest;
  licenses: UpdateDriverLicenseRequest;
  "health-checks": UpdateDriverHealthCheckRequest;
  certifications: UpdateDriverCertificationRequest;
  contracts: UpdateEmploymentContractRequest;
  insurances: UpdateDriverInsuranceRequest;
  dependents: UpdateDriverDependentRequest;
  "bank-accounts": UpdateDriverBankAccountRequest;
  violations: UpdateDriverViolationRequest;
  accidents: UpdateDriverAccidentRequest;
}

export type DriverProfileRecordKey = keyof DriverRecordViewMap;
export type DriverSelfRecordKey = Exclude<DriverProfileRecordKey, "violations" | "accidents">;

export interface DriverExpiringQuery {
  days: number;
  type?: DriverExpiringType;
  page: number;
  pageSize: number;
}

export interface DriverDirectoryQuery {
  search?: string;
  status?: string;
  availability?: DriverAvailability;
  page: number;
  pageSize: number;
  orderBy?: string;
  descending?: boolean;
}

export type DriverSensitiveView =
  | DriverProfileView
  | DriverLicenseView
  | DriverInsuranceView
  | DriverDependentView
  | DriverBankAccountView;
