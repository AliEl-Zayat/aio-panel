import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import type {
  Organization,
  OrganizationMembership,
  OrganizationMember,
  AddOrganizationMemberResponse,
} from "@/types/api";

export const organizationService = {
  async list(): Promise<OrganizationMembership[]> {
    const { data } = await apiClient.get<OrganizationMembership[]>(
      ApiUrlConstants.ORGANIZATIONS
    );
    return data;
  },

  async getById(id: number): Promise<Organization> {
    const { data } = await apiClient.get<Organization>(
      ApiUrlConstants.ORGANIZATION_BY_ID(id)
    );
    return data;
  },

  async create(body: { name: string; slug: string }): Promise<Organization> {
    const { data } = await apiClient.post<Organization>(
      ApiUrlConstants.ORGANIZATIONS,
      body
    );
    return data;
  },

  async update(
    id: number,
    body: { name?: string; slug?: string }
  ): Promise<Organization> {
    const { data } = await apiClient.patch<Organization>(
      ApiUrlConstants.ORGANIZATION_BY_ID(id),
      body
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(ApiUrlConstants.ORGANIZATION_BY_ID(id));
  },

  async listMembers(organizationId: number): Promise<OrganizationMember[]> {
    const { data } = await apiClient.get<OrganizationMember[]>(
      ApiUrlConstants.ORGANIZATION_MEMBERS(organizationId)
    );
    return data;
  },

  async addMember(
    organizationId: number,
    body: { email?: string; userId?: number; role?: string }
  ): Promise<AddOrganizationMemberResponse> {
    const { data } = await apiClient.post<AddOrganizationMemberResponse>(
      ApiUrlConstants.ORGANIZATION_MEMBERS(organizationId),
      body
    );
    return data;
  },

  async updateMemberRole(
    organizationId: number,
    userId: number,
    body: { role: string }
  ): Promise<void> {
    await apiClient.patch(
      ApiUrlConstants.ORGANIZATION_MEMBER(organizationId, userId),
      body
    );
  },

  async removeMember(
    organizationId: number,
    userId: number
  ): Promise<void> {
    await apiClient.delete(
      ApiUrlConstants.ORGANIZATION_MEMBER(organizationId, userId)
    );
  },
};
