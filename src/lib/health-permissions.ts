/**
 * Roles allowed to view System Health. Shared by the client navigation gate
 * and the server-side handler so both agree on a single rule.
 */
const HEALTH_VIEW_ROLES = new Set(["ACCOUNT_ADMIN", "PLATFORM_ADMIN"]);

export function canViewSystemHealth(role: string): boolean {
  return HEALTH_VIEW_ROLES.has(role);
}
