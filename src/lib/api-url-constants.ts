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

  /** Organizations — list + create */
  ORGANIZATIONS: "/api/organizations",
  ORGANIZATION_BY_ID: (id: number) => `/api/organizations/${id}`,
  ORGANIZATION_MEMBERS: (id: number) => `/api/organizations/${id}/members`,
  ORGANIZATION_MEMBER: (orgId: number, userId: number) =>
    `/api/organizations/${orgId}/members/${userId}`,

  /** Projects — list + create; query ?scope= */
  PROJECTS: "/api/projects",
  PROJECT_BY_ID: (id: number) => `/api/projects/${id}`,
} as const;
