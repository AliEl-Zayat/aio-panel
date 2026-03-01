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

  /** Knowledge tasks — list + CRUD + reorder; optional ?companyId= */
  KNOWLEDGE_TASKS: "/api/knowledge/tasks",
  KNOWLEDGE_TASK_BY_ID: (id: number) => `/api/knowledge/tasks/${id}`,
  KNOWLEDGE_TASKS_REORDER: "/api/knowledge/tasks/reorder",

  /** Knowledge people — list + CRUD; optional ?companyId= | ?organizationId= | ?projectId= */
  KNOWLEDGE_PEOPLE: "/api/knowledge/people",
  KNOWLEDGE_PERSON_BY_ID: (id: number) => `/api/knowledge/people/${id}`,

  /** Email templates — list + CRUD; optional ?scope=personal | ?organizationId= | ?projectId= */
  EMAIL_TEMPLATES: "/api/email-templates",
  EMAIL_TEMPLATE_BY_ID: (id: number) => `/api/email-templates/${id}`,

  /** Command snippets — list + CRUD; optional ?scope=personal | ?organizationId= | ?projectId= */
  COMMAND_SNIPPETS: "/api/command-snippets",
  COMMAND_SNIPPET_BY_ID: (id: number) => `/api/command-snippets/${id}`,

  /** Secret keys — list + CRUD + reveal; optional ?scope=personal | ?organizationId= | ?projectId= | ?kind= */
  SECRET_KEYS: "/api/secret-keys",
  SECRET_KEY_BY_ID: (id: number) => `/api/secret-keys/${id}`,
  SECRET_KEY_REVEAL: (id: number) => `/api/secret-keys/${id}/reveal`,

  /** Secret accounts — list + CRUD + reveal; optional ?scope=personal | ?organizationId= | ?projectId= | ?service= */
  SECRET_ACCOUNTS: "/api/secret-accounts",
  SECRET_ACCOUNT_BY_ID: (id: number) => `/api/secret-accounts/${id}`,
  SECRET_ACCOUNT_REVEAL: (id: number) => `/api/secret-accounts/${id}/reveal`,

  /** Finance Helper — snapshot (GET/PUT) + reminder status */
  FINANCE_HELPER_SNAPSHOT: "/api/finance-helper/snapshot",
  FINANCE_HELPER_REMINDER_STATUS: "/api/finance-helper/reminder-status",

  /** Side Budget — entries CRUD, summary, upload proof */
  SIDE_BUDGET_ENTRIES: "/api/side-budget/entries",
  SIDE_BUDGET_ENTRY_BY_ID: (id: number) => `/api/side-budget/entries/${id}`,
  SIDE_BUDGET_ENTRY_UPLOAD_PROOF: (id: number) =>
    `/api/side-budget/entries/${id}/upload-proof`,
  SIDE_BUDGET_SUMMARY: "/api/side-budget/summary",

  /** Inventory — products + movements (user-scoped) */
  INVENTORY_PRODUCTS: "/api/inventory/products",
  INVENTORY_PRODUCT_BY_ID: (id: number) => `/api/inventory/products/${id}`,
  INVENTORY_PRODUCT_UPLOAD_IMAGE: (id: number) =>
    `/api/inventory/products/${id}/upload-image`,
  INVENTORY_PRODUCT_MOVEMENTS: (id: number) =>
    `/api/inventory/products/${id}/movements`,

  /** Invoices — CRUD, mark-sent, mark-paid, payments, client suggestions */
  INVOICES: "/api/invoices",
  INVOICE_CLIENT_SUGGESTIONS: "/api/invoices/client-suggestions",
  INVOICE_BY_ID: (id: number) => `/api/invoices/${id}`,
  INVOICE_MARK_SENT: (id: number) => `/api/invoices/${id}/actions/mark-sent`,
  INVOICE_MARK_PAID: (id: number) => `/api/invoices/${id}/actions/mark-paid`,
  INVOICE_PAYMENTS: (id: number) => `/api/invoices/${id}/payments`,

  /** Music Bookmarker — tracks and albums (user-scoped) */
  MUSIC_TRACKS: "/api/music/tracks",
  MUSIC_TRACK_BY_ID: (id: number) => `/api/music/tracks/${id}`,
  MUSIC_ALBUMS: "/api/music/albums",
  MUSIC_ALBUM_BY_ID: (id: number) => `/api/music/albums/${id}`,
} as const;
