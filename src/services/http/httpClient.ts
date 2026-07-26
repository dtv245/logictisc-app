/**
 * Cung cấp một Axios client duy nhất cho providers và auth services.
 */

import axios from "axios";

import { env } from "../../config/env";
import { attachInterceptors } from "./interceptors";

export const httpClient = attachInterceptors(
  axios.create({
    baseURL: env.apiBaseUrl,
    timeout: 30_000,
    withCredentials: true,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  }),
);
