"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { preferencesService } from "@/services/preferences.service";
import { DEFAULT_PREFERENCES } from "@/types/preferences";
import type { UserPreferences, PatchPreferencesBody } from "@/types/preferences";
import { hasSessionCookie, SESSION_COOKIE_NAME } from "@/lib/session";

function getHasSession(): boolean {
  if (typeof document === "undefined") return false;
  const value = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  const token = value?.split("=")[1];
  return hasSessionCookie(token);
}

export function usePreferences() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["users", "me", "preferences"],
    queryFn: () => preferencesService.getPreferences(),
    enabled: typeof document !== "undefined" && getHasSession(),
  });
  const mutation = useMutation({
    mutationFn: (body: PatchPreferencesBody) =>
      preferencesService.patchPreferences(body),
    onSuccess: (data) => {
      queryClient.setQueryData<UserPreferences>(
        ["users", "me", "preferences"],
        data
      );
      queryClient.invalidateQueries({ queryKey: ["users", "me", "preferences"] });
    },
  });

  const preferences: UserPreferences =
    query.data ?? DEFAULT_PREFERENCES;

  return {
    data: preferences,
    isLoading: query.isLoading,
    error: query.error,
    patchPreferences: mutation.mutateAsync,
    isPatching: mutation.isPending,
    // Aliases for backward compatibility
    preferences,
    isError: query.isError,
    refetch: query.refetch,
    patch: mutation.mutateAsync,
    patchStatus: mutation.status,
    patchError: mutation.error,
    restoreDefaults: () => mutation.mutateAsync(DEFAULT_PREFERENCES),
  };
}
