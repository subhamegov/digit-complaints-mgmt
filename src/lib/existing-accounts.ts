/**
 * Prototype directory of emails that already have an account which is NOT active.
 * Used by /signup to explain the account state instead of creating a duplicate.
 */
export type NonActiveAccountStatus = "provisioning" | "suspended" | "blocked" | "inactive";

const NON_ACTIVE_ACCOUNTS: Record<string, NonActiveAccountStatus> = {
  "provisioning@example.gov": "provisioning",
  "suspended@example.gov": "suspended",
  "blocked@example.gov": "blocked",
  "inactive@example.gov": "inactive",
};

export function nonActiveAccountStatus(email: string): NonActiveAccountStatus | null {
  return NON_ACTIVE_ACCOUNTS[email.trim().toLowerCase()] ?? null;
}

export interface AccountStateCopy {
  heading: string;
  body: string;
  tone: "neutral" | "caution";
  status?: { label: string; value: string; note: string };
  primary: { label: string; to?: string; contact?: boolean };
  secondary: { label: string; to?: string };
}

export const ACCOUNT_STATE_COPY: Record<NonActiveAccountStatus, AccountStateCopy> = {
  provisioning: {
    heading: "Your account setup is already in progress",
    body: "We're still preparing your workspace. We'll email you when it's ready.",
    tone: "neutral",
    status: { label: "Workspace setup", value: "In progress", note: "Estimated 30–45 minutes" },
    primary: { label: "Back to sign in", to: "/login" },
    secondary: { label: "Use a different email" },
  },
  suspended: {
    heading: "Your account is currently suspended",
    body: "An account already exists for this email, but access is currently suspended. Contact your administrator for help.",
    tone: "caution",
    primary: { label: "Sign in", to: "/login" },
    secondary: { label: "Use a different email" },
  },
  blocked: {
    heading: "Access to this account is currently unavailable",
    body: "An account already exists for this email, but access has been blocked. Contact your administrator for support.",
    tone: "caution",
    primary: { label: "Contact administrator", contact: true },
    secondary: { label: "Back to sign in", to: "/login" },
  },
  inactive: {
    heading: "An account already exists for this email",
    body: "Your account is not currently active. Sign in to review your access or contact your administrator.",
    tone: "neutral",
    primary: { label: "Sign in", to: "/login" },
    secondary: { label: "Use a different email" },
  },
};
