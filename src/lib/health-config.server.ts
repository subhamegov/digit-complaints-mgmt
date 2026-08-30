/**
 * Account-scoped health configuration (server-only source of truth).
 *
 * Dashboard destinations are configuration, not UI constants: no Grafana URL
 * is hardcoded in a component, and a dashboard is only ever returned for the
 * account it belongs to. In a real deployment this module would read from the
 * account configuration service; the shape below is that contract.
 */

export type GrafanaCategory =
  | "APPLICATION"
  | "INFRASTRUCTURE"
  | "DATABASE"
  | "INTEGRATION"
  | "COMMUNICATION"
  | "OTHER";

export type GrafanaDashboardConfig = {
  id: string;
  name: string;
  description: string;
  /** Absolute Grafana URL. Null/empty means "not configured for this account". */
  url: string | null;
  category: GrafanaCategory;
  enabled: boolean;
};

export type AccountHealthConfiguration = {
  account_id: string;
  status_dashboard: { enabled: boolean; url: string | null };
  grafana_dashboards: GrafanaDashboardConfig[];
};

/**
 * Configuration per account. Dashboards without a configured URL stay null -
 * they are intentionally not surfaced rather than linked to a placeholder.
 */
const ACCOUNT_HEALTH_CONFIGURATION: Record<string, AccountHealthConfiguration> = {
  "acc.bomet.cg": {
    account_id: "acc.bomet.cg",
    status_dashboard: { enabled: true, url: "https://bometfeedbackhub.digit.org/status/" },
    grafana_dashboards: [
      { id: "application_health", name: "Application Health", description: "Application availability, response times and errors.", url: null, category: "APPLICATION", enabled: true },
      { id: "infrastructure", name: "Infrastructure", description: "Compute, memory, storage and infrastructure health.", url: null, category: "INFRASTRUCTURE", enabled: true },
      { id: "api_performance", name: "API Performance", description: "API latency, throughput and error rates.", url: null, category: "INTEGRATION", enabled: true },
      { id: "database_health", name: "Database Health", description: "Database availability, connections and performance.", url: null, category: "DATABASE", enabled: true },
      { id: "notifications", name: "Notification Health", description: "Email, SMS and WhatsApp delivery performance.", url: null, category: "COMMUNICATION", enabled: true },
    ],
  },
};

const DEFAULT_CONFIGURATION: AccountHealthConfiguration = {
  account_id: "",
  status_dashboard: { enabled: true, url: "https://bometfeedbackhub.digit.org/status/" },
  grafana_dashboards: [
    { id: "application_health", name: "Application Health", description: "Application availability, response times and errors.", url: null, category: "APPLICATION", enabled: true },
    { id: "infrastructure", name: "Infrastructure", description: "Compute, memory, storage and infrastructure health.", url: null, category: "INFRASTRUCTURE", enabled: true },
    { id: "api_performance", name: "API Performance", description: "API latency, throughput and error rates.", url: null, category: "INTEGRATION", enabled: true },
    { id: "database_health", name: "Database Health", description: "Database availability, connections and performance.", url: null, category: "DATABASE", enabled: true },
    { id: "notifications", name: "Notification Health", description: "Email, SMS and WhatsApp delivery performance.", url: null, category: "COMMUNICATION", enabled: true },
  ],
};

function isSafeHttpsUrl(url: string | null): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    // No credentials and no auth tokens may be carried in a dashboard link.
    if (parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves the dashboards an account may actually see. Runs server-side only:
 * a client can never request another account's dashboards by changing state,
 * because filtering happens here, before anything is serialised.
 */
export function resolveAccountHealth(accountId: string) {
  const config = ACCOUNT_HEALTH_CONFIGURATION[accountId] ?? {
    ...DEFAULT_CONFIGURATION,
    account_id: accountId,
  };

  const statusUrl = config.status_dashboard.enabled && isSafeHttpsUrl(config.status_dashboard.url)
    ? config.status_dashboard.url
    : null;

  const dashboards = config.grafana_dashboards
    .filter((d) => d.enabled && isSafeHttpsUrl(d.url))
    .map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      category: d.category,
      url: d.url as string,
    }));

  return {
    accountId: config.account_id,
    statusDashboardUrl: statusUrl,
    grafanaDashboards: dashboards,
    checkedAt: new Date().toISOString(),
  };
}
