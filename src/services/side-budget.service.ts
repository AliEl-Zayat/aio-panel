import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";

export type SideBudgetEntryType = "INCOME" | "EXPENSE";

export interface SideBudgetEntry {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  date: string;
  type: SideBudgetEntryType;
  description: string | null;
  proofFileUrl: string | null;
  proofUrl: string | null;
  proofNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSideBudgetEntryBody {
  amount: number;
  currency?: string;
  date: string;
  type: SideBudgetEntryType;
  description?: string | null;
  proofUrl?: string | null;
  proofNote?: string | null;
}

export interface UpdateSideBudgetEntryBody {
  amount?: number;
  currency?: string;
  date?: string;
  type?: SideBudgetEntryType;
  description?: string | null;
  proofUrl?: string | null;
  proofNote?: string | null;
}

export interface SideBudgetSummary {
  incomeTotal: number;
  expenseTotal: number;
}

export interface ListEntriesParams {
  type?: SideBudgetEntryType;
  from?: string;
  to?: string;
}

export interface SummaryParams {
  from?: string;
  to?: string;
}

export const sideBudgetService = {
  async getEntries(params?: ListEntriesParams): Promise<SideBudgetEntry[]> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    const query = searchParams.toString();
    const url = query
      ? `${ApiUrlConstants.SIDE_BUDGET_ENTRIES}?${query}`
      : ApiUrlConstants.SIDE_BUDGET_ENTRIES;
    const { data } = await apiClient.get<SideBudgetEntry[]>(url);
    return data;
  },

  async getEntry(id: number): Promise<SideBudgetEntry> {
    const { data } = await apiClient.get<SideBudgetEntry>(
      ApiUrlConstants.SIDE_BUDGET_ENTRY_BY_ID(id)
    );
    return data;
  },

  async createEntry(body: CreateSideBudgetEntryBody): Promise<SideBudgetEntry> {
    const { data } = await apiClient.post<SideBudgetEntry>(
      ApiUrlConstants.SIDE_BUDGET_ENTRIES,
      body
    );
    return data;
  },

  async updateEntry(
    id: number,
    body: UpdateSideBudgetEntryBody
  ): Promise<SideBudgetEntry> {
    const { data } = await apiClient.patch<SideBudgetEntry>(
      ApiUrlConstants.SIDE_BUDGET_ENTRY_BY_ID(id),
      body
    );
    return data;
  },

  async deleteEntry(id: number): Promise<void> {
    await apiClient.delete(ApiUrlConstants.SIDE_BUDGET_ENTRY_BY_ID(id));
  },

  async getSummary(params?: SummaryParams): Promise<SideBudgetSummary> {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    const query = searchParams.toString();
    const url = query
      ? `${ApiUrlConstants.SIDE_BUDGET_SUMMARY}?${query}`
      : ApiUrlConstants.SIDE_BUDGET_SUMMARY;
    const { data } = await apiClient.get<SideBudgetSummary>(url);
    return data;
  },

  async uploadProof(entryId: number, file: File): Promise<SideBudgetEntry> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<SideBudgetEntry>(
      ApiUrlConstants.SIDE_BUDGET_ENTRY_UPLOAD_PROOF(entryId),
      formData
    );
    return data;
  },
};
