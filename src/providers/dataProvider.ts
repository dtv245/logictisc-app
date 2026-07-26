import type {
  BaseRecord,
  CreateManyParams,
  CreateParams,
  CustomParams,
  DataProvider,
  DeleteManyParams,
  DeleteOneParams,
  GetListParams,
  GetManyParams,
  GetOneParams,
  MetaQuery,
  UpdateManyParams,
  UpdateParams,
} from "@refinedev/core";
import type { AxiosRequestConfig, Method, RawAxiosRequestHeaders } from "axios";

import { env } from "../config/env";
import {
  getResourceEndpoint,
  getResourceItemEndpoint,
} from "../api/endpoints";
import { httpClient } from "../api/httpClient";
import { buildQueryParams } from "../api/queryAdapter";
import {
  adaptListResponse,
  adaptRecordResponse,
  unwrapApiResponse,
} from "../api/responseAdapter";

const requestRecord = async <TData extends BaseRecord>(
  config: AxiosRequestConfig,
): Promise<TData> => {
  const response = await httpClient.request<unknown>(config);
  return adaptRecordResponse<TData>(response.data);
};

const resolveEndpoint = (resource: string, meta?: MetaQuery): string =>
  getResourceEndpoint(resource, meta);

export const dataProvider: DataProvider = {
  async getList<TData extends BaseRecord = BaseRecord>(params: GetListParams) {
    const { resource, pagination, filters, sorters, meta } = params;
    const response = await httpClient.get<unknown>(
      resolveEndpoint(resource, meta),
      {
        params: buildQueryParams({ pagination, filters, sorters }),
      },
    );

    return adaptListResponse<TData>(response.data);
  },

  async getOne<TData extends BaseRecord = BaseRecord>(params: GetOneParams) {
    const { resource, id, meta } = params;
    const data = await requestRecord<TData>({
      method: "get",
      url: getResourceItemEndpoint(resource, id, meta),
    });

    return { data };
  },

  async getMany<TData extends BaseRecord = BaseRecord>(params: GetManyParams) {
    const { resource, ids, meta } = params;
    const data = await Promise.all(
      ids.map((id) =>
        requestRecord<TData>({
          method: "get",
          url: getResourceItemEndpoint(resource, id, meta),
        }),
      ),
    );

    return { data };
  },

  async create<TData extends BaseRecord = BaseRecord, TVariables = object>(
    params: CreateParams<TVariables>,
  ) {
    const { resource, variables, meta } = params;
    const data = await requestRecord<TData>({
      method: "post",
      url: resolveEndpoint(resource, meta),
      data: variables,
    });

    return { data };
  },

  async createMany<
    TData extends BaseRecord = BaseRecord,
    TVariables = object,
  >(params: CreateManyParams<TVariables>) {
    const { resource, variables, meta } = params;
    const data = await Promise.all(
      variables.map((variable) =>
        requestRecord<TData>({
          method: "post",
          url: resolveEndpoint(resource, meta),
          data: variable,
        }),
      ),
    );

    return { data };
  },

  async update<TData extends BaseRecord = BaseRecord, TVariables = object>(
    params: UpdateParams<TVariables>,
  ) {
    const { resource, id, variables, meta } = params;
    const data = await requestRecord<TData>({
      method: "patch",
      url: getResourceItemEndpoint(resource, id, meta),
      data: variables,
    });

    return { data };
  },

  async updateMany<
    TData extends BaseRecord = BaseRecord,
    TVariables = object,
  >(params: UpdateManyParams<TVariables>) {
    const { resource, ids, variables, meta } = params;
    const data = await Promise.all(
      ids.map((id) =>
        requestRecord<TData>({
          method: "patch",
          url: getResourceItemEndpoint(resource, id, meta),
          data: variables,
        }),
      ),
    );

    return { data };
  },

  async deleteOne<TData extends BaseRecord = BaseRecord, TVariables = object>(
    params: DeleteOneParams<TVariables>,
  ) {
    const { resource, id, variables, meta } = params;
    const response = await httpClient.delete<unknown>(
      getResourceItemEndpoint(resource, id, meta),
      { data: variables },
    );
    const unwrapped = unwrapApiResponse(response.data);
    const data =
      unwrapped === undefined || unwrapped === null || unwrapped === ""
        ? ({ id } as TData)
        : adaptRecordResponse<TData>(response.data);

    return { data };
  },

  async deleteMany<TData extends BaseRecord = BaseRecord, TVariables = object>({
    resource,
    ids,
    variables,
    meta,
  }: DeleteManyParams<TVariables>) {
    const data = await Promise.all(
      ids.map(async (id) => {
        const result = await dataProvider.deleteOne<TData, TVariables>({
          resource,
          id,
          variables,
          meta,
        });
        return result.data;
      }),
    );

    return { data };
  },

  async custom<
    TData extends BaseRecord = BaseRecord,
    TQuery = unknown,
    TPayload = unknown,
  >(params: CustomParams<TQuery, TPayload>) {
    const { url, method, filters, sorters, payload, query, headers, meta } = params;
    const response = await httpClient.request<unknown>({
      url,
      method: method as Method,
      data: payload,
      params: buildQueryParams({
        filters,
        sorters,
        query,
        pagination: { mode: "off" },
      }),
      headers: headers as RawAxiosRequestHeaders,
    });

    const responseResult = unwrapApiResponse(response.data);
    const allowsEmptyResponse = meta?.allowEmptyResponse === true;

    if (
      response.status === 204 ||
      (allowsEmptyResponse &&
        (responseResult === null || responseResult === undefined))
    ) {
      const fallback =
        typeof payload === "object" && payload !== null ? payload : {};
      return { data: fallback as TData };
    }

    return { data: adaptRecordResponse<TData>(response.data) };
  },

  getApiUrl() {
    return env.apiBaseUrl;
  },
};
