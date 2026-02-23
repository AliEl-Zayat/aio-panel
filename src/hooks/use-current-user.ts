"use client";

import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
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

export function useCurrentUser() {
  const query = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => userService.getMe(),
    enabled: typeof document !== "undefined" && getHasSession(),
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
