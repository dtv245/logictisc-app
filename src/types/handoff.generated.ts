/** Generated transport catalog: 291 schemas. Run scripts/generate-handoff-types.py; do not edit.
 * Source canonical SHA256: 2d10d31b8c7a013fa10aca92b5cf3411cadf8dcd5a1ca88f540201b3771e7774
 * Required/optional follow OAS; optional alone does not prove response non-nullability.
 * Semantic notes apply to CurrentUserResponse and metadata clears; runtime validators remain separate. */
export type AcceptRequest = { "expectedInputFingerprint": string; "idempotencyKey": string; };
export type Accepted = { "acceptedAt"?: string; "acceptedBy"?: string; "candidateId"?: string; "driverAssignmentId"?: string; "driverId"?: string; "id"?: string; "loadId"?: string; "originalInputFingerprint"?: string; "revalidationSnapshot"?: Explanation; "runId"?: string; "tripId"?: string; "truckId"?: string; };
export type AcceptedRatingSnapshot = { "acceptedAt"?: string; "acceptedBy"?: string; "calculation"?: RatingPreview; "commandHash"?: string; "idempotencyKey"?: string; "reason"?: string; "reasonCode"?: string; "snapshotId"?: string; "supersedesSnapshotId"?: string; };
export type AccessorialChargeView = { "approvedAt"?: string; "approvedBy"?: string; "companyCostAmount"?: number; "currency"?: string; "customerAmount"?: number; "documentId"?: string; "driverPayAmount"?: number; "freeQuantity"?: number; "id"?: string; "loadId"?: string; "note"?: string; "occurredAt"?: string; "quantity"?: number; "rate"?: number; "status"?: string; "tripId"?: string; "tripStopId"?: string; "type"?: string; "unit"?: string; "version"?: number; };
export type Adjustment = { "affectedDocumentId": string; "idempotencyKey": string; "reason": string; "reasonCode": string; };
export type ApiError = { "code"?: string; "field"?: string; "message"?: string; };
export type ApiResponseAccepted = { "code"?: string; "data"?: Accepted; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseAcceptedRatingSnapshot = { "code"?: string; "data"?: AcceptedRatingSnapshot; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseAccessorialChargeView = { "code"?: string; "data"?: AccessorialChargeView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseApprovalResult = { "code"?: string; "data"?: ApprovalResult; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseBillingInvoice = { "code"?: string; "data"?: BillingInvoice; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseCaptured = { "code"?: string; "data"?: Captured; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseContractMileageEvidence = { "code"?: string; "data"?: ContractMileageEvidence; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseConversationView = { "code"?: string; "data"?: ConversationView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseCurrentUserResponse = { "code"?: string; "data"?: CurrentUserResponse; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseCustomerBalanceReport = { "code"?: string; "data"?: CustomerBalanceReport; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseCustomerView = { "code"?: string; "data"?: CustomerView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseDeliveryDelayReport = { "code"?: string; "data"?: DeliveryDelayReport; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseDetentionCalculationResult = { "code"?: string; "data"?: DetentionCalculationResult; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseDocumentView = { "code"?: string; "data"?: DocumentView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseDriverPayPolicyView = { "code"?: string; "data"?: DriverPayPolicyView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseDriverSettlementView = { "code"?: string; "data"?: DriverSettlementView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseEmployeeView = { "code"?: string; "data"?: EmployeeView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseEvent = { "code"?: string; "data"?: Event; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseExceptionSummaryReport = { "code"?: string; "data"?: ExceptionSummaryReport; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseExpenseSummaryReport = { "code"?: string; "data"?: ExpenseSummaryReport; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseFuelReport = { "code"?: string; "data"?: FuelReport; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseIdentity = { "code"?: string; "data"?: Identity; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseImpact = { "code"?: string; "data"?: Impact; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseInspectionView = { "code"?: string; "data"?: InspectionView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseInteger = { "code"?: string; "data"?: number; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseInvoiceView = { "code"?: string; "data"?: InvoiceView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseKnownOperatingCpmReport = { "code"?: string; "data"?: KnownOperatingCpmReport; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseLarkBaseRecord = { "code"?: string; "data"?: LarkBaseRecord; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseLarkLoginResult = { "code"?: string; "data"?: LarkLoginResult; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseListAccessorialChargeView = { "code"?: string; "data"?: Array<AccessorialChargeView>; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseListDriverPayPolicyView = { "code"?: string; "data"?: Array<DriverPayPolicyView>; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseListDriverSettlementView = { "code"?: string; "data"?: Array<DriverSettlementView>; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseListLaneProfitabilityReport = { "code"?: string; "data"?: Array<LaneProfitabilityReport>; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseListLarkBaseRecord = { "code"?: string; "data"?: Array<LarkBaseRecord>; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseListLoadFinancialSummary = { "code"?: string; "data"?: Array<LoadFinancialSummary>; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseListPayPeriod = { "code"?: string; "data"?: Array<PayPeriod>; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseListShipmentCostView = { "code"?: string; "data"?: Array<ShipmentCostView>; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseListTripDriverAssignmentView = { "code"?: string; "data"?: Array<TripDriverAssignmentView>; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseListTripStopView = { "code"?: string; "data"?: Array<TripStopView>; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseListTruckProfitabilityReport = { "code"?: string; "data"?: Array<TruckProfitabilityReport>; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseLoadProfitabilityReport = { "code"?: string; "data"?: LoadProfitabilityReport; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseLoadRevenueSummary = { "code"?: string; "data"?: LoadRevenueSummary; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseLoadTimelineResponse = { "code"?: string; "data"?: LoadTimelineResponse; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseLoadView = { "code"?: string; "data"?: LoadView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseLong = { "code"?: string; "data"?: number; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseMaintenanceSummaryReport = { "code"?: string; "data"?: MaintenanceSummaryReport; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseMapStringString = { "code"?: string; "data"?: { [key: string]: string; }; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseMessageView = { "code"?: string; "data"?: MessageView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseMileage = { "code"?: string; "data"?: Mileage; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseMonthlyFinancialSummary = { "code"?: string; "data"?: MonthlyFinancialSummary; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseNotificationView = { "code"?: string; "data"?: NotificationView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseOtdReport = { "code"?: string; "data"?: OtdReport; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseOutcome = { "code"?: string; "data"?: Outcome; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePagedResponseConversationView = { "code"?: string; "data"?: PagedResponseConversationView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePagedResponseCustomerView = { "code"?: string; "data"?: PagedResponseCustomerView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePagedResponseDocumentView = { "code"?: string; "data"?: PagedResponseDocumentView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePagedResponseEmployeeView = { "code"?: string; "data"?: PagedResponseEmployeeView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePagedResponseInspectionView = { "code"?: string; "data"?: PagedResponseInspectionView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePagedResponseInvoiceView = { "code"?: string; "data"?: PagedResponseInvoiceView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePagedResponseLoadView = { "code"?: string; "data"?: PagedResponseLoadView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePagedResponseMessageView = { "code"?: string; "data"?: PagedResponseMessageView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePagedResponseNotificationView = { "code"?: string; "data"?: PagedResponseNotificationView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePagedResponsePaymentView = { "code"?: string; "data"?: PagedResponsePaymentView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePagedResponseRoleView = { "code"?: string; "data"?: PagedResponseRoleView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePagedResponseTripView = { "code"?: string; "data"?: PagedResponseTripView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePagedResponseTruckView = { "code"?: string; "data"?: PagedResponseTruckView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePayPeriod = { "code"?: string; "data"?: PayPeriod; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePaymentView = { "code"?: string; "data"?: PaymentView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePolicy = { "code"?: string; "data"?: Policy; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponsePublishedPolicy = { "code"?: string; "data"?: PublishedPolicy; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseRateRule = { "code"?: string; "data"?: RateRule; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseRatingContract = { "code"?: string; "data"?: RatingContract; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseRatingPreview = { "code"?: string; "data"?: RatingPreview; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseReport = { "code"?: string; "data"?: Report; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseRoleView = { "code"?: string; "data"?: RoleView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseShipmentCostView = { "code"?: string; "data"?: ShipmentCostView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseTaxAssessment = { "code"?: string; "data"?: TaxAssessment; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseTransitTimeReport = { "code"?: string; "data"?: TransitTimeReport; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseTripDriverAssignmentView = { "code"?: string; "data"?: TripDriverAssignmentView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseTripStopView = { "code"?: string; "data"?: TripStopView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseTripView = { "code"?: string; "data"?: TripView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseTruckView = { "code"?: string; "data"?: TruckView; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApiResponseVoid = { "code"?: string; "data"?: unknown; "errors"?: Array<ApiError>; "message"?: string; "meta"?: ResponseMeta; "success"?: boolean; };
export type ApprovalResult = { "approvedAt"?: string; "approvedBy"?: string; "expenseId"?: string; "shipmentCostId"?: string; "status"?: string; };
export type Assessment = { "breakFeasible"?: boolean; "cycleFeasible"?: boolean; "driveFeasible"?: boolean; "dutyFeasible"?: boolean; "minimumHosHeadroomRatio"?: number; "nextAvailableFeasible"?: boolean; "ruleSetCode"?: string; "ruleSetVersion"?: string; "serviceFeasible"?: boolean; "simulatedRoutePlanReference"?: string; "simulatedRoutePlanVersion"?: string; };
export type AssignDriverRequest = { "assignmentType"?: string; "driverId": string; "effectiveFrom"?: string; "plannedMiles"?: number; };
export type Attribute = { "actualMiles": number; "completedAt": string; "emptyMiles"?: number; "loadedMiles"?: number; "policyId"?: string; "reason"?: string; "reasonCode"?: string; "source": Source; "sourceEventId"?: string; "supersedesId"?: string; "tripId": string; "truckId": string; };
export type Availability = { "available"?: boolean; "coversFrom"?: string; "coversUntil"?: string; };
export type BillingInvoice = { "actor"?: string; "billingChainId"?: string; "capturedAt"?: string; "commandId"?: string; "currency"?: string; "customerId"?: string; "economicSign"?: number; "invoiceId"?: string; "lines"?: Array<Line>; "loadId"?: string; "parentInvoiceId"?: string; "purpose"?: string; "snapshotId"?: string; "status"?: string; "subtotal"?: number; "tax"?: number; "total"?: number; };
export type Bundle = { "capacity"?: InputCapacity; "driverAvailability"?: InputAvailability; "location"?: InputLocation; "qualification"?: InputQualification; "route"?: InputRoute; "truckAvailability"?: InputAvailability; };
export type CalculatePayrollRequest = { "currency": string; "effectiveDate": string; "idempotencyKey": string; "jurisdictionOverrides"?: { [key: string]: PayrollJurisdiction; }; "payPeriodId": string; "settlementIds": Array<string>; "supplements"?: Array<Supplement>; "taxInputs"?: { [key: string]: { [key: string]: string; }; }; };
export type CalculateSettlementRequest = { "driverId": string; "payPeriodId": string; };
export type Candidate = { "driverId"?: string; "explanation"?: Explanation; "feasible"?: boolean; "finalScore"?: number; "id"?: string; "inputFingerprint"?: string; "loadId"?: string; "rank"?: number; "ratingSnapshotId"?: string; "rejectionCodes"?: Array<string>; "runId"?: string; "tripId"?: string; "truckId"?: string; };
export type CandidateContext = { "driverId"?: string; "loadId"?: string; "planningEnd"?: string; "planningStart"?: string; "tripId"?: string; "truckId"?: string; };
export type Capacity = { "cargo"?: Weight; "truck"?: Weight; };
export type CapacityRequest = { "cargo": WeightRequest; "truck": WeightRequest; };
export type Capture = { "executionReference"?: string; "kind": "MEMBERSHIP" | "CAPACITY" | "ACTIVITY"; "loadId"?: string; "occurredAt": string; "policyId"?: string; "reason"?: string; "reasonCode"?: string; "source": Source; "sourceEventId"?: string; "status": string; "supersedesEventId"?: string; "tripId"?: string; "truckId": string; "validUntil": string; };
export type CaptureRequest = { "approvalReference": string; "capacity"?: CapacityRequest; "expiresAt"?: string; "forecast"?: ForecastRequest; "id": string; "kind": "VEHICLE_LOCATION" | "DRIVER_AVAILABILITY" | "TRUCK_AVAILABILITY" | "ROUTE" | "CAPACITY" | "QUALIFICATION" | "HOS" | "FORECAST_COST"; "maxAgeSeconds"?: number; "observedAt": string; "policyId": string; "qualification"?: QualificationRequest; "reason": string; "reasonCode": string; "scope": Scope; "source": Source; "supersedesInputId"?: string; "unit": string; };
export type Captured = { "approvalReference"?: string; "capturedAt"?: string; "capturedBy"?: string; "evidenceVersion"?: number; "expiresAt"?: string; "id"?: string; "kind"?: "VEHICLE_LOCATION" | "DRIVER_AVAILABILITY" | "TRUCK_AVAILABILITY" | "ROUTE" | "CAPACITY" | "QUALIFICATION" | "HOS" | "FORECAST_COST"; "maxAgeSeconds"?: number; "normalizedInputHash"?: string; "observedAt"?: string; "payload"?: Payload; "policyId"?: string; "reason"?: string; "reasonCode"?: string; "scope"?: Scope; "source"?: Source; "supersedesInputId"?: string; "unit"?: string; };
export type ClaimRequest = { "claimType": string; "claimValue": string; };
export type ClaimView = { "claimType"?: string; "claimValue"?: string; "id"?: string; };
export type ComponentResult = { "contribution"?: number; "normalizedUtility"?: number; "rawUnit"?: string; "rawValue"?: number; "weight"?: number; };
export type ContractMileageEvidence = { "capturedAt"?: string; "capturedBy"?: string; "componentType"?: "LINEHAUL" | "FSC" | "RATE_TIER" | "MINIMUM_CHARGE"; "contractId"?: string; "contractVersion"?: number; "currency"?: string; "id"?: string; "loadId"?: string; "normalizedMiles"?: number; "originalUnit"?: string; "originalValue"?: number; "provenance"?: string; };
export type ContractMileageRequest = { "componentType": "LINEHAUL" | "FSC" | "RATE_TIER" | "MINIMUM_CHARGE"; "contractId"?: string; "contractVersion"?: number; "originalUnit": string; "originalValue": number; "provenance": string; };
export type ConversationView = { "createdAt"?: string; "id"?: string; "isTenantChat"?: boolean; "lastMessageAt"?: string; "loadId"?: string; "name"?: string; };
export type Cost = { "amount"?: number; "approvedAt"?: string; "approvedBy"?: string; "category"?: "FUEL" | "DRIVER" | "TOLL" | "ACCESSORIAL" | "PERMIT"; "costBasis"?: string; "costId"?: string; "currency"?: string; "forecastPolicyCode"?: string; "forecastPolicyVersion"?: number; "ledgerVersion"?: number; "status"?: string; "zeroEvidence"?: ZeroCostEvidence; };
export type CostClassificationSummary = { "allocatedFixedCost"?: number; "allocatedMarginPercent"?: MetricDto; "allocatedProfit"?: MetricDto; "contributionMargin"?: MetricDto; "contributionMarginPercent"?: MetricDto; "costs"?: Array<CostDetail>; "currency"?: string; "excludedCost"?: number; "policyName"?: string; "policyVersion"?: string; "revenue"?: number; "unallocatedTripCosts"?: Array<CostDetail>; "unclassifiedCost"?: number; "variableCost"?: number; };
export type CostDetail = { "allocationMethod"?: string; "amount"?: number; "behavior"?: "VARIABLE" | "FIXED_ALLOCATABLE" | "EXCLUDED" | "UNCLASSIFIED"; "category"?: string; "costBasis"?: string; "costId"?: string; "currency"?: string; "reason"?: string; "sourceId"?: string; "sourceType"?: string; "tripId"?: string; };
export type CostRequest = { "costId": string; "forecastPolicyCode": string; "forecastPolicyVersion"?: number; "zeroCostReason"?: string; };
export type CreateAccessorialChargeRequest = { "companyCostAmount"?: number; "currency": string; "customerAmount": number; "documentId"?: string; "driverPayAmount"?: number; "freeQuantity"?: number; "note"?: string; "occurredAt"?: string; "quantity"?: number; "rate"?: number; "tripId"?: string; "tripStopId"?: string; "type": string; "unit"?: string; };
export type CreateConversationRequest = { "isTenantChat": boolean; "loadId"?: string; "name"?: string; };
export type CreateCustomerRequest = { "addressCity"?: string; "addressCountry"?: string; "addressLine1"?: string; "addressLine2"?: string; "addressState"?: string; "addressZipCode"?: string; "email"?: string; "isVatExempt": boolean; "name": string; "notes"?: string; "phone"?: string; "status": string; "taxId"?: string; };
export type CreateEmployeeRequest = { "addressCity"?: string; "addressCountry"?: string; "addressLine1"?: string; "addressLine2"?: string; "addressState"?: string; "addressZipCode"?: string; "email": string; "firstName": string; "joinedDate": string; "lastName": string; "phoneNumber"?: string; "roleId"?: string; "salaryAmount": number; "salaryCurrency": string; "salaryType": string; "status": string; };
export type CreateInspectionRequest = { "containerNumber"?: string; "inspectedAt": string; "inspectedById": string; "inspectorSignature"?: string; "latitude"?: number; "loadId": string; "longitude"?: number; "notes"?: string; "sealNumber"?: string; "type": string; "vehicleBodyClass"?: string; "vehicleMake"?: string; "vehicleModel"?: string; "vehicleYear"?: number; "vin"?: string; };
export type CreateInvoiceRequest = { "customerId"?: string; "dueDate"?: string; "employeeId"?: string; "loadId"?: string; "notes"?: string; "periodEnd"?: string; "periodStart"?: string; "status": string; "subtotalAmount": number; "subtotalCurrency": string; "taxBehavior"?: string; "taxTotalAmount": number; "taxTotalCurrency": string; "totalAmount": number; "totalCurrency": string; "totalDistanceDriven"?: number; "type": string; };
export type CreateLoadRequest = { "assignedDispatcherId"?: string; "assignedTruckId"?: string; "containerId"?: string; "customerId": string; "deliveryCostAmount": number; "deliveryCostCurrency": string; "destinationAddressCity": string; "destinationAddressCountry": string; "destinationAddressLine1": string; "destinationAddressLine2"?: string; "destinationAddressState": string; "destinationAddressZipCode": string; "destinationLocationLatitude": number; "destinationLocationLongitude": number; "destinationTerminalId"?: string; "distance": number; "externalBrokerReference"?: string; "externalSourceId"?: string; "externalSourceProvider"?: string; "hazmatClass"?: string; "isHazmat": boolean; "isInProximity": boolean; "name": string; "notes"?: string; "originAddressCity": string; "originAddressCountry": string; "originAddressLine1": string; "originAddressLine2"?: string; "originAddressState": string; "originAddressZipCode": string; "originLocationLatitude": number; "originLocationLongitude": number; "originTerminalId"?: string; "requestedDeliveryDate"?: string; "requestedPickupBusinessDate"?: string; "requestedPickupDate"?: string; "requestedPickupDateProvenance"?: PickupBusinessDateProvenance; "source": string; "status": string; "type": string; "unNumber"?: string; };
export type CreatePaymentRequest = { "amountAmount": number; "amountCurrency": string; "billingAddressCity": string; "billingAddressCountry": string; "billingAddressLine1": string; "billingAddressLine2"?: string; "billingAddressState": string; "billingAddressZipCode": string; "description"?: string; "idempotencyKey": string; "invoiceId": string; "recordedAt"?: string; "referenceNumber"?: string; "status": string; "stripePaymentIntentId"?: string; "stripePaymentMethodId"?: string; };
export type CreateRequest = { "driverIds": Array<string>; "idempotencyKey": string; "policyId": string; "sourceSelections": Array<SourceSelection>; "targets": Array<Target>; "truckIds": Array<string>; };
export type CreateRoleRequest = { "claims": Array<ClaimRequest>; "displayName"?: string; "name": string; };
export type CreateShipmentCostRequest = { "allocationMethod"?: string; "amount": number; "category": string; "costBasis": string; "currency": string; "driverId"?: string; "incurredAt"?: string; "note"?: string; "quantity"?: number; "sourceId"?: string; "sourceType": string; "status"?: string; "tripId"?: string; "truckId"?: string; "unit"?: string; "unitRate"?: number; };
export type CreateTripRequest = { "name": string; "status": string; "totalDistance": number; "truckId"?: string; };
export type CreateTruckRequest = { "adrEquipmentAllowedClasses"?: string; "adrEquipmentIsAdrCertified"?: boolean; "adrEquipmentOrangePlateNumber"?: string; "isHazmatPlacarded": boolean; "licensePlate"?: string; "licensePlateState"?: string; "mainDriverId"?: string; "make"?: string; "model"?: string; "number": string; "secondaryDriverId"?: string; "status": string; "type": string; "vehicleCapacity": number; "vin"?: string; "year"?: number; };
export type Credit = { "idempotencyKey": string; "lines": Array<CreditLine>; "reason": string; "reasonCode": string; "taxDecision": TaxDecision; };
export type CreditLine = { "amount": number; "originalLineId": string; "quantity"?: number; "taxAmount": number; };
export type CurrentUserResponse = { "email": string | null; "employeeId": string | null; "roles": Array<string>; "subject": string; "tenantId": string; };
export type CustomerBalanceReport = { "currency"?: string; "customerId"?: string; "invoiceCount"?: number; "openBalance"?: number; "totalInvoiced"?: number; "totalPaid"?: number; };
export type CustomerView = { "addressCity"?: string; "addressCountry"?: string; "addressLine1"?: string; "addressLine2"?: string; "addressState"?: string; "addressZipCode"?: string; "email"?: string; "id"?: string; "isVatExempt"?: boolean; "name"?: string; "notes"?: string; "phone"?: string; "status"?: string; "taxId"?: string; };
export type DeliveryDelayReport = { "averageDelayMinutes"?: number; "eligibleLoads"?: number; "lateDeliveryPercentage"?: number; "maxDelayMinutes"?: number; "totalLateLoads"?: number; };
export type DetentionCalculationRequest = { "blockMinutes"?: number; "currency": string; "driverHourlyRate"?: number; "freeMinutes"?: number; "hourlyRate": number; };
export type DetentionCalculationResult = { "billableUnits"?: number; "currency"?: string; "customerAmount"?: number; "driverPayAmount"?: number; "dwellMinutes"?: number; "dwellSeconds"?: number; "excessMinutes"?: number; "excessSeconds"?: number; "stopId"?: string; };
export type Distance = { "normalizedMiles"?: number; "originalUnit"?: string; "originalValue"?: number; };
export type DocumentView = { "blobContainer"?: string; "blobPath"?: string; "captureLatitude"?: number; "captureLongitude"?: number; "capturedAt"?: string; "contentType"?: string; "description"?: string; "employeeId"?: string; "fileName"?: string; "fileSizeBytes"?: number; "id"?: string; "loadId"?: string; "notes"?: string; "originalFileName"?: string; "ownerType"?: string; "recipientName"?: string; "status"?: string; "truckId"?: string; "type"?: string; "uploadedById"?: string; "uploadedByName"?: string; };
export type DriverPayPolicyRequest = { "currency": string; "dailyRate"?: number; "detentionBlockMinutes"?: number; "detentionFreeMinutes"?: number; "detentionRate"?: number; "driverId"?: string; "effectiveFrom": string; "effectiveTo"?: string; "flatRate"?: number; "hourlyRate"?: number; "layoverRate"?: number; "mileageBasis"?: string; "name": string; "payMethod": string; "perLoadRate"?: number; "perMileRate"?: number; "policyCode": string; "revenueBasis"?: string; "revenuePercentage"?: number; "stopPayRate"?: number; };
export type DriverPayPolicyView = { "active"?: boolean; "currency"?: string; "dailyRate"?: number; "detentionBlockMinutes"?: number; "detentionFreeMinutes"?: number; "detentionRate"?: number; "driverId"?: string; "effectiveFrom"?: string; "effectiveTo"?: string; "flatRate"?: number; "hourlyRate"?: number; "id"?: string; "layoverRate"?: number; "mileageBasis"?: string; "name"?: string; "payMethod"?: string; "perLoadRate"?: number; "perMileRate"?: number; "policyCode"?: string; "policyVersion"?: number; "revenueBasis"?: string; "revenuePercentage"?: number; "stopPayRate"?: number; };
export type DriverSettlementView = { "approvedAt"?: string; "calculatedAt"?: string; "currency"?: string; "deductionAmount"?: number; "driverId"?: string; "driverName"?: string; "grossEarnings"?: number; "id"?: string; "lines"?: Array<SettlementLineView>; "lockedAt"?: string; "parentSettlementId"?: string; "payPeriodCode"?: string; "payPeriodId"?: string; "policyId"?: string; "policyVersion"?: number; "reimbursementAmount"?: number; "sequenceNumber"?: number; "settlementNet"?: number; "settlementNumber"?: string; "settlementType"?: string; "status"?: string; "validationReason"?: string; };
export type Durations = { "capacitySeconds"?: number; "conflictSeconds"?: number; "eventCount"?: number; "gapSeconds"?: number; "membershipSeconds"?: number; "productiveSeconds"?: number; "scopeSeconds"?: number; "truckId"?: string; };
export type EmployeeView = { "addressCity"?: string; "addressCountry"?: string; "addressLine1"?: string; "addressLine2"?: string; "addressState"?: string; "addressZipCode"?: string; "email"?: string; "firstName"?: string; "id"?: string; "joinedDate"?: string; "lastName"?: string; "phoneNumber"?: string; "roleId"?: string; "roleName"?: string; "salaryAmount"?: number; "salaryCurrency"?: string; "salaryType"?: string; "status"?: string; };
export type Event = { "capturedAt"?: string; "capturedBy"?: string; "classification"?: string; "executionReference"?: string; "id"?: string; "kind"?: "MEMBERSHIP" | "CAPACITY" | "ACTIVITY"; "loadId"?: string; "normalizedInputHash"?: string; "occurredAt"?: string; "policyId"?: string; "reason"?: string; "reasonCode"?: string; "source"?: Source; "sourceEventId"?: string; "status"?: string; "supersedesEventId"?: string; "tripId"?: string; "truckId"?: string; "validUntil"?: string; };
export type ExceptionSummaryReport = { "averageResolutionMinutes"?: number; "countByType"?: { [key: string]: number; }; "resolvedExceptions"?: number; "totalExceptions"?: number; "unresolvedExceptions"?: number; };
export type ExpenseSummaryReport = { "byCategory"?: { [key: string]: number; }; "count"?: number; "currency"?: string; "totalApprovedAmount"?: number; };
export type Explanation = { "context"?: CandidateContext; "databaseStateFingerprint"?: string; "evidence"?: Bundle; "facts"?: Facts; "feasible"?: boolean; "forecast"?: Result; "hos"?: InputAssessment; "rejectionCodes"?: Array<string>; "score"?: Score; };
export type Facts = { "acceptedRatingSnapshotId"?: string; "conflictingActiveAssignment"?: boolean; "loadPreDispatch"?: boolean; "requestedPickupBusinessDate"?: string; "routingLocationsAvailable"?: boolean; "sameTenantAndTripLoadContext"?: boolean; "statuses"?: { [key: string]: string; }; "tripPreDispatch"?: boolean; };
export type Forecast = { "accessorialApplicable"?: boolean; "costs"?: Array<Cost>; "permitApplicable"?: boolean; };
export type ForecastRequest = { "accessorialApplicable": boolean; "costs": Array<CostRequest>; "permitApplicable": boolean; };
export type FuelIndexObservation = { "contentHash"?: string; "currency"?: string; "frequency"?: string; "fuelType"?: string; "includingTaxes"?: boolean; "observationDate"?: string; "provider"?: string; "providerVersion"?: string; "region"?: string; "retrievedAt"?: string; "seriesIdentifier"?: string; "unit"?: string; "value"?: number; };
export type FuelReport = { "averageCostPerGallon"?: number; "currency"?: string; "mpg"?: MetricDto; "totalFuelCost"?: number; "totalGallons"?: number; };
export type FuelSurchargeResult = { "currency"?: string; "index"?: FuelIndexObservation; "mileage"?: ResolvedRatingMileage; "perMile"?: number; "policy"?: IndexBasedFscPolicy; "rawPerMile"?: number; "roundingPolicyCode"?: string; "roundingPolicyVersion"?: number; "total"?: number; "unroundedTotal"?: number; };
export type GenerateInvoiceRequest = { "idempotencyKey": string; "lineTaxes": Array<LineTax>; "snapshotId": string; "taxDecision": TaxDecision; };
export type Identity = { "buildId"?: string; "builtAt"?: string; "dirty"?: boolean; "sourceCommit"?: string; "sourceHash"?: string; "version"?: string; };
export type Impact = { "adjustmentSettlementId"?: string; "affectedDocumentId"?: string; "commandId"?: string; "economicDelta"?: number; "originalSettlementId"?: string; "outcome"?: string; "payDelta"?: number; };
export type IndexBasedFscPolicy = { "baseFuelPrice"?: number; "contractMpg"?: number; "indexProvider"?: string; "indexRegion"?: string; "maxIndexAgeDays"?: number; "mileageBasis"?: "CONTRACT_MILES" | "PLANNED_LOAD_MILES" | "ACTUAL_LOADED_MILES" | "ACTUAL_ALL_MILES"; "priceCurrency"?: string; "priceUnit"?: string; };
export type InputAssessment = { "provenance"?: Provenance; "value"?: Assessment; };
export type InputAvailability = { "provenance"?: Provenance; "value"?: Availability; };
export type InputCapacity = { "provenance"?: Provenance; "value"?: Capacity; };
export type InputCost = { "provenance"?: Provenance; "value"?: Cost; };
export type InputLocation = { "provenance"?: Provenance; "value"?: Location; };
export type InputQualification = { "provenance"?: Provenance; "value"?: Qualification; };
export type InputRoute = { "provenance"?: Provenance; "value"?: Route; };
export type InspectionView = { "containerNumber"?: string; "id"?: string; "inspectedAt"?: string; "inspectedById"?: string; "inspectedByName"?: string; "latitude"?: number; "loadId"?: string; "longitude"?: number; "notes"?: string; "sealNumber"?: string; "type"?: string; "vehicleBodyClass"?: string; "vehicleMake"?: string; "vehicleModel"?: string; "vehicleYear"?: number; "vin"?: string; };
export type InvoiceView = { "billingChainId"?: string; "customerId"?: string; "customerName"?: string; "dueDate"?: string; "economicSign"?: number; "employeeId"?: string; "employeeName"?: string; "id"?: string; "invoicePurpose"?: string; "loadId"?: string; "notes"?: string; "number"?: number; "parentInvoiceId"?: string; "periodEnd"?: string; "periodStart"?: string; "ratingSnapshotId"?: string; "sentAt"?: string; "sentToEmail"?: string; "status"?: string; "subtotalAmount"?: number; "subtotalCurrency"?: string; "taxBehavior"?: string; "taxTotalAmount"?: number; "taxTotalCurrency"?: string; "totalAmount"?: number; "totalCurrency"?: string; "totalDistanceDriven"?: number; "type"?: string; };
export type Issue = { "idempotencyKey": string; };
export type Item = { "calculationSnapshotJson"?: string; "currency"?: string; "driverId"?: string; "effectiveDate"?: string; "grossAmount"?: number; "id"?: string; "incomeTaxAmount"?: number; "insuranceAmount"?: number; "jurisdiction"?: PayrollJurisdiction; "netAmount"?: number; "noPaymentReason"?: string; "noPaymentReasonCode"?: string; "noPaymentRequiredAt"?: string; "noPaymentRequiredBy"?: string; "otherDeductionAmount"?: number; "policyId"?: string; "policyVersion"?: number; "reimbursementAmount"?: number; "settlementIds"?: Array<string>; "status"?: string; "taxAvailability"?: string; "validationReason"?: string; "workerClassification"?: "EMPLOYEE" | "CONTRACTOR"; };
export type Knot = { "raw"?: number; "utility"?: number; };
export type KnownOperatingCpmReport = { "allocationComplete"?: boolean; "currency"?: string; "driverCostIncluded"?: boolean; "eligibleRecordedMiles"?: number; "expenseOperatingCost"?: number; "fixedCostIncluded"?: boolean; "knownOperatingCost"?: number; "knownOperatingCostMetric"?: MetricDto; "knownOperatingCostPerMile"?: MetricDto; "maintenanceCost"?: number; "maintenanceCurrencyReason"?: string; };
export type LaneProfitabilityReport = { "averageMarginMetric"?: MetricDto; "averageMarginPercent"?: number; "averageRpm"?: number; "averageRpmMetric"?: MetricDto; "costClassification"?: CostClassificationSummary; "currency"?: string; "destinationState"?: string; "loadCount"?: number; "originState"?: string; "totalCost"?: number; "totalMiles"?: number; "totalMilesMetric"?: MetricDto; "totalProfit"?: number; "totalProfitMetric"?: MetricDto; "totalRevenue"?: number; };
export type LarkBaseRecord = { "fields"?: Record<string, unknown>; "record_id"?: string; };
export type LarkCallbackRequest = { "code"?: string; "error"?: string; "errorDescription"?: string; "returnTo"?: string; "state"?: string; };
export type LarkLoginResult = { "accessToken"?: string; "email"?: string; "employeeId"?: string; "expiresIn"?: number; "name"?: string; "returnTo"?: string; "roles"?: Array<string>; "subject"?: string; "tenantId"?: string; "tokenType"?: string; };
export type Line = { "amount"?: number; "componentType"?: string; "creditedLineId"?: string; "creditedQuantity"?: number; "description"?: string; "lineId"?: string; "sourceId"?: string; "taxAmount"?: number; };
export type LineTax = { "componentType": string; "sourceId": string; "taxAmount": number; };
export type LoadEventView = { "actorId"?: string; "documentId"?: string; "eventType"?: string; "id"?: string; "latitude"?: number; "loadId"?: string; "longitude"?: number; "newStatus"?: string; "note"?: string; "occurredAt"?: string; "previousStatus"?: string; "source"?: string; "tripId"?: string; "tripStopId"?: string; };
export type LoadFinancialSummary = { "accessorials"?: Array<AccessorialChargeView>; "actualCost"?: number; "actualInvoicedRevenue"?: number; "allocatedProfit"?: number; "allocatedProfitMetric"?: MetricDto; "breakEvenLoadedRate"?: number; "contributionMargin"?: number; "contributionMarginMetric"?: MetricDto; "costClassification"?: CostClassificationSummary; "costPerTotalMile"?: number; "costVariance"?: number; "costVarianceMetric"?: MetricDto; "costs"?: Array<ShipmentCostView>; "currency"?: string; "emptyMiles"?: number; "estimatedCost"?: number; "loadId"?: string; "loadNumber"?: string; "loadedMiles"?: number; "marginPercent"?: number; "marginPercentMetric"?: MetricDto; "mileageMetrics"?: ProfitabilityMileageMetrics; "quotedRevenue"?: number; "revenuePerTotalMile"?: number; "totalMiles"?: number; };
export type LoadProfitabilityReport = { "actualCost"?: number; "actualRevenue"?: number; "allocatedProfit"?: number; "allocatedProfitMetric"?: MetricDto; "breakEvenLoadedRate"?: MetricDto; "contributionMargin"?: number; "contributionMarginMetric"?: MetricDto; "costClassification"?: CostClassificationSummary; "costPerTotalMile"?: MetricDto; "costVariance"?: MetricDto; "currency"?: string; "estimatedCost"?: number; "loadId"?: string; "marginPercent"?: MetricDto; "revenuePerTotalMile"?: MetricDto; };
export type LoadRevenueSummary = { "currency"?: string; "distanceBasis"?: string; "loadId"?: string; "openBalance"?: number; "paidAmount"?: number; "revenuePerMile"?: number; "subtotalRevenue"?: number; "taxAmount"?: number; "totalInvoiceAmount"?: number; };
export type LoadTimelineResponse = { "currentStatus"?: string; "events"?: Array<LoadEventView>; "loadId"?: string; "loadNumber"?: string; };
export type LoadView = { "assignedDispatcherId"?: string; "assignedDispatcherName"?: string; "assignedTruckId"?: string; "assignedTruckNumber"?: string; "cancelledAt"?: string; "customerId"?: string; "customerName"?: string; "deliveredAt"?: string; "deliveryCostAmount"?: number; "deliveryCostCurrency"?: string; "destinationAddressCity"?: string; "destinationAddressCountry"?: string; "destinationAddressLine1"?: string; "destinationAddressLine2"?: string; "destinationAddressState"?: string; "destinationAddressZipCode"?: string; "destinationLocationLatitude"?: number; "destinationLocationLongitude"?: number; "dispatchedAt"?: string; "distance"?: number; "hazmatClass"?: string; "id"?: string; "isHazmat"?: boolean; "isInProximity"?: boolean; "name"?: string; "notes"?: string; "number"?: number; "originAddressCity"?: string; "originAddressCountry"?: string; "originAddressLine1"?: string; "originAddressLine2"?: string; "originAddressState"?: string; "originAddressZipCode"?: string; "originLocationLatitude"?: number; "originLocationLongitude"?: number; "pickedUpAt"?: string; "pickupBusinessDateChangeId"?: string; "requestedDeliveryDate"?: string; "requestedPickupBusinessDate"?: string; "requestedPickupDate"?: string; "source"?: string; "status"?: string; "type"?: string; "unNumber"?: string; "version"?: number; };
export type Location = { "latitude"?: number; "longitude"?: number; };
export type MaintenanceSummaryReport = { "currency"?: string; "currencyAvailability"?: "AVAILABLE" | "PARTIAL" | "UNAVAILABLE" | "NOT_APPLICABLE"; "currencyAvailabilityReason"?: string; "recordCount"?: number; "totalCost"?: number; "totalLaborCost"?: number; "totalPartsCost"?: number; };
export type ManualPayrollBankReconciliationRequest = { "amount": number; "bankSource": string; "caseEventId": string; "counterpartyReference": string; "currency": string; "evidenceReference": string; "idempotencyKey": string; "occurredAt": string; "outcome": string; "reason": string; "transactionReference": string; };
export type MessageView = { "content"?: string; "conversationId"?: string; "id"?: string; "isDeleted"?: boolean; "senderId"?: string; "senderName"?: string; "sentAt"?: string; };
export type MetricDto = { "availability"?: "AVAILABLE" | "PARTIAL" | "UNAVAILABLE" | "NOT_APPLICABLE"; "basis"?: string; "code"?: string; "denominator"?: number; "numerator"?: number; "reason"?: string; "unit"?: string; "value"?: number; };
export type Mileage = { "actualMiles"?: number; "capturedAt"?: string; "capturedBy"?: string; "completedAt"?: string; "emptyMiles"?: number; "id"?: string; "loadedMiles"?: number; "normalizedInputHash"?: string; "policyId"?: string; "reason"?: string; "reasonCode"?: string; "source"?: Source; "sourceEventId"?: string; "supersedesId"?: string; "tripId"?: string; "truckId"?: string; };
export type MonthlyFinancialSummary = { "approvedExpenses"?: number; "currency"?: string; "knownOperatingCost"?: number; "knownOperatingCostAvailability"?: "AVAILABLE" | "PARTIAL" | "UNAVAILABLE" | "NOT_APPLICABLE"; "knownOperatingCostAvailabilityReason"?: string; "maintenanceCost"?: number; "maintenanceCurrency"?: string; "maintenanceCurrencyAvailability"?: "AVAILABLE" | "PARTIAL" | "UNAVAILABLE" | "NOT_APPLICABLE"; "maintenanceCurrencyReason"?: string; "month"?: number; "totalRevenue"?: number; "year"?: number; };
export type NoPaymentRequiredRequest = { "reason": string; "reasonCode": string; };
export type NotificationView = { "createdDate"?: string; "id"?: string; "isRead"?: boolean; "message"?: string; "title"?: string; };
export type NumericPolicy = { "contributionScale"?: number; "intermediatePrecision"?: number; "roundingMode"?: "UP" | "DOWN" | "CEILING" | "FLOOR" | "HALF_UP" | "HALF_DOWN" | "HALF_EVEN" | "UNNECESSARY"; "scoreScale"?: number; "utilityScale"?: number; "weightScale"?: number; };
export type OptimizationScoringPolicy = { "curves"?: { [key: string]: Array<Knot>; }; "numeric"?: NumericPolicy; "numericPolicy"?: PolicyReference; "utilityPolicy"?: PolicyReference; "weightPolicy"?: PolicyReference; "weights"?: { [key: string]: number; }; };
export type OtdReport = { "averageDelayMinutes"?: number; "onTimeLoads"?: number; "otdPercentage"?: number; "totalEligibleLoads"?: number; };
export type Outcome = { "candidates"?: Array<Candidate>; "run"?: Run; };
export type PagePayrollReconciliationCaseView = { "content"?: Array<PayrollReconciliationCaseView>; "empty"?: boolean; "first"?: boolean; "last"?: boolean; "number"?: number; "numberOfElements"?: number; "pageable"?: PageableObject; "size"?: number; "sort"?: SortObject; "totalElements"?: number; "totalPages"?: number; };
export type PageableObject = { "offset"?: number; "pageNumber"?: number; "pageSize"?: number; "paged"?: boolean; "sort"?: SortObject; "unpaged"?: boolean; };
export type PagedResponseConversationView = { "currentPage"?: number; "items"?: Array<ConversationView>; "pageSize"?: number; "totalItems"?: number; "totalPages"?: number; };
export type PagedResponseCustomerView = { "currentPage"?: number; "items"?: Array<CustomerView>; "pageSize"?: number; "totalItems"?: number; "totalPages"?: number; };
export type PagedResponseDocumentView = { "currentPage"?: number; "items"?: Array<DocumentView>; "pageSize"?: number; "totalItems"?: number; "totalPages"?: number; };
export type PagedResponseEmployeeView = { "currentPage"?: number; "items"?: Array<EmployeeView>; "pageSize"?: number; "totalItems"?: number; "totalPages"?: number; };
export type PagedResponseInspectionView = { "currentPage"?: number; "items"?: Array<InspectionView>; "pageSize"?: number; "totalItems"?: number; "totalPages"?: number; };
export type PagedResponseInvoiceView = { "currentPage"?: number; "items"?: Array<InvoiceView>; "pageSize"?: number; "totalItems"?: number; "totalPages"?: number; };
export type PagedResponseLoadView = { "currentPage"?: number; "items"?: Array<LoadView>; "pageSize"?: number; "totalItems"?: number; "totalPages"?: number; };
export type PagedResponseMessageView = { "currentPage"?: number; "items"?: Array<MessageView>; "pageSize"?: number; "totalItems"?: number; "totalPages"?: number; };
export type PagedResponseNotificationView = { "currentPage"?: number; "items"?: Array<NotificationView>; "pageSize"?: number; "totalItems"?: number; "totalPages"?: number; };
export type PagedResponsePaymentView = { "currentPage"?: number; "items"?: Array<PaymentView>; "pageSize"?: number; "totalItems"?: number; "totalPages"?: number; };
export type PagedResponseRoleView = { "currentPage"?: number; "items"?: Array<RoleView>; "pageSize"?: number; "totalItems"?: number; "totalPages"?: number; };
export type PagedResponseTripView = { "currentPage"?: number; "items"?: Array<TripView>; "pageSize"?: number; "totalItems"?: number; "totalPages"?: number; };
export type PagedResponseTruckView = { "currentPage"?: number; "items"?: Array<TruckView>; "pageSize"?: number; "totalItems"?: number; "totalPages"?: number; };
export type PayPeriod = { "endDate"?: string; "id"?: string; "paymentDate"?: string; "periodCode"?: string; "startDate"?: string; "status"?: string; };
export type Payload = { "capacity"?: Capacity; "forecast"?: Forecast; "qualification"?: Qualification; };
export type PaymentView = { "amountAmount"?: number; "amountCurrency"?: string; "billingAddressCity"?: string; "billingAddressCountry"?: string; "billingAddressLine1"?: string; "billingAddressLine2"?: string; "billingAddressState"?: string; "billingAddressZipCode"?: string; "description"?: string; "id"?: string; "invoiceId"?: string; "invoiceNumber"?: number; "recordedAt"?: string; "referenceNumber"?: string; "status"?: string; };
export type PayrollJurisdiction = { "countryCode"?: string; "localityCode"?: string; "subdivisionCode"?: string; };
export type PayrollPaymentEventView = { "eventId"?: string; "payment"?: PayrollPaymentView; "reason"?: string; "sourceKey"?: string; "status"?: string; };
export type PayrollPaymentView = { "amount"?: number; "attemptNumber"?: number; "currency"?: string; "failureCode"?: string; "failureMessage"?: string; "id"?: string; "idempotencyKey"?: string; "paymentMethod"?: string; "payrollItemId"?: string; "providerKey"?: string; "providerReference"?: string; "reconciledAt"?: string; "scheduledAt"?: string; "status"?: string; "submittedAt"?: string; "succeededAt"?: string; };
export type PayrollPolicy = { "active"?: boolean; "authoritativeSource"?: string; "calculatorKey"?: string; "configurationJson"?: string; "currency"?: string; "effectiveFrom"?: string; "effectiveTo"?: string; "id"?: string; "jurisdiction"?: PayrollJurisdiction; "policyCode"?: string; "version"?: number; "workerClassification"?: "EMPLOYEE" | "CONTRACTOR"; };
export type PayrollReconciliationCaseView = { "amount"?: number; "caseEventId"?: string; "currency"?: string; "occurredAt"?: string; "outcome"?: string; "paymentId"?: string; "paymentStatus"?: string; "providerKey"?: string; "providerReference"?: string; "reason"?: string; "sourceKey"?: string; };
export type PayrollRunView = { "approvedAt"?: string; "calculatedAt"?: string; "completedAt"?: string; "completedBy"?: string; "completionSource"?: string; "currency"?: string; "effectiveDate"?: string; "id"?: string; "items"?: Array<Item>; "lockedAt"?: string; "payPeriodId"?: string; "runNumber"?: string; "status"?: string; "validationReason"?: string; };
export type PayslipView = { "driverId"?: string; "id"?: string; "issuedAt"?: string; "issuedBy"?: string; "payrollItemId"?: string; "pdfSha256"?: string; "pdfUri"?: string; "rendererVersion"?: string; "snapshotJson"?: string; };
export type Period = { "businessZoneId"?: string; "from"?: string; "to"?: string; };
export type PickupBusinessDateProvenance = { "reason": string; "reasonCode": string; "source": string; };
export type Policy = { "active"?: boolean; "authoritativeSource": string; "calculatorKey": string; "configurationJson": string; "currency": string; "effectiveFrom": string; "effectiveTo"?: string; "jurisdiction": PayrollJurisdiction; "policyCode": string; "workerClassification": "EMPLOYEE" | "CONTRACTOR"; };
export type PolicyReference = { "code"?: string; "version"?: number; };
export type PolicySnapshot = { "eligibilitySourcePolicy"?: Policy; "scoringPolicy"?: OptimizationScoringPolicy; };
export type Profile = { "active"?: boolean; "effectiveFrom": string; "effectiveTo"?: string; "jurisdiction"?: PayrollJurisdiction; "workerClassification": "EMPLOYEE" | "CONTRACTOR"; };
export type ProfileView = { "active"?: boolean; "effectiveFrom"?: string; "effectiveTo"?: string; "employeeId"?: string; "id"?: string; "jurisdiction"?: PayrollJurisdiction; "version"?: number; "workerClassification"?: "EMPLOYEE" | "CONTRACTOR"; };
export type ProfitabilityMileageMetrics = { "breakEvenLoadedRate"?: MetricDto; "costPerTotalMile"?: MetricDto; "emptyMiles"?: MetricDto; "loadedMiles"?: MetricDto; "revenuePerTotalMile"?: MetricDto; "totalMiles"?: MetricDto; };
export type Provenance = { "context"?: CandidateContext; "evidenceReference"?: string; "evidenceVersion"?: string; "expiresAt"?: string; "maxAgeSeconds"?: number; "observedAt"?: string; "source"?: Source; "unit"?: string; };
export type Publish = { "activityStates": { [key: string]: "PRODUCTIVE" | "NON_PRODUCTIVE" | "EXCLUDED" | "UNAVAILABLE"; }; "approvalReference": string; "capacityStates": { [key: string]: boolean; }; "code": string; "membershipStates": { [key: string]: boolean; }; "sources": Array<Source>; "version"?: number; };
export type PublishRequest = { "approvalReference": string; "code": string; "eligibilitySourcePolicy": Policy; "scoringPolicy": OptimizationScoringPolicy; "version"?: number; };
export type PublishedPolicy = { "approvalReference"?: string; "code"?: string; "eligibilitySourcePolicy"?: Policy; "id"?: string; "publishedAt"?: string; "publishedBy"?: string; "scoringPolicy"?: OptimizationScoringPolicy; "version"?: number; };
export type Qualification = { "effectiveFrom"?: string; "effectiveUntil"?: string; "equipmentMatches"?: boolean; "hazmatDriver"?: boolean; "hazmatRequired"?: boolean; "hazmatTruck"?: boolean; "maintenanceClear"?: boolean; "operational"?: boolean; "qualifiedDriver"?: boolean; "validLicense"?: boolean; };
export type QualificationRequest = { "effectiveFrom": string; "effectiveUntil": string; "equipmentMatches": boolean; "hazmatDriver": boolean; "hazmatRequired": boolean; "hazmatTruck": boolean; "maintenanceClear": boolean; "operational": boolean; "qualifiedDriver": boolean; "validLicense": boolean; };
export type RateMatchContext = { "contractId"?: string; "contractVersion"?: number; "currency"?: string; "customerId"?: string; "equipment"?: string; "lane"?: string; "pricingDate"?: string; "service"?: string; "tier"?: string; };
export type RateRule = { "baseRate"?: number; "contractId"?: string; "contractVersion"?: number; "createdAt"?: string; "createdBy"?: string; "currency"?: string; "customerId"?: string; "effectiveFrom"?: string; "effectiveTo"?: string; "equipment"?: string; "fsc"?: IndexBasedFscPolicy; "lane"?: string; "linehaulMileageBasis"?: "CONTRACT_MILES" | "PLANNED_LOAD_MILES" | "ACTUAL_LOADED_MILES" | "ACTUAL_ALL_MILES"; "maximumCharge"?: number; "method"?: "FLAT" | "PER_MILE"; "minimumCharge"?: number; "priority"?: number; "roundingPolicyCode"?: string; "roundingPolicyVersion"?: number; "ruleId"?: string; "service"?: string; "tier"?: string; "version"?: number; };
export type RateRuleRequest = { "baseRate": number; "contractId"?: string; "contractVersion"?: number; "currency": string; "customerId"?: string; "effectiveFrom": string; "effectiveTo"?: string; "equipment"?: string; "fsc"?: IndexBasedFscPolicy; "lane"?: string; "linehaulMileageBasis"?: "CONTRACT_MILES" | "PLANNED_LOAD_MILES" | "ACTUAL_LOADED_MILES" | "ACTUAL_ALL_MILES"; "maximumCharge"?: number; "method": "FLAT" | "PER_MILE"; "minimumCharge"?: number; "priority": number; "service"?: string; "tier"?: string; };
export type RatingAcceptRequest = { "expectedInputHash": string; "expectedResultHash": string; "idempotencyKey": string; "rating": RatingPreviewRequest; "reason"?: string; "reasonCode"?: string; "supersedesSnapshotId"?: string; };
export type RatingAccessorialInput = { "approvedAt"?: string; "approvedBy"?: string; "chargeId"?: string; "currency"?: string; "customerAmount"?: number; "loadId"?: string; "quantity"?: number; "rate"?: number; "sourceVersion"?: number; "status"?: string; "type"?: string; "unit"?: string; };
export type RatingContract = { "contractId"?: string; "createdAt"?: string; "createdBy"?: string; "currency"?: string; "customerId"?: string; "effectiveFrom"?: string; "effectiveTo"?: string; "version"?: number; };
export type RatingContractRequest = { "currency": string; "customerId": string; "effectiveFrom": string; "effectiveTo"?: string; };
export type RatingInputs = { "accessorials"?: Array<RatingAccessorialInput>; "contextSource"?: string; "fscMileage"?: ResolvedRatingMileage; "linehaulMileage"?: ResolvedRatingMileage; "loadId"?: string; "matchContext"?: RateMatchContext; "pricingDate"?: RatingPricingDate; "rule"?: RateRule; };
export type RatingLine = { "amount"?: number; "componentType"?: string; "currency"?: string; "description"?: string; "sourceId"?: string; "unroundedAmount"?: number; };
export type RatingPreview = { "boundedLinehaul"?: number; "calculatedAt"?: string; "correlationId"?: string; "currency"?: string; "currencyScale"?: number; "fuelSurcharge"?: FuelSurchargeResult; "inputHash"?: string; "inputs"?: RatingInputs; "lines"?: Array<RatingLine>; "rawLinehaul"?: number; "resultHash"?: string; "roundingPolicyCode"?: string; "roundingPolicyVersion"?: number; "subtotal"?: number; "taxAvailability"?: string; };
export type RatingPreviewRequest = { "accessorialIds": Array<string>; "contextSource": string; "contractId"?: string; "contractVersion"?: number; "currency": string; "equipment"?: string; "fscMileageEvidenceId"?: string; "lane"?: string; "linehaulMileageEvidenceId"?: string; "service"?: string; "tier"?: string; };
export type RatingPricingDate = { "pricingDate"?: string; "pricingDateSource"?: string; "sourceChangeId"?: string; };
export type Rebill = { "creditEvidenceIds": Array<string>; "generation": GenerateInvoiceRequest; "reason": string; "reasonCode": string; };
export type Recalculate = { "expectedSnapshotId": string; "idempotencyKey": string; "reason": string; "reasonCode": string; };
export type Regenerate = { "expectedSnapshotId": string; "generation": GenerateInvoiceRequest; };
export type Report = { "calculatedAt"?: string; "coverage"?: Array<Durations>; "deadheadPercent"?: MetricDto; "health"?: Array<MetricDto>; "loadedMilesPercent"?: MetricDto; "period"?: Period; "policyCode"?: string; "policyId"?: string; "policyVersion"?: number; "reportingPolicyCode"?: string; "reportingPolicyVersion"?: number; "truckIds"?: Array<string>; "utilization"?: MetricDto; };
export type Request = { "endDate": string; "paymentDate"?: string; "periodCode": string; "startDate": string; };
export type ResolvedRatingMileage = { "capturedAt"?: string; "capturedBy"?: string; "componentType"?: "LINEHAUL" | "FSC" | "RATE_TIER" | "MINIMUM_CHARGE"; "eligibleMiles"?: number; "evidenceId"?: string; "mileageBasis"?: string; "mileageSourceType"?: string; "originalUnit"?: string; "originalValue"?: number; "provenance"?: string; "sourceReference"?: string; "sourceVersion"?: number; };
export type ResponseMeta = { "path"?: string; "requestId"?: string; "timestamp"?: string; };
export type Result = { "costEvidence"?: Array<InputCost>; "currency"?: string; "expectedContributionMargin"?: number; "expectedRevenue"?: number; "expectedVariableCost"?: number; "forecastCostIds"?: Array<string>; "ratingSnapshotId"?: string; "requiredCategories"?: Array<"FUEL" | "DRIVER" | "TOLL" | "ACCESSORIAL" | "PERMIT">; };
export type RoleView = { "claims"?: Array<ClaimView>; "displayName"?: string; "id"?: string; "name"?: string; "normalizedName"?: string; };
export type Route = { "appointmentStart"?: string; "deadhead"?: Distance; "loadAttributedLoadedMiles"?: Distance; "pickupReachable"?: boolean; "predictedArrivalAtPickup"?: string; "simulatedRoutePlanReference"?: string; "simulatedRoutePlanVersion"?: string; };
export type Run = { "calculatedAt"?: string; "correlationId"?: string; "createdAt"?: string; "createdBy"?: string; "durationMillis"?: number; "id"?: string; "idempotencyKey"?: string; "normalizedInputHash"?: string; "planningUntil"?: string; "policyId"?: string; "policySnapshot"?: PolicySnapshot; "requestSnapshot"?: RunRequest; };
export type RunRequest = { "driverIds"?: Array<string>; "idempotencyKey"?: string; "policyId"?: string; "sourceSelections"?: Array<SourceSelection>; "targets"?: Array<Target>; "tenantScope"?: string; "truckIds"?: Array<string>; };
export type SchedulePayrollPaymentRequest = { "destinationReference"?: string; "idempotencyKey": string; "paymentMethod": string; "providerKey"?: string; };
export type Scope = { "driverId": string; "loadId": string; "tripId": string; "truckId": string; };
export type Score = { "components"?: { [key: string]: ComponentResult; }; "finalScore"?: number; "policy"?: OptimizationScoringPolicy; };
export type SendMessageRequest = { "content": string; "conversationId": string; "senderId"?: string; };
export type SetPickupBusinessDateRequest = { "expectedChangeId"?: string; "provenance": PickupBusinessDateProvenance; "requestedPickupBusinessDate": string; };
export type SettlementAdjustmentRequest = { "idempotencyKey": string; "lines": Array<Line>; "reason": string; };
export type SettlementLineView = { "amount"?: number; "currency"?: string; "description"?: string; "id"?: string; "lineClass"?: string; "lineType"?: string; "loadId"?: string; "quantity"?: number; "rate"?: number; "sourceId"?: string; "tripId"?: string; "unit"?: string; };
export type SettlementReversalRequest = { "reason": string; };
export type ShipmentCostView = { "allocationMethod"?: string; "amount"?: number; "approvedAt"?: string; "category"?: string; "costBasis"?: string; "currency"?: string; "driverId"?: string; "id"?: string; "incurredAt"?: string; "loadId"?: string; "note"?: string; "postedAt"?: string; "quantity"?: number; "sourceId"?: string; "sourceType"?: string; "status"?: string; "tripId"?: string; "truckId"?: string; "unit"?: string; "unitRate"?: number; "verifiedAt"?: string; "version"?: number; };
export type SortObject = { "empty"?: boolean; "sorted"?: boolean; "unsorted"?: boolean; };
export type Source = { "classification": "AUTHORITATIVE_DB" | "TRUSTED_ADAPTER"; "reference": string; "type": string; "version": string; };
export type SourceSelection = { "capacityInputId": string; "forecastInputId": string; "qualificationInputId": string; "scope": Scope; };
export type Supplement = { "amount": number; "description": string; "driverId": string; "lineClass": string; "sourceId": string; };
export type Supplemental = { "chargeIds": Array<string>; "generation": GenerateInvoiceRequest; "reason": string; "reasonCode": string; };
export type Target = { "loadId": string; "pickupStopId": string; "ratingSnapshotId": string; "tripId": string; };
export type TaxAssessment = { "assessment"?: TaxAssessmentRequest; "capturedAt"?: string; "capturedBy"?: string; "inputHash"?: string; };
export type TaxAssessmentRequest = { "assessedAt"?: string; "assessedBy"?: string; "assessmentId"?: string; "currency": string; "customerId": string; "jurisdiction": string; "loadId": string; "policyVersion"?: string; "sourceReference": string; "sourceType": string; "taxAmount": number; "taxableBasis": number; };
export type TaxDecision = { "assessmentId"?: string; "reason": string; "reasonCode": string; "requirement": string; "sourceReference": string; };
export type TenantDefault = { "jurisdiction": PayrollJurisdiction; };
export type TransitTimeReport = { "averageTransitMinutes"?: number; "eligibleLoadCount"?: number; };
export type TripDriverAssignmentView = { "actualMiles"?: number; "assignedAt"?: string; "assignmentType"?: string; "driverId"?: string; "driverName"?: string; "effectiveFrom"?: string; "effectiveTo"?: string; "id"?: string; "isActive"?: boolean; "plannedMiles"?: number; "tripId"?: string; };
export type TripStopView = { "addressCity"?: string; "addressState"?: string; "appointmentEnd"?: string; "appointmentStart"?: string; "arrivedAt"?: string; "departedAt"?: string; "dwellMinutes"?: number; "id"?: string; "latitude"?: number; "loadId"?: string; "longitude"?: number; "order"?: number; "serviceCompletedAt"?: string; "serviceStartedAt"?: string; "status"?: string; "tripId"?: string; "type"?: string; };
export type TripView = { "cancelledAt"?: string; "completedAt"?: string; "dispatchedAt"?: string; "id"?: string; "name"?: string; "number"?: number; "status"?: string; "totalDistance"?: number; "truckId"?: string; "truckNumber"?: string; "version"?: number; };
export type TruckProfitabilityReport = { "averageMarginMetric"?: MetricDto; "averageMarginPercent"?: number; "costClassification"?: CostClassificationSummary; "costPerMile"?: number; "costPerMileMetric"?: MetricDto; "currency"?: string; "loadCount"?: number; "totalCost"?: number; "totalMiles"?: number; "totalMilesMetric"?: MetricDto; "totalProfit"?: number; "totalProfitMetric"?: MetricDto; "totalRevenue"?: number; "truckAttributionMetric"?: MetricDto; "truckId"?: string; "truckNumber"?: string; };
export type TruckView = { "adrEquipmentAllowedClasses"?: string; "adrEquipmentIsAdrCertified"?: boolean; "currentLocationLatitude"?: number; "currentLocationLongitude"?: number; "id"?: string; "isHazmatPlacarded"?: boolean; "licensePlate"?: string; "licensePlateState"?: string; "mainDriverId"?: string; "mainDriverName"?: string; "make"?: string; "model"?: string; "number"?: string; "secondaryDriverId"?: string; "secondaryDriverName"?: string; "status"?: string; "type"?: string; "vehicleCapacity"?: number; "version"?: number; "vin"?: string; "year"?: number; };
export type UpdateLoadRequest = { "assignedDispatcherId"?: string; "assignedTruckId"?: string; "containerId"?: string; "customerId": string; "deliveryCostAmount": number; "deliveryCostCurrency": string; "destinationAddressCity": string; "destinationAddressCountry": string; "destinationAddressLine1": string; "destinationAddressLine2"?: string; "destinationAddressState": string; "destinationAddressZipCode": string; "destinationLocationLatitude": number; "destinationLocationLongitude": number; "destinationTerminalId"?: string; "distance": number; "expectedVersion": number; "externalBrokerReference"?: string; "externalSourceId"?: string; "externalSourceProvider"?: string; "hazmatClass"?: string; "isHazmat": boolean; "isInProximity": boolean; "name": string; "notes"?: string; "originAddressCity": string; "originAddressCountry": string; "originAddressLine1": string; "originAddressLine2"?: string; "originAddressState": string; "originAddressZipCode": string; "originLocationLatitude": number; "originLocationLongitude": number; "originTerminalId"?: string; "requestedDeliveryDate"?: string; "requestedPickupBusinessDate"?: string; "requestedPickupDate"?: string; "requestedPickupDateProvenance"?: PickupBusinessDateProvenance; "source": string; "status": string; "type": string; "unNumber"?: string; };
export type UpdatePaymentRequest = { "description"?: string | null; "referenceNumber"?: string | null; };
export type UpdateTripRequest = { "expectedVersion": number; "name": string; "status": string; "totalDistance": number; "truckId"?: string; };
export type UpdateTruckRequest = { "adrEquipmentAllowedClasses"?: string; "adrEquipmentIsAdrCertified"?: boolean; "adrEquipmentOrangePlateNumber"?: string; "expectedVersion": number; "isHazmatPlacarded": boolean; "licensePlate"?: string; "licensePlateState"?: string; "mainDriverId"?: string; "make"?: string; "model"?: string; "number": string; "secondaryDriverId"?: string; "status": string; "type": string; "vehicleCapacity": number; "vin"?: string; "year"?: number; };
export type ValidationRequest = { "reason": string; };
export type Weight = { "normalizedPounds"?: number; "originalUnit"?: string; "originalValue"?: number; };
export type WeightRequest = { "unit": string; "value": number; };
export type ZeroCostEvidence = { "confirmedAt"?: string; "confirmedBy"?: string; "reason"?: string; "reasonCode"?: string; };
export const resourceMutationContracts = {
  "customers": {
    "createFields": [
      "addressCity",
      "addressCountry",
      "addressLine1",
      "addressLine2",
      "addressState",
      "addressZipCode",
      "email",
      "isVatExempt",
      "name",
      "notes",
      "phone",
      "status",
      "taxId"
    ],
    "updateFields": [
      "addressCity",
      "addressCountry",
      "addressLine1",
      "addressLine2",
      "addressState",
      "addressZipCode",
      "email",
      "isVatExempt",
      "name",
      "notes",
      "phone",
      "status",
      "taxId"
    ],
    "requiredCreate": [
      "isVatExempt",
      "name",
      "status"
    ],
    "requiredUpdate": [
      "isVatExempt",
      "name",
      "status"
    ],
    "versioned": false
  },
  "employees": {
    "createFields": [
      "addressCity",
      "addressCountry",
      "addressLine1",
      "addressLine2",
      "addressState",
      "addressZipCode",
      "email",
      "firstName",
      "joinedDate",
      "lastName",
      "phoneNumber",
      "roleId",
      "salaryAmount",
      "salaryCurrency",
      "salaryType",
      "status"
    ],
    "updateFields": [
      "addressCity",
      "addressCountry",
      "addressLine1",
      "addressLine2",
      "addressState",
      "addressZipCode",
      "email",
      "firstName",
      "joinedDate",
      "lastName",
      "phoneNumber",
      "roleId",
      "salaryAmount",
      "salaryCurrency",
      "salaryType",
      "status"
    ],
    "requiredCreate": [
      "email",
      "firstName",
      "joinedDate",
      "lastName",
      "salaryAmount",
      "salaryCurrency",
      "salaryType",
      "status"
    ],
    "requiredUpdate": [
      "email",
      "firstName",
      "joinedDate",
      "lastName",
      "salaryAmount",
      "salaryCurrency",
      "salaryType",
      "status"
    ],
    "versioned": false
  },
  "trucks": {
    "createFields": [
      "adrEquipmentAllowedClasses",
      "adrEquipmentIsAdrCertified",
      "adrEquipmentOrangePlateNumber",
      "isHazmatPlacarded",
      "licensePlate",
      "licensePlateState",
      "mainDriverId",
      "make",
      "model",
      "number",
      "secondaryDriverId",
      "status",
      "type",
      "vehicleCapacity",
      "vin",
      "year"
    ],
    "updateFields": [
      "adrEquipmentAllowedClasses",
      "adrEquipmentIsAdrCertified",
      "adrEquipmentOrangePlateNumber",
      "expectedVersion",
      "isHazmatPlacarded",
      "licensePlate",
      "licensePlateState",
      "mainDriverId",
      "make",
      "model",
      "number",
      "secondaryDriverId",
      "status",
      "type",
      "vehicleCapacity",
      "vin",
      "year"
    ],
    "requiredCreate": [
      "isHazmatPlacarded",
      "number",
      "status",
      "type",
      "vehicleCapacity"
    ],
    "requiredUpdate": [
      "expectedVersion",
      "isHazmatPlacarded",
      "number",
      "status",
      "type",
      "vehicleCapacity"
    ],
    "versioned": true
  },
  "loads": {
    "createFields": [
      "assignedDispatcherId",
      "assignedTruckId",
      "containerId",
      "customerId",
      "deliveryCostAmount",
      "deliveryCostCurrency",
      "destinationAddressCity",
      "destinationAddressCountry",
      "destinationAddressLine1",
      "destinationAddressLine2",
      "destinationAddressState",
      "destinationAddressZipCode",
      "destinationLocationLatitude",
      "destinationLocationLongitude",
      "destinationTerminalId",
      "distance",
      "externalBrokerReference",
      "externalSourceId",
      "externalSourceProvider",
      "hazmatClass",
      "isHazmat",
      "isInProximity",
      "name",
      "notes",
      "originAddressCity",
      "originAddressCountry",
      "originAddressLine1",
      "originAddressLine2",
      "originAddressState",
      "originAddressZipCode",
      "originLocationLatitude",
      "originLocationLongitude",
      "originTerminalId",
      "requestedDeliveryDate",
      "requestedPickupBusinessDate",
      "requestedPickupDate",
      "requestedPickupDateProvenance",
      "source",
      "status",
      "type",
      "unNumber"
    ],
    "updateFields": [
      "assignedDispatcherId",
      "assignedTruckId",
      "containerId",
      "customerId",
      "deliveryCostAmount",
      "deliveryCostCurrency",
      "destinationAddressCity",
      "destinationAddressCountry",
      "destinationAddressLine1",
      "destinationAddressLine2",
      "destinationAddressState",
      "destinationAddressZipCode",
      "destinationLocationLatitude",
      "destinationLocationLongitude",
      "destinationTerminalId",
      "distance",
      "expectedVersion",
      "externalBrokerReference",
      "externalSourceId",
      "externalSourceProvider",
      "hazmatClass",
      "isHazmat",
      "isInProximity",
      "name",
      "notes",
      "originAddressCity",
      "originAddressCountry",
      "originAddressLine1",
      "originAddressLine2",
      "originAddressState",
      "originAddressZipCode",
      "originLocationLatitude",
      "originLocationLongitude",
      "originTerminalId",
      "requestedDeliveryDate",
      "requestedPickupBusinessDate",
      "requestedPickupDate",
      "requestedPickupDateProvenance",
      "source",
      "status",
      "type",
      "unNumber"
    ],
    "requiredCreate": [
      "customerId",
      "deliveryCostAmount",
      "deliveryCostCurrency",
      "destinationAddressCity",
      "destinationAddressCountry",
      "destinationAddressLine1",
      "destinationAddressState",
      "destinationAddressZipCode",
      "destinationLocationLatitude",
      "destinationLocationLongitude",
      "distance",
      "isHazmat",
      "isInProximity",
      "name",
      "originAddressCity",
      "originAddressCountry",
      "originAddressLine1",
      "originAddressState",
      "originAddressZipCode",
      "originLocationLatitude",
      "originLocationLongitude",
      "source",
      "status",
      "type"
    ],
    "requiredUpdate": [
      "customerId",
      "deliveryCostAmount",
      "deliveryCostCurrency",
      "destinationAddressCity",
      "destinationAddressCountry",
      "destinationAddressLine1",
      "destinationAddressState",
      "destinationAddressZipCode",
      "destinationLocationLatitude",
      "destinationLocationLongitude",
      "distance",
      "expectedVersion",
      "isHazmat",
      "isInProximity",
      "name",
      "originAddressCity",
      "originAddressCountry",
      "originAddressLine1",
      "originAddressState",
      "originAddressZipCode",
      "originLocationLatitude",
      "originLocationLongitude",
      "source",
      "status",
      "type"
    ],
    "versioned": true
  },
  "trips": {
    "createFields": [
      "name",
      "status",
      "totalDistance",
      "truckId"
    ],
    "updateFields": [
      "expectedVersion",
      "name",
      "status",
      "totalDistance",
      "truckId"
    ],
    "requiredCreate": [
      "name",
      "status",
      "totalDistance"
    ],
    "requiredUpdate": [
      "expectedVersion",
      "name",
      "status",
      "totalDistance"
    ],
    "versioned": true
  },
  "invoices": {
    "createFields": [
      "customerId",
      "dueDate",
      "loadId",
      "notes",
      "status",
      "subtotalAmount",
      "subtotalCurrency",
      "taxBehavior",
      "taxTotalAmount",
      "taxTotalCurrency",
      "totalAmount",
      "totalCurrency",
      "type"
    ],
    "updateFields": [
      "customerId",
      "dueDate",
      "loadId",
      "notes",
      "status",
      "subtotalAmount",
      "subtotalCurrency",
      "taxBehavior",
      "taxTotalAmount",
      "taxTotalCurrency",
      "totalAmount",
      "totalCurrency",
      "type"
    ],
    "requiredCreate": [
      "status",
      "subtotalAmount",
      "subtotalCurrency",
      "taxTotalAmount",
      "taxTotalCurrency",
      "totalAmount",
      "totalCurrency",
      "type"
    ],
    "requiredUpdate": [
      "status",
      "subtotalAmount",
      "subtotalCurrency",
      "taxTotalAmount",
      "taxTotalCurrency",
      "totalAmount",
      "totalCurrency",
      "type"
    ],
    "versioned": false
  },
  "roles": {
    "createFields": [
      "claims",
      "displayName",
      "name"
    ],
    "updateFields": [
      "claims",
      "displayName",
      "name"
    ],
    "requiredCreate": [
      "claims",
      "name"
    ],
    "requiredUpdate": [
      "claims",
      "name"
    ],
    "versioned": false
  }
} as const;

