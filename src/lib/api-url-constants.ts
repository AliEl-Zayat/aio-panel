/**
 * Single source for aio-server API base URL and path constants.
 * Used by the service layer and axios instance only.
 * NEXT_PUBLIC_API_URL is inlined at build time in Next.js.
 */
const getBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const ApiUrlConstants = {
  getBaseUrl,
  AUTH_LOGIN: "/api/auth/login",
  USERS_ME: "/api/users/me",
  USERS_ME_PREFERENCES: "/api/users/me/preferences",
  /** User settings (preferences) — GET / PATCH */
  SETTINGS: "/api/settings",
} as const;
