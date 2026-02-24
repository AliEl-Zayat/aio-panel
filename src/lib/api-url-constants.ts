/**
 * Single source for aio-server API base URL and path constants.
 * Used by the service layer and axios instance only.
 * NEXT_PUBLIC_API_URL is inlined at build time in Next.js.
 */
const getBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_API_URL ?? "http://192.168.1.5:4000";

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

  /** Companies — list + CRUD (user-scoped) */
  COMPANIES: "/api/companies",
  COMPANY_BY_ID: (id: number) => `/api/companies/${id}`,

  /** Knowledge tasks — list + CRUD; optional ?companyId= */
  KNOWLEDGE_TASKS: "/api/knowledge/tasks",
  KNOWLEDGE_TASK_BY_ID: (id: number) => `/api/knowledge/tasks/${id}`,

  /** Email templates — list + CRUD; optional ?scope=personal | ?organizationId= | ?projectId= */
  EMAIL_TEMPLATES: "/api/email-templates",
  EMAIL_TEMPLATE_BY_ID: (id: number) => `/api/email-templates/${id}`,

  /** Command snippets — list + CRUD; optional ?scope=personal | ?organizationId= | ?projectId= */
  COMMAND_SNIPPETS: "/api/command-snippets",
  COMMAND_SNIPPET_BY_ID: (id: number) => `/api/command-snippets/${id}`,
} as const;
