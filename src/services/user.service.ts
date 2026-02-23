import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import type { User } from "@/types/api";

export const userService = {
  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>(ApiUrlConstants.USERS_ME);
    return data;
  },
};
