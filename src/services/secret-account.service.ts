import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import type {
  SecretAccount,
  SecretAccountRevealResponse,
} from "@/types/api";

export type SecretAccountListParams = {
  scope?: "personal";
  organizationId?: number;
  projectId?: number;
  service?: string;
};

function buildListUrl(params?: SecretAccountListParams): string {
  const base = ApiUrlConstants.SECRET_ACCOUNTS;
  if (!params || Object.keys(params).length === 0) {
    return base;
  }
  const search = new URLSearchParams();
  if (params.scope === "personal") {
    search.set("scope", "personal");
  } else if (params.organizationId != null) {
    search.set("organizationId", String(params.organizationId));
  } else if (params.projectId != null) {
    search.set("projectId", String(params.projectId));
  }
  if (params.service != null && params.service !== "") {
    search.set("service", params.service);
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export const secretAccountService = {
  async list(params?: SecretAccountListParams): Promise<SecretAccount[]> {
    const url = buildListUrl(params);
    const { data } = await apiClient.get<SecretAccount[]>(url);
    return data;
  },

  async getById(id: number): Promise<SecretAccount> {
    const { data } = await apiClient.get<SecretAccount>(
      ApiUrlConstants.SECRET_ACCOUNT_BY_ID(id)
    );
    return data;
  },

  async reveal(id: number): Promise<SecretAccountRevealResponse> {
    const { data } = await apiClient.get<SecretAccountRevealResponse>(
      ApiUrlConstants.SECRET_ACCOUNT_REVEAL(id)
    );
    return data;
  },

  async create(body: {
    name: string;
    service?: string | null;
    loginUrl?: string | null;
    username: string;
    password: string;
    organizationId?: number | null;
    projectId?: number | null;
  }): Promise<SecretAccount> {
    const { data } = await apiClient.post<SecretAccount>(
      ApiUrlConstants.SECRET_ACCOUNTS,
      body
    );
    return data;
  },

  async update(
    id: number,
    body: {
      name?: string;
      service?: string | null;
      loginUrl?: string | null;
      username?: string;
      password?: string;
    }
  ): Promise<SecretAccount> {
    const { data } = await apiClient.patch<SecretAccount>(
      ApiUrlConstants.SECRET_ACCOUNT_BY_ID(id),
      body
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(ApiUrlConstants.SECRET_ACCOUNT_BY_ID(id));
  },
};
