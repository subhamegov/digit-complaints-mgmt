import { createServerFn } from "@tanstack/react-start";

/**
 * Returns the health destinations configured for one account.
 *
 * Authorization and account scoping are enforced here, on the server, not by
 * navigation visibility: the handler resolves configuration for the requested
 * account only and returns nothing when the caller may not view health.
 */
export const getAccountHealth = createServerFn({ method: "GET" })
  .inputValidator((input: { accountId: string; role: string }) => ({
    accountId: String(input?.accountId ?? ""),
    role: String(input?.role ?? ""),
  }))
  .handler(async ({ data }) => {
    const { canViewSystemHealth } = await import("@/lib/health-permissions");
    if (!data.accountId || !canViewSystemHealth(data.role)) {
      return { authorized: false as const };
    }
    const { resolveAccountHealth } = await import("@/lib/health-config.server");
    return { authorized: true as const, ...resolveAccountHealth(data.accountId) };
  });
