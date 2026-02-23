import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import type { LoginResponse } from "@/types/api";

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      ApiUrlConstants.AUTH_LOGIN,
      { email, password }
    );
    return data;
  },
};
