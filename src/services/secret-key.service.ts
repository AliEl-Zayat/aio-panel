import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import type { SecretKey, SecretKeyKind, SecretKeyRevealResponse } from "@/types/api";

export type SecretKeyListParams = {
  kind?: SecretKeyKind;
} & (
  | { scope?: "personal" }
  | { organizationId?: number }
  | { projectId?: number }
  | Record<string, never>
);

function buildListUrl(params?: SecretKeyListParams): string {
  const base = ApiUrlConstants.SECRET_KEYS;
  if (!params || Object.keys(params).length === 0) {
    return base;
  }
  const search = new URLSearchParams();
  if ("scope" in params && params.scope === "personal") {
    search.set("scope", "personal");
  } else if ("organizationId" in params && params.organizationId != null) {
    search.set("organizationId", String(params.organizationId));
  } else if ("projectId" in params && params.projectId != null) {
    search.set("projectId", String(params.projectId));
  }
  if (params.kind === "API_KEY" || params.kind === "ENCRYPTION_KEY") {
    search.set("kind", params.kind);
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export const secretKeyService = {
  async list(params?: SecretKeyListParams): Promise<SecretKey[]> {
    const url = buildListUrl(params);
    const { data } = await apiClient.get<SecretKey[]>(url);
    return data;
  },

  async getById(id: number): Promise<SecretKey> {
    const { data } = await apiClient.get<SecretKey>(
      ApiUrlConstants.SECRET_KEY_BY_ID(id)
    );
    return data;
  },

  async reveal(id: number): Promise<SecretKeyRevealResponse> {
    const { data } = await apiClient.get<SecretKeyRevealResponse>(
      ApiUrlConstants.SECRET_KEY_REVEAL(id)
    );
    return data;
  },

  async create(body: {
    name: string;
    kind: SecretKeyKind;
    value: string;
    hint?: string | null;
    organizationId?: number | null;
    projectId?: number | null;
  }): Promise<SecretKey> {
    const { data } = await apiClient.post<SecretKey>(
      ApiUrlConstants.SECRET_KEYS,
      body
    );
    return data;
  },

  async update(
    id: number,
    body: {
      name?: string;
      kind?: SecretKeyKind;
      value?: string;
      hint?: string | null;
    }
  ): Promise<SecretKey> {
    const { data } = await apiClient.patch<SecretKey>(
      ApiUrlConstants.SECRET_KEY_BY_ID(id),
      body
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(ApiUrlConstants.SECRET_KEY_BY_ID(id));
  },
};
