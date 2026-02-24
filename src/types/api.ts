/** User shape returned by aio-server (e.g. /api/users/me, login response). */
export interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
}

/** Response shape from POST /api/auth/login. */
export interface LoginResponse {
  token: string;
  user: User;
}

// --- Organizations & projects (match aio-server response shapes) ---

/** Organization shape from GET /api/organizations/:id or POST /api/organizations. */
export interface Organization {
  id: number;
  name: string;
  slug: string;
}

/** List item from GET /api/organizations (org fields + current user's role). */
export interface OrganizationMembership {
  id: number;
  name: string;
  slug: string;
  role: string;
}

/** List item from GET /api/organizations/:id/members. */
export interface OrganizationMember {
  userId: number;
  role: string;
  user: {
    id: number;
    email: string;
    name: string | null;
  };
}

/** Response from POST /api/organizations/:id/members (add member). */
export interface AddOrganizationMemberResponse {
  userId: number;
  role: string;
}

/** Project shape from GET/POST/PATCH /api/projects. */
export interface Project {
  id: number;
  name: string;
  slug: string;
  userId: number;
  organizationId: number | null;
}

// --- Knowledge area (companies + tasks) ---

/** Company shape from GET/POST/PATCH /api/companies. */
export interface Company {
  id: number;
  name: string;
  slug: string;
}

/** Knowledge task shape from GET/POST/PATCH /api/knowledge/tasks. */
export interface KnowledgeTask {
  id: number;
  title: string;
  body: string | null;
  companyId: number | null;
  organizationId: number | null;
  projectId: number | null;
  company?: { id: number; name: string; slug: string } | null;
  organization?: { id: number; name: string; slug: string } | null;
  project?: { id: number; name: string; slug: string } | null;
}

// --- Email templates ---

/** Email template shape from GET/POST/PATCH /api/email-templates. */
export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  userId: number;
  organizationId: number | null;
  projectId: number | null;
  createdAt: string;
  updatedAt: string;
  organization?: { id: number; name: string; slug: string } | null;
  project?: { id: number; name: string; slug: string } | null;
}
