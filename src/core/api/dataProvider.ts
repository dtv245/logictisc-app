/**
 * Adapts the Logistics API transport to the Refine v4 `DataProvider`.
 *
 * Resource paths and query whitelists are injected explicitly so the generic
 * provider cannot invent endpoints or send unsupported sort/filter fields.
 */

import type {
  BaseKey,
  BaseRecord,
  CreateParams,
  CustomParams,
  DataProvider,
  DeleteOneParams,
  GetListParams,
  GetManyParams,
  GetOneParams,
  MetaQuery,
  UpdateParams,
} from "@refinedev/core";
import {
  AxiosHeaders,
  type AxiosHeaderValue,
  type AxiosRequestConfig,
} from "axios";

import { ApiHttpError } from "../errors/httpError";
import { isRecord, readPagedResponse } from "./envelope";
import { createLatestRequestCoordinator } from "./latestRequest";
import {
  assertRelativeApiPath,
  joinApiItemPath,
} from "./path";
import {
  serializeCustomQuery,
  serializeListQuery,
} from "./querySerializer";
import type { LogisticsApiClient } from "./types";

export type ResourceUpdateMethod = "put" | "patch";

export interface ApiResourceDefinition {
  collectionPath: string;
  allowedFilterFields: readonly string[];
  allowedSortFields: readonly string[];
  updateMethod?: ResourceUpdateMethod;
}

export interface CreateDataProviderOptions {
  apiClient: LogisticsApiClient;
  resources: Readonly<Record<string, ApiResourceDefinition>>;
}

const readQuerySignal = (
  meta: MetaQuery | undefined,
): AbortSignal | undefined => meta?.queryContext?.signal;

const createProtocolError = (
  code: string,
  cause?: unknown,
): ApiHttpError =>
  new ApiHttpError({
    statusCode: 500,
    code,
    message: code,
    requestId: null,
    cause,
  });

const readRecord = <TData extends BaseRecord>(
  value: unknown,
): TData => {
  if (!isRecord(value)) {
    throw createProtocolError("INVALID_RECORD_RESPONSE");
  }

  // Common transport validation can establish an object boundary; feature
  // schemas validate the concrete DTO fields before they reach forms/views.
  return value as TData;
};

const readCustomData = <TData extends BaseRecord>(
  value: unknown,
): TData => {
  if (value === undefined || value === null) {
    throw createProtocolError("EMPTY_CUSTOM_RESPONSE");
  }

  // Refine v4 constrains custom results to BaseRecord even though several
  // existing action endpoints legitimately return scalar values.
  return value as TData;
};

const buildItemPath = (
  definition: ApiResourceDefinition,
  id: BaseKey,
): string => joinApiItemPath(definition.collectionPath, id);

const createRequestHeaders = (
  headers: object | undefined,
): AxiosHeaders | undefined => {
  if (!headers) {
    return undefined;
  }

  const result = new AxiosHeaders();
  const entries = Object.entries(headers) as [string, unknown][];

  for (const [name, value] of entries) {
    const isHeaderValue =
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      (Array.isArray(value) &&
        value.every((entry) => typeof entry === "string"));

    if (!isHeaderValue) {
      throw new Error(`INVALID_CUSTOM_HEADER:${name}`);
    }

    result.set(name, value as AxiosHeaderValue);
  }

  return result;
};

const withSignal = (
  signal: AbortSignal | undefined,
): { signal?: AbortSignal } => (signal ? { signal } : {});

