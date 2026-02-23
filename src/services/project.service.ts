import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import type { Project } from "@/types/api";

type ProjectScope = "personal" | "organization" | "all";

export const projectService = {
  async list(scope?: ProjectScope): Promise<Project[]> {
    const url =
      scope === undefined
        ? ApiUrlConstants.PROJECTS
        : `${ApiUrlConstants.PROJECTS}?scope=${scope}`;
    const { data } = await apiClient.get<Project[]>(url);
    return data;
  },

  async getById(id: number): Promise<Project> {
    const { data } = await apiClient.get<Project>(
      ApiUrlConstants.PROJECT_BY_ID(id)
    );
    return data;
  },

  async create(body: {
    name: string;
    slug: string;
    organizationId?: number;
  }): Promise<Project> {
    const { data } = await apiClient.post<Project>(
      ApiUrlConstants.PROJECTS,
      body
    );
    return data;
  },

  async update(
    id: number,
    body: { name?: string; slug?: string }
  ): Promise<Project> {
    const { data } = await apiClient.patch<Project>(
      ApiUrlConstants.PROJECT_BY_ID(id),
      body
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(ApiUrlConstants.PROJECT_BY_ID(id));
  },
};
