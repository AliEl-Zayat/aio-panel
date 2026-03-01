import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import type { KnowledgeTask, KnowledgeTaskStatus } from "@/types/api";

export type TaskListFilter =
  | { type: "all" }
  | { type: "common" }
  | { type: "company"; id: number }
  | { type: "organization"; id: number }
  | { type: "project"; id: number };

function tasksListUrl(filter: TaskListFilter): string {
  switch (filter.type) {
    case "all":
      return ApiUrlConstants.KNOWLEDGE_TASKS;
    case "common":
      return ApiUrlConstants.KNOWLEDGE_TASKS;
    case "company":
      return `${ApiUrlConstants.KNOWLEDGE_TASKS}?companyId=${filter.id}`;
    case "organization":
      return `${ApiUrlConstants.KNOWLEDGE_TASKS}?organizationId=${filter.id}`;
    case "project":
      return `${ApiUrlConstants.KNOWLEDGE_TASKS}?projectId=${filter.id}`;
  }
}

export const knowledgeTaskService = {
  async list(filter: TaskListFilter): Promise<KnowledgeTask[]> {
    const url = tasksListUrl(filter);
    const { data } = await apiClient.get<KnowledgeTask[]>(url);
    if (filter.type === "common") {
      return data.filter(
        (t) =>
          t.companyId == null &&
          t.organizationId == null &&
          t.projectId == null
      );
    }
    return data;
  },

  async getById(id: number): Promise<KnowledgeTask> {
    const { data } = await apiClient.get<KnowledgeTask>(
      ApiUrlConstants.KNOWLEDGE_TASK_BY_ID(id)
    );
    return data;
  },

  async create(body: {
    title: string;
    body?: string | null;
    companyId?: number | null;
    organizationId?: number | null;
    projectId?: number | null;
    status?: KnowledgeTaskStatus;
    order?: number;
    blockageReason?: string | null;
  }): Promise<KnowledgeTask> {
    const { data } = await apiClient.post<KnowledgeTask>(
      ApiUrlConstants.KNOWLEDGE_TASKS,
      body
    );
    return data;
  },

  async update(
    id: number,
    body: {
      title?: string;
      body?: string | null;
      companyId?: number | null;
      organizationId?: number | null;
      projectId?: number | null;
      status?: KnowledgeTaskStatus;
      order?: number;
      blockageReason?: string | null;
    }
  ): Promise<KnowledgeTask> {
    const { data } = await apiClient.patch<KnowledgeTask>(
      ApiUrlConstants.KNOWLEDGE_TASK_BY_ID(id),
      body
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(ApiUrlConstants.KNOWLEDGE_TASK_BY_ID(id));
  },

  async reorder(taskIds: number[]): Promise<void> {
    await apiClient.put(ApiUrlConstants.KNOWLEDGE_TASKS_REORDER, { taskIds });
  },
};