export const createLogisticsDataProvider = ({
  apiClient,
  resources,
}: CreateDataProviderOptions): DataProvider => {
  const latestLists = createLatestRequestCoordinator();

  const getDefinition = (
    resource: string,
  ): ApiResourceDefinition => {
    const definition = resources[resource];
    if (!definition) {
      throw new Error(`RESOURCE_NOT_CONFIGURED:${resource}`);
    }

    assertRelativeApiPath(definition.collectionPath);
    return definition;
  };

  const requestRecord = async <TData extends BaseRecord>(
    config: AxiosRequestConfig,
  ): Promise<TData> => {
    const response = await apiClient.instance.request<unknown>(config);
    return readRecord<TData>(response.data);
  };

  const getOne = async <TData extends BaseRecord = BaseRecord>({
    resource,
    id,
    meta,
  }: GetOneParams): Promise<{ data: TData }> => {
    const definition = getDefinition(resource);
    const data = await requestRecord<TData>({
      method: "get",
      url: buildItemPath(definition, id),
      ...withSignal(readQuerySignal(meta)),
    });

    return { data };
  };

  const provider: DataProvider = {
    async getList<TData extends BaseRecord = BaseRecord>({
      resource,
      pagination,
      filters,
      sort,
      sorters,
      meta,
    }: GetListParams) {
      const definition = getDefinition(resource);
      const coordinatedRequest = latestLists.begin(
        `list:${resource}`,
        readQuerySignal(meta),
      );

      try {
        const response = await apiClient.instance.get<unknown>(
          definition.collectionPath,
          {
            params: serializeListQuery({
              ...(pagination ? { pagination } : {}),
              ...(filters ? { filters } : {}),
              ...(sorters ?? sort
                ? { sorters: sorters ?? sort }
                : {}),
              allowedFilterFields:
                definition.allowedFilterFields,
              allowedSortFields:
                definition.allowedSortFields,
            }),
            signal: coordinatedRequest.signal,
          },
        );
        const page = readPagedResponse<TData>(response.data);

        if (!page) {
          throw createProtocolError("INVALID_PAGED_RESPONSE");
        }

        return {
          data: page.items,
          total: page.totalItems,
        };
      } finally {
        coordinatedRequest.release();
      }
    },

    getOne,

    async getMany<TData extends BaseRecord = BaseRecord>({
      resource,
      ids,
      meta,
    }: GetManyParams) {
      const responses = await Promise.all(
        ids.map((id) =>
          getOne<TData>({
            resource,
            id,
            ...(meta ? { meta } : {}),
          }),
        ),
      );

      return {
        data: responses.map((response) => response.data),
      };
    },

    async create<
      TData extends BaseRecord = BaseRecord,
      TVariables = object,
    >({
      resource,
      variables,
      meta,
    }: CreateParams<TVariables>) {
      const definition = getDefinition(resource);
      const data = await requestRecord<TData>({
        method: "post",
        url: definition.collectionPath,
        data: variables,
        ...withSignal(readQuerySignal(meta)),
      });

      return { data };
    },

    async update<
      TData extends BaseRecord = BaseRecord,
      TVariables = object,
    >({
      resource,
      id,
      variables,
      meta,
    }: UpdateParams<TVariables>) {
      const definition = getDefinition(resource);
      const data = await requestRecord<TData>({
        method: definition.updateMethod ?? "put",
        url: buildItemPath(definition, id),
        data: variables,
        ...withSignal(readQuerySignal(meta)),
      });

      return { data };
    },

    async deleteOne<
      TData extends BaseRecord = BaseRecord,
      TVariables = object,
    >({
      resource,
      id,
      variables,
      meta,
    }: DeleteOneParams<TVariables>) {
      const definition = getDefinition(resource);
      const response = await apiClient.instance.delete<unknown>(
        buildItemPath(definition, id),
        {
          ...(variables === undefined ? {} : { data: variables }),
          ...withSignal(readQuerySignal(meta)),
        },
      );

      if (response.data === null || response.data === undefined) {
        const fallback: BaseRecord = { id };
        return {
          // Refine requires delete mutations to return the deleted record even
          // when the Spring endpoint intentionally returns `data: null`.
          data: fallback as TData,
        };
      }

      return { data: readRecord<TData>(response.data) };
    },

    async custom<
      TData extends BaseRecord = BaseRecord,
      TQuery = unknown,
      TPayload = unknown,
    >({
      url,
      method,
      filters = [],
      sort = [],
      sorters = [],
      payload,
      query,
      headers,
      meta,
    }: CustomParams<TQuery, TPayload>) {
      if (
        filters.length > 0 ||
        sort.length > 0 ||
        sorters.length > 0
      ) {
        throw new Error(
          "CUSTOM_FILTERS_AND_SORTERS_REQUIRE_FEATURE_ADAPTER",
        );
      }

      const requestHeaders = createRequestHeaders(headers);
      const requestData =
        method === "get" ||
        method === "head" ||
        method === "options"
          ? undefined
          : payload;

      const response = await apiClient.instance.request<unknown>({
        url: assertRelativeApiPath(url),
        method,
        ...(requestData === undefined ? {} : { data: requestData }),
        params: serializeCustomQuery(query),
        ...(requestHeaders ? { headers: requestHeaders } : {}),
        ...withSignal(readQuerySignal(meta)),
      });

      return { data: readCustomData<TData>(response.data) };
    },

    getApiUrl: apiClient.getApiUrl,
  };

  return provider;
};
