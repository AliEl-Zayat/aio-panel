import axios, { type AxiosInstance } from "axios";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import { getSessionToken, clearSessionCookie } from "@/lib/session";

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: ApiUrlConstants.getBaseUrl(),
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use((config) => {
    const token = getSessionToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        clearSessionCookie();
        if (typeof globalThis.window !== "undefined") {
          globalThis.window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

/** Shared axios instance for aio-server API. Use in services only. */
export const apiClient = createApiClient();
