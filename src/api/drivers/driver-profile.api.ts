import { getLogisticsApiClient } from "@/lib/apiClient";
import type {
  DriverDirectoryItem,
  DriverDirectoryQuery,
  DriverExpiringItemView,
  DriverExpiringQuery,
  DriverProfileRecordKey,
  DriverProfileSummaryView,
  DriverRecordCreateRequestMap,
  DriverRecordUpdateRequestMap,
  DriverRecordViewMap,
  DriverSelfRecordKey,
  PagedResponse,
  UpsertDriverProfileRequest,
  UpdateDriverOperationalStatusRequest,
  DriverOperationalStatusView,
  DriverProfileView,
} from "@/types/drivers/driver-profile.types";

const RECORD_PATHS: Record<DriverProfileRecordKey, string> = {
  "emergency-contacts": "emergency-contacts",
  licenses: "licenses",
  "health-checks": "health-checks",
  certifications: "certifications",
  contracts: "contracts",
  insurances: "insurances",
  dependents: "dependents",
  "bank-accounts": "bank-accounts",
  violations: "violations",
  accidents: "accidents",
};

const SELF_RECORD_PATHS: Record<DriverSelfRecordKey, string> = {
  "emergency-contacts": "emergency-contacts",
  licenses: "licenses",
  "health-checks": "health-checks",
  certifications: "certifications",
  contracts: "contracts",
  insurances: "insurances",
  dependents: "dependents",
  "bank-accounts": "bank-accounts",
};

const requestConfig = (signal?: AbortSignal) => ({
  headers: { "Cache-Control": "no-store" },
  ...(signal ? { signal } : {}),
});

const getData = async <TData>(
  path: string,
  params?: object,
  signal?: AbortSignal,
): Promise<TData> => {
  const response = await getLogisticsApiClient().instance.get<TData>(path, {
    ...requestConfig(signal),
    ...(params ? { params } : {}),
  });
  return response.data;
};

const postData = async <TData, TRequest>(path: string, body: TRequest): Promise<TData> => {
  const response = await getLogisticsApiClient().instance.post<TData>(path, body, requestConfig());
  return response.data;
};

const putData = async <TData, TRequest>(path: string, body: TRequest): Promise<TData> => {
  const response = await getLogisticsApiClient().instance.put<TData>(path, body, requestConfig());
  return response.data;
};

const deleteData = async (path: string): Promise<void> => {
  await getLogisticsApiClient().instance.delete(path, requestConfig());
};

const driverPath = (driverId: string): string => `/api/drivers/${encodeURIComponent(driverId)}`;

export const driverProfileApi = {
  listDrivers: (query: DriverDirectoryQuery, signal?: AbortSignal) =>
    getData<PagedResponse<DriverDirectoryItem>>("/api/drivers", query, signal),

  getDriver: (driverId: string, signal?: AbortSignal) =>
    getData<DriverDirectoryItem>(driverPath(driverId), undefined, signal),

  getSummary: (driverId: string, signal?: AbortSignal) =>
    getData<DriverProfileSummaryView>(`${driverPath(driverId)}/profile-summary`, undefined, signal),

  listExpiring: (query: DriverExpiringQuery, signal?: AbortSignal) =>
    getData<PagedResponse<DriverExpiringItemView>>("/api/drivers/expiring", query, signal),

  getProfile: (driverId: string, signal?: AbortSignal) =>
    getData<DriverProfileView>(`${driverPath(driverId)}/profile`, undefined, signal),

  saveProfile: (driverId: string, body: UpsertDriverProfileRequest) =>
    putData<DriverProfileView, UpsertDriverProfileRequest>(`${driverPath(driverId)}/profile`, body),

  getOperationalStatus: (driverId: string, signal?: AbortSignal) =>
    getData<DriverOperationalStatusView>(`${driverPath(driverId)}/operational-status`, undefined, signal),

  saveOperationalStatus: (driverId: string, body: UpdateDriverOperationalStatusRequest) =>
    putData<DriverOperationalStatusView, UpdateDriverOperationalStatusRequest>(`${driverPath(driverId)}/operational-status`, body),

  listRecords: <TKey extends DriverProfileRecordKey>(
    driverId: string,
    resource: TKey,
    query: Pick<DriverDirectoryQuery, "page" | "pageSize"> & Partial<Pick<DriverDirectoryQuery, "orderBy" | "descending">>,
    signal?: AbortSignal,
  ) => getData<PagedResponse<DriverRecordViewMap[TKey]>>(
    `${driverPath(driverId)}/${RECORD_PATHS[resource]}`,
    query,
    signal,
  ),

  getRecord: <TKey extends DriverProfileRecordKey>(driverId: string, resource: TKey, recordId: string, signal?: AbortSignal) =>
    getData<DriverRecordViewMap[TKey]>(
      `${driverPath(driverId)}/${RECORD_PATHS[resource]}/${encodeURIComponent(recordId)}`,
      undefined,
      signal,
    ),

  createRecord: <TKey extends DriverProfileRecordKey>(
    driverId: string,
    resource: TKey,
    body: DriverRecordCreateRequestMap[TKey],
  ) => postData<DriverRecordViewMap[TKey], DriverRecordCreateRequestMap[TKey]>(
    `${driverPath(driverId)}/${RECORD_PATHS[resource]}`,
    body,
  ),

  updateRecord: <TKey extends DriverProfileRecordKey>(
    driverId: string,
    resource: TKey,
    recordId: string,
    body: DriverRecordUpdateRequestMap[TKey],
  ) => putData<DriverRecordViewMap[TKey], DriverRecordUpdateRequestMap[TKey]>(
    `${driverPath(driverId)}/${RECORD_PATHS[resource]}/${encodeURIComponent(recordId)}`,
    body,
  ),

  deactivateRecord: (driverId: string, resource: DriverProfileRecordKey, recordId: string) =>
    deleteData(`${driverPath(driverId)}/${RECORD_PATHS[resource]}/${encodeURIComponent(recordId)}`),

  getMyProfile: (signal?: AbortSignal) =>
    getData<DriverProfileView>("/api/driver/me/profile", undefined, signal),

  getMyOperationalStatus: (signal?: AbortSignal) =>
    getData<DriverOperationalStatusView>("/api/driver/me/operational-status", undefined, signal),

  listMyRecords: <TKey extends DriverSelfRecordKey>(
    resource: TKey,
    query: Pick<DriverDirectoryQuery, "page" | "pageSize">,
    signal?: AbortSignal,
  ) => getData<PagedResponse<DriverRecordViewMap[TKey]>>(
    `/api/driver/me/${SELF_RECORD_PATHS[resource]}`,
    query,
    signal,
  ),

  getSensitiveProfile: (driverId: string, signal?: AbortSignal) =>
    getData<DriverProfileView>(`${driverPath(driverId)}/profile/sensitive`, undefined, signal),

  getSensitiveRecord: <TKey extends "licenses" | "insurances" | "dependents" | "bank-accounts">(
    driverId: string,
    resource: TKey,
    recordId: string,
    signal?: AbortSignal,
  ) => getData<DriverRecordViewMap[TKey]>(
    `${driverPath(driverId)}/${RECORD_PATHS[resource]}/${encodeURIComponent(recordId)}/sensitive`,
    undefined,
    signal,
  ),
};
