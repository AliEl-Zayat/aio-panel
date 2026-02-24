import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import type { CommandSnippet } from "@/types/api";

export type CommandSnippetListParams = {
  type?: "COMMAND" | "TEXT";
} & (
  | { scope?: "personal" }
  | { organizationId?: number }
  | { projectId?: number }
  | Record<string, never>
);

function buildListUrl(params?: CommandSnippetListParams): string {
  const base = ApiUrlConstants.COMMAND_SNIPPETS;
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
  if (params.type === "COMMAND" || params.type === "TEXT") {
    search.set("type", params.type);
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export const commandSnippetService = {
  async list(params?: CommandSnippetListParams): Promise<CommandSnippet[]> {
    const url = buildListUrl(params);
    const { data } = await apiClient.get<CommandSnippet[]>(url);
    return data;
  },

  async getById(id: number): Promise<CommandSnippet> {
    const { data } = await apiClient.get<CommandSnippet>(
      ApiUrlConstants.COMMAND_SNIPPET_BY_ID(id)
    );
    return data;
  },

  async create(body: {
    name: string;
    content: string;
    type: "COMMAND" | "TEXT";
    organizationId?: number | null;
    projectId?: number | null;
  }): Promise<CommandSnippet> {
    const { data } = await apiClient.post<CommandSnippet>(
      ApiUrlConstants.COMMAND_SNIPPETS,
      body
    );
    return data;
  },

  async update(
    id: number,
    body: { name?: string; content?: string; type?: "COMMAND" | "TEXT" }
  ): Promise<CommandSnippet> {
    const { data } = await apiClient.patch<CommandSnippet>(
      ApiUrlConstants.COMMAND_SNIPPET_BY_ID(id),
      body
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(ApiUrlConstants.COMMAND_SNIPPET_BY_ID(id));
  },
};
