/**
 * CSRF protection has been disabled for this SPA + API architecture.
 *
 * The application is protected by:
 * - CORS (restricts cross-origin requests)
 * - sameSite cookies (prevents CSRF automatically)
 * - HttpOnly cookies (prevents XSS theft)
 * - Rate limiting (prevents brute force)
 * - HTTPS in production (encrypts traffic)
 *
 * This function is kept for backwards compatibility but returns empty string.
 * The X-CSRF-Token header will be ignored by the backend.
 */
export async function getCsrfToken(): Promise<string> {
  return '';
}
