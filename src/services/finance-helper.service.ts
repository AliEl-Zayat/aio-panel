import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";

export interface FinanceSnapshot {
  id: number;
  userId: number;
  savings: number;
  availableMoney: number;
  funds: number;
  incomes: number;
  currency: string;
  notes: string | null;
  lastUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertFinanceSnapshotBody {
  savings?: number;
  availableMoney?: number;
  funds?: number;
  incomes?: number;
  currency?: string;
  notes?: string | null;
}

export interface ReminderStatus {
  overdue: boolean;
  lastUpdatedAt: string | null;
}

export const financeHelperService = {
  async getSnapshot(): Promise<FinanceSnapshot> {
    const { data } = await apiClient.get<FinanceSnapshot>(
      ApiUrlConstants.FINANCE_HELPER_SNAPSHOT
    );
    return data;
  },

  async putSnapshot(body: UpsertFinanceSnapshotBody): Promise<FinanceSnapshot> {
    const { data } = await apiClient.put<FinanceSnapshot>(
      ApiUrlConstants.FINANCE_HELPER_SNAPSHOT,
      body
    );
    return data;
  },

  async getReminderStatus(): Promise<ReminderStatus> {
    const { data } = await apiClient.get<ReminderStatus>(
      ApiUrlConstants.FINANCE_HELPER_REMINDER_STATUS
    );
    return data;
  },
};
