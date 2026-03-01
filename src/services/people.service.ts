import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import type { Person } from "@/types/api";

export type PersonListFilter =
  | { type: "all" }
  | { type: "common" }
  | { type: "company"; id: number }
  | { type: "organization"; id: number }
  | { type: "project"; id: number };

function peopleListUrl(filter: PersonListFilter): string {
  switch (filter.type) {
    case "all":
      return ApiUrlConstants.KNOWLEDGE_PEOPLE;
    case "common":
      return ApiUrlConstants.KNOWLEDGE_PEOPLE;
    case "company":
      return `${ApiUrlConstants.KNOWLEDGE_PEOPLE}?companyId=${filter.id}`;
    case "organization":
      return `${ApiUrlConstants.KNOWLEDGE_PEOPLE}?organizationId=${filter.id}`;
    case "project":
      return `${ApiUrlConstants.KNOWLEDGE_PEOPLE}?projectId=${filter.id}`;
  }
}

export const peopleService = {
  async list(filter: PersonListFilter): Promise<Person[]> {
    const url = peopleListUrl(filter);
    const { data } = await apiClient.get<Person[]>(url);
    if (filter.type === "common") {
      return data.filter(
        (p) =>
          p.companyId == null &&
          p.organizationId == null &&
          p.projectId == null
      );
    }
    return data;
  },

  async getById(id: number): Promise<Person> {
    const { data } = await apiClient.get<Person>(
      ApiUrlConstants.KNOWLEDGE_PERSON_BY_ID(id)
    );
    return data;
  },

  async create(body: {
    name: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    fcmToken?: string | null;
    companyId?: number | null;
    organizationId?: number | null;
    projectId?: number | null;
  }): Promise<Person> {
    const { data } = await apiClient.post<Person>(
      ApiUrlConstants.KNOWLEDGE_PEOPLE,
      body
    );
    return data;
  },

  async update(
    id: number,
    body: {
      name?: string;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
      fcmToken?: string | null;
      companyId?: number | null;
      organizationId?: number | null;
      projectId?: number | null;
    }
  ): Promise<Person> {
    const { data } = await apiClient.patch<Person>(
      ApiUrlConstants.KNOWLEDGE_PERSON_BY_ID(id),
      body
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(ApiUrlConstants.KNOWLEDGE_PERSON_BY_ID(id));
  },
};
