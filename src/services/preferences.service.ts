import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import type { UserPreferences, PatchPreferencesBody } from "@/types/preferences";

/** Use preferences endpoint (settings alias exists on server at /api/settings; both work) */
const PREFERENCES_URL = ApiUrlConstants.USERS_ME_PREFERENCES;

export const preferencesService = {
  async getPreferences(): Promise<UserPreferences> {
    const { data } = await apiClient.get<UserPreferences>(PREFERENCES_URL);
    return data;
  },

  async patchPreferences(body: PatchPreferencesBody): Promise<UserPreferences> {
    const { data } = await apiClient.patch<UserPreferences>(PREFERENCES_URL, body);
    return data;
  },
};

/** Alias for preferences — user settings (theme, layout, sidebar, etc.) */
export const settingsService = preferencesService;
