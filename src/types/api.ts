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
