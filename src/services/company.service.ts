import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import type { Company } from "@/types/api";

export const companyService = {
  async list(): Promise<Company[]> {
    const { data } = await apiClient.get<Company[]>(ApiUrlConstants.COMPANIES);
    return data;
  },

  async getById(id: number): Promise<Company> {
    const { data } = await apiClient.get<Company>(
      ApiUrlConstants.COMPANY_BY_ID(id)
    );
    return data;
  },

  async create(body: {
    name: string;
    slug: string;
    logoUrl?: string | null;
  }): Promise<Company> {
    const { data } = await apiClient.post<Company>(
      ApiUrlConstants.COMPANIES,
      body
    );
    return data;
  },

  async update(
    id: number,
    body: { name?: string; slug?: string; logoUrl?: string | null }
  ): Promise<Company> {
    const { data } = await apiClient.patch<Company>(
      ApiUrlConstants.COMPANY_BY_ID(id),
      body
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(ApiUrlConstants.COMPANY_BY_ID(id));
  },
};
