/**
 * Session cookie used for auth (JWT). Middleware checks presence; client sends token in Authorization header.
 */
export const SESSION_COOKIE_NAME = "session";

/** Max age for session cookie (7 days, in seconds). */
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export function hasSessionCookie(cookieValue: string | undefined): boolean {
  return Boolean(cookieValue?.trim());
}

/**
 * Returns the session token from document.cookie. Only call in browser (client components).
 */
export function getSessionToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`)
  );
  const value = match?.[1];
  return value ? decodeURIComponent(value) : null;
}

/**
 * Sets the session cookie (e.g. after login). Only call in browser.
 */
export function setSessionCookie(token: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
}

/**
 * Clears the session cookie (logout). Only call in browser.
 */
export function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0`;
}
