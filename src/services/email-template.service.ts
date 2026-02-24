import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import type { EmailTemplate } from "@/types/api";

export type EmailTemplateListParams =
  | { scope?: "personal" }
  | { organizationId?: number }
  | { projectId?: number }
  | Record<string, never>;

function buildListUrl(params?: EmailTemplateListParams): string {
  if (!params || Object.keys(params).length === 0) {
    return ApiUrlConstants.EMAIL_TEMPLATES;
  }
  if ("scope" in params && params.scope === "personal") {
    return `${ApiUrlConstants.EMAIL_TEMPLATES}?scope=personal`;
  }
  if ("organizationId" in params && params.organizationId != null) {
    return `${ApiUrlConstants.EMAIL_TEMPLATES}?organizationId=${params.organizationId}`;
  }
  if ("projectId" in params && params.projectId != null) {
    return `${ApiUrlConstants.EMAIL_TEMPLATES}?projectId=${params.projectId}`;
  }
  return ApiUrlConstants.EMAIL_TEMPLATES;
}

export const emailTemplateService = {
  async list(params?: EmailTemplateListParams): Promise<EmailTemplate[]> {
    const url = buildListUrl(params);
    const { data } = await apiClient.get<EmailTemplate[]>(url);
    return data;
  },

  async getById(id: number): Promise<EmailTemplate> {
    const { data } = await apiClient.get<EmailTemplate>(
      ApiUrlConstants.EMAIL_TEMPLATE_BY_ID(id)
    );
    return data;
  },

  async create(body: {
    name: string;
    subject: string;
    body: string;
    organizationId?: number | null;
    projectId?: number | null;
  }): Promise<EmailTemplate> {
    const { data } = await apiClient.post<EmailTemplate>(
      ApiUrlConstants.EMAIL_TEMPLATES,
      body
    );
    return data;
  },

  async update(
    id: number,
    body: { name?: string; subject?: string; body?: string }
  ): Promise<EmailTemplate> {
    const { data } = await apiClient.patch<EmailTemplate>(
      ApiUrlConstants.EMAIL_TEMPLATE_BY_ID(id),
      body
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(ApiUrlConstants.EMAIL_TEMPLATE_BY_ID(id));
  },
};
