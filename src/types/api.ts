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
